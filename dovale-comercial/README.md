# Dovale Comercial

App para administrar a parte comercial da Dovale Engenharia: bases de
potenciais clientes por segmento e disparo de e-mail (manual ou recorrente)
pela conta Gmail `danilo.magalhaes@dovaleengenharia.com`.

## O que o app faz

- Três bases fixas ("abas"): **Construtoras**, **Escritórios de Advocacia
  (Direito Imobiliário)** e **Síndicos e Administradoras de Condomínio**.
- Importação de listas em **PDF**: você anexa o PDF, o app extrai
  nome/empresa/e-mail/telefone automaticamente (heurística por regex) e
  mostra uma tela de revisão para você corrigir antes de confirmar — PDFs
  com layout muito irregular ou digitalizados como imagem não são lidos
  corretamente, então sempre confira a revisão.
- **Disparo manual (coletivo)**: escreve assunto + corpo (com
  `{{nome}}`, `{{empresa}}`, `{{cidade}}`) e envia para a lista toda ou só
  para os contatos selecionados.
- **Disparo agendado com recorrência**: cria uma regra (ex: toda segunda às
  9h) por lista + template; roda sozinho.
- Histórico de todo disparo (enviados, falhas, data), status por contato
  (ativo / descadastrado / inválido) e link de descadastro automático em
  todo e-mail enviado.

## Configuração inicial

1. **Senha de app do Gmail** (não é a senha normal da conta): ative a
   verificação em duas etapas em `danilo.magalhaes@dovaleengenharia.com` e
   crie uma senha de app em https://myaccount.google.com/apppasswords.
2. Copie `.env.example` para `.env` e preencha `GMAIL_USER` e
   `GMAIL_APP_PASSWORD` (os demais campos já têm valores padrão razoáveis).
3. `npm install`
4. `npm start` e abra http://localhost:3000

## Usando pela interface local

Rode `npm start` sempre que for importar uma lista nova ou disparar uma
campanha manual — a tela mostra as abas, upload de PDF com revisão, tabela
de contatos (editar status, excluir) e o formulário de envio. Os
agendamentos recorrentes rodam sozinhos a cada 5 minutos enquanto o
servidor estiver ligado.

## Usando sem deixar nada ligado (GitHub Actions)

Como nem sempre alguém vai estar com `npm start` rodando, o workflow
`.github/workflows/dovale-comercial.yml` cobre os dois cenários sem
precisar de servidor:

- **Recorrência**: roda a cada hora, confere os agendamentos criados pela
  interface (tabela "Agendamentos") e dispara os que estiverem devidos.
- **Importar PDF sem abrir o app**: coloque o arquivo em
  `uploads/construtoras/`, `uploads/advocacia/` ou `uploads/sindicos/` (pelo
  próprio GitHub, "Add file") — a próxima rodada da hora importa
  automaticamente. Cada arquivo só é processado uma vez
  (`data/processed-files.json` controla isso).
- **Disparo manual sem interface**: aba *Actions* → workflow
  "dovale-comercial" → *Run workflow* → escolha `enviar-campanha-manual` e
  preencha lista/assunto/corpo HTML.

Configure em **Settings → Secrets and variables → Actions** do repositório:

| Nome | Tipo | Obrigatório |
| --- | --- | --- |
| `DOVALE_GMAIL_USER` | secret | sim |
| `DOVALE_GMAIL_APP_PASSWORD` | secret | sim |
| `DOVALE_FROM_NAME` | variable | não |
| `DOVALE_EMAIL_SIGNATURE` | variable | não |
| `DOVALE_SEND_DELAY_MS` | variable | não |
| `DOVALE_SEND_DAILY_LIMIT` | variable | não |

## Avisos importantes

- **Limite do Gmail**: conta pessoal permite ~500 e-mails/dia, Google
  Workspace ~2000/dia. `SEND_DAILY_LIMIT` no `.env` protege contra passar
  disso sem querer; `SEND_DELAY_MS` espaça os envios para reduzir o risco de
  o Gmail marcar a conta como suspeita.
- **Cold e-mail / LGPD**: todo e-mail sai com cabeçalho `List-Unsubscribe` e
  o rodapé leva a assinatura configurada. Quando alguém pedir para não
  receber mais, marque o contato como "descadastrado" na tabela (ele para
  de entrar nos próximos disparos, mas continua na base para referência).
- **Extração de PDF é heurística**: funciona bem com listas exportadas de
  planilha (Excel/Sheets → PDF) ou tabelas de Word; PDFs escaneados como
  imagem não têm texto para extrair. Sempre revise antes de confirmar.

## Comandos úteis

```bash
npm start            # interface web local
npm run import-pdfs  # importa PDFs colocados em uploads/<lista>/ manualmente
npm run send-campaign -- --lista=construtoras --assunto="Oi" --corpo=template.html
npm run run-scheduler # roda os agendamentos devidos agora (uso normal: automático)
npm test              # checagem da extração de PDF
```
