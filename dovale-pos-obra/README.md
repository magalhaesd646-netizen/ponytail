# Dovale Pós-Obra

Painel para centralizar as visualizações do pós-obra da Dovale Engenharia,
com três abas — **Pós-Obra**, **Vistorias de Qualidade e Pós-Obra** e
**Agenda Pós-Obra** — cada uma mostrando uma tabela puxada automaticamente
de uma planilha Excel no OneDrive/SharePoint, atualizada todo dia sozinha
(GitHub Actions). Cada aba também pode abrir um link externo (ex.: o app à
parte que ela vai virar no futuro) assim que você tiver esse link — veja
"Link externo por aba" abaixo.

## Configuração inicial (planilhas)

1. No OneDrive/SharePoint, abra o arquivo Excel de cada aba, clique em
   **Compartilhar** → **"Qualquer pessoa com o link pode visualizar"** →
   **Copiar link**. Não precisa senha nem app registrado — o app baixa o
   arquivo direto a partir desse link público.
2. Copie `.env.example` para `.env` e cole os links em `POS_OBRA_SHEET_URL`,
   `VISTORIAS_SHEET_URL` e `AGENDA_SHEET_URL` (uma planilha por aba; pode
   repetir o mesmo link nas três se preferir manter tudo num arquivo só e
   usar `_SHEET_NAME` para apontar a aba/sheet correta dentro dele).
3. Se o arquivo tiver mais de uma aba (sheet) e você quiser uma específica,
   preencha `POS_OBRA_SHEET_NAME` (etc.) com o nome exato dela — senão o app
   usa a primeira aba do arquivo.
4. `npm install`
5. `npm start` — gera `web/data/*.json` a partir das planilhas configuradas.
6. Abra `web/index.html` num servidor estático (ex.: `npx serve web`) para
   conferir as três abas. Uma aba sem planilha configurada mostra "planilha
   ainda não configurada" em vez de dar erro.

## Automação diária (GitHub Actions)

O workflow `.github/workflows/dovale-pos-obra.yml` roda todo dia sozinho:
busca as três planilhas, regenera `web/data/*.json`, comita esse resultado
(histórico de dados, igual ao `data/seen.json` do vale-paraiba-lancamentos)
e publica o painel no GitHub Pages. Configure em **Settings → Secrets and
variables → Actions** do repositório:

| Nome | Tipo | Obrigatório |
| --- | --- | --- |
| `POS_OBRA_SHEET_URL` | secret | não* |
| `VISTORIAS_SHEET_URL` | secret | não* |
| `AGENDA_SHEET_URL` | secret | não* |
| `POS_OBRA_SHEET_NAME` / `VISTORIAS_SHEET_NAME` / `AGENDA_SHEET_NAME` | variable | não |

\* sem o link de uma aba configurado, ela fica com a tabela vazia — as
outras continuam funcionando normalmente.

**GitHub Pages**: este repositório publica um único site (GitHub Pages só
permite um por repositório). O mesmo site já é usado pelo
`vale-paraiba-lancamentos` (que embute o `investimentos`); o painel de
pós-obra é publicado dentro dele, em `/dovale-pos-obra/`. Se o Pages ainda
não estiver habilitado, veja o README do `vale-paraiba-lancamentos` ("Passo
único: habilitar o GitHub Pages") — só precisa ser feito uma vez. As duas
automações (`dovale-pos-obra` todo dia, `vale-paraiba-lancamentos` a cada 3
dias) reconstroem o site inteiro (as duas abas) a cada execução, então o
painel de pós-obra fica sempre atualizado independentemente de qual delas
rodou por último.

## Link externo por aba

Edite `web/links.json` (direto pelo GitHub ou localmente) para adicionar um
link "Abrir link externo ↗" em qualquer aba, por exemplo quando ela virar um
app à parte:

```json
{ "pos-obra": "https://...", "vistorias": null, "agenda": null }
```

`null` (ou o campo ausente) esconde o botão nessa aba.

## Limitações importantes

- O link de compartilhamento do OneDrive/SharePoint precisa ser "qualquer
  pessoa com o link" — um link restrito a pessoas específicas da
  organização não funciona sem autenticação, que este app não implementa
  (para isso seria necessário registrar um app no Azure AD e usar a
  Microsoft Graph API com OAuth).
- Cada execução lê a planilha inteira e substitui os dados anteriores; se a
  planilha tiver uma falha pontual de acesso, o painel mantém os últimos
  dados bons conhecidos em vez de ficar vazio.
- O parser (`exceljs`) lê valores calculados de fórmulas, texto e datas
  (convertidas para ISO); formatação visual (cores, negrito) da planilha não
  é replicada no painel.

## Testes

```bash
npm test
```

Cobre a conversão do link de compartilhamento (`src/lib/oneDrive.js`) e a
leitura de planilha em linhas/colunas (`src/lib/parseWorkbook.js`), sem
depender de rede.
