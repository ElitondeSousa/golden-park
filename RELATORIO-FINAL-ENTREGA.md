# Golden Park: relatório final de entrega

**Data:** 14/11/2026, das 10h35 às 11h (Brasília). Prazo: 12h.
**Classificação: PRONTO PARA ENTREGA.** Justificativa na seção 9.

## 1. Estado geral

O MVP instala, sobe e funciona seguindo só a documentação. A prova é uma **instalação limpa**: clone novo do repositório público no GitHub, banco novo em volume Docker separado, só os comandos do README. Nela foram executados:
- o fluxo principal completo;
- o simulador;
- toda a suíte de testes.

Nenhum problema bloqueador (P0) ou crítico (P1) foi encontrado. Nesta etapa não houve mudança de código: só documentação e organização, como pede a regra de não criar funcionalidades.

## 2. Classificação dos problemas encontrados

| Nível | Problema | Tratamento |
|---|---|---|
| P0 | Nenhum | — |
| P1 | Nenhum | — |
| P2 | No Windows, `pnpm demo:preparar` / `db:push` falha com `EPERM … query_engine` se a API estiver rodando (o Prisma não regrava o arquivo em uso) | Documentado em "Problemas comuns" (parar a API e repetir). Não ocorre na instalação limpa. |
| P2 | O nome fixo do container (`parkvision-postgres`) impede duas cópias do projeto com o banco no ar ao mesmo tempo | Documentado ("container name already in use" → `pnpm db:down` na outra cópia) |
| P2 | Abrir o QR Code num celular de verdade exigia `WEB_URL` com o IP do computador | **Corrigido** depois da auditoria (seção 2.2): o QR usa o endereço por onde o totem foi aberto |
| P2 | O build de produção avisa que um pacote JS passa de 500 kB | Só aviso, sem efeito na demonstração. O mapa 3D fica num pacote separado, carregado só no localizador. |
| P2 | Os testes ponta a ponta dependem do Microsoft Edge instalado | Documentado nos pré-requisitos (opcional) |

## 2.1. Adição pedida pela equipe depois da auditoria

**Simulação 3D no mapa do painel.** A aba "Simulação 3D", ao lado de "Mapa 2D", mostra a maquete 3D do estacionamento (`apps/web/public/simulacao-3d/`, cópia da página de `docs/mvp/mapa/simulacao-3d.html`) dentro do painel, com o link "Abrir em tela cheia".

- **Rótulo:** ilustrativa; a movimentação é gerada no navegador e não usa a ocupação real.
- **Impacto:** não mexe na API, no algoritmo nem no mapa 2D, que continua sendo a visão padrão.
- **Verificação:** a cena carregou no navegador; há um teste unitário novo da troca 2D/3D (web 95/95); typecheck limpo; 19 testes e2e do painel passando.
- **Limitação:** precisa de internet, porque o Three.js é baixado de CDN com versão fixa (0.160.0).

## 2.2. Ajustes posteriores (mesmo dia, depois da auditoria)

Todos enviados ao GitHub, com typecheck e testes passando depois de cada um:

- **Vitrine online na Vercel** (https://golden-park-weld.vercel.app): telas estáticas do cliente, da administração e do totem, com a simulação 3D. Pasta `vitrine/`.
- **Protótipo da 1ª entrega** restaurado ao design planejado (dourado e creme); o build de tokens não o sobrescreve mais.
- **QR Code no celular:** a web aceita conexões da rede local e o totem gera o QR com o endereço por onde foi aberto, sem editar o `.env`.
- **Mapa 3D no localizador:** a página do QR mostra o estacionamento em 3D (three.js), com a rota em setas animadas, troca de nível e gestos de arrastar, girar e aproximar. Sem WebGL, volta para o mapa 2D. Os testes e2e cobrem o modo 3D e os unitários, o 2D. Testes: shared 4, core 106, api 71, web 96; Playwright 49 passando.
- **README e documentos** revistos, com as capturas do mapa 3D, a vitrine e o link da pasta do pitch em vídeo.

## 3. Funcionalidades confirmadas

Confirmado na instalação limpa, salvo indicação:

- **Totem:**
  - iniciar atendimento, escolher categoria e tipo de vaga (comum, PcD, pessoa idosa);
  - recomendação com região, justificativa e passos;
  - ticket com QR Code real, apontando para `http://localhost:5173/t/<token>`.
- **Distribuição:**
  - a recomendação **não reserva**: a ocupação de N3 ficou em 0 até a confirmação, subiu para 1 e voltou a 0 na saída;
  - confirmação e saída duplicadas são recusadas (`TRANSICAO_INVALIDA`);
  - operação sem token responde 401;
  - vagas comuns, PcD e pessoa idosa, compatibilidade por veículo e estacionamento lotado estão cobertos pelos testes de core e API.
- **QR Code e mapa:**
  - a página abre com mapa, rota pelo grafo de vias e pino de destino (hoje em 3D, seção 2.2);
  - nenhum texto fala em GPS;
  - depois da saída, a página mudou sozinha para "Este veículo já saiu".
- **Painel:** ocupação total, disponibilidade por região e por tipo, mapa, tempo real, operação de tickets e controles do simulador (testes e2e e de componente).
- **Simulador:**
  - cenário de pico com 232 entradas, 187 confirmações, 24 saídas e **0 erros**;
  - nenhuma região ou tipo de vaga com ocupação negativa ou acima da capacidade, e as somas por tipo fecham;
  - "Reiniciar" removeu 930 tickets simulados e devolveu a ocupação a 0.
- **Responsividade:** e2e em 320, 375, 390, 430, 768 e 1440 px, sem rolagem lateral, com alvos de 44 px e o destino visível.

## 4. Testes executados

| Comando | Onde | Resultado |
|---|---|---|
| `pnpm install` | Instalação limpa | OK (55 s) |
| `pnpm demo:preparar` | Instalação limpa | OK: `✔ 10 regiões e acessos carregados` |
| `pnpm demo` + `curl /api/saude` | Instalação limpa | `{"ok":true,"banco":"ok","modoDemonstracao":true}`; `/totem` e `/painel` = 200 |
| Fluxo pela interface e API (totem → QR → confirmar → sair) | Instalação limpa | OK (seção 3) |
| Simulação de pico + verificação de invariantes + reiniciar | Instalação limpa | OK (seção 3) |
| `pnpm typecheck` | Instalação limpa | OK (exit 0) |
| `pnpm test` | Instalação limpa | **275/275**: shared 4, core 106, api 71, web 94 |
| `pnpm e2e` (Playwright, Edge) | Instalação limpa | **49 passando**, 6 especificações de captura puladas de propósito (exit 0, 3,7 min) |
| `pnpm --filter @parkvision/web build` | Repositório de desenvolvimento | OK (aviso de tamanho de pacote) |
| `pnpm e2e` | Repositório de desenvolvimento (mais cedo, mesma versão) | 49 passando, 6 capturas puladas |

**Não executado:**
- instalação em Linux e macOS;
- abertura do QR num celular físico pela rede;
- Safari/iOS (só o Edge está disponível).

## 5. Documentação produzida ou atualizada

- [README.md](README.md):
  - apresentação, problema, público-alvo, funcionalidades e tecnologias reais;
  - arquitetura, pré-requisitos, instalação, configuração, execução, acesso e demonstração;
  - limitações e solução de problemas.
- [INSTRUCOES-DE-EXECUCAO.md](INSTRUCOES-DE-EXECUCAO.md): 10 passos numerados com o resultado esperado em cada um.
- [ROTEIRO-DEMONSTRACAO.md](ROTEIRO-DEMONSTRACAO.md): demonstração de 3 a 5 minutos, só com funções implementadas.
- [CHECKLIST-ENTREGA.md](CHECKLIST-ENTREGA.md): critérios com evidência.
- Já existentes e conferidos: [docs/DOCUMENTACAO-TECNICA.md](docs/DOCUMENTACAO-TECNICA.md), [docs/RESUMO-AVALIADORES.pdf](docs/RESUMO-AVALIADORES.pdf), `.env.example` e os relatórios das etapas em `docs/mvp/`.

## 6. Instruções de inicialização (resumo)

```bash
git clone https://github.com/ElitondeSousa/golden-park.git
```

```bash
cd golden-park
```

```bash
pnpm install
```

```bash
cp .env.example apps/api/.env
```

```bash
pnpm demo:preparar
```

```bash
pnpm demo
```

Depois abra:
- totem: http://localhost:5173/totem?acesso=A_ROT
- painel: http://localhost:5173/painel (token do operador: valor de `SIMULADOR_TOKEN`)
- localizador: endereço `/t/…` do QR Code

## 7. Riscos restantes

- **QR no celular:** a demonstração com celular real depende da rede local e do firewall. Alternativa: abrir o link `/t/…` no navegador do computador.
- **Docker:** o Docker Desktop precisa estar aberto antes de `pnpm demo:preparar`. Sem ele, o comando falha com mensagem do Docker.
- **Sistemas operacionais:** só o Windows foi validado; em Linux e macOS os comandos são os mesmos, mas não foram executados.
- **Dados:** a ocupação de demonstração é simulada (está marcada assim em todas as telas). Sensores físicos, LED e pagamento não fazem parte do MVP.

## 8. Agentes e skills

- **Agente de documentação:** escreveu o roteiro de demonstração em paralelo, com o contexto completo do projeto.
- **Sessão principal:** auditoria, testes, instalação limpa, instruções, checklist e este relatório.
- **Skills:** nenhuma skill nova foi instalada, porque não traria ganho dentro do prazo. As diretrizes de interface (Web Interface Guidelines) já tinham sido aplicadas na etapa anterior.

## 9. Classificação: PRONTO PARA ENTREGA

Evidências: os quatro requisitos obrigatórios foram validados.
1. **MVP funcional:** fluxo completo e simulador executados numa instalação limpa, com a regra de não reservar vaga confirmada.
2. **Repositório organizado e disponível:** público no GitHub, `.gitignore` correto, sem credenciais versionadas (o `.env` nunca entrou no histórico).
3. **Documentação:** README, documentação técnica, resumo de uma página, roteiro e relatórios.
4. **Instruções completas:** seguidas à risca numa cópia limpa, do clone à demonstração. Os únicos obstáculos encontrados são de ambiente e estão documentados.

As limitações (simulação, sem hardware, testes só em Windows e Edge) estão declaradas, mas não impedem instalar, executar nem avaliar.

## 10. Ações que dependem da equipe

1. A [pasta do pitch em vídeo](https://drive.google.com/drive/folders/1As2GhpaemcnAX9MI47cfdmz8J1NMfw98?usp=drive_link) já está pública (qualquer pessoa com o link pode ver), mas ainda vazia: falta enviar o vídeo.
2. Conferir o repositório numa aba anônima.
3. Submeter até 12h: link do repositório, vídeo de 90 s (feito pela equipe) e `docs/RESUMO-AVALIADORES.pdf`.
4. Ensaiar a demonstração com o [roteiro](ROTEIRO-DEMONSTRACAO.md) no computador do pitch.
