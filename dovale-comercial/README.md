# Dovale Comercial

App para administrar a parte comercial da Dovale Engenharia: bases de
potenciais clientes por segmento e disparo de e-mail (manual ou recorrente)
pela conta `danilo.magalhaes@dovaleengenharia.com` (Titan Email).

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

1. **Libere o acesso de terceiros no Titan**: entre no webmail do Titan como
   `danilo.magalhaes@dovaleengenharia.com`, vá em Configurações e ative o
   "Acesso de terceiros" (third-party app access) — sem isso o SMTP recusa
   qualquer login. Se a conta do Titan tiver verificação em duas etapas
   ativada, desative-a (o Titan bloqueia apps de terceiros com 2FA ligado).
   Se o domínio for hospedado na Europa, o host de SMTP muda (algo como
   `smtp0101.titan.email` em vez de `smtp.titan.email`) — confirme o host
   exato nas configurações de "cliente de e-mail" do próprio Titan.
2. Copie `.env.example` para `.env` e preencha `SMTP_USER` (o e-mail) e
   `SMTP_PASS` (a senha normal da caixa — o Titan não usa "senha de app"
   como o Google). Ajuste `SMTP_HOST`/`SMTP_PORT` se a conta for hospedada
   na Europa.
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
| `DOVALE_SMTP_USER` | secret | sim |
| `DOVALE_SMTP_PASS` | secret | sim |
| `DOVALE_SMTP_HOST` | variable | não (padrão `smtp.titan.email`) |
| `DOVALE_SMTP_PORT` | variable | não (padrão `465`) |
| `DOVALE_FROM_NAME` | variable | não |
| `DOVALE_EMAIL_SIGNATURE` | variable | não |
| `DOVALE_SEND_DELAY_MS` | variable | não |
| `DOVALE_SEND_DAILY_LIMIT` | variable | não |

## Avisos importantes

- **Limite de envio**: `SEND_DAILY_LIMIT` no `.env` protege contra passar do
  limite diário do seu plano Titan sem querer; `SEND_DELAY_MS` espaça os
  envios para reduzir o risco de o provedor marcar a conta como suspeita.
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
