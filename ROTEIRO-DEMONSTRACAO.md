# Golden Park: roteiro de demonstração (3 a 5 minutos)

Este roteiro usa apenas funcionalidades implementadas e testadas no MVP. Os botões aparecem entre aspas, com o texto exato da tela.

## Preparação (antes de apresentar)

1. Abra o Docker Desktop e, na raiz do repositório, prepare o banco:

   ```bash
   pnpm demo:preparar
   ```

2. Suba a API e a web juntas:

   ```bash
   pnpm demo
   ```

3. Abra três abas no navegador:
   - **Painel:** `http://localhost:5173/painel`
   - **Totem:** `http://localhost:5173/totem?acesso=A_ROT`
   - **Celular (QR Code):** escolha uma das opções.
     - **Celular de verdade:** abra o **totem pelo IP do computador** (a linha `Network:` do terminal, ex.: `http://192.168.0.10:5173/totem?acesso=A_ROT`), com o celular na mesma rede Wi-Fi. O QR sai com esse endereço.
     - **Sem celular:** abra o link `/t/…` do ticket no navegador, com a visualização de celular das ferramentas de desenvolvedor.
4. No painel, informe o "Token do operador" e clique em "Salvar". O token é o valor de `SIMULADOR_TOKEN` em `apps/api/.env`; no exemplo, `troque-este-token`.
5. No painel, na seção Simulação, clique em "Reiniciar" e confirme, para começar do zero. Se quiser o estacionamento com movimento, clique em "Simular estacionamento tranquilo".
6. Deixe o totem na tela inicial e o painel visível.

## Roteiro

### 1. O problema (0:00–0:30)

Diga: "Em dia de movimento, o motorista roda pelo estacionamento procurando vaga. Uma área lota enquanto outra fica vazia, e na volta muita gente não lembra onde deixou o carro. O Golden Park faz o próprio estacionamento indicar a melhor região para cada veículo e guia o motorista pelo celular, sem aplicativo."

### 2. Totem de entrada (0:30–1:30)

1. Clique em "Começar".
2. Escolha "Carro pequeno".
3. Escolha "Vaga comum".
   - Opcional: mostre que existem "Vaga PcD" e "Vaga para pessoa idosa". Elas só recebem vaga do próprio tipo e exigem credencial, que o sistema não verifica.
4. Mostre a recomendação:
   - o código da região em destaque;
   - as vagas livres;
   - "Por que esta região", a justificativa do algoritmo (disponibilidade, distância pela rota e movimento recente);
   - os passos de "Como chegar".
5. Destaque a nota da tela: **a indicação não reserva vaga**. A ocupação só muda quando o carro estaciona.
6. Clique em "Emitir ticket". Aparecem o ticket com o código (ex.: `PV-0001`) e o QR Code. **Anote o código.**

### 3. QR Code no celular (1:30–2:15)

1. Escaneie o QR Code, ou abra o link `/t/…`.
2. Mostre:
   - o mapa da planta real em tela cheia;
   - a rota destacada pelos corredores até a região, com o pino de destino;
   - zoom com pinça e arrastar.
3. Toque em "Mostrar detalhes": aparecem os passos, os dados do ticket e o tipo de vaga.
4. Diga: "Não é GPS. A página mostra a região indicada e o caminho pelas vias do estacionamento."

### 4. Confirmação no painel (2:15–3:15)

1. No painel, clique em "Consultar ticket" (no topo). A página desce até a seção Tickets.
2. Digite o código do ticket em "Código do ticket" e clique em "Consultar".
3. Clique em "Confirmar estacionamento". Isso equivale à leitura do ticket na região.
4. Mostre, em tempo real e sem recarregar:
   - a ocupação da região mudando na tabela e no mapa;
   - a nova linha em "Movimentações recentes".
5. Volte ao celular: a página trocou sozinha para "Encontre seu veículo", com a região registrada.

### 5. Saída (3:15–3:45)

1. No painel, clique em "Registrar saída".
2. Mostre a vaga liberada (a ocupação volta) e a movimentação registrada.
3. No celular, a página passa a "Este veículo já saiu": o ticket está encerrado.

### 6. Simulador (3:45–4:30)

1. Na seção Simulação, clique em "Simular horário de pico".
2. Mostre:
   - os carrinhos percorrendo as vias no mapa;
   - os indicadores e a tabela atualizando, com vagas comuns, PcD e pessoa idosa;
   - o selo "Ambiente de demonstração · dados simulados".
3. Diga: "O simulador passa pelas mesmas regras do sistema real. A ocupação só muda na confirmação e na saída, e nunca passa da capacidade."

### 7. Fechamento (4:30–5:00)

Diga: "Sem aplicativo e com a infraestrutura que o shopping já tem — totem, ticket e o celular do cliente —, o Golden Park reduz filas e voltas, aproveita melhor as vagas e dá à operação uma visão em tempo real. Sensores físicos podem ser ligados depois pela mesma interface de eventos que o simulador já usa."

## Se algo der errado

- **`http://localhost:3333/api/saude` responde 503 ou o painel mostra erro de conexão:** o Docker Desktop está fechado ou o banco parou. Abra o Docker e rode `pnpm db:up`.
- **O QR Code não abre no celular:** o totem foi aberto por `localhost`. Abra-o pelo IP do computador e emita outro ticket. Confira também se o celular está na mesma rede e se o firewall permite o Node.js. Se não der tempo, abra o link `/t/…` no navegador do computador.
- **O painel pede o token ou recusa uma ação:** informe o "Token do operador", que é o mesmo valor de `SIMULADOR_TOKEN` em `apps/api/.env`.
- **Números de uma demonstração anterior na tela:** em Simulação, clique em "Reiniciar". Isso apaga só os dados simulados.

## O que NÃO dizer

- **GPS:** não existe GPS nem rastreamento do veículo. A página do QR mostra a região indicada ou a registrada.
- **Hardware e pagamento:** não há sensores físicos, painéis de LED nem pagamento implementados. Os eventos de sensor existem na API e são simulados.
- **Vagas reservadas:** os mínimos seguem a lei, mas a localização física das vagas PcD e de pessoa idosa no térreo é uma proposta simulada. Nenhum caminho a pé foi validado como acessível.
- **Números do simulador:** não são dados reais do Capim Dourado. Estão sempre marcados como simulados.
- **Distâncias e tempos:** o sistema não mostra distâncias nem tempos de deslocamento.
