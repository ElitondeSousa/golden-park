# Golden Park — Documentação técnica do MVP

Documento único para a avaliação: o que o projeto é, como está organizado, quais tecnologias usa e como funciona. Detalhes de cada etapa estão nos relatórios em [docs/mvp/](mvp/). Instruções de instalação e execução estão no [README](../README.md#como-rodar).

## 1. Visão geral

O Golden Park distribui automaticamente os veículos no estacionamento do Capim Dourado Shopping:

1. Na entrada, o **totem** pergunta o tipo de veículo e, se necessário, a vaga reservada (PcD ou pessoa idosa).
2. O **algoritmo** escolhe a melhor região naquele momento e explica o motivo.
3. O motorista recebe um **ticket com QR Code**.
4. Ao escanear o QR Code, o celular abre o **localizador**: mapa com a rota pelos corredores até a região, sem instalar aplicativo.
5. Depois de estacionar, o mesmo QR Code mostra onde o carro ficou.
6. A operação acompanha tudo no **painel administrativo**, em tempo real.

Regra central: **recomendar não é reservar.** A ocupação de uma região só muda quando o estacionamento é confirmado e quando o veículo sai. A capacidade é revalidada no banco nesse momento.

## 2. Arquitetura

```
                ┌───────────────────────────── apps/web (React + Vite) ─────────────────────────────┐
                │  Totem /totem         Localizador /t/:token         Painel /painel                │
                │        └──────────── MapaEstacionamento (SVG, planta real) ───────────┘           │
                └───────────────▲───────────── REST (/api) ─────────────▲── Socket.IO ──────────────┘
                                │                                       │
                ┌───────────────┴──────────── apps/api (Fastify) ───────┴───────────────────────────┐
                │  rotas REST · serviços (tickets, regiões, sensores) · tempo real · simulador        │
                │        │ usa                                   │ Prisma                             │
                │  packages/core (algoritmo + rotas)      PostgreSQL 16 (Docker)                      │
                │  packages/shared (tipos, Zod, mapa digital, vagas reservadas)                       │
                └─────────────────────────────────────────────────────────────────────────────────────┘
```

| Pacote | Papel |
|---|---|
| `packages/shared` | Contratos usados por todos: tipos de domínio, esquemas de validação (Zod), eventos em tempo real e o **mapa digital oficial** (regiões, capacidades, acessos e grafo de vias extraídos da planta). |
| `packages/core` | **Funções puras**, sem banco: algoritmo de recomendação, menor caminho (Dijkstra) e proposta de distribuição das vagas reservadas. |
| `apps/api` | API Fastify 5, Socket.IO, Prisma/PostgreSQL e o simulador embutido. É a única fonte da verdade da ocupação. |
| `apps/web` | As três interfaces em React 19 e o mapa em SVG próprio. Os estilos vêm dos tokens do Design System. |
| `design-system` | Tokens em 3 camadas (primitivos → semânticos → componentes) com tema claro e escuro, logos e scripts de build e de contraste. |

## 3. Tecnologias

| Camada | Tecnologias |
|---|---|
| Linguagem | TypeScript (Node.js 24) |
| Back-end | Fastify 5, Socket.IO 4, Prisma 6, Zod 4 |
| Banco | PostgreSQL 16 em Docker Compose |
| Front-end | React 19, Vite, React Router, Tailwind 4 (ligado aos tokens `--pv-*`), Lucide, `qrcode` |
| Testes | Vitest, Testing Library, Playwright (Edge) |
| Monorepo | pnpm workspaces |
| Design System | W3C Design Tokens (JSON) → CSS gerado; verificação automática de contraste (WCAG AA) |

## 4. Fluxo principal

```
Totem ──POST /api/entradas──▶ API: roda o algoritmo, cria ticket + recomendação (ocupação NÃO muda)
  ◀── ticket, recomendação (região, justificativa, rota), URL do QR Code
Motorista escaneia o QR ──GET /api/localizador/:token──▶ região, rota e orientações (só deste ticket)
Confirmação (operador/sensor) ──POST /api/tickets/:codigo/estacionar──▶ +1 ocupada (UPDATE condicionado)
Saída ──POST /api/tickets/:codigo/saida──▶ −1 ocupada
Cada mudança ──Socket.IO──▶ painel (/painel) e o localizador daquele ticket (/localizador)
```

- O QR Code leva um **token aleatório**. O banco guarda só o hash SHA-256 dele, e a página do QR não expõe dados de outros tickets.
- Concorrência: toda troca de status é um `UPDATE … WHERE status = …`, e a ocupação muda com `UPDATE … WHERE ocupadas < capacidade` na mesma transação. Confirmações simultâneas nunca passam da capacidade.

## 5. Algoritmo de recomendação (`packages/core`)

1. **Elegibilidade.** A região precisa:
   - aceitar a categoria (moto, carro pequeno, carro grande);
   - estar operando, com dados confiáveis (sensores ok);
   - ter vaga livre **do tipo pedido** (comum, PcD ou pessoa idosa);
   - ter rota a partir do acesso.
2. **Pontuação** (pesos fixos): disponibilidade 50% + distância pela rota 30% + fluxo recente 20%.
3. **Empate** (diferença menor que 0,01): vence a menor distância, depois mais vagas livres, depois o código.
4. **Justificativa** em português, comparando com a segunda colocada.
5. **Vagas reservadas:**
   - pedido comum nunca recebe vaga reservada;
   - PcD e pessoa idosa só recebem vaga do próprio tipo;
   - sem vaga do tipo, o resultado é "indisponível", sem troca automática de tipo;
   - PcD prefere regiões no mesmo nível da entrada de pedestres. O texto nunca afirma rota acessível não validada.
6. **Rota:** menor caminho (Dijkstra) no grafo de vias dos três níveis.

## 6. Dados

**Mapa digital** (`packages/shared/src/mapa/capim-dourado.json`): 10 regiões em 3 níveis (térreo, subsolo 1 e subsolo 2), 1.269 vagas, acessos de veículos, nós e arestas do grafo de vias, com coordenadas da planta.

**Vagas reservadas** (`acessibilidade.json`):
- mínimos legais (2% PcD, 5% pessoa idosa) sobre o total;
- vagas lidas na planta;
- entradas de pedestres;
- critérios da proposta de distribuição.

**Banco** (Prisma):

| Tabela | Conteúdo |
|---|---|
| `regiao` | Capacidade e ocupação totais e por tipo (PcD, pessoa idosa), estado operacional, sensores, fluxo, versão |
| `ticket` | Código, hash do token do QR, categoria, tipo de vaga, acesso, região recomendada e registrada, status, marca de simulado |
| `recomendacao` | Região, pontuação, pesos, avaliação de todas as regiões, justificativa e rota |
| `evento_ocupacao` | Entradas, saídas e ajustes |
| `evento_sensor` | Eventos de sensor (idempotentes pelo id) |

## 7. API REST

Sem autenticação: leitura pública, totem e localizador. Com o cabeçalho `x-operador-token`: operação e simulador.

| Método | Rota | Uso |
|---|---|---|
| GET | `/api/saude` | Saúde da API e do banco (503 se o banco cair) |
| GET | `/api/mapa`, `/api/regioes`, `/api/indicadores` | Mapa, regiões (com vagas por tipo) e indicadores |
| GET | `/api/recomendacoes`, `/api/historico`, `/api/vagas-reservadas` | Últimas recomendações, movimentações, resumo das vagas reservadas |
| POST | `/api/entradas` | Totem: registra a entrada e devolve ticket + recomendação + URL do QR |
| GET | `/api/localizador/:token` | Página do QR: só os dados daquele ticket |
| GET | `/api/tickets`, `/api/tickets/:codigo` | Operação: lista e consulta |
| POST | `/api/tickets/:codigo/estacionar` · `/saida` · `/recomendacao` · `/cancelar` | Confirmar, registrar saída, nova recomendação, cancelar |
| PATCH | `/api/regioes/:id` · `/api/regioes/:id/vagas-reservadas` | Ajustes da região e das vagas reservadas (recusa valores inconsistentes) |
| POST | `/api/sensores/eventos` | Eventos de sensor (vaga ocupada/liberada, falha, fluxo, disponibilidade) |
| GET/POST/PATCH | `/api/simulacao/*` | Estado, cenários, iniciar/pausar/retomar/encerrar/reiniciar, configuração e eventos manuais |

Erros sempre no formato `{ erro: { codigo, mensagem } }`. Contratos completos: [docs/mvp/02-contratos.md](mvp/02-contratos.md).

## 8. Tempo real (Socket.IO)

- **Namespace `/painel`:** recebe todos os eventos.
  - `veiculo:entrou`, `veiculo:recomendado`, `veiculo:estacionou`, `veiculo:saiu`;
  - `regiao:ocupacao`, `regiao:status`, `regiao:fluxo`;
  - `indicadores:atualizados`, `ticket:atualizado`;
  - `simulador:*`.
- **Namespace `/localizador`:** cada página do QR entra só na sala do seu ticket.
- **Proteção contra perdas e atrasos:**
  - todo evento leva id, sequência e a marca `simulado`;
  - a região leva uma versão, e o painel descarta eventos atrasados;
  - ao reconectar, o painel recarrega o estado pela API.

## 9. Simulador

Roda dentro da API e usa **os mesmos serviços** dos dados reais, então valem as mesmas regras.

- **Eventos:** gera chegadas, confirmações, saídas, falhas de sensor e congestionamento, com relógio acelerado e semente fixa (reproduzível).
- **Seis cenários:**

  | Cenário | Situação |
  |---|---|
  | A | tranquilo |
  | B | pico |
  | C | região lotada |
  | D | congestionamento |
  | E | indisponibilidade |
  | F | vagas reservadas esgotadas |

- **Marcação:** tudo o que ele cria fica com `simulado = true`. "Reiniciar" apaga só isso e devolve as vagas, sem tocar em dados reais.

## 10. Interfaces

| Tela | Destaques |
|---|---|
| **Totem** | Uma ação por etapa, botões grandes, progresso "Etapa X de 4", recomendação com o código da zona em destaque, motivo, passos, aviso de que não reserva vaga, ticket com QR Code real. |
| **Localizador** | Mapa em tela cheia (pinça, arrastar, centralizar, ver rota inteira), painel inferior expansível, estados a caminho / estacionado / saiu / inválido / sem conexão. Sem GPS e sem distâncias inventadas. |
| **Painel** | Navegação horizontal, vagas livres em destaque, mapa com ocupação e rota, tabela de zonas (comuns, PcD, pessoa idosa), operação de tickets, simulador e vagas reservadas, tudo em tempo real. |

Identidade e acessibilidade nas três telas:
- **Cores e temas:** bronze como cor de ação; temas claro e escuro com a preferência salva.
- **Acessibilidade:** contraste AA conferido, alvos de toque de 44 px, foco visível, `prefers-reduced-motion`.
- **Telas:** larguras de 320 px a 1440 px.

## 11. Qualidade e testes

| Suíte | Cobertura | Resultado |
|---|---|---|
| `packages/shared` | Integridade do mapa digital | 4 testes |
| `packages/core` | Algoritmo, empates, rotas, vagas reservadas | 106 testes |
| `apps/api` (banco de teste) | Regras, concorrência, tempo real, simulador, vagas reservadas | 71 testes |
| `apps/web` | Componentes, mapa, gestos, telas | 94 testes |
| Playwright (Edge) | Fluxos completos, integração, celular, temas, responsividade em 6 larguras | 49 testes |

## 12. Segurança e privacidade

- **Rotas de operação:** exigem token de operador.
- **QR Code:** guarda só o hash do token. A página do QR nunca mostra placa nem dados de outros tickets, e os eventos públicos saem sem placa.
- **Validação:** todas as entradas da API passam por Zod; erros de banco viram 503 sem detalhes internos.
- **Dados de demonstração:** separados dos reais (marca `simulado`) e identificados em todas as telas.

## 13. Limitações conhecidas

- **Sensores, LED e pagamento:** sensores físicos ainda não foram integrados (os eventos de sensor são simulados), e não há painéis de LED nem pagamento.
- **Planta e grafo:** as capacidades do térreo foram contadas no desenho e precisam de confirmação. O grafo de vias é simplificado.
- **Vagas reservadas:** a posição física e os caminhos a pé são uma proposta simulada até a validação em campo.
- **Testes:** só foram feitos no navegador Edge (Chromium).
