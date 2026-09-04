# Pós-Obra

Painel para centralizar as visualizações do pós-obra, com três abas —
**Pós-Obra**, **Vistorias de Qualidade e Pós-Obra** e **Agenda Pós-Obra** —
cada uma mostrando uma tabela lida de uma planilha Excel, atualizada
automaticamente (GitHub Actions) sempre que a planilha muda. Cada aba também
pode abrir um link externo (ex.: o app à parte que ela vai virar no futuro)
assim que você tiver esse link — veja "Link externo por aba" abaixo.

## Configuração inicial (planilhas) — upload manual

O tenant do Microsoft 365 usado aqui bloqueia acesso anônimo de verdade a
arquivos do OneDrive/SharePoint (mesmo com o link "qualquer pessoa"), então
o caminho por enquanto é subir o arquivo Excel direto no repositório:

1. No Excel/OneDrive, baixe uma cópia do arquivo (**Arquivo → Baixar uma
   cópia**, formato `.xlsx`).
2. No GitHub, vá em `pos-obra/uploads/` → **Add file → Upload files** e
   suba o arquivo renomeado exatamente como:
   - `pos-obra.xlsx` para a aba Pós-Obra
   - `vistorias.xlsx` para Vistorias de Qualidade e Pós-Obra
   - `agenda.xlsx` para Agenda Pós-Obra
3. Assim que o upload é commitado na `main`, o workflow
   `.github/workflows/pos-obra.yml` dispara sozinho, lê o arquivo e
   atualiza o painel — não precisa rodar nada manualmente.
4. Se o arquivo tiver mais de uma aba (sheet) e você quiser uma específica,
   configure `POS_OBRA_SHEET_NAME` (ou `VISTORIAS_SHEET_NAME` /
   `AGENDA_SHEET_NAME`) como variável do repositório com o nome exato dela
   — senão o app usa a primeira aba do arquivo.

Repita o upload sempre que quiser atualizar os dados dessa aba. Uma aba sem
arquivo em `uploads/` mostra "planilha ainda não configurada" em vez de dar
erro.

### Rodando localmente

```bash
npm install
npm start            # lê uploads/*.xlsx e gera web/data/*.json
npx serve web         # confere as três abas num navegador
```

## Upgrade: puxar direto do OneDrive/SharePoint automaticamente

Sem precisar subir o arquivo toda vez: configure `POS_OBRA_SHEET_URL` (e/ou
`VISTORIAS_SHEET_URL`, `AGENDA_SHEET_URL`) como **secret** do repositório
com o link de compartilhamento "qualquer pessoa com o link pode
visualizar". Um arquivo em `uploads/<aba>.xlsx` sempre tem prioridade sobre
o link — remova o arquivo de `uploads/` para essa aba passar a usar o link.

**Isso só funciona se o tenant permitir acesso anônimo de verdade** (nem
todo Microsoft 365 corporativo permite, mesmo com o link certo — foi o caso
testado aqui: retornou `403 Forbidden`). Se o link não funcionar, a
alternativa robusta é registrar um app no Azure AD (Azure Portal → App
registrations) com permissão de aplicativo `Files.Read.All` e usar OAuth
via Microsoft Graph — isso exige ajuste de código (`src/lib/oneDrive.js`) e
acesso de administrador do Microsoft 365 da empresa.

## Automação (GitHub Actions)

O workflow `.github/workflows/pos-obra.yml` roda: (1) sempre que um arquivo
muda em `pos-obra/uploads/`, (2) todo dia às 07h (horário de Brasília), e
(3) manualmente pela aba **Actions**. Ele lê as planilhas (upload ou link),
regenera `web/data/*.json`, comita esse resultado (histórico de dados,
igual ao `data/seen.json` do vale-paraiba-lancamentos) e publica o painel
no GitHub Pages. Configure em **Settings → Secrets and variables →
Actions** do repositório (só necessário para o upgrade do link, não para o
upload manual):

| Nome | Tipo | Obrigatório |
| --- | --- | --- |
| `POS_OBRA_SHEET_URL` | secret | não* |
| `VISTORIAS_SHEET_URL` | secret | não* |
| `AGENDA_SHEET_URL` | secret | não* |
| `POS_OBRA_SHEET_NAME` / `VISTORIAS_SHEET_NAME` / `AGENDA_SHEET_NAME` | variable | não |

\* sem upload em `uploads/` nem link configurado para uma aba, ela fica com
a tabela vazia — as outras continuam funcionando normalmente.

**GitHub Pages**: este repositório publica um único site (GitHub Pages só
permite um por repositório). O mesmo site já é usado pelo
`vale-paraiba-lancamentos` (que embute o `investimentos`); o painel de
pós-obra é publicado dentro dele, em `/pos-obra/`. Se o Pages ainda não
estiver habilitado, veja o README do `vale-paraiba-lancamentos` ("Passo
único: habilitar o GitHub Pages") — só precisa ser feito uma vez. As duas
automações (`pos-obra` e `vale-paraiba-lancamentos`) reconstroem o site
inteiro a cada execução, então o painel de pós-obra fica sempre atualizado
independentemente de qual delas rodou por último.

## Link externo por aba

Edite `web/links.json` (direto pelo GitHub ou localmente) para adicionar um
link "Abrir link externo ↗" em qualquer aba, por exemplo quando ela virar um
app à parte:

```json
{ "pos-obra": "https://...", "vistorias": null, "agenda": null }
```

`null` (ou o campo ausente) esconde o botão nessa aba.

## Limitações importantes

- Cada execução lê a planilha inteira e substitui os dados anteriores; se a
  leitura falhar (arquivo corrompido, link fora do ar), o painel mantém os
  últimos dados bons conhecidos em vez de ficar vazio.
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
