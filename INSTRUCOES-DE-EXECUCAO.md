# Golden Park: instruções de execução

Guia numerado e verificável. Cada passo diz o comando exato e o que você deve ver.

Validado em 14/11/2026 com uma **instalação limpa**: clone novo do GitHub, banco novo e só estes passos (Windows 11, Node 24.19, pnpm 10.22, Docker Desktop). Os comandos são os mesmos no Linux e no macOS; onde muda alguma coisa, há as duas versões.

---

## 1. Requisitos

| Ferramenta | Versão | Como conferir |
|---|---|---|
| Node.js | 22 ou superior (testado com 24) | `node -v` |
| pnpm | 10 | `pnpm -v` (instalar: `npm install -g pnpm`) |
| Docker Desktop | qualquer versão recente, **aberto** | `docker info` sem erro |
| Git | qualquer | `git --version` |
| Microsoft Edge | só para os testes ponta a ponta (opcional) | — |

Portas usadas: **5433** (PostgreSQL), **3333** (API) e **5173** (web).

## 2. Clonar o repositório

```bash
git clone https://github.com/ElitondeSousa/golden-park.git
```

```bash
cd golden-park
```

✔ A pasta `golden-park` tem `apps/`, `packages/`, `docker-compose.yml` e `.env.example`.

## 3. Instalar as dependências

```bash
pnpm install
```

✔ Termina com `Done in …` (cerca de 1 minuto na primeira vez).

## 4. Configurar o ambiente

Copie o arquivo de exemplo para a API. No Linux, no macOS ou no Git Bash:

```bash
cp .env.example apps/api/.env
```

No PowerShell (Windows):

```powershell
Copy-Item .env.example apps/api/.env
```

✔ O arquivo `apps/api/.env` existe. Os valores de exemplo já funcionam localmente:

- banco em `localhost:5433` (usuário e senha `parkvision`, só para desenvolvimento);
- `SIMULADOR_TOKEN="troque-este-token"`;
- `MODO_DEMONSTRACAO="true"`.

O front-end não precisa de configuração: o Vite repassa `/api` e o tempo real para `localhost:3333`.

## 5. Preparar o banco de dados

Com o Docker Desktop **aberto**:

```bash
pnpm demo:preparar
```

Esse comando executa três etapas:
1. `docker compose up -d postgres`: sobe o PostgreSQL 16 e cria também o banco de testes;
2. `prisma db push`: cria as tabelas (o projeto usa o esquema Prisma direto, sem arquivos de migração);
3. o seed: carrega as 10 regiões e os acessos do mapa real.

✔ A última linha é `✔ 10 regiões e acessos carregados`.

## 6. Iniciar o back-end (e o front-end juntos)

```bash
pnpm demo
```

Esse comando sobe a API e a web no mesmo terminal. Se preferir terminais separados, rode o back-end num e o front-end noutro:

```bash
pnpm dev:api
```

✔ Abra `http://localhost:3333/api/saude` no navegador. A resposta é `{"ok":true,"banco":"ok","modoDemonstracao":true}`.

## 7. Iniciar o front-end

Já está no ar se você usou `pnpm demo`. Senão, em outro terminal:

```bash
pnpm dev:web
```

✔ O terminal mostra `Local: http://localhost:5173/`.

## 8. Acessar a aplicação

| Tela | Endereço | Para quem |
|---|---|---|
| Totem de entrada | http://localhost:5173/totem?acesso=A_ROT | motorista na entrada (também `A_NE`, `A_S1`, `A_S2`) |
| Localizador (QR Code) | `http://localhost:5173/t/<token>`, o endereço impresso no QR Code do ticket | motorista no celular |
| Painel administrativo | http://localhost:5173/painel | operação do estacionamento |

**Token do operador:** necessário para confirmar estacionamento, registrar saída e controlar o simulador no painel. É o valor de `SIMULADOR_TOKEN` em `apps/api/.env` (no exemplo, `troque-este-token`). Não é uma senha real: troque-o fora da demonstração.

✔ O painel mostra "Vagas livres 1.269 de 1.269" e o mapa do térreo.

## 9. Executar uma demonstração

1. **Totem:** clique em "Começar", depois em "Carro pequeno" e em "Vaga comum".
   ✔ Aparece a região recomendada (ex.: N3), com o motivo e os passos.
2. Clique em "Emitir ticket".
   ✔ Aparece o ticket (ex.: `PV-0001`) com o QR Code.
3. **Localizador:** abra o endereço do QR Code. No celular, veja o passo 9.1 abaixo.
   ✔ Aparece o mapa com a rota até a região e o painel inferior "Estacionamento ainda não confirmado".
4. **Painel:** informe o token do operador e clique em "Salvar". Clique em "Consultar ticket", digite o código e clique em "Consultar". Depois clique em "Confirmar estacionamento".
   ✔ A ocupação da região sobe 1 na tabela e no mapa, sem recarregar. O localizador muda sozinho para "Encontre seu veículo".
5. Clique em "Registrar saída".
   ✔ A vaga é liberada e o localizador mostra "Este veículo já saiu".
6. **Simulador:** em Simulação, clique em "Simular horário de pico".
   ✔ Os veículos simulados entram, os carrinhos andam no mapa e os números mudam, com o selo "Ambiente de demonstração · dados simulados". Para parar, clique em "Pausar". "Reiniciar" apaga só os dados simulados.

**9.1. Abrir o QR Code num celular de verdade.** O celular precisa estar na mesma rede (Wi-Fi) do computador:
1. Veja o endereço de rede da web no terminal do `pnpm demo`: a linha `Network: http://<IP>:5173/` da interface Wi-Fi.
2. Abra o totem por esse endereço, ex.: `http://192.168.0.10:5173/totem?acesso=A_ROT`, e emita o ticket. O QR Code sai com esse mesmo endereço, sem precisar editar o `.env`.
3. Escaneie o QR com a câmera do celular.
4. Se o celular não carregar, permita o Node.js na rede privada quando o Windows perguntar, ou libere a porta 5173 no firewall.

O roteiro completo da apresentação está em [ROTEIRO-DEMONSTRACAO.md](ROTEIRO-DEMONSTRACAO.md).

## 10. Encerrar os serviços

1. No terminal do `pnpm demo` (ou de `dev:api` e `dev:web`), aperte **Ctrl+C**.
2. Desligue o banco, mantendo os dados:

   ```bash
   pnpm db:down
   ```

3. Para apagar também os dados do banco e recomeçar do zero:

   ```bash
   docker compose down -v
   ```

---

## Testes (opcional)

Unitários e de integração (com o banco no ar):

```bash
pnpm test
```

✔ 4 + 106 + 71 + 95 testes passando.

Ponta a ponta (Playwright com o Edge do sistema; sobe API e web próprias nas portas 3334 e 5174, no banco de teste):

```bash
pnpm e2e
```

✔ 49 testes passando (6 especificações de captura de tela são puladas de propósito).

## Problemas comuns

| Sintoma | Causa e solução |
|---|---|
| `/api/saude` responde 503 ou o painel mostra erro de conexão | O Docker Desktop está fechado ou o banco parou. Abra o Docker e rode `pnpm db:up`. |
| `EPERM … query_engine-windows.dll.node` no `pnpm demo:preparar` (Windows) | A API estava rodando e prende o arquivo do Prisma. Pare a API (Ctrl+C) e rode de novo. |
| `port is already allocated` / `EADDRINUSE` | A porta 5433, 3333 ou 5173 está em uso. Feche o outro programa, ou mude `PORTA` no `.env` e a porta do PostgreSQL no `docker-compose.yml` (lembre de ajustar `DATABASE_URL`). |
| `Container name "/parkvision-postgres" is already in use` | Já existe outra cópia do projeto com o banco no ar. Rode `pnpm db:down` nessa outra cópia. |
| O painel recusa uma ação ou pede o token | Informe o token do operador (valor de `SIMULADOR_TOKEN` em `apps/api/.env`). |
| O QR Code não abre no celular | O celular não alcança o computador. Veja o passo 9.1. |
| Testes falham com "banco parkvision_teste não existe" (volume criado antes) | `docker exec parkvision-postgres psql -U parkvision -c "CREATE DATABASE parkvision_teste"` |
