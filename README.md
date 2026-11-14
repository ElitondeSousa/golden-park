<p align="center">
  <img src="design-system/brand/golden-park-claro-completo.png" alt="Golden Park — sistema inteligente de estacionamento" width="300">
</p>

# Golden Park — Sistema inteligente de estacionamento

> O projeto se chamava **ParkVision** até a atualização de identidade visual; documentos das etapas anteriores mantêm o nome antigo como registro histórico. Identificadores técnicos (pacotes `@parkvision/*`, tokens `--pv-*`, URL do repositório) foram preservados por compatibilidade. Identidade, logos e temas: [docs/mvp/14-golden-park.md](docs/mvp/14-golden-park.md).

Sistema que **organiza e distribui automaticamente os veículos** no estacionamento do Capim Dourado Shopping:
- recomenda a melhor região na entrada;
- emite um ticket com QR Code;
- guia o motorista pelo celular, sem aplicativo;
- mostra a operação em tempo real no painel.

> **Status atual: MVP funcional.** As três interfaces (totem, localizador pelo QR Code e painel administrativo) estão implementadas e integradas ao back-end real: API, banco, algoritmo, simulador e tempo real. Os números de ocupação nas demonstrações vêm do simulador e aparecem sempre marcados como dados simulados.

<p align="center">
  <img src="docs/mvp/capturas/mvp-localizador-375-claro.png" alt="Localizador pelo QR Code no celular" height="420">
  &nbsp;
  <img src="docs/mvp/capturas/mvp-localizador-320-escuro.png" alt="Localizador no tema escuro" height="420">
</p>

<p align="center">
  <img src="docs/mvp/capturas/mvp-totem-1440-recomendacao.png" alt="Totem de entrada com a região recomendada" width="49%">
  <img src="docs/mvp/capturas/mvp-painel-1440-claro.png" alt="Painel administrativo" width="49%">
</p>

## As três interfaces

| Interface | Endereço | O que faz |
|---|---|---|
| **Totem de entrada** | `/totem?acesso=A_ROT` | O motorista escolhe o veículo e, se precisar, a vaga reservada (PcD ou pessoa idosa). Recebe a região recomendada, o motivo e o caminho, e emite o ticket com QR Code. |
| **Localizador (QR Code)** | `/t/<token>` | Página mobile tipo app de navegação: mapa em tela cheia, rota pelos corredores até a região, painel inferior com orientações e ticket. Depois de estacionar, mostra a região registrada. |
| **Painel administrativo** | `/painel` | Vagas livres em destaque, mapa interativo com ocupação por região, tabela de zonas (comuns, PcD, pessoa idosa), operação de tickets, simulador e vagas reservadas. |

As três seguem a identidade aprovada nos wireframes:
- bronze como cor de ação e ouro no logo;
- temas claro e escuro, com a preferência salva;
- funcionam a partir de 320 px de largura.

## O que o MVP já faz

- **Distribuição inteligente:** cada região recebe uma pontuação por disponibilidade (50%), distância pela rota (30%) e fluxo recente (20%). A recomendação vem com justificativa em português.
- **Sem reserva:** recomendar não ocupa vaga. A ocupação só muda quando o estacionamento é confirmado e quando o veículo sai, com a capacidade revalidada no banco, também em operações simultâneas.
- **Rotas:** menor caminho no grafo de vias do mapa digital, que foi feito a partir da planta real, nos três níveis (térreo, subsolo 1 e subsolo 2).
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

- API: `http://localhost:3333` (teste rápido: `http://localhost:3333/api/saude`)
- Web: `http://localhost:5173`

Se preferir, suba em dois terminais com `pnpm dev:api` e `pnpm dev:web`.

### 4. Usar

1. **Totem:** `http://localhost:5173/totem?acesso=A_ROT`. Escolha o veículo e o tipo de vaga, depois emita o ticket. Também funciona com os acessos `A_NE`, `A_S1` e `A_S2`.
2. **Localizador:** escaneie o QR Code do ticket com o celular na mesma rede, trocando `localhost` pelo IP do computador em `WEB_URL`, ou abra o endereço `/t/…` no navegador.
3. **Painel:** `http://localhost:5173/painel`. Para operar tickets e o simulador, informe o token do operador (o `SIMULADOR_TOKEN` do `.env`, por padrão `troque-este-token`).
4. **Movimento de demonstração:** no painel, em Simulação, clique em "Simular estacionamento tranquilo" ou "Simular horário de pico". "Reiniciar" apaga só os dados simulados.

### Variáveis de ambiente (`apps/api/.env`)

| Variável | Padrão | Para que serve |
|---|---|---|
| `DATABASE_URL` | `postgresql://parkvision:parkvision@localhost:5433/parkvision` | Banco de desenvolvimento |
| `DATABASE_URL_TESTE` | `…/parkvision_teste` | Banco dos testes (criado junto com o container) |
| `PORTA` | `3333` | Porta da API |
| `WEB_URL` | `http://localhost:5173` | Endereço usado no QR Code do ticket |
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

### Problemas comuns

- **`/api/saude` responde 503 ou a API não conecta:** o Docker Desktop está fechado ou o container parou. Abra o Docker e rode `pnpm db:up`.
- **Porta 5433, 3333 ou 5173 ocupada:** feche o outro processo ou mude a porta (`PORTA` no `.env`; o PostgreSQL em `docker-compose.yml`).
- **O QR Code não abre no celular:** o celular precisa alcançar o computador. Use o IP da máquina em `WEB_URL` e acesse a web por esse IP.
- **`EPERM … query_engine-windows.dll.node` ao rodar `pnpm demo:preparar` ou `pnpm db:push` (Windows):** a API está rodando e prende o arquivo do Prisma. Pare a API (Ctrl+C no `pnpm demo`) e rode o comando de novo.
- **Banco de teste inexistente** (volume criado antes): rode `docker exec parkvision-postgres psql -U parkvision -c "CREATE DATABASE parkvision_teste"`.

Documentação técnica completa (arquitetura, API, eventos, algoritmo, dados, testes): [docs/DOCUMENTACAO-TECNICA.md](docs/DOCUMENTACAO-TECNICA.md). Resumo de uma página para os avaliadores: [docs/RESUMO-AVALIADORES.md](docs/RESUMO-AVALIADORES.md).

## Documentação do MVP

| Etapa | Documento |
|---|---|
| Etapa 0 — Arquitetura do MVP, contratos, mapa digital | [01-arquitetura-mvp](docs/mvp/01-arquitetura-mvp.md) · [02-contratos](docs/mvp/02-contratos.md) · [04-proposta-mapa](docs/mvp/04-proposta-mapa.md) · [06-revisao-planta](docs/mvp/06-revisao-planta.md) |
| Etapa 1 — Back-end e algoritmo | [07-relatorio-etapa-1](docs/mvp/07-relatorio-etapa-1.md) |
| Etapa 2 — Simulador | [08-simulador](docs/mvp/08-simulador.md) · [09-relatorio-etapa-2](docs/mvp/09-relatorio-etapa-2.md) |
| Etapa 3 — Interfaces e mapa interativo | [10-interfaces](docs/mvp/10-interfaces.md) · [11-relatorio-etapa-3](docs/mvp/11-relatorio-etapa-3.md) |
| Etapa 4 — Integração completa | [12-integracao](docs/mvp/12-integracao.md) · [13-relatorio-etapa-4](docs/mvp/13-relatorio-etapa-4.md) |
| Identidade Golden Park | [14-golden-park](docs/mvp/14-golden-park.md) |
| Navegação mobile e simulação | [15-evolucao-mapa-navegacao](docs/mvp/15-evolucao-mapa-navegacao.md) |
| Vagas PcD e pessoa idosa | [16-vagas-reservadas](docs/mvp/16-vagas-reservadas.md) |
| Telas MVP a partir dos wireframes | [17-telas-mvp](docs/mvp/17-telas-mvp.md) |

Capturas de todas as etapas: [docs/mvp/capturas/](docs/mvp/capturas/).

## Tecnologias

| Camada | Escolha |
|---|---|
| Linguagem | **TypeScript** |
| Frontend | React 19 + Vite · Tailwind 4 ligado aos tokens do Design System · Lucide · mapa em SVG próprio |
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
├── packages/
│   ├── shared/         # contratos (tipos + Zod), mapa digital oficial, vagas reservadas
│   └── core/           # algoritmo de distribuição, rotas e distribuição das vagas reservadas
├── design-system/      # tokens (fonte da verdade), logos, scripts de build e contraste
├── docs/
│   ├── mvp/            # documentação das etapas do MVP, mapa e capturas
│   ├── diagrams/       # diagramas Mermaid
│   └── planta/         # planta recebida (PDF + imagens)
└── prototype/          # protótipo HTML da 1ª entrega (planejamento)
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
