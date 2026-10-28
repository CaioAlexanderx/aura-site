# aura-site

Site institucional da Aura (getaura.com.br): HTML estático servido por um Worker da Cloudflare (`src/worker.js`, assets na raiz). O deploy é o Workers Builds no push da `main`.

## Publicar uma página nova

1. Crie o `.html` na raiz e adicione a URL limpa ao `sitemap.xml` (e um redirect `.html` para URL limpa em `_redirects`, como as outras).
2. Gere o JSON-LD: `python scripts/inject-jsonld.py` (passa por todas as páginas, mas só grava as que mudaram de conteúdo; na `main` sem mudança ele não altera nenhum arquivo). `python scripts/inject-jsonld.py --check` confere sem gravar e sai com erro se a fonte do script (planos, preços, recursos) ficou para trás do HTML: nesse caso corrija o script, não o HTML.
3. Se a página entra no resumo para IAs, acrescente a linha em `llms.txt`.
4. Abra o PR e mergeie. Espere o deploy chegar em produção.
5. Avise os buscadores (IndexNow) **depois do deploy**, com o checkout na `main` atualizada:

```
node scripts/indexnow.js --dry-run     # mostra o que enviaria, sem enviar
node scripts/indexnow.js               # envia as URLs do sitemap que mudaram no último commit (mais o /llms.txt)
node scripts/indexnow.js /planos       # ou só as URLs que você passar (caminho ou URL completa)
node scripts/indexnow.js --all         # todas as URLs do sitemap
```

Sem dependência (Node 18+). O script confere que a chave está no ar antes de enviar; se não estiver, o deploy ainda não chegou. O modo padrão olha o último commit (`git diff HEAD~1 HEAD`), então rode logo depois do merge de um PR (a `main` usa squash, um commit por PR). A chave é o arquivo `<32 hex>.txt` da raiz, pública por desenho: o Bing a lê para validar o dono do site. O Google não usa IndexNow; para ele vale o `sitemap.xml` e o Search Console. A versão em Python (`scripts/indexnow.py`) faz o mesmo sem o modo "último commit".

## Testes

Não há suíte de framework; os testes de fumaça rodam com Node puro:

```
node scripts/tests/indexnow.test.js
node scripts/tests/promessas-sem-lastro.test.js   # site sem TEF, multi-gateway, lotes/validade nem balanço de estoque (roda também no CI)
node scripts/tests/skin-2026.test.js              # pele 2026 dormente: escopo em [data-skin="2026"], fontes locais, demo fora dos índices
```

Todos de uma vez: `node --test scripts/tests/*.test.js`.

## Pele 2026 (fase 2, em construção)

`css/skin-2026.css` só vale para a página com `data-skin="2026"` (no `<html>`); hoje nenhuma página pública a carrega. Fontes em `assets/fonts/` (woff2 do Fontsource, licença OFL ao lado), logo em `assets/brand/`. Demonstração interna, fora do sitemap e com noindex: `/_skin-2026-demo`. Arquivos `_*.html` são páginas internas de revisão: o `inject-jsonld.py` e o teste de origem os pulam.
