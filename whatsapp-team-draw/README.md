# whatsapp-team-draw

Bot de WhatsApp para sortear times de futebol/pelada a partir da lista de
jogadores de um grupo. Goleiro é fixo (não entra no sorteio) e os cabeças de
chave são espalhados um por time, pra evitar time turbinado.

Usa [whatsapp-web.js](https://wwebjs.dev/), que controla o WhatsApp Web do seu
próprio número via Chromium headless. Não é a API oficial da Meta — serve bem
para uso pessoal/grupo de amigos, mas não é indicado para envio em massa.

## Uso

```bash
npm install
npm start
```

Escaneie o QR code exibido no terminal com o WhatsApp do celular (Aparelhos
conectados → Conectar um aparelho). O bot passa a responder aos comandos em
qualquer conversa (grupo ou individual) onde estiver presente.

## Comandos

| Comando | O que faz |
|---|---|
| `!entrar` | Entra na lista de jogadores |
| `!sair` | Sai da lista |
| `!goleiro` | Marca/desmarca você como goleiro fixo do seu time |
| `!cabeca` | Marca/desmarca você como cabeça de chave |
| `!lista` | Mostra a lista atual |
| `!sortear [quantidade de times]` | Sorteia os times (2 a 4, padrão: 2) |
| `!limpar` | Zera a lista |

## Como funciona o sorteio

1. Você escolhe quantos times quer (2, 3 ou 4). Todo mundo da lista entra em
   algum time — não há lista de reservas.
2. Cada goleiro marcado com `!goleiro` é distribuído um por time (sorteado
   entre os times, não entra na disputa por vaga de linha).
3. Os cabeças de chave são embaralhados e espalhados um por time antes do
   resto da lista, pra evitar que dois "cabeças" caiam juntos.
4. O restante dos jogadores é embaralhado e distribuído entre os times o mais
   equilibrado possível. Quando a lista não divide um número exato de
   jogadores por time, o(s) time(s) com menos jogadores é(são) sempre o(s)
   último(s) (ex.: 3 times para 10 jogadores → 4, 3, 3; nunca 3, 4, 3). O
   último time pode ficar com bem menos gente que os outros se a lista for
   pequena para a quantidade de times escolhida.

A lógica pura do sorteio está em `src/teamDraw.js` e pode ser testada sem
WhatsApp: `npm test`.

## Limitações conhecidas

- A lista de jogadores fica em memória: reiniciar o bot zera as listas em
  aberto (ok para o uso pretendido — coletar jogadores de uma pelada por vez).
- Não há checagem de admin do grupo para `!limpar`; qualquer participante do
  grupo pode zerar a lista.
