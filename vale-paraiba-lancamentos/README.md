# vale-paraiba-lancamentos

Monitor diário de **lançamentos imobiliários** em São José dos Campos,
Jacareí, Taubaté e nos demais municípios do Vale do Paraíba Paulista. A cada
execução ele busca novos empreendimentos, tenta identificar a **construtora**,
a **incorporadora** e um **e-mail de contato do depto. técnico/suprimentos**
da empresa, e envia um **e-mail de alerta** só com o que for novo desde a
última execução.

## O que ele faz

1. Para cada cidade configurada, busca lançamentos em:
   - **Portais públicos de imóveis** (Viva Real e ZAP Imóveis), lendo a
     página pública de "lançamentos" da cidade.
   - **Google** (Custom Search API), com uma consulta ampla combinando termos
     como "lançamento imobiliário", "pré-lançamento", "novo empreendimento".
   - **Google restrito a `site:instagram.com` e `site:facebook.com`**, para
     capturar posts públicos sobre lançamentos indexados pelo Google.
2. Normaliza os resultados (nome do empreendimento, cidade, fonte) e tenta
   reconhecer a construtora/incorporadora comparando o texto com uma lista
   editável em [`data/known-builders.json`](./data/known-builders.json).
3. Compara com o histórico em `data/seen.json`; só o que é **novo** entra no
   alerta.
4. Para cada lançamento novo, tenta achar um e-mail de contato técnico no
   site da construtora (busca por palavras como `suprimentos`, `compras`,
   `engenharia`, `obras`, `tecnico` no endereço de e-mail).
5. Envia um e-mail resumindo os lançamentos novos (ou só loga no console se
   o SMTP não estiver configurado — modo *dry-run*).

## Por que não faz login/scraping direto no Instagram e Facebook

Fazer scraping autenticado dessas redes (logando com uma conta pessoal para
raspar páginas de empresas) viola os termos de uso da Meta, é tecnicamente
frágil (bloqueios, captchas, mudanças de layout) e pode banir a conta
usada. Em vez disso, o app usa o **Google Custom Search** para achar posts
**públicos** dessas redes já indexados pelo Google — é mais estável, mas
também mais limitado: nem todo post é indexado, e a cobertura tende a ser
parcial. Para melhorar a cobertura, complemente manualmente seguindo as
construtoras da região no Instagram/Facebook, ou considere usar a API oficial
(Meta Graph API) caso a empresa/conta usada tenha uma Página comercial com
acesso liberado — isso está fora do escopo deste projeto.

## Limitações importantes (leia antes de confiar 100% no alerta)

- Isso **não é um feed oficial** de lançamentos — é uma busca heurística.
  Pode haver falsos negativos (lançamento que não aparece) e falsos
  positivos (algo que não é exatamente um "lançamento novo").
- A identificação de construtora/incorporadora só funciona bem para nomes
  presentes em `data/known-builders.json` ou que apareçam literalmente no
  título/trecho do resultado. Complete esse arquivo com as construtoras que
  você já conhece atuando na região para melhorar a precisão.
- O e-mail encontrado é uma **melhor tentativa**: o app escolhe o e-mail do
  site institucional cujo endereço contenha palavras como "suprimentos" ou
  "compras"; se não achar nenhum, pode devolver um e-mail genérico de
  contato, ou nenhum.
- Os portais (Viva Real/ZAP) podem bloquear requisições automatizadas
  (HTTP 403) dependendo do IP/frequência. Quando isso acontece, o app não
  quebra — só ignora aquele portal naquela execução e segue com as outras
  fontes.

## Configuração

### 1. Instalar dependências

```bash
cd vale-paraiba-lancamentos
npm install
```

### 2. Google Custom Search API (opcional, mas recomendado)

1. Crie uma chave de API em
   [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
   (ative a "Custom Search API" no projeto).
2. Crie um mecanismo de busca em
   [programmablesearchengine.google.com](https://programmablesearchengine.google.com/),
   configurado para **"Buscar em toda a web"**, e copie o `cx` (Search
   engine ID).
3. Preencha `GOOGLE_API_KEY` e `GOOGLE_CSE_ID` no `.env` (copie de
   `.env.example`).

A cota gratuita é de 100 buscas/dia. O app usa no máximo 2 buscas por cidade
(web + redes sociais) e tem um orçamento diário configurável
(`GOOGLE_DAILY_QUERY_BUDGET`, padrão 90) para nunca estourar a cota, mesmo
monitorando todos os ~34 municípios do Vale do Paraíba de uma vez.

Sem essas variáveis, o app funciona mesmo assim, só que apenas com os
portais públicos como fonte.

### 3. E-mail de alerta (SMTP)

Preencha no `.env`:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app        # não é a senha normal da conta
SMTP_FROM=seu-email@gmail.com
ALERT_EMAIL_TO=quem-deve-receber-o-alerta@gmail.com
```

Para Gmail, gere uma "senha de app" em
[myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
(precisa de verificação em duas etapas ativada na conta).

Sem SMTP configurado, o app roda em modo *dry-run*: só imprime no console o
que teria sido enviado.

### 4. Cidades monitoradas (opcional)

Por padrão monitora todos os municípios da mesorregião do Vale do Paraíba
Paulista (ver `src/config.js`), com São José dos Campos, Jacareí e Taubaté
sempre primeiro. Para restringir, defina no `.env`:

```
VALE_CITIES=São José dos Campos,Jacareí,Taubaté
```

## Rodando manualmente

```bash
npm start
```

## Rodando os testes

```bash
npm test
```

## Automação diária (GitHub Actions)

O workflow [`../.github/workflows/vale-paraiba-lancamentos.yml`](../.github/workflows/vale-paraiba-lancamentos.yml)
roda todo dia às 08:00 (horário de Brasília) via `cron`, e também pode ser
disparado manualmente pela aba **Actions** do GitHub (`workflow_dispatch`).

Para funcionar, configure estes **Secrets** no repositório (Settings →
Secrets and variables → Actions):

| Secret | Descrição |
|---|---|
| `VALE_GOOGLE_API_KEY` | chave da Google Custom Search API |
| `VALE_GOOGLE_CSE_ID` | ID do mecanismo de busca (`cx`) |
| `VALE_SMTP_HOST` | ex.: `smtp.gmail.com` |
| `VALE_SMTP_PORT` | ex.: `587` |
| `VALE_SMTP_USER` | usuário SMTP |
| `VALE_SMTP_PASS` | senha de app SMTP |
| `VALE_SMTP_FROM` | remetente do e-mail (pode ser igual ao `VALE_SMTP_USER`) |
| `VALE_ALERT_EMAIL_TO` | e-mail que recebe o alerta diário |

O workflow também faz commit automático de `data/seen.json` (histórico do
que já foi notificado), para o dia seguinte só alertar sobre lançamentos
realmente novos. Isso exige permissão de escrita do `GITHUB_TOKEN`
(já habilitada no workflow via `permissions: contents: write`; se o push
falhar por permissão, confira em Settings → Actions → General → Workflow
permissions se "Read and write permissions" está marcado).

> **Importante:** o agendamento (`schedule`) de um workflow só é ativado
> pelo GitHub quando o arquivo está na **branch padrão** do repositório
> (normalmente `main`). Depois de mesclar esta branch, confirme que o
> workflow aparece habilitado na aba Actions.

## Estrutura do projeto

```
src/
  config.js              cidades, templates de busca, palavras-chave
  sources/
    googleSearch.js       wrapper da Google Custom Search API
    portalScraper.js       scraper resiliente de portais públicos
  lib/
    extractor.js           normaliza resultados brutos em "lançamentos"
    emailFinder.js          acha e-mail de depto técnico no site da empresa
    state.js                persistência do que já foi notificado
    notifier.js              monta e envia o e-mail de alerta
    http.js / text.js        utilitários (fetch resiliente, slug, regex)
  run.js                  orquestra tudo (ponto de entrada)
data/
  known-builders.json     lista editável de construtoras/incorporadoras conhecidas
  seen.json               estado (lançamentos já notificados)
tests/                    testes unitários (node --test)
```

## Melhorando a precisão

- Complete `data/known-builders.json` com as construtoras/incorporadoras que
  você já sabe que atuam na região (nome, apelidos/aliases e site).
- Ajuste `TECH_DEPT_KEYWORDS` em `src/config.js` se as empresas da sua região
  usarem outros nomes de e-mail para os departamentos que te interessam.
- Ajuste `VALE_CITIES` para focar só nas cidades prioritárias, se quiser
  reduzir ruído.
