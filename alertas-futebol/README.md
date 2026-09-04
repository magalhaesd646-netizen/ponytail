# Alertas de Futebol

App para avisar (por e-mail e/ou webhook) quando uma partida ao vivo cruza
um limiar que você definiu — por exemplo "mais de 5 chutes a gol", "mais de
8 escanteios" ou "posse de bola acima de 60%" — nas principais ligas do
mundo (Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Champions
League, Brasileirão e outras).

## O que o app faz

- Tela web para escolher **quais ligas monitorar** (uma, várias ou todas as
  pré-cadastradas em `src/leagues.js`).
- Tela para montar **regras de alerta**: estatística (chutes a gol,
  finalizações totais, escanteios, posse de bola, cartões amarelos/vermelhos,
  faltas, impedimentos, defesas), condição (≥, ≤, =), valor, e escopo
  (mandante, visitante ou qualquer time) — cada regra pode valer para todas
  as ligas selecionadas ou só para uma liga específica.
- Monitor que busca as partidas ao vivo nas ligas escolhidas, confere as
  estatísticas de cada uma contra as regras e dispara o alerta assim que o
  limiar é cruzado — só uma vez por regra/time/partida (não fica repetindo
  a cada rodada).
- Painel de "partidas ao vivo agora" (para conferir/testar as regras) e
  histórico dos últimos alertas enviados.

## Configuração inicial

1. **Crie uma conta na API-Football**: https://www.api-football.com/ tem um
   plano gratuito (cota diária de requisições — veja "Limites da API"
   abaixo). Pegue sua chave em https://dashboard.api-football.com/.
2. Copie `.env.example` para `.env` e preencha `FOOTBALL_API_KEY`. Se você
   assinou pelo RapidAPI em vez do site direto, mude `FOOTBALL_API_PROVIDER`
   para `rapidapi`.
3. Configure pelo menos **um** canal de notificação no `.env` — sem isso os
   alertas são detectados mas não chegam a lugar nenhum:
   - **E-mail**: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `ALERT_EMAIL_TO`
     (qualquer provedor SMTP genérico — Gmail/Workspace, Titan, etc.).
   - **Webhook**: `ALERT_WEBHOOK_URL` com uma URL de webhook de entrada do
     Discord ou do Slack (a mensagem sai formatada pros dois ao mesmo tempo).
4. `npm install`
5. Confira/ajuste os IDs de liga: `npm run list-leagues` imprime todas as
   ligas da temporada atual conforme a API (id, nome, país) — os IDs em
   `src/leagues.js` são os valores públicos e estáveis da API-Football, mas
   vale conferir antes de confiar neles, e você pode adicionar outras ligas
   nesse arquivo copiando o id encontrado aqui.
6. `npm start` e abra http://localhost:3001

## Usando pela interface local

Rode `npm start`, marque as ligas, monte as regras e clique em "Salvar
configuração". O botão "Testar agora" roda uma verificação imediata (útil
pra conferir se o e-mail/webhook está saindo). Enquanto o servidor estiver
ligado, ele também roda sozinho a cada poucos minutos (`MONITOR_CRON` no
`.env`, padrão a cada 3 minutos).

## Usando sem deixar nada ligado (GitHub Actions)

O workflow `.github/workflows/alertas-futebol.yml` roda o monitor
periodicamente sem precisar de servidor — mas a configuração (ligas/regras)
ainda precisa ser salva primeiro rodando `npm start` localmente uma vez (ou
editando `data/config.json` direto pelo GitHub e commitando).

Configure em **Settings → Secrets and variables → Actions** do repositório:

| Nome | Tipo | Obrigatório |
| --- | --- | --- |
| `FOOTBALL_ALERTAS_API_KEY` | secret | sim |
| `FOOTBALL_ALERTAS_SMTP_HOST` | secret | não* |
| `FOOTBALL_ALERTAS_SMTP_USER` | secret | não* |
| `FOOTBALL_ALERTAS_SMTP_PASS` | secret | não* |
| `FOOTBALL_ALERTAS_EMAIL_TO` | secret | não* |
| `FOOTBALL_ALERTAS_WEBHOOK_URL` | secret | não* |

\* configure e-mail ou webhook (ou os dois) — sem nenhum dos dois o monitor
roda mas não entrega nada.

## Limites da API (leia antes de configurar o intervalo)

O plano gratuito da API-Football tem uma cota diária baixa (na ordem de
100 requisições/dia). Cada rodada do monitor gasta **1 requisição para
listar as partidas ao vivo + 1 requisição por partida ao vivo** (para
buscar as estatísticas). Com vários jogos simultâneos, um intervalo curto
estoura a cota rápido. Ajuste:

- `MAX_FIXTURES_PER_RUN` no `.env` — trava quantas partidas são processadas
  por rodada (padrão 15).
- O `cron` em `.github/workflows/alertas-futebol.yml` — quanto mais espaçado,
  menos requisições por dia (o padrão do workflow já é conservador).
- `MONITOR_CRON` no `.env` — só vale para o modo `npm start` local.

Se precisar de alertas mais em tempo real com muitas ligas ao mesmo tempo,
vale considerar um plano pago da API-Football.

## Testes

```
npm test
```

Cobre a lógica de avaliação de regras (`src/rules.js`), normalização de
estatísticas (`src/metrics.js`), persistência (`src/store.js`) e formatação
de mensagem (`src/notifier.js`) — sem depender de rede.
