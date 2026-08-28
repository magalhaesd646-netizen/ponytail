# whatsapp-team-draw

Ferramenta para sortear times de futebol/pelada. Goleiro é fixo (não entra no
sorteio) e os cabeças de chave são espalhados um por time, pra evitar time
turbinado.

## App (colar lista → marcar → sortear)

Sem instalação, sem servidor: é uma página estática.

1. Abra `public/index.html` direto no navegador (duplo clique no arquivo).
2. Copie a lista de jogadores do grupo do WhatsApp e cole na caixa de texto
   (aceita lista numerada, com `-`/`•`, ou nomes separados por vírgula).
3. Clique em "Carregar lista".
4. Marque 🧤 para quem for goleiro fixo do time e ⭐ para os cabeças de chave.
5. Ajuste o tamanho do time se quiser e clique em "Sortear times".

Tudo roda no seu navegador, nenhum dado sai da sua máquina.

**No celular:** baixe só o arquivo `public/standalone.html` (é o mesmo app,
mas empacotado num arquivo único, sem depender de `style.css`/`app.js` ao
lado — abre certo mesmo saindo da pasta do Downloads). Gerado a partir dos
arquivos acima com `node scripts/build-standalone.js`; rode de novo se editar
`index.html`, `style.css` ou `app.js`.

## Bot de WhatsApp (opcional)

Se preferir que o próprio grupo se cadastre via comandos, em vez de colar a
lista manualmente, tem um bot usando
[whatsapp-web.js](https://wwebjs.dev/) (controla o WhatsApp Web do seu
próprio número via Chromium headless — não é a API oficial da Meta, então
não é indicado para envio em massa):

```bash
npm install
npm run bot
```

Escaneie o QR code exibido no terminal (Aparelhos conectados → Conectar um
aparelho).

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

A lógica pura do sorteio está em `src/teamDraw.js`, usada tanto pela página
quanto pelo bot, e pode ser testada sem navegador nem WhatsApp: `npm test`.
