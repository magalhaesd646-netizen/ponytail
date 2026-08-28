# Sorteio de Times

Cola a lista de jogadores da pelada, marca os 3 ou 4 melhores como cabeças de
chave, e sorteia times equilibrados. Não depende de WhatsApp — o app só
formata o resultado pronto pra colar de volta no grupo.

## Usar

**Link (recomendado, funciona em qualquer celular):**
https://claude.ai/code/artifact/25b4947d-054e-4ef3-bfb1-8722dc7c514e

Ou local, sem instalar nada — é uma página estática:

1. Abra `public/index.html` no navegador (desktop) ou `public/standalone.html`
   (celular — arquivo único, abre certo mesmo saindo da pasta de Downloads).
2. Cole a lista de jogadores (aceita numerada, com `-`/`•`, ou nomes
   separados por vírgula) e clique em "Carregar lista".
3. Toque na ⭐ dos 3 ou 4 melhores jogadores — eles viram cabeças de chave.
4. Ajuste "Por time" se quiser (padrão 5) e clique em "Sortear times".
5. Clique em "Compartilhar resultado" — abre o menu de compartilhamento do
   celular (inclui WhatsApp direto) ou copia o texto pronto.

Tudo roda no navegador, nenhum dado sai do aparelho.

**Importante:** abra sempre pelo navegador (Chrome/Safari), não pela
pré-visualização de arquivo de dentro de um app de mensagens — nesses casos o
JavaScript não roda e a página fica só na tela de colar a lista, sem sortear.

## Como funciona o sorteio

1. O número de times é automático: `arredonda pra cima(jogadores ÷ por time)`.
   Por isso um jogo pode fechar em 2, 3 ou 4 times — o(s) time(s) que sobrar
   fica(m) com menos gente em vez de deixar alguém de fora.
2. Os cabeças de chave são embaralhados e espalhados um por time antes do
   resto da lista, pra evitar que os melhores caiam todos juntos.
3. O restante é embaralhado e distribuído até completar cada time.

A lógica pura do sorteio está em `src/teamDraw.js` e é testada sem navegador:
`npm test`.

## Manter os arquivos publicados em sincronia

`public/index.html`, `style.css`, `app.js` e `src/teamDraw.js` são a fonte.
Depois de editar qualquer um deles, regenere as versões empacotadas:

```bash
node scripts/build-standalone.js   # public/standalone.html (arquivo único p/ download)
node scripts/build-artifact.js     # public/Sorteio de Times.html (fonte do link publicado)
```
