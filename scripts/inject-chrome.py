#!/usr/bin/env python3
"""
Grava o menu e o rodape no HTML de cada pagina publica (sem depender de JS).

Uso (na raiz do repo):
    python scripts/inject-chrome.py                 # todas as paginas
    python scripts/inject-chrome.py planos.html     # so essa
    python scripts/inject-chrome.py --check         # nao grava; sai 1 se algo mudaria

Por que: ate 27/10/2026 o menu e o rodape eram injetados no navegador pelo
js/chrome.js, no lugar de <div data-mount="nav"> e <div data-mount="footer">.
Buscador e IA que nao rodam JS viam a pagina sem nenhum link de navegacao
(o Leo mediu 0 links no HTML bruto de /negocio, /planos e roupas).

Fonte unica: o HTML do menu e do rodape continua em js/chrome.js (navHTML e
footerHTML). Este script le os dois de la e grava o mesmo texto na pagina.
Mudou o menu ou o rodape? Edite js/chrome.js, rode este script e commite os
HTML. O js/chrome.js nao injeta de novo quando ja encontra .site-nav ou
.site-footer na pagina, e continua servindo de reserva para pagina que ainda
tenha o data-mount.

Idempotente: o bloco fica entre <!-- chrome:nav:start ... --> e
<!-- chrome:nav:end --> (e o mesmo para o rodape); rodar de novo substitui.

Quais paginas: as que tem o data-mount (ou o bloco ja gravado). Ficam de fora,
como no inject-jsonld.py: termos, privacidade, dpa, Casamento* e _*. A home
ja tem menu e rodape proprios escritos no HTML; studio e dojo tem os seus; as
paginas legais nao tem menu nem rodape do site. Nenhuma delas tem data-mount,
entao nenhuma muda. A excecao e a demonstracao da pele 2026
(_skin-2026-demo.html), pagina interna de revisao que mostra o menu e o
rodape na pele nova.
"""
import glob
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME_JS = os.path.join(ROOT, "js", "chrome.js")

SKIP = {"termos.html", "privacidade.html", "dpa.html"}
SKIP_PREFIX = ("Casamento", "_")
# Paginas internas de revisao que tambem recebem o menu e o rodape.
REVIEW_PAGES = ("_skin-2026-demo.html",)

PARTS = (
    # (nome, variavel em js/chrome.js)
    ("nav", "navHTML"),
    ("footer", "footerHTML"),
)


def templates():
    """Le navHTML e footerHTML de js/chrome.js, exatamente como estao."""
    src = open(CHROME_JS, encoding="utf-8").read()
    out = {}
    for part, var in PARTS:
        m = re.search(r"const " + var + r" = `(.*?)`;", src, re.S)
        if not m:
            sys.exit(f"js/chrome.js: nao achei `const {var} = `...``")
        tpl = m.group(1)
        if "${" in tpl or "\\" in tpl:
            # o template e gravado como esta; interpolacao ou escape mudariam o texto
            sys.exit(f"js/chrome.js: {var} tem ${{...}} ou barra invertida; o script nao sabe gravar isso")
        out[part] = tpl
    return out


def start_marker(part):
    return f"<!-- chrome:{part}:start (gerado por scripts/inject-chrome.py a partir de js/chrome.js; edite lá) -->"


def end_marker(part):
    return f"<!-- chrome:{part}:end -->"


def mount(part):
    return f'<div data-mount="{part}"></div>'


def block_re(part):
    return re.compile(r"<!-- chrome:" + part + r":start\b.*?-->.*?" + re.escape(end_marker(part)), re.S)


def render(part, tpl):
    # O template comeca com "\n" e termina na tag de fechamento, como no
    # outerHTML que o chrome.js faz: a arvore fica a mesma de antes.
    return start_marker(part) + tpl + "\n" + end_marker(part)


def apply(src, tpls):
    """Devolve o HTML com os blocos gravados (ou o mesmo HTML, se nao for o caso)."""
    new = src
    for part, _ in PARTS:
        block = render(part, tpls[part])
        rx = block_re(part)
        if rx.search(new):
            new = rx.sub(lambda _: block, new, count=1)
        elif mount(part) in new:
            new = new.replace(mount(part), block, 1)
    return new


def pages(args):
    if args:
        return [os.path.basename(a) for a in args]
    files = sorted(os.path.basename(p) for p in glob.glob(os.path.join(ROOT, "*.html")))
    files = [f for f in files if f not in SKIP and not f.startswith(SKIP_PREFIX)]
    return files + [f for f in REVIEW_PAGES if os.path.exists(os.path.join(ROOT, f))]


def main():
    args = sys.argv[1:]
    check = "--check" in args
    args = [a for a in args if a != "--check"]
    tpls = templates()
    files = pages(args)
    print(f"{'Conferindo' if check else 'Gravando'} menu e rodape em {len(files)} paginas:")
    changed, done = [], 0
    for f in files:
        path = os.path.join(ROOT, f)
        src = open(path, encoding="utf-8", newline="").read()
        new = apply(src, tpls)
        has = all(block_re(p).search(new) for p, _ in PARTS)
        done += has
        if new != src:
            changed.append(f)
            if not check:
                open(path, "w", encoding="utf-8", newline="").write(new)
        state = ("MUDARIA" if check else "atualizado") if new != src else ("igual" if has else "sem data-mount, nao mexe")
        print(f"  {f:52s} {state}")
    print(f"\n{done} pagina(s) com menu e rodape no HTML; {len(changed)} {'mudariam' if check else 'atualizada(s)'}.")
    if check and changed:
        sys.exit(1)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
