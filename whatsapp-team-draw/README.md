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
| `!sortear [quantidade de times]` | Sorteia os times (2 a 4, padrão: 2), 5 jogadores de linha por time cheio |
| `!limpar` | Zera a lista |

## Como funciona o sorteio

1. Você escolhe quantos times quer (2, 3 ou 4). Todo mundo da lista entra em
   algum time — não há lista de reservas.
2. Cada time cheio tem exatamente 5 jogadores de linha. Só o último time
   pode ter 5 ou menos: se a lista for curta para a quantidade de times
   escolhida, é ele que fica menor (ex.: 16 jogadores em 4 times → 5, 5, 5,
   1). Se sobrar gente além do que cabe nos times de 5, quem absorve o
   excedente são os outros times, não o último (ex.: 22 jogadores em 4
   times → 6, 6, 5, 5).
3. Cada goleiro marcado com `!goleiro` é distribuído um por time (sorteado
   entre os times, não entra na disputa por vaga de linha).
4. Os cabeças de chave são embaralhados e espalhados um por time antes do
   resto da lista, pra evitar que dois "cabeças" caiam juntos.
5. O restante dos jogadores é embaralhado e distribuído entre os times na
   ordem acima.

A lógica pura do sorteio está em `src/teamDraw.js` e pode ser testada sem
WhatsApp: `npm test`.

## Limitações conhecidas

- A lista de jogadores fica em memória: reiniciar o bot zera as listas em
  aberto (ok para o uso pretendido — coletar jogadores de uma pelada por vez).
- Não há checagem de admin do grupo para `!limpar`; qualquer participante do
  grupo pode zerar a lista.
