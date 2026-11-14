# Golden Park: checklist de entrega

Prazo: **14/11/2026, 12h (Brasília)**. Itens marcados apenas quando verificados nesta data, com a evidência ao lado.

| | Critério | Evidência |
|---|---|---|
| ☑ | MVP inicia corretamente | Instalação limpa (clone novo do GitHub + banco novo): `pnpm install` → `pnpm demo:preparar` → `pnpm demo`; `/api/saude` = `{"ok":true,"banco":"ok"}` |
| ☑ | Front-end funcional | `/totem`, `/painel` e `/t/<token>` respondem 200 na instalação limpa; build de produção (`vite build`) concluído |
| ☑ | Back-end funcional | API respondendo pelo proxy (10 regiões, 1.269 vagas); typecheck sem erros |
| ☑ | Banco de dados configurável | Docker Compose + `prisma db push` + seed, a partir do `.env.example`, em um volume novo |
| ☑ | Fluxo principal demonstrável | Na instalação limpa: totem → ticket PV-0001 → QR Code → confirmação (N3: 0 → 1) → saída (1 → 0); confirmação e saída duplicadas recusadas; sem token = 401 |
| ☑ | QR Code funcional | O ticket traz um QR com `http://localhost:5173/t/<token>`. A página abre com o mapa 3D, a rota em setas e o pino, e atualiza sozinha para "Este veículo já saiu". Com o totem aberto pelo IP da rede, o QR sai com esse endereço, sem editar o `.env` (commit `c4a23d9`, com teste). |
| ☑ | Interface mobile responsiva | e2e `telas-mvp.spec.ts` em 320, 375, 390, 430, 768 e 1440 px: sem rolagem lateral, alvos ≥ 44 px, destino visível |
| ☑ | Dashboard funcional | e2e de painel, tempo real, reconexão, operação de tickets e vagas reservadas passando |
| ☑ | Simulador demonstrável | Instalação limpa: cenário de pico com 232 entradas, 187 confirmações, 24 saídas e 0 erros; nenhuma ocupação negativa ou acima da capacidade; "Reiniciar" volta a 0 |
| ☑ | Repositório organizado | `.gitignore` cobre `node_modules`, builds, `.env*`, logs e resultados do Playwright; nenhum arquivo temporário versionado |
| ☑ | README completo | Apresentação, problema, público-alvo, funcionalidades, tecnologias, arquitetura, pré-requisitos, instalação, configuração, execução, acesso, demonstração, limitações e solução de problemas |
| ☑ | Instruções de execução | [INSTRUCOES-DE-EXECUCAO.md](INSTRUCOES-DE-EXECUCAO.md): 10 passos com o resultado esperado de cada um |
| ☑ | Arquivo de ambiente de exemplo | `.env.example` com valores locais seguros, só de desenvolvimento |
| ☑ | Testes executados | Typecheck; Vitest 4 + 106 + 71 + 94 na instalação limpa; hoje 4 + 106 + 71 + 96, depois da aba 3D e do mapa 3D do cliente; Playwright 49 (ver [RELATORIO-FINAL-ENTREGA.md](RELATORIO-FINAL-ENTREGA.md)) |
| ☑ | Instalação limpa validada | Clone novo e banco novo, seguindo só a documentação. *Mesma máquina Windows; Linux e macOS não testados.* |
| ☑ | Ausência de credenciais expostas | `.env` nunca foi versionado (histórico conferido). O token e o banco do exemplo são valores locais de demonstração. |
| ☑ | Roteiro de demonstração pronto | [ROTEIRO-DEMONSTRACAO.md](ROTEIRO-DEMONSTRACAO.md) (3 a 5 min), só com funções implementadas |
| ☑ | Repositório acessível aos avaliadores | Repositório **público** no GitHub (conferido), com todos os documentos enviados |
| ☑ | Vitrine online | https://golden-park-weld.vercel.app responde (telas estáticas do cliente, da administração e do totem) |
| ☑ | Pasta do pitch acessível | Link no README; pasta compartilhada como "Qualquer pessoa com o link" (Leitor) e conferida sem login. *A pasta ainda está vazia: falta a equipe enviar o vídeo.* |

## Ações da equipe

1. Enviar o vídeo para a [pasta do pitch](https://drive.google.com/drive/folders/1As2GhpaemcnAX9MI47cfdmz8J1NMfw98?usp=drive_link), que já é pública e hoje está vazia.
2. Abrir https://github.com/ElitondeSousa/golden-park numa aba anônima e conferir README, instruções, resumo e o link do pitch.
3. Submeter no formulário do HackaRun até 12h: link do repositório, vídeo de 90 s (feito pela equipe) e resumo de uma página (`docs/RESUMO-AVALIADORES.pdf`).
4. Antes do pitch: rodar `pnpm demo:preparar` e `pnpm demo` no computador da apresentação e ensaiar o [roteiro](ROTEIRO-DEMONSTRACAO.md).
