# Meus Investimentos

Controle visual pessoal de investimentos, separado por categoria (Renda Fixa, Ações,
Fundos, Criptomoedas, Outros), com gráfico de pizza da alocação da carteira.

## Como usar

Abra `index.html` diretamente no navegador (duplo clique) ou sirva a pasta com
qualquer servidor estático, ex:

```
npx serve investimentos
```

Não há backend nem build: é uma única página HTML/CSS/JS.

## Cadastro de investimentos

- **Manual**: preencha categoria, ativo, banco/corretora, data e valor no formulário.
- **Por imagem**: envie um print (extrato, app do banco, corretora) e clique em
  "Ler imagem". O OCR roda no próprio navegador (Tesseract.js) e tenta identificar
  banco, data e valor automaticamente. O que não for encontrado fica em branco para
  você preencher manualmente — a leitura é só um ponto de partida, sempre confira
  antes de salvar.

## Dados

Tudo fica salvo em `localStorage`, só neste navegador/dispositivo — nada é enviado
para nenhum servidor. Use os botões **Exportar backup** / **Importar backup** na
carteira para salvar um arquivo JSON de segurança ou migrar para outro navegador.
