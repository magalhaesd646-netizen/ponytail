# Detector de Arbitragem Esportiva

App web que compara odds de apostas esportivas (mercado *moneyline* / h2h)
entre várias casas de apostas em tempo (quase) real, usando a
[The Odds API](https://the-odds-api.com/), e aponta quando existe uma
combinação de apostas com **lucro garantido independente do resultado**
("arbitragem" ou "surebet").

## O que esta ferramenta faz e o que ela não faz

- ✅ Lê odds públicas via API.
- ✅ Calcula, para cada evento, se a melhor odd de cada resultado (soma das
  1/odd) fica abaixo de 1 — nesse caso existe arbitragem — e quanto apostar
  em cada casa para travar o lucro.
- ✅ Atualiza automaticamente em um intervalo configurável.
- ❌ **Não** loga em nenhuma casa de apostas.
- ❌ **Não** aposta automaticamente. Você decide e aposta manualmente, no
  site de cada casa, com as informações mostradas aqui.

## Como funciona o cálculo

Para um evento com odds decimais `o1, o2 (, o3)` (a melhor odd de cada
resultado, em casas possivelmente diferentes):

```
soma_implícita = 1/o1 + 1/o2 (+ 1/o3)
```

Se `soma_implícita < 1`, apostando `stake_i = valor_total * (1/o_i) /
soma_implícita` em cada resultado, o retorno é o mesmo não importa quem
vença: `valor_total / soma_implícita` — sempre maior que `valor_total`.

Só o mercado `h2h` (quem vence) é suportado. Mercados de *totals*/*spreads*
têm uma linha (ex: over/under 2.5) que varia por casa, então comparar por
nome de resultado não é seguro sem antes casar as linhas — isso ficou fora
do escopo desta primeira versão.

## Configuração

1. Crie uma conta gratuita em https://the-odds-api.com/ e pegue sua API key
   (o plano gratuito dá ~500 requisições/mês).
2. Instale as dependências:

   ```bash
   cd arbitrage-detector
   pip install -r requirements.txt
   ```

3. Rode o servidor:

   ```bash
   python app.py
   ```

4. Abra `http://localhost:5000`, cole sua API key, escolha o esporte e as
   regiões das casas, e clique em "Iniciar monitoramento".

A API key nunca é salva no servidor — ela fica só no seu navegador durante a
sessão e é enviada para o backend a cada checagem, que repassa para a The
Odds API.

## Avisos importantes

- **Janelas de arbitragem fecham rápido.** As odds mudam a todo instante;
  entre o app detectar e você apostar manualmente em duas casas diferentes,
  a odd pode já ter caído e a "garantia" de lucro desaparecer. Confira as
  odds direto no site da casa antes de apostar valor real.
- **Casas de apostas não gostam de arbitragem.** Contas identificadas
  fazendo "surebets" com frequência costumam ser limitadas (odds piores só
  para você) ou banidas. Isso é um risco de negócio, não só técnico.
- **Cuidado com o intervalo de atualização e sua cota da API.** O plano
  gratuito da The Odds API tem um limite mensal de requisições — cada
  checagem consome uma. Ajuste o campo "Atualizar a cada" para não estourar
  a cota.
- Esta ferramenta é informativa. A decisão e a execução de qualquer aposta
  são sempre suas, feitas manualmente no site da casa de apostas, e sob sua
  responsabilidade legal e financeira.
