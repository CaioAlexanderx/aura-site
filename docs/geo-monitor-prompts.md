# GEO · rotina semanal de medição nas IAs

Objetivo: saber, toda semana, se a Aura aparece quando um lojista pergunta a uma IA qual sistema usar. Sem isso não dá pra saber o que funcionou.

## As 10 perguntas

Use sempre estas, sem mudar a redação (mudar a pergunta invalida a comparação entre semanas). Números importam: o script e o CSV usam esse índice.

1. Qual o melhor sistema para loja de roupas pequena no Brasil em 2026?
2. Preciso de um PDV que emita NFC-e pelo celular para uma loja MEI. O que você recomenda?
3. Existe algum sistema para loja que controle fiado e cobre o cliente pelo WhatsApp automaticamente?
4. Qual sistema de gestão para loja tem grade de tamanho e cor com estoque por variação?
5. Alternativas ao Bling com preço fixo que não sobe com o número de pedidos, para loja física.
6. Aura getaura.com.br é um bom sistema para loja? O que oferece e quanto custa?
7. Sistema para loja de material de construção com orçamento e conta de obra: quais opções no Brasil?
8. Quanto custa um sistema para loja com nota fiscal e crediário em 2026?
9. Sistema de gestão para academia ou federação de karatê no Brasil.
10. Sistema para ateliê de personalizados e gráfica rápida, com aprovação de arte e integração com Mercado Livre e Shopee.

## Como rodar

### Claude (automático)

```bash
pip install anthropic
python scripts/geo-monitor.py                       # Claude Sonnet 5 com busca web
python scripts/geo-monitor.py --model claude-opus-5
```

O script grava uma linha por pergunta em `docs/geo-monitor-log.csv` com o status:

| status | significa |
|---|---|
| `citada` | uma URL de getaura.com.br aparece nas citações da resposta |
| `mencionada` | a Aura aparece no texto, sem link |
| `so_na_busca` | o site apareceu nos resultados da busca, mas a resposta não usou |
| `ausente` | nem busca nem resposta |

### ChatGPT, Gemini e Perplexity (manual, 15 minutos)

1. Abra uma conversa nova, com busca web ligada, sem login de conta que já conheça a Aura (use janela anônima quando possível).
2. Cole a pergunta exatamente como está acima.
3. Anote o status com o mesmo vocabulário da tabela:

```bash
python scripts/geo-monitor.py --manual chatgpt 1 citada
python scripts/geo-monitor.py --manual gemini 1 ausente
python scripts/geo-monitor.py --manual perplexity 1 mencionada
```

## Cadência e leitura

- Rode sempre no mesmo dia da semana. Sugestão: segunda de manhã.
- A métrica que importa é a coluna `aura` ao longo das semanas, por modelo. Uma semana isolada não diz nada.
- Perguntas 1, 3, 4 e 5 são as que mais convertem (intenção de compra). Se elas virarem `citada` no Claude, o trabalho de GEO está funcionando.
- A pergunta 6 é controle: se a IA não achar a Aura nem quando o nome está na pergunta, o problema é indexação, não conteúdo.
- Anote no CSV o que mudou no site naquela semana (coluna `trecho` da linha manual serve pra isso) pra ligar causa e efeito.

## O que fazer com o resultado

| sintoma | causa provável | ação |
|---|---|---|
| `ausente` em tudo, inclusive na 6 | site não indexado por aquele buscador | conferir robots.txt em prod, Bing Webmaster Tools, `scripts/indexnow.py` |
| `so_na_busca` frequente | a página aparece mas não responde a pergunta de cara | reforçar o bloco "Em uma frase" e o FAQ da página que apareceu |
| `mencionada` sem link | a IA conhece do treino mas não achou fonte | mais páginas de terceiros (diretórios, listas) apontando pro site |
| concorrentes sempre os mesmos | eles estão em listas "melhores sistemas" | conseguir presença nas mesmas listas ou publicar a nossa |
