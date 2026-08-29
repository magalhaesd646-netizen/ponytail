# vale-paraiba-lancamentos

Monitor diário de **lançamentos imobiliários** em São José dos Campos,
Jacareí, Taubaté e nos demais municípios do Vale do Paraíba Paulista, com um
**painel web** e **alerta automático** (GitHub Issue + notificação nativa do
GitHub) sempre que algo novo é encontrado — sem precisar criar nenhuma
credencial para começar a funcionar.

## Funciona "pronto", sem configurar nada

Depois de mesclado na branch padrão (`main`) e com o **GitHub Pages
habilitado uma única vez** (30 segundos, ver abaixo), o app já roda sozinho
todo dia:

- Busca lançamentos nos portais públicos (Viva Real, ZAP Imóveis) — não
  precisa de chave de API para isso.
- Quando acha algo novo, **abre uma Issue** no próprio repositório com o
  resumo (empreendimento, cidade, construtora, incorporadora, e-mail de
  contato quando encontrado). O GitHub já te avisa por e-mail
  automaticamente quando uma Issue é aberta no seu próprio repositório —
  então isso já cobre "sempre me avise", sem SMTP, sem senha de app, sem
  nada.
- Publica um **painel web** (`web/index.html`) no GitHub Pages, com busca,
  filtro por cidade e destaque para os lançamentos novos — dá pra checar
  quando quiser, sem esperar o e-mail.

As duas únicas coisas que **exigem uma ação sua** são as que nenhum app
consegue fazer sozinho: habilitar o GitHub Pages (é um botão nas
configurações do repositório, não uma credencial) e, se quiser, criar chaves
de API/e-mail para os upgrades opcionais abaixo.

### Passo único: habilitar o GitHub Pages

No repositório, vá em **Settings → Pages → Build and deployment → Source** e
escolha **"GitHub Actions"**. Não precisa escolher branch nem pasta — o
workflow já cuida disso. Depois do próximo run, o painel fica disponível na
URL que aparece ali (formato `https://<usuário>.github.io/<repo>/`).

Pronto — a partir daí é só esperar a execução diária (ou rodar manualmente
pela aba **Actions → vale-paraiba-lancamentos → Run workflow**).

## Upgrades opcionais (deixam o app melhor, mas não são obrigatórios)

| Upgrade | O que melhora | O que exige |
|---|---|---|
| Google Custom Search API | Busca ampla no Google + posts públicos de Instagram/Facebook indexados; melhora bastante a identificação de construtora/incorporadora | Uma chave de API do Google (grátis até 100 buscas/dia) |
| E-mail próprio (SMTP) | Além da Issue, também manda um e-mail digest formatado para quem você quiser | Senha de app de um e-mail (ex.: Gmail) |

Sem esses dois, o app roda no **modo zero-config**: só portais públicos +
Issue de alerta + painel web. É mais limitado (a construtora nem sempre é
identificada, porque o nome dela raramente aparece no link de listagem do
portal — o app tenta compensar abrindo a página de detalhe do anúncio, mas
não é garantido), porém já funciona de verdade sem nenhuma conta nova.

### Ativando o upgrade do Google (opcional)

1. Crie uma chave de API em
   [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
   (ative a "Custom Search API" no projeto).
2. Crie um mecanismo de busca em
   [programmablesearchengine.google.com](https://programmablesearchengine.google.com/),
   configurado para **"Buscar em toda a web"**, e copie o `cx` (Search
   engine ID).
3. No repositório, vá em **Settings → Secrets and variables → Actions** e
   crie `VALE_GOOGLE_API_KEY` e `VALE_GOOGLE_CSE_ID` com esses valores.

### Ativando o upgrade de e-mail próprio (opcional)

No mesmo lugar (**Settings → Secrets and variables → Actions**), crie:

| Secret | Exemplo |
|---|---|
| `VALE_SMTP_HOST` | `smtp.gmail.com` |
| `VALE_SMTP_PORT` | `587` |
| `VALE_SMTP_USER` | seu e-mail |
| `VALE_SMTP_PASS` | senha de app (não a senha normal da conta) |
| `VALE_SMTP_FROM` | pode ser igual ao `VALE_SMTP_USER` |
| `VALE_ALERT_EMAIL_TO` | quem deve receber o e-mail |

Para Gmail, gere a senha de app em
[myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
(precisa de verificação em duas etapas ativada na conta).

## Por que não faz login/scraping direto no Instagram e Facebook

Fazer scraping autenticado dessas redes (logando com uma conta pessoal para
raspar páginas de empresas) viola os termos de uso da Meta, é tecnicamente
frágil (bloqueios, captchas, mudanças de layout) e pode banir a conta usada.
Com o upgrade do Google ativado, o app usa o **Google Custom Search** para
achar posts **públicos** dessas redes já indexados pelo Google — mais
estável, porém também mais limitado (nem todo post é indexado).

## Limitações importantes (leia antes de confiar 100% no alerta)

- Isso **não é um feed oficial** de lançamentos — é uma busca heurística.
  Pode haver falsos negativos (lançamento que não aparece) e falsos
  positivos.
- A identificação de construtora/incorporadora funciona melhor com o
  upgrade do Google ativado. Complete
  [`data/known-builders.json`](./data/known-builders.json) com as
  construtoras que você já conhece atuando na região para melhorar a
  precisão em qualquer modo.
- O e-mail encontrado é uma **melhor tentativa**, nunca garantida.
- Os portais (Viva Real/ZAP) podem bloquear requisições automatizadas
  (HTTP 403) dependendo do IP/frequência. Quando isso acontece, o app não
  quebra — só ignora aquele portal naquela execução e segue com as outras
  fontes.

## Rodando localmente (para testar/desenvolver)

```bash
cd vale-paraiba-lancamentos
npm install
cp .env.example .env   # opcional, para testar os upgrades
npm start               # roda uma vez, gera web/data.json
npm test                # roda os testes
```

Para ver o painel localmente, sirva a pasta `web/` com qualquer servidor
estático, ex.: `npx serve web` ou `python3 -m http.server --directory web`.

## Estrutura do projeto

```
src/
  config.js               cidades, templates de busca, palavras-chave
  sources/
    googleSearch.js        wrapper da Google Custom Search API (opcional)
    portalScraper.js        scraper resiliente de portais públicos
  lib/
    extractor.js            normaliza resultados brutos em "lançamentos"
    emailFinder.js           acha e-mail de depto técnico no site da empresa
    state.js                 persistência do que já foi notificado
    digest.js                formata o resumo (texto/HTML/markdown), usado pelos 2 canais
    notifier.js               canal de e-mail (opcional, via SMTP)
    githubIssue.js            canal padrão de alerta (Issue no GitHub, zero-config)
    http.js / text.js         utilitários (fetch resiliente, slug, regex)
  run.js                   orquestra tudo (ponto de entrada)
web/
  index.html               painel publicado no GitHub Pages
  data.json                gerado a cada execução (não é a fonte de verdade em git)
data/
  known-builders.json      lista editável de construtoras/incorporadoras conhecidas
  seen.json                estado (lançamentos já notificados, commitado pelo workflow)
tests/                     testes unitários (node --test)
```

## Automação diária (GitHub Actions)

O workflow
[`../.github/workflows/vale-paraiba-lancamentos.yml`](../.github/workflows/vale-paraiba-lancamentos.yml)
roda todo dia às 08:00 (horário de Brasília) e também pode ser disparado
manualmente pela aba **Actions**. A cada execução ele:

1. Roda o monitor (`npm start`).
2. Commita `data/seen.json` de volta no repositório (histórico do que já foi
   notificado — sem isso o app "esqueceria" tudo a cada execução).
3. Publica `web/` no GitHub Pages (`web/data.json` é sempre regenerado do
   zero a cada run, por isso não é sincronizado com o git).

> **Nota:** tanto o `schedule` quanto o GitHub Pages só funcionam de verdade
> quando o workflow está na **branch padrão** do repositório (normalmente
> `main`) — confirme isso depois de mesclar esta branch.

## Melhorando a precisão

- Complete `data/known-builders.json` com as construtoras/incorporadoras que
  você já sabe que atuam na região (nome, apelidos/aliases e site).
- Ajuste `TECH_DEPT_KEYWORDS` em `src/config.js` se as empresas da sua região
  usarem outros nomes de e-mail para os departamentos que te interessam.
- Ajuste `VALE_CITIES` (variável de ambiente/secret) para focar só nas
  cidades prioritárias, se quiser reduzir ruído.
