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
| `!sortear [tamanho]` | Sorteia os times (padrão: 5 jogadores de linha por time) |
| `!limpar` | Zera a lista |

## Como funciona o sorteio

1. Cada goleiro marcado com `!goleiro` é distribuído um por time (sorteado
   entre os times, não entra na disputa por vaga de linha).
2. Os cabeças de chave são embaralhados e espalhados um por time antes do
   resto da lista, pra evitar que dois "cabeças" caiam juntos.
3. O restante dos jogadores é embaralhado e distribuído até completar o
   tamanho do time.
4. Quem sobra (lista não fecha um número exato de times) vai para a lista de
   reservas.

A lógica pura do sorteio está em `src/teamDraw.js` e pode ser testada sem
WhatsApp: `npm test`.

## Limitações conhecidas

- A lista de jogadores fica em memória: reiniciar o bot zera as listas em
  aberto (ok para o uso pretendido — coletar jogadores de uma pelada por vez).
- Não há checagem de admin do grupo para `!limpar`; qualquer participante do
  grupo pode zerar a lista.
