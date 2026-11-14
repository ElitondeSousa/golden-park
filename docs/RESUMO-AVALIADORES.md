# Golden Park — Resumo para os avaliadores

**Equipe:** Eliton de Sousa Pereira · Marcos Feliphe Freitas Moraes · Gustavo Araújo Lopes · Arthur Santos Coelho
**Repositório:** https://github.com/ElitondeSousa/golden-park

**1. Nome do projeto.** Golden Park — sistema inteligente de distribuição de veículos no estacionamento.

**2. Problema identificado.**
- Em horários de movimento, os motoristas rodam pelo estacionamento procurando vaga. Algumas áreas lotam enquanto outras ficam vazias.
- Isso gera filas na entrada, congestionamento interno e perda de tempo.
- Na volta, muita gente não lembra onde deixou o carro.

**3. Público-alvo.**
- Clientes do Capim Dourado Shopping que chegam de carro ou moto, incluindo pessoas com deficiência e pessoas idosas, que precisam de vagas reservadas.
- A equipe de operação do estacionamento.

**4. Solução proposta.**
- O próprio estacionamento indica, na entrada, a melhor região para cada veículo naquele momento, considerando vagas livres, distância pela rota e movimento recente.
- O motorista é guiado pelo celular, sem instalar aplicativo, e reencontra o carro pelo QR Code do ticket.

**5. Descrição do produto (MVP).** Três telas integradas, funcionando de verdade:
- **Totem de entrada:** o motorista escolhe o veículo e, se precisar, vaga PcD ou para pessoa idosa. Recebe a região recomendada, o motivo e o caminho, e retira o ticket com QR Code.
- **Página do QR Code:** mapa no celular com a rota pelos corredores até a região. Depois de estacionar, mostra onde o carro ficou.
- **Painel da operação:** vagas livres, mapa com a ocupação de cada região, tabela de zonas (comuns, PcD, pessoa idosa), tickets e simulador. Atualiza em tempo real.
- **Mapa digital:** feito a partir da planta real do shopping (3 níveis, 10 regiões, 1.269 vagas).
- **Simulador:** gera movimento realista para demonstração, com os dados sempre identificados como simulados.

**6. Tecnologias utilizadas.**
- TypeScript, React, Node.js (Fastify), Socket.IO (tempo real), PostgreSQL com Prisma e Docker.
- Design System próprio com temas claro e escuro.
- Testes automatizados com Vitest e Playwright (mais de 300 testes).

**7. Diferencial e inovação.**
- O sistema não só mostra vagas: **distribui** os veículos e explica cada recomendação.
- Não reserva vaga. A ocupação só muda quando o carro estaciona, sem conflito entre motoristas.
- Respeita as vagas PcD e para pessoa idosa, conforme a lei, sem desviar ninguém para outro tipo de vaga.
- Funciona sem aplicativo.
- É honesto com o usuário: não promete GPS nem inventa tempos.

**8. Viabilidade e aplicação no shopping.**
- **Infraestrutura:** usa o que o shopping já tem (cancela ou totem na entrada, ticket impresso e celular do cliente).
- **Sensores e painéis:** podem ser conectados depois pela mesma interface de eventos que o simulador já usa.
- **Implantação aos poucos:** começar com os totens e o painel e depois ligar sensores por região.
- **Benefícios:** menos filas e voltas pelo estacionamento, melhor aproveitamento das vagas e uma visão da operação em tempo real.
