<p align="center">
  <img src="design-system/brand/golden-park-claro-completo.png" alt="Golden Park — sistema inteligente de estacionamento" width="300">
</p>

# Golden Park — Sistema inteligente de estacionamento

Sistema que **organiza e distribui automaticamente os veículos** no estacionamento do Capim Dourado Shopping:
- recomenda a melhor região na entrada;
- emite um ticket com QR Code;
- guia o motorista pelo celular, sem aplicativo;
- mostra a operação em tempo real no painel.

> **Status atual: MVP funcional.** As três interfaces (totem, localizador pelo QR Code e painel administrativo) estão implementadas e integradas ao back-end real: API, banco, algoritmo, simulador e tempo real. Os números de ocupação nas demonstrações vêm do simulador e aparecem sempre marcados como dados simulados.

<p align="center">
  <img src="docs/mvp/capturas/cliente-3d-claro.png" alt="Localizador pelo QR Code: mapa 3D com a rota em setas até a região" height="420">
  &nbsp;
  <img src="docs/mvp/capturas/cliente-3d-escuro.png" alt="Localizador no tema escuro" height="420">
</p>

<p align="center">
  <img src="docs/mvp/capturas/mvp-totem-1440-recomendacao.png" alt="Totem de entrada com a região recomendada" width="49%">
  <img src="docs/mvp/capturas/mvp-painel-1440-claro.png" alt="Painel administrativo" width="49%">
</p>

### ▶ [Ver a vitrine online (Vercel)](https://golden-park-weld.vercel.app)

Telas do cliente (QR Code), da administração e do totem, com a simulação 3D interativa. É uma vitrine estática; o MVP completo roda localmente com a API e o banco.

> **Para avaliar:**
> - [INSTRUCOES-DE-EXECUCAO.md](INSTRUCOES-DE-EXECUCAO.md): passo a passo verificável, validado numa instalação limpa;
> - [ROTEIRO-DEMONSTRACAO.md](ROTEIRO-DEMONSTRACAO.md): demonstração de 3 a 5 minutos;
> - [docs/DOCUMENTACAO-TECNICA.md](docs/DOCUMENTACAO-TECNICA.md): arquitetura, API, algoritmo e dados;
> - [docs/RESUMO-AVALIADORES.pdf](docs/RESUMO-AVALIADORES.pdf): resumo de uma página;
> - [CHECKLIST-ENTREGA.md](CHECKLIST-ENTREGA.md) e [RELATORIO-FINAL-ENTREGA.md](RELATORIO-FINAL-ENTREGA.md): o que foi conferido e o estado final;
> - [vitrine online](https://golden-park-weld.vercel.app): telas estáticas para ver sem instalar nada.

## Problema e público-alvo

- **Problema:** em horários de movimento, os motoristas rodam pelo estacionamento procurando vaga. Algumas áreas lotam enquanto outras ficam vazias, e isso gera filas na entrada, congestionamento interno e perda de tempo. Na volta, muita gente não lembra onde deixou o carro.
- **Público-alvo:** clientes do Capim Dourado Shopping que chegam de carro ou moto, incluindo pessoas com deficiência e pessoas idosas, que precisam de vagas reservadas, e a equipe de operação do estacionamento.
- **Objetivo:** o próprio estacionamento indica, na entrada, a melhor região para cada veículo e guia o motorista pelo celular, sem aplicativo.

## As três interfaces

| Interface | Endereço | O que faz |
|---|---|---|
| **Totem de entrada** | `/totem?acesso=A_ROT` | O motorista escolhe o veículo e, se precisar, a vaga reservada (PcD ou pessoa idosa). Recebe a região recomendada, o motivo e o caminho, e emite o ticket com QR Code. |
| **Localizador (QR Code)** | `/t/<token>` | Página mobile no estilo de app de mobilidade: mapa **3D** em tela cheia (arrastar, girar e aproximar com os dedos), rota pelas vias com setas animadas até a região, troca de nível e painel inferior com orientações e ticket. Depois de estacionar, mostra a região registrada. Sem WebGL, cai para o mapa 2D da planta. |
| **Painel administrativo** | `/painel` | Vagas livres em destaque, mapa interativo com ocupação por região, tabela de zonas (comuns, PcD, pessoa idosa), operação de tickets, simulador e vagas reservadas. No mapa, a aba **Simulação 3D** mostra a maquete 3D do estacionamento com movimentação ilustrativa. |

As três seguem a identidade aprovada nos wireframes:
- bronze como cor de ação e ouro no logo;
- temas claro e escuro, com a preferência salva;
- funcionam a partir de 320 px de largura.

## O que o MVP já faz

- **Distribuição inteligente:** cada região recebe uma pontuação por disponibilidade (50%), distância pela rota (30%) e fluxo recente (20%). A recomendação vem com justificativa em português.
- **Sem reserva:** recomendar não ocupa vaga. A ocupação só muda quando o estacionamento é confirmado e quando o veículo sai, com a capacidade revalidada no banco, também em operações simultâneas.
- **Rotas:** menor caminho no grafo de vias do mapa digital, que foi feito a partir da planta real, nos três níveis (térreo, subsolo 1 e subsolo 2). No celular, a rota aparece num mapa 3D gerado a partir dessa mesma geometria.
- **Vagas PcD e para pessoa idosa:**
  - mínimos legais calculados sobre o total (Lei 13.146/2015 e Lei 10.741/2003);
  - quem pede vaga comum nunca recebe vaga reservada, e quem pede reservada só recebe do próprio tipo;
  - a distribuição física das vagas é uma proposta simulada até a validação em campo.
- **Tempo real:** o painel e o localizador se atualizam sozinhos (Socket.IO) e se recuperam depois de uma queda de conexão.
- **Simulador:** gera entradas, confirmações, saídas, falhas de sensor e congestionamento, sempre marcados como simulados. Tem seis cenários (A–F) e carrinhos animados no mapa do painel.
- **Honestidade nos dados:**
  - sem GPS: o localizador não rastreia o veículo;
  - nenhuma distância ou tempo inventado;
  - nenhum caminho é chamado de acessível sem validação na planta.

Ainda **não** fazem parte do MVP:
- sensores físicos (os eventos de sensor existem na API e são simulados);
- painéis de LED;
- pagamento por QR Code.

## Arquitetura

```
apps/web (React + Vite)  ── REST /api + Socket.IO ──▶  apps/api (Fastify)  ── Prisma ──▶  PostgreSQL 16 (Docker)
 totem · localizador · painel                           rotas · serviços · tempo real · simulador
 mapa 3D (three.js) e 2D (SVG)                           usa packages/core (algoritmo + rotas) e packages/shared (contratos + mapa)
```

| Componente | Como funciona |
|---|---|
| **Front-end** (`apps/web`) | Três telas em React. O localizador desenha o mapa em 3D com three.js (carregado só nessa página) e usa o mapa SVG quando não há WebGL; o painel usa o mapa SVG. Em desenvolvimento, o Vite repassa `/api` e `/socket.io` para a API em `localhost:3333` e aceita conexões da rede local (para o celular). |
| **Back-end** (`apps/api`) | API REST em Fastify, validação com Zod e eventos em tempo real com Socket.IO (namespaces `/painel` e `/localizador`). Única fonte da verdade da ocupação. |
| **Banco** | PostgreSQL 16 via Docker Compose. O esquema é aplicado com `prisma db push` e o seed carrega as regiões do mapa. |
| **Algoritmo** (`packages/core`) | Funções puras: pontuação por disponibilidade, distância pela rota e fluxo; menor caminho (Dijkstra) no grafo de vias; regras das vagas reservadas. |
| **Simulador** | Roda dentro da API e usa os mesmos serviços dos dados reais. Os dados que ele gera ficam marcados como simulados. |
| **Integração** | O totem cria o ticket e a recomendação, e a ocupação não muda. A confirmação e a saída mudam a ocupação no banco. Os eventos atualizam o painel e o QR Code daquele ticket. |

Detalhes em [docs/DOCUMENTACAO-TECNICA.md](docs/DOCUMENTACAO-TECNICA.md).

## Como rodar

### Pré-requisitos

- **Node.js 22 ou superior** (testado com o 24) e **pnpm 10** (`npm install -g pnpm`)
- **Docker Desktop** (sobe o PostgreSQL 16 na porta 5433)
- Para os testes ponta a ponta: **Microsoft Edge** instalado (o Playwright usa o Edge do sistema)

### 1. Instalar e configurar

```bash
git clone https://github.com/ElitondeSousa/golden-park.git
```

```bash
cd golden-park
```

```bash
pnpm install
```

Copie o arquivo de exemplo para `apps/api/.env`. No Linux/macOS (Git Bash no Windows também serve):

```bash
cp .env.example apps/api/.env
```

No PowerShell do Windows:

```powershell
Copy-Item .env.example apps/api/.env
```

### 2. Preparar o banco

Com o Docker Desktop aberto, rode o comando abaixo. Ele sobe o PostgreSQL, cria as tabelas e carrega as 10 regiões e os acessos do mapa real:

```bash
pnpm demo:preparar
```

### 3. Subir a API e a web juntas

```bash
pnpm demo
```

- API: `http://localhost:3333`
- Web: `http://localhost:5173`

Se preferir, suba em dois terminais com `pnpm dev:api` e `pnpm dev:web`. Para conferir se tudo subiu, `http://localhost:3333/api/saude` responde `{"ok":true,"banco":"ok",...}`.

### 4. Usar

1. **Totem:** `http://localhost:5173/totem?acesso=A_ROT`. Escolha o veículo e o tipo de vaga, depois emita o ticket. Também funciona com os acessos `A_NE`, `A_S1` e `A_S2`.
2. **Localizador:** para escanear com o celular (mesma rede Wi-Fi), abra o totem pelo IP do computador (a linha `Network:` do terminal, ex.: `http://192.168.0.10:5173/totem?acesso=A_ROT`). O QR Code sai com esse endereço. No próprio computador, abra o endereço `/t/…` do ticket.
3. **Painel:** `http://localhost:5173/painel`. Para operar tickets e o simulador, informe o token do operador (o `SIMULADOR_TOKEN` do `.env`, por padrão `troque-este-token`).
4. **Movimento de demonstração:** no painel, em Simulação, clique em "Simular estacionamento tranquilo" ou "Simular horário de pico". "Reiniciar" apaga só os dados simulados.

### 5. Encerrar

Aperte **Ctrl+C** no terminal do `pnpm demo`. Depois desligue o banco (os dados ficam guardados):

```bash
pnpm db:down
```

Para apagar também os dados e recomeçar do zero:

```bash
docker compose down -v
```

### Variáveis de ambiente (`apps/api/.env`)

| Variável | Padrão | Para que serve |
|---|---|---|
| `DATABASE_URL` | `postgresql://parkvision:parkvision@localhost:5433/parkvision` | Banco de desenvolvimento |
| `DATABASE_URL_TESTE` | `…/parkvision_teste` | Banco dos testes (criado junto com o container) |
| `PORTA` | `3333` | Porta da API |
| `WEB_URL` | `http://localhost:5173` | Endereço do QR Code do ticket. Se o totem for aberto pelo IP da rede, o QR passa a usar o endereço de rede sozinho |
| `SIMULADOR_TOKEN` | `troque-este-token` | Token do operador e do simulador (troque fora da demonstração) |
| `MODO_DEMONSTRACAO` | `true` | Marca tudo o que o totem e o painel criam como simulado |

### Testes

Unitários e de integração (o banco de teste é criado junto com o container):

```bash
pnpm test
```

Ponta a ponta (Playwright com o Edge; sobe a API e a web em portas próprias, no banco de teste):

```bash
pnpm e2e
```

### Limitações (o que é simulado)

- **Ocupação de demonstração:** vem do **simulador**, sempre marcada como "dados simulados". Com `MODO_DEMONSTRACAO="true"`, os tickets do totem também ficam marcados como simulados.
- **Sensores:** não há sensores físicos. Os eventos de sensor existem na API (`POST /api/sensores/eventos`) e são gerados pelo simulador. Na demonstração, a confirmação é feita pelo painel.
- **Hardware e pagamento:** não há painéis de LED nem pagamento.
- **Localizador:** sem GPS. A página do QR mostra a região indicada ou a registrada e o caminho pelo grafo de vias, que é simplificado. O mapa 3D precisa de WebGL (sem ele, aparece o mapa 2D) e funciona sem internet; o volume dos prédios é ilustrativo.
- **Vagas reservadas:** a posição física das vagas PcD e de pessoa idosa no térreo é uma proposta simulada.
- **Simulação 3D do painel:** é ilustrativa. A movimentação é gerada no navegador, não usa a ocupação real e precisa de internet para baixar a biblioteca Three.js. Posições dos subsolos e rampas são aproximadas.
- **Testes:** só foram feitos no Edge (Chromium).

### Problemas comuns

- **`/api/saude` responde 503 ou a API não conecta:** o Docker Desktop está fechado ou o container parou. Abra o Docker e rode `pnpm db:up`.
- **Porta 5433, 3333 ou 5173 ocupada:** feche o outro processo ou mude a porta (`PORTA` no `.env`; o PostgreSQL em `docker-compose.yml`).
- **O QR Code não abre no celular:** abra o totem pelo IP do computador (linha `Network:` do terminal), e não por `localhost`, para o QR sair com o endereço de rede. Celular e computador precisam estar na mesma rede, e o firewall do Windows precisa permitir o Node.js na porta 5173.
- **`EPERM … query_engine-windows.dll.node` ao rodar `pnpm demo:preparar` ou `pnpm db:push` (Windows):** a API está rodando e prende o arquivo do Prisma. Pare a API (Ctrl+C no `pnpm demo`) e rode o comando de novo.
- **Banco de teste inexistente** (volume criado antes): rode `docker exec parkvision-postgres psql -U parkvision -c "CREATE DATABASE parkvision_teste"`.

Documentação técnica completa (arquitetura, API, eventos, algoritmo, dados, testes): [docs/DOCUMENTACAO-TECNICA.md](docs/DOCUMENTACAO-TECNICA.md). Resumo de uma página para os avaliadores: [docs/RESUMO-AVALIADORES.md](docs/RESUMO-AVALIADORES.md).

## Documentação do MVP

| Etapa | Documento |
|---|---|
| Etapa 0 — Arquitetura do MVP, contratos, mapa digital | [00-relatorio-etapa-0](docs/mvp/00-relatorio-etapa-0.md) · [01-arquitetura-mvp](docs/mvp/01-arquitetura-mvp.md) · [02-contratos](docs/mvp/02-contratos.md) · [03-plano-execucao](docs/mvp/03-plano-execucao.md) · [04-proposta-mapa](docs/mvp/04-proposta-mapa.md) · [06-revisao-planta](docs/mvp/06-revisao-planta.md) |
| Etapa 1 — Back-end e algoritmo | [07-relatorio-etapa-1](docs/mvp/07-relatorio-etapa-1.md) |
| Etapa 2 — Simulador | [08-simulador](docs/mvp/08-simulador.md) · [09-relatorio-etapa-2](docs/mvp/09-relatorio-etapa-2.md) |
| Etapa 3 — Interfaces e mapa interativo | [10-interfaces](docs/mvp/10-interfaces.md) · [11-relatorio-etapa-3](docs/mvp/11-relatorio-etapa-3.md) |
| Etapa 4 — Integração completa | [12-integracao](docs/mvp/12-integracao.md) · [13-relatorio-etapa-4](docs/mvp/13-relatorio-etapa-4.md) |
| Identidade Golden Park | [14-golden-park](docs/mvp/14-golden-park.md) |
| Navegação mobile e simulação | [15-evolucao-mapa-navegacao](docs/mvp/15-evolucao-mapa-navegacao.md) |
| Vagas PcD e pessoa idosa | [16-vagas-reservadas](docs/mvp/16-vagas-reservadas.md) |
| Telas MVP a partir dos wireframes | [17-telas-mvp](docs/mvp/17-telas-mvp.md) |
| Entrega final | [instruções de execução](INSTRUCOES-DE-EXECUCAO.md) · [roteiro](ROTEIRO-DEMONSTRACAO.md) · [checklist](CHECKLIST-ENTREGA.md) · [relatório final](RELATORIO-FINAL-ENTREGA.md) · [documentação técnica](docs/DOCUMENTACAO-TECNICA.md) · [resumo](docs/RESUMO-AVALIADORES.md) |

Capturas de todas as etapas: [docs/mvp/capturas/](docs/mvp/capturas/).

## Tecnologias

| Camada | Escolha |
|---|---|
| Linguagem | **TypeScript** |
| Frontend | React 19 + Vite · Tailwind 4 ligado aos tokens do Design System · Lucide · mapa 3D com three.js e mapa 2D em SVG próprio |
| Backend | Node.js 24 + Fastify 5 · Socket.IO · Prisma 6 · Zod |
| Banco de dados | PostgreSQL 16 (Docker) |
| Algoritmo e rotas | Pacote `@parkvision/core` (funções puras, Dijkstra no grafo de vias) |
| Testes | Vitest · Testing Library · Playwright |
| **Tecnologia sorteada** | **Design System**: tokens em 3 camadas, componentes, estados, temas, governança |

## Estrutura de pastas

```
.
├── apps/
│   ├── api/            # Fastify + Socket.IO + Prisma, simulador embutido
│   └── web/            # totem, localizador (QR Code) e painel — React + Vite
│                       #   (public/simulacao-3d: maquete 3D da aba Simulação 3D do painel)
├── packages/
│   ├── shared/         # contratos (tipos + Zod), mapa digital oficial, vagas reservadas
│   └── core/           # algoritmo de distribuição, rotas e distribuição das vagas reservadas
├── design-system/      # tokens (fonte da verdade), logos, scripts de build e contraste
├── docs/
│   ├── mvp/            # documentação das etapas do MVP, mapa e capturas
│   ├── diagrams/       # diagramas Mermaid
│   └── planta/         # planta recebida (PDF + imagens)
├── prototype/          # protótipo HTML da 1ª entrega (planejamento)
├── vitrine/            # vitrine estática publicada na Vercel
├── INSTRUCOES-DE-EXECUCAO.md · ROTEIRO-DEMONSTRACAO.md
└── CHECKLIST-ENTREGA.md · RELATORIO-FINAL-ENTREGA.md
```

## Equipe

- Eliton de Sousa Pereira
- Marcos Feliphe Freitas Moraes
- Gustavo Araújo Lopes
- Arthur Santos Coelho

## Histórico: 1ª entrega (planejamento)

Antes do MVP, a 1ª entrega (13/11/2026) reuniu documentação, arquitetura, Design System e um protótipo visual das telas.

- **Protótipo:** pode ser aberto direto no navegador, mas é só visual, sem back-end.

  ### [Abrir o protótipo da 1ª entrega](https://elitondesousa.github.io/golden-park/prototype/)

- **Documentos de planejamento:**
  [visão geral](docs/01-visao-geral.md) ·
  [requisitos](docs/02-requisitos.md) ·
  [arquitetura](docs/03-arquitetura.md) ·
  [Design System](docs/04-design-system.md) ·
  [telas](docs/05-telas.md) ·
  [tecnologia sorteada](docs/06-tecnologia-sorteada.md) ·
  [roadmap](docs/07-roadmap.md) ·
  [decisões técnicas](docs/08-decisoes-tecnicas.md) ·
  [distribuição inteligente](docs/09-distribuicao-inteligente.md) ·
  [análise da planta](docs/10-analise-planta.md) ·
  [checklist](docs/CHECKLIST-PRIMEIRA-ENTREGA.md)
- **Diferenças em relação ao MVP:** algumas escolhas do planejamento mudaram na implementação, como Fastify em vez de NestJS, Tailwind em vez de CSS Modules e pesos do algoritmo de 50/30/20. Os relatórios das etapas registram cada mudança.
