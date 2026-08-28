# whatsapp-team-draw

Ferramenta para sortear times de futebol/pelada. Goleiro é fixo (não entra no
sorteio) e os cabeças de chave são espalhados um por time, pra evitar time
turbinado. Duas formas de usar:

- **App web local** (`npm start`) — cada jogador se cadastra sozinho abrindo
  um link, sem precisar digitar comandos.
- **Bot de WhatsApp** (`npm run bot`) — cadastro via comandos numa conversa do
  WhatsApp.

## App web local

```bash
npm install
npm start
```

O terminal mostra os links para compartilhar, por exemplo:

```
Servidor rodando na porta 3000.
Compartilhe um destes links com o pessoal (mesma rede Wi-Fi):
  http://192.168.0.12:3000
  http://localhost:3000 (só nesta máquina)
```

Mande o link `http://SEU-IP:3000` no grupo. **Só funciona para quem estiver na
mesma rede Wi-Fi/local que o computador rodando o servidor** — não é acessível
pela internet. Se precisar que alguém de fora da rede acesse, exponha a porta
com uma ferramenta de túnel (ex: `ngrok http 3000`) e mande o link que ela
gerar.

Cada pessoa que abre o link:
1. Digita o nome e clica em Entrar.
2. Marca 🧤 se for goleiro fixo ou ⭐ se for cabeça de chave (só consegue
   editar a própria linha).
3. Qualquer um com o link pode clicar em "Sortear times" quando a lista
   estiver completa — não há dono/admin da lista, é um espaço compartilhado
   simples para gente de confiança.

## Bot de WhatsApp

Usa [whatsapp-web.js](https://wwebjs.dev/), que controla o WhatsApp Web do seu
próprio número via Chromium headless. Não é a API oficial da Meta — serve bem
para uso pessoal/grupo de amigos, mas não é indicado para envio em massa.

```bash
npm run bot
```

Escaneie o QR code exibido no terminal com o WhatsApp do celular (Aparelhos
conectados → Conectar um aparelho). O bot passa a responder aos comandos em
qualquer conversa (grupo ou individual) onde estiver presente.

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

1. Cada goleiro marcado é distribuído um por time (sorteado entre os times,
   não entra na disputa por vaga de linha).
2. Os cabeças de chave são embaralhados e espalhados um por time antes do
   resto da lista, pra evitar que dois "cabeças" caiam juntos.
3. O restante dos jogadores é embaralhado e distribuído até completar o
   tamanho do time.
4. Quem sobra (lista não fecha um número exato de times) vai para a lista de
   reservas.

A lógica pura do sorteio está em `src/teamDraw.js` e pode ser testada sem
WhatsApp nem navegador: `npm test`.

## Limitações conhecidas

- A lista de jogadores fica em memória (tanto no app web quanto no bot):
  reiniciar zera as listas em aberto — ok para o uso pretendido, coletar
  jogadores de uma pelada por vez.
- Nenhum dos dois modos tem autenticação: qualquer pessoa com o link (app
  web) ou no grupo (bot) pode editar a lista e zerá-la. Pensado para uso
  entre amigos de confiança, não para grupos abertos.
