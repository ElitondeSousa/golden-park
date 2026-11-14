/**
 * Mapa 3D de navegação do cliente (página do QR Code), estilo app de mobilidade.
 *
 * - Usa a MESMA geometria oficial do mapa 2D (traçado da planta, regiões, grafo de vias e acessos de packages/shared):
 *   nada é inventado; só a apresentação é em perspectiva.
 * - Rota: faixa âmbar com contorno bronze passando só pelos nós do grafo, setas de sentido correndo até a vaga
 *   (paradas com movimento reduzido), marcador de partida e pino 3D no destino.
 * - Câmera inclinada que enquadra a rota na faixa livre entre as abas e o painel inferior; um dedo arrasta,
 *   dois dedos aproximam e giram. "Ver rota inteira" e "Centralizar" animam a câmera.
 * - Rótulos e marcadores em HTML por cima da cena (nítidos em qualquer celular e com os mesmos testids do 2D).
 * - Sem GPS: nada aqui mostra a posição real do veículo. O carrinho só aparece na demonstração rotulada.
 */
import type { Nivel } from '@parkvision/shared';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { NIVEIS, acessoPorNo, centro, mapa, nomeCurto, nosPorId, regiaoDoMapa, tracadoPlanta, trechosDaRota } from './dados.ts';
import { AbasDeNivel, type VeiculoAnimado } from './MapaEstacionamento.tsx';
import { caixa, caixaDaNavegacao, janelasPorNivel, pontoNaRota, pontosNoNivel, type Ponto } from './navegacao.ts';

export interface ComandoCamera { tipo: 'rota' | 'destino'; n: number }

interface Props {
  nivel: Nivel;
  aoTrocarNivel: (n: Nivel) => void;
  destino: string;
  rota: string[] | null;
  apagarOutras?: boolean;
  rotuloDestino?: string;
  veiculos?: VeiculoAnimado[];
  /** muda `n` para pedir um novo enquadramento (botões "Ver rota inteira" / "Centralizar") */
  comando: ComandoCamera;
  /** faixas da tela ocupadas por cima (abas) e por baixo (painel inferior), em px */
  margemTopo: number;
  margemBaixo: number;
  className?: string;
}

const INCLINACAO = THREE.MathUtils.degToRad(48); // ângulo da câmera a partir da vertical
const FOV = 40;
const ALTURA = { via: 0.6, regiao: 5, destino: 12, rotaContorno: 14.2, rota: 14.6, seta: 15 };

const cor = (variavel: string, padrao: string) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(variavel).trim();
  return new THREE.Color(v && !v.startsWith('var(') && !v.startsWith('color-mix') ? v : padrao);
};
const movimentoReduzido = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Segmentos de linha do traçado SVG da planta (M/L/C/Z absolutos; curvas amostradas). */
function segmentosDoTracado(d: string): number[] {
  const seg: number[] = [];
  let x = 0, y = 0, x0 = 0, y0 = 0;
  for (const [, cmd, args] of d.matchAll(/([MLCZmlcz])([^MLCZmlcz]*)/g)) {
    const n = (args!.match(/-?\d*\.?\d+(?:e-?\d+)?/gi) ?? []).map(Number);
    if (cmd === 'M') { x = x0 = n[0]!; y = y0 = n[1]!; for (let i = 2; i + 1 < n.length; i += 2) { seg.push(x, y, n[i]!, n[i + 1]!); x = n[i]!; y = n[i + 1]!; } }
    else if (cmd === 'L') { for (let i = 0; i + 1 < n.length; i += 2) { seg.push(x, y, n[i]!, n[i + 1]!); x = n[i]!; y = n[i + 1]!; } }
    else if (cmd === 'C') {
      for (let i = 0; i + 5 < n.length; i += 6) {
        const [ax, ay, bx, by, cx, cy] = n.slice(i, i + 6) as [number, number, number, number, number, number];
        let px = x, py = y;
        for (let k = 1; k <= 4; k++) {
          const t = k / 4, u = 1 - t;
          const qx = u * u * u * x + 3 * u * u * t * ax + 3 * u * t * t * bx + t * t * t * cx;
          const qy = u * u * u * y + 3 * u * u * t * ay + 3 * u * t * t * by + t * t * t * cy;
          seg.push(px, py, qx, qy); px = qx; py = qy;
        }
        x = cx; y = cy;
      }
    } else if (cmd === 'Z' || cmd === 'z') { seg.push(x, y, x0, y0); x = x0; y = y0; }
  }
  return seg;
}

/** Faixa plana (largura fixa) ao longo de uma polilinha no plano xz, à altura h. */
function faixa(pts: Ponto[], largura: number, h: number): THREE.BufferGeometry {
  const pos: number[] = [], idx: number[] = [];
  const w = largura / 2;
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)]!, b = pts[Math.min(pts.length - 1, i + 1)]!;
    let dx = b[0] - a[0], dz = b[1] - a[1];
    const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    pos.push(p[0] - dz * w, h, p[1] + dx * w, p[0] + dz * w, h, p[1] - dx * w);
    if (i > 0) { const k = (i - 1) * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Polilinha com as quinas arredondadas (como no 2D) amostrada em pontos — a faixa fica contínua nas curvas. */
function suavizar(pts: Ponto[], raio: number): Ponto[] {
  if (pts.length < 3) return pts;
  const out: Ponto[] = [pts[0]!];
  for (let i = 1; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i - 1]!, [bx, by] = pts[i]!, [cx, cy] = pts[i + 1]!;
    const l1 = Math.hypot(bx - ax, by - ay), l2 = Math.hypot(cx - bx, cy - by);
    const r = Math.min(raio, l1 / 2, l2 / 2);
    const p1: Ponto = [bx - ((bx - ax) / l1) * r, by - ((by - ay) / l1) * r];
    const p2: Ponto = [bx + ((cx - bx) / l2) * r, by + ((cy - by) / l2) * r];
    for (let k = 0; k <= 6; k++) {
      const t = k / 6, u = 1 - t;
      out.push([u * u * p1[0] + 2 * u * t * bx + t * t * p2[0], u * u * p1[1] + 2 * u * t * by + t * t * p2[1]]);
    }
  }
  out.push(pts[pts.length - 1]!);
  return out;
}

export function MapaNavegacao3D(props: Props) {
  const { nivel, destino, rota, apagarOutras, rotuloDestino, veiculos, comando, margemTopo, margemBaixo } = props;
  const host = useRef<HTMLDivElement>(null);
  const camadaHtml = useRef<HTMLDivElement>(null);
  const trechos = useMemo(() => (rota?.length ? trechosDaRota(rota) : []), [rota]);
  const pontosRota = useMemo(() => (rota ? pontosNoNivel(rota, nivel) : []), [rota, nivel]);
  const regDestino = regiaoDoMapa[destino];
  // tema claro/escuro: as cores da cena vêm dos tokens, então a cena é refeita quando o tema muda
  const [tema, setTema] = useState(() => (typeof document !== 'undefined' ? document.documentElement.dataset.theme : undefined));
  useEffect(() => {
    const mo = new MutationObserver(() => setTema(document.documentElement.dataset.theme));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, []);
  // referências estáveis para o laço de animação
  const estado = useRef({ margemTopo, margemBaixo, veiculos, enquadrar: (_t: 'rota' | 'destino', _animar: boolean) => {} });
  estado.current.margemTopo = margemTopo;
  estado.current.margemBaixo = margemBaixo;
  estado.current.veiculos = veiculos;

  useEffect(() => {
    const el = host.current, html = camadaHtml.current;
    if (!el || !html) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.touchAction = 'none';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    el.prepend(renderer.domElement);

    const cena = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 5, 20000);
    const luz = new THREE.HemisphereLight(0xffffff, 0x8a9099, 1.15);
    const sol = new THREE.DirectionalLight(0xffffff, 1.1);
    sol.position.set(-400, 1200, 600);
    cena.add(luz, sol);

    const papel = cor('--pv-mapa-papel', '#FFFFFF');
    const tinta = cor('--pv-mapa-tinta', '#C9D1DE');
    const via = cor('--pv-mapa-via', '#E2E7EF');
    const corRota = cor('--pv-wayfinding-route', '#F5A800');
    const corMarca = cor('--pv-brand-primary', '#7F562C');
    const corTexto = cor('--pv-text-primary', '#161C29');
    const neutra = cor('--pv-bg-muted', '#E2E7EF');
    cena.background = papel;
    const descartaveis: { dispose: () => void }[] = [];
    const guardar = <T extends { dispose: () => void }>(x: T) => { descartaveis.push(x); return x; };
    const mat = (c: THREE.Color, extra: THREE.MeshLambertMaterialParameters = {}) => guardar(new THREE.MeshLambertMaterial({ color: c, ...extra }));

    // ── chão do nível ──
    const vb = NIVEIS.find((n) => n.id === nivel)!.viewBox;
    const chao = new THREE.Mesh(guardar(new THREE.PlaneGeometry(vb[2] * 1.6, vb[3] * 1.6)), mat(papel.clone().offsetHSL(0, 0, -0.02)));
    chao.rotation.x = -Math.PI / 2;
    chao.position.set(vb[0] + vb[2] / 2, 0, vb[1] + vb[3] / 2);
    cena.add(chao);

    // ── traçado da planta ──
    const segs = segmentosDoTracado(tracadoPlanta[nivel].d);
    const posTraco = new Float32Array((segs.length / 4) * 6);
    for (let i = 0, j = 0; i < segs.length; i += 4, j += 6) { posTraco.set([segs[i]!, 0.3, segs[i + 1]!, segs[i + 2]!, 0.3, segs[i + 3]!], j); }
    const gTraco = guardar(new THREE.BufferGeometry());
    gTraco.setAttribute('position', new THREE.BufferAttribute(posTraco, 3));
    cena.add(new THREE.LineSegments(gTraco, guardar(new THREE.LineBasicMaterial({ color: tinta }))));

    // ── vias (grafo) ──
    const matVia = mat(via, { side: THREE.DoubleSide });
    for (const a of mapa.arestas) {
      const p = nosPorId[a.de], q = nosPorId[a.para];
      if (!p || !q || p.nivel !== nivel || q.nivel !== nivel) continue;
      cena.add(new THREE.Mesh(guardar(faixa([p.xy, q.xy], 18, ALTURA.via)), matVia));
    }

    // ── regiões ──
    const rotulosRegiao: { el: HTMLElement; pos: THREE.Vector3 }[] = [];
    html.querySelectorAll('[data-rotulo-regiao]').forEach((n) => n.remove());
    for (const r of mapa.regioes.filter((x) => x.nivel === nivel)) {
      const ehDestino = r.id === destino;
      const forma = new THREE.Shape(r.poligono.map(([x, y]) => new THREE.Vector2(x, y)));
      const h = ehDestino ? ALTURA.destino : ALTURA.regiao;
      const g = guardar(new THREE.ExtrudeGeometry(forma, { depth: h, bevelEnabled: false }));
      g.rotateX(Math.PI / 2); g.translate(0, h, 0);
      const apagada = apagarOutras && !ehDestino;
      const m = new THREE.Mesh(g, mat(ehDestino ? corRota.clone().lerp(papel, 0.55) : neutra, { transparent: apagada, opacity: apagada ? 0.45 : 1 }));
      cena.add(m);
      const borda = new THREE.LineSegments(guardar(new THREE.EdgesGeometry(g, 30)), guardar(new THREE.LineBasicMaterial({ color: ehDestino ? corMarca : tinta })));
      cena.add(borda);
      if (!ehDestino) {
        const [cx, cy] = centro(r.poligono);
        const rot = document.createElement('div');
        rot.dataset.rotuloRegiao = r.id;
        rot.textContent = r.id;
        rot.className = 'absolute -translate-x-1/2 -translate-y-1/2 px-1.5 rounded text-[11px] font-semibold pointer-events-none';
        rot.style.cssText += `color:${'var(--pv-text-secondary)'};background:color-mix(in srgb, var(--pv-mapa-papel) 80%, transparent);opacity:${apagada ? 0.6 : 1}`;
        html.appendChild(rot);
        rotulosRegiao.push({ el: rot, pos: new THREE.Vector3(cx, h + 2, cy) });
      }
    }

    // ── rota: contorno bronze + faixa âmbar + setas correndo até a vaga ──
    const setas: THREE.Mesh[] = [];
    let curva: Ponto[] = [];
    let comprimentoCurva = 0;
    if (pontosRota.length > 1) {
      curva = suavizar(pontosRota, 26);
      for (let i = 1; i < curva.length; i++) comprimentoCurva += Math.hypot(curva[i]![0] - curva[i - 1]![0], curva[i]![1] - curva[i - 1]![1]);
      cena.add(new THREE.Mesh(guardar(faixa(curva, 26, ALTURA.rotaContorno)), guardar(new THREE.MeshBasicMaterial({ color: corMarca, side: THREE.DoubleSide }))));
      cena.add(new THREE.Mesh(guardar(faixa(curva, 17, ALTURA.rota)), guardar(new THREE.MeshBasicMaterial({ color: corRota, side: THREE.DoubleSide }))));
      // chevron (seta) apontando para +x no plano xz
      const chevron = new THREE.Shape();
      chevron.moveTo(-5, -6); chevron.lineTo(3, 0); chevron.lineTo(-5, 6); chevron.lineTo(-2, 0); chevron.closePath();
      const gSeta = guardar(new THREE.ShapeGeometry(chevron));
      gSeta.rotateX(-Math.PI / 2);
      const matSeta = guardar(new THREE.MeshBasicMaterial({ color: corTexto, side: THREE.DoubleSide }));
      const n = Math.max(3, Math.floor(comprimentoCurva / 46));
      for (let i = 0; i < n; i++) { const s = new THREE.Mesh(gSeta, matSeta); s.userData.fase = i / n; cena.add(s); setas.push(s); }
    }
    const posicionarSetas = (t: number) => {
      for (const s of setas) {
        const f = (s.userData.fase + t) % 1;
        const p = pontoNaRota(curva, f);
        s.position.set(p.x, ALTURA.seta, p.y);
        s.rotation.y = -THREE.MathUtils.degToRad(p.angulo);
      }
    };
    posicionarSetas(0);

    // ── marcadores em HTML (partida, pino do destino, acessos, veículos da demonstração) ──
    const marcador = (sel: string) => html.querySelector<HTMLElement>(sel);
    const posPartida = pontosRota.length > 1 && acessoPorNo[rota![0]!] && nosPorId[rota![0]!]?.nivel === nivel ? new THREE.Vector3(pontosRota[0]![0], ALTURA.rota, pontosRota[0]![1]) : null;
    const [dx, dy] = regDestino && regDestino.nivel === nivel ? centro(regDestino.poligono) : [NaN, NaN];
    const posDestino = Number.isFinite(dx) ? new THREE.Vector3(dx, ALTURA.destino, dy) : null;
    const acessos = mapa.acessos.filter((a) => a.nivel === nivel).map((a) => ({ id: a.id, pos: new THREE.Vector3(nosPorId[a.no]!.xy[0], 2, nosPorId[a.no]!.xy[1]) }));
    // carrinho da demonstração (só aparece quando há veículos — rotulado como demonstração pela página)
    const carro = new THREE.Mesh(guardar(new THREE.BoxGeometry(22, 9, 11)), mat(corTexto));
    carro.visible = false;
    cena.add(carro);

    // ── câmera e gestos ──
    const controles = new OrbitControls(camera, renderer.domElement);
    controles.enableDamping = true;
    controles.dampingFactor = 0.12;
    controles.screenSpacePanning = false;
    controles.minPolarAngle = THREE.MathUtils.degToRad(5);
    controles.maxPolarAngle = THREE.MathUtils.degToRad(70);
    controles.minDistance = 120;
    controles.maxDistance = 4200;
    controles.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
    controles.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE };

    let largura = 1, altura = 1;
    const aplicarOffset = () => {
      const { margemTopo: topo, margemBaixo: baixo } = estado.current;
      camera.aspect = largura / altura;
      // centraliza a cena na faixa livre entre as abas (topo) e o painel inferior (baixo)
      camera.setViewOffset(largura, altura, 0, (baixo - topo) / 2, largura, altura);
      camera.updateProjectionMatrix();
    };
    let animacao: { de: [THREE.Vector3, THREE.Vector3]; para: [THREE.Vector3, THREE.Vector3]; t0: number; dur: number } | null = null;
    const enquadrar = (tipo: 'rota' | 'destino', animar: boolean) => {
      const { margemTopo: topo, margemBaixo: baixo } = estado.current;
      const bb = tipo === 'destino' && regDestino?.nivel === nivel ? caixa(regDestino.poligono) : caixaDaNavegacao(rota, destino, nivel);
      const w = Math.max(bb[2] - bb[0], 140), h = Math.max(bb[3] - bb[1], 140);
      const alvo = new THREE.Vector3((bb[0] + bb[2]) / 2, 0, (bb[1] + bb[3]) / 2);
      const livre = Math.max(0.25, (altura - topo - baixo) / altura);
      const tg = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
      const folga = tipo === 'destino' ? 2.6 : 1.35;
      const dist = (Math.max((h * Math.cos(INCLINACAO)) / livre, w / (largura / altura)) / (2 * tg)) * folga;
      const pos = alvo.clone().add(new THREE.Vector3(0, Math.cos(INCLINACAO) * dist, Math.sin(INCLINACAO) * dist));
      if (!animar || movimentoReduzido()) { camera.position.copy(pos); controles.target.copy(alvo); controles.update(); return; }
      animacao = { de: [camera.position.clone(), controles.target.clone()], para: [pos, alvo], t0: performance.now(), dur: 650 };
    };
    estado.current.enquadrar = enquadrar;

    const v = new THREE.Vector3();
    const projetar = (p: THREE.Vector3) => { v.copy(p).project(camera); return { x: (v.x * 0.5 + 0.5) * largura, y: (-v.y * 0.5 + 0.5) * altura, visivel: v.z < 1 }; };
    const atualizarHtml = () => {
      for (const r of rotulosRegiao) { const s = projetar(r.pos); r.el.style.transform = `translate(${s.x}px, ${s.y}px) translate(-50%, -50%)`; r.el.style.display = s.visivel ? '' : 'none'; }
      const pino = marcador('[data-testid="pino-destino"]');
      if (pino) { if (posDestino) { const s = projetar(posDestino); pino.style.display = s.visivel ? '' : 'none'; pino.style.transform = `translate(${s.x}px, ${s.y}px) translate(-50%, -100%)`; } else pino.style.display = 'none'; }
      const partida = marcador('[data-testid="partida-rota"]');
      if (partida) { if (posPartida) { const s = projetar(posPartida); partida.style.display = ''; partida.style.transform = `translate(${s.x}px, ${s.y}px) translate(-50%, -50%)`; } else partida.style.display = 'none'; }
      for (const a of acessos) { const n = marcador(`[data-acesso="${a.id}"]`); if (n) { const s = projetar(a.pos); n.style.transform = `translate(${s.x}px, ${s.y}px) translate(-50%, -50%)`; n.style.display = s.visivel ? '' : 'none'; } }
    };

    const redimensionar = () => {
      const r = el.getBoundingClientRect();
      largura = Math.max(1, r.width); altura = Math.max(1, r.height);
      renderer.setSize(largura, altura, false);
      renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%';
      aplicarOffset();
    };
    redimensionar();
    enquadrar('rota', false);
    const ro = new ResizeObserver(() => { redimensionar(); enquadrar('rota', false); });
    ro.observe(el);

    let quadro = 0;
    const carroDom = () => marcador('[data-testid="veiculo-simulado"]');
    const laco = (agora: number) => {
      if (animacao) {
        const k = Math.min(1, (agora - animacao.t0) / animacao.dur), e = 1 - Math.pow(1 - k, 3);
        camera.position.lerpVectors(animacao.de[0], animacao.para[0], e);
        controles.target.lerpVectors(animacao.de[1], animacao.para[1], e);
        if (k >= 1) animacao = null;
      }
      aplicarOffset();
      controles.update();
      if (setas.length && !movimentoReduzido()) posicionarSetas((agora / 4200) % 1);
      // demonstração: carrinho percorre o trecho do nível na janela de tempo dele
      const demo = estado.current.veiculos?.[0];
      carro.visible = false;
      if (demo) {
        const j = janelasPorNivel(demo.nos).find((x) => x.nivel === nivel && x.pts.length > 1);
        if (j) {
          const t = (agora - demo.inicio) / demo.duracao, local = j.b > j.a ? (t - j.a) / (j.b - j.a) : 1;
          if (local >= 0 && local <= 1.1) { const p = pontoNaRota(j.pts, local); carro.position.set(p.x, ALTURA.seta + 4, p.y); carro.rotation.y = -THREE.MathUtils.degToRad(p.angulo); carro.visible = true; }
        }
      }
      const dom = carroDom();
      if (dom) { if (carro.visible) { const s = projetar(carro.position); dom.style.display = ''; dom.setAttribute('transform', `translate(${s.x.toFixed(1)} ${s.y.toFixed(1)})`); dom.style.transform = `translate(${s.x}px, ${s.y}px) translate(-50%, -50%)`; } else dom.style.display = 'none'; }
      renderer.render(cena, camera);
      atualizarHtml();
      // estado da câmera exposto no DOM (testes e depuração): muda quando o usuário arrasta ou enquadra
      const cam = `${camera.position.x.toFixed(0)} ${camera.position.y.toFixed(0)} ${camera.position.z.toFixed(0)}`;
      if (el.dataset.camera !== cam) el.dataset.camera = cam;
      quadro = requestAnimationFrame(laco);
    };
    quadro = requestAnimationFrame(laco);

    return () => {
      cancelAnimationFrame(quadro);
      ro.disconnect();
      controles.dispose();
      descartaveis.forEach((d) => d.dispose());
      renderer.dispose();
      renderer.domElement.remove();
      rotulosRegiao.forEach((r) => r.el.remove());
    };
    // a cena é refeita ao trocar de nível, de destino ou de rota; margens e veículos vêm por referência
  }, [nivel, destino, rota?.join(','), apagarOutras, tema]); // eslint-disable-line react-hooks/exhaustive-deps

  // pedidos de enquadramento vindos dos botões da página
  const ultimo = useRef(comando.n);
  useEffect(() => {
    if (comando.n === ultimo.current) return;
    ultimo.current = comando.n;
    estado.current.enquadrar(comando.tipo, true);
  }, [comando]);

  const pinoVisivel = regDestino?.nivel === nivel;
  return (
    <div className={props.className}>
      <div className="relative h-full overflow-hidden" style={{ background: 'var(--pv-mapa-papel)' }}>
        <div className="absolute top-2 left-2 right-2 z-10 pointer-events-none [&>*]:pointer-events-auto">
          <AbasDeNivel nivel={nivel} aoTrocar={props.aoTrocarNivel} destino={destino} trechos={trechos.map((t) => t.nivel)} compactas />
        </div>
        <div
          ref={host}
          data-testid="mapa-estacionamento"
          data-nivel={nivel}
          data-modo="3d"
          role="img"
          aria-label={`Mapa 3D do estacionamento — ${NIVEIS.find((n) => n.id === nivel)!.nome}. ${pontosRota.length > 1 ? 'A faixa âmbar com setas mostra o caminho pelas vias até a região de destino.' : ''} Arraste para mover; use dois dedos para aproximar e girar.`}
          className="absolute inset-0"
        >
          {/* rota e região de destino do nível exibido, com os mesmos atributos do mapa 2D */}
          {pontosRota.length > 1 && <div data-camada="rota" data-nos={trechos.find((t) => t.nivel === nivel)?.nos.join(' ')} hidden />}
          {pinoVisivel && <div data-regiao={destino} data-destino="true" hidden />}
        </div>
        {/* camada HTML: rótulos e marcadores projetados da cena 3D */}
        <div ref={camadaHtml} className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div data-testid="partida-rota" className="absolute left-0 top-0 size-5 rounded-full border-[3px]" style={{ background: 'var(--pv-mapa-papel)', borderColor: 'var(--pv-brand-primary)', display: 'none' }}>
            <span className="absolute inset-[3px] rounded-full" style={{ background: 'var(--pv-brand-primary)' }} />
          </div>
          {mapa.acessos.filter((a) => a.nivel === nivel).map((a) => (
            <div key={a.id} data-acesso={a.id} className="absolute left-0 top-0 flex items-center gap-1 whitespace-nowrap" style={{ display: 'none' }}>
              <span className="size-3 rounded-full border-2" style={{ background: 'var(--pv-text-primary)', borderColor: 'var(--pv-mapa-papel)' }} />
              <span className="text-[11px] font-semibold px-1 rounded" style={{ color: 'var(--pv-text-secondary)', background: 'color-mix(in srgb, var(--pv-mapa-papel) 80%, transparent)' }}>{nomeCurto(a.nome)}</span>
            </div>
          ))}
          {pinoVisivel && (
            <div data-testid="pino-destino" className="absolute left-0 top-0 flex flex-col items-center" style={{ display: 'none' }}>
              {rotuloDestino && <span className="mb-1 px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap" style={{ background: 'var(--pv-brand-primary)', color: 'var(--pv-text-on-brand)' }}>{rotuloDestino}</span>}
              <span className="grid place-items-center min-w-11 h-8 px-2 rounded-md text-base font-bold font-display text-white shadow-[var(--pv-shadow-sm)]" style={{ background: 'var(--pv-color-vision-600)', border: '2px solid #fff' }}>{destino}</span>
              <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true"><path d="M1 0h16L9 12z" fill="var(--pv-color-vision-600)" /></svg>
            </div>
          )}
          {veiculos?.length ? <div data-testid="veiculo-simulado" data-categoria={veiculos[0]!.categoria} className="absolute left-0 top-0 size-2" style={{ display: 'none' }} /> : null}
        </div>
      </div>
    </div>
  );
}
