# Golden Park: checklist de entrega

Prazo: **14/11/2026, 12h (Brasília)**. Itens marcados apenas quando verificados nesta data, com a evidência ao lado.

| | Critério | Evidência |
|---|---|---|
| ☑ | MVP inicia corretamente | Instalação limpa (clone novo do GitHub + banco novo): `pnpm install` → `pnpm demo:preparar` → `pnpm demo`; `/api/saude` = `{"ok":true,"banco":"ok"}` |
| ☑ | Front-end funcional | `/totem`, `/painel` e `/t/<token>` respondem 200 na instalação limpa; build de produção (`vite build`) concluído |
| ☑ | Back-end funcional | API respondendo pelo proxy (10 regiões, 1.269 vagas); typecheck sem erros |
| ☑ | Banco de dados configurável | Docker Compose + `prisma db push` + seed, a partir do `.env.example`, em um volume novo |
| ☑ | Fluxo principal demonstrável | Na instalação limpa: totem → ticket PV-0001 → QR Code → confirmação (N3: 0 → 1) → saída (1 → 0); confirmação e saída duplicadas recusadas; sem token = 401 |
| ☑ | QR Code funcional | O ticket traz um QR com `http://localhost:5173/t/<token>`. A página abre com mapa, rota e pino, e atualiza sozinha para "Este veículo já saiu". *Abertura num celular real pela rede não testada nesta máquina (depende de `WEB_URL` com o IP).* |
| ☑ | Interface mobile responsiva | e2e `telas-mvp.spec.ts` em 320, 375, 390, 430, 768 e 1440 px: sem rolagem lateral, alvos ≥ 44 px, destino visível |
| ☑ | Dashboard funcional | e2e de painel, tempo real, reconexão, operação de tickets e vagas reservadas passando |
| ☑ | Simulador demonstrável | Instalação limpa: cenário de pico com 232 entradas, 187 confirmações, 24 saídas e 0 erros; nenhuma ocupação negativa ou acima da capacidade; "Reiniciar" volta a 0 |
| ☑ | Repositório organizado | `.gitignore` cobre `node_modules`, builds, `.env*`, logs e resultados do Playwright; nenhum arquivo temporário versionado |
| ☑ | README completo | Apresentação, problema, público-alvo, funcionalidades, tecnologias, arquitetura, pré-requisitos, instalação, configuração, execução, acesso, demonstração, limitações e solução de problemas |
| ☑ | Instruções de execução | [INSTRUCOES-DE-EXECUCAO.md](INSTRUCOES-DE-EXECUCAO.md): 10 passos com o resultado esperado de cada um |
| ☑ | Arquivo de ambiente de exemplo | `.env.example` com valores locais seguros, só de desenvolvimento |
| ☑ | Testes executados | Typecheck; Vitest 4 + 106 + 71 + 94 na instalação limpa (95 na web após a aba 3D); Playwright 49 (ver [RELATORIO-FINAL-ENTREGA.md](RELATORIO-FINAL-ENTREGA.md)) |
| ☑ | Instalação limpa validada | Clone novo e banco novo, seguindo só a documentação. *Mesma máquina Windows; Linux e macOS não testados.* |
| ☑ | Ausência de credenciais expostas | `.env` nunca foi versionado (histórico conferido). O token e o banco do exemplo são valores locais de demonstração. |
| ☑ | Roteiro de demonstração pronto | [ROTEIRO-DEMONSTRACAO.md](ROTEIRO-DEMONSTRACAO.md) (3 a 5 min), só com funções implementadas |
| ☑ | Repositório acessível aos avaliadores | Repositório **público** no GitHub (conferido) com todos os documentos desta etapa enviados (commit `169a689`) |

## Ações da equipe

1. Abrir https://github.com/ElitondeSousa/golden-park numa aba anônima e conferir README, instruções e resumo.
2. Submeter no formulário do HackaRun até 12h: link do repositório, vídeo de 90 s (feito pela equipe) e resumo de uma página (`docs/RESUMO-AVALIADORES.pdf`).
3. Antes do pitch: rodar `pnpm demo:preparar` e `pnpm demo` no computador da apresentação e ensaiar o [roteiro](ROTEIRO-DEMONSTRACAO.md).
