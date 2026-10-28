#!/usr/bin/env python3
"""
Injeta JSON-LD (schema.org) em todas as paginas publicas do site.

Uso (na raiz do repo):
    python scripts/inject-jsonld.py                      # todas as paginas
    python scripts/inject-jsonld.py index.html planos.html   # so essas

Idempotente: o bloco fica entre <!-- jsonld:start --> e <!-- jsonld:end -->
no <head>; rodar de novo substitui. Rode sempre que criar/alterar uma pagina
(principalmente FAQ e <title>/<meta description>), depois commite o HTML.
Se o bloco que ja esta na pagina tem o mesmo conteudo e so muda a formatacao
(ex.: /sistema-para-otica, escrito a mao), o arquivo nao e reescrito.

Em dia com o HTML: rodar na main nao muda nenhum arquivo. Se mudar, a fonte
abaixo (PLANS, FEATURES, textos) ficou para tras do HTML commitado; corrija a
fonte, nao o HTML. Para conferir sem gravar:
    python scripts/inject-jsonld.py --check    # sai com 1 se algo mudaria

O que gera por pagina:
  - Organization + WebSite (so na home)
  - SoftwareApplication com Offers dos 3 planos (home e /planos)
  - WebPage + BreadcrumbList (todas)
  - FAQPage extraida do HTML (paginas com .lp-faq-item ou .faq-item)

Por que: assistentes de IA (ChatGPT, Claude, Gemini, Perplexity) e o Google
leem esses blocos pra entender o que a Aura e, quanto custa e quais perguntas
cada pagina responde. Sem isso, dependem de inferir do texto solto.
"""
import glob
import html
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://www.getaura.com.br"
ORG_ID = SITE + "/#organization"
SITE_ID = SITE + "/#website"
APP_ID = SITE + "/#software"

SKIP = {"termos.html", "privacidade.html", "dpa.html"}
# "_": paginas internas de revisao (ex.: _skin-2026-demo.html), fora do indice.
SKIP_PREFIX = ("Casamento", "_")

# ---- Precos (fonte da verdade: js/plans-data.js + planos.html) ----
# (nome, ancora em /planos, mensal, anual equivalente por mes, o que o plano inclui)
# 15/10/2026: um Offer por plano, com o mensal e o anual-equivalente dentro do
# mesmo Offer. Antes eram 6 Offers soltos (mensal e anual de cada plano na mesma
# lista) e uma IA lendo a lista corrida podia colar o R$ 89 no pacote de R$ 169.
PLANS = [
    ("Essencial", "essencial", 89.00, 74.17,
     "PDV com NFC-e, até 50 notas fiscais por mês (NF-e e NFC-e), estoque com variantes, financeiro básico, 1 usuário com login. Crediário (fiado) a partir do plano Negócio."),
    ("Negócio", "negocio", 169.00, 140.83,
     "Operação completa: notas fiscais ilimitadas (NF-e, NFC-e e NFS-e), crediário (fiado) com cobrança no WhatsApp, CRM, folha de pagamento, loja online, até 3 usuários com login. Studio ou Dojô incluídos."),
    ("Expansão", "expansao", 269.00, 224.17,
     "Tudo do Negócio (notas ilimitadas e crediário), mais usuários ilimitados, multi-CNPJ, BI, API e Customer Success dedicado. Studio ou Dojô incluídos."),
]

FEATURES = [
    "PDV (frente de caixa) com NFC-e em 1 clique",
    "NF-e, NFC-e e NFS-e sem modulo fiscal a parte",
    "Estoque com grade de tamanho, cor e modelo",
    "Troca e devolucao no caixa com saldo automatico",
    "Crediario (fiado) com cobranca automatica pelo WhatsApp e PIX",
    "Financeiro: contas a pagar/receber, conciliacao OFX, DRE, fluxo de caixa",
    "CRM com ranking por LTV e retencao de clientes",
    "Folha de pagamento e comissoes automaticas",
    "Loja online inclusa e WhatsApp Business",
    "Multi-CNPJ consolidado e API (plano Expansao)",
]


def organization():
    return {
        "@type": "Organization",
        "@id": ORG_ID,
        "name": "Aura Tecnologia",
        "alternateName": "Aura",
        "url": SITE + "/",
        "logo": {"@type": "ImageObject", "url": SITE + "/Icon.png"},
        "image": SITE + "/og-image.png",
        "description": "ERP e sistema de gestão em nuvem para lojas: PDV com NFC-e, estoque com grade, troca no caixa, financeiro e crediário com cobrança no WhatsApp. Preço fixo.",
        "address": {"@type": "PostalAddress", "addressLocality": "Jacareí", "addressRegion": "SP", "addressCountry": "BR"},
        "areaServed": "BR",
        "contactPoint": [{
            "@type": "ContactPoint",
            "contactType": "sales",
            "telephone": "+55-11-95630-5269",
            "availableLanguage": ["Portuguese"],
            "url": "https://wa.me/5511956305269",
        }],
        "sameAs": ["https://www.instagram.com/aura_tecnologia"],
    }


def website():
    return {
        "@type": "WebSite",
        "@id": SITE_ID,
        "url": SITE + "/",
        "name": "Aura",
        "inLanguage": "pt-BR",
        "publisher": {"@id": ORG_ID},
    }


def software():
    offers = []
    for name, anchor, monthly, annual, desc in PLANS:
        mo = f"{monthly:.2f}"
        an = f"{annual:.2f}"
        mo_br = f"{monthly:.2f}".replace(".", ",")
        an_br = f"{annual:.2f}".replace(".", ",")
        mo_txt = mo_br[:-3] if mo_br.endswith(",00") else mo_br
        offers.append({
            "@type": "Offer",
            "name": f"Plano {name}",
            "price": mo,
            "priceCurrency": "BRL",
            "url": f"{SITE}/planos#{anchor}",
            "availability": "https://schema.org/InStock",
            "description": (
                f"{desc} Preço: R$ {mo_txt} por mês no plano mensal; "
                f"R$ {an_br} por mês no plano anual, cobrado mês a mês, sem fidelidade."
            ),
            "priceSpecification": [
                {
                    "@type": "UnitPriceSpecification",
                    "name": f"Plano {name} mensal",
                    "price": mo,
                    "priceCurrency": "BRL",
                    "billingIncrement": 1,
                    "unitCode": "MON",
                },
                {
                    "@type": "UnitPriceSpecification",
                    "name": f"Plano {name} anual (valor por mês, cobrado mês a mês, sem fidelidade)",
                    "price": an,
                    "priceCurrency": "BRL",
                    "billingIncrement": 1,
                    "unitCode": "MON",
                },
            ],
        })
    return {
        "@type": "SoftwareApplication",
        "@id": APP_ID,
        "name": "Aura",
        "alternateName": ["Aura Negócio", "Aura Studio", "Aura Dojô"],
        "url": SITE + "/",
        "applicationCategory": "BusinessApplication",
        "applicationSubCategory": "ERP para pequenas empresas, PDV e gestão para varejo",
        "operatingSystem": "Web, Android, iOS",
        "inLanguage": "pt-BR",
        "description": "ERP em nuvem para comércio e varejo: PDV com NFC-e, estoque com grade, troca no caixa, financeiro com DRE e crediário (fiado) com cobrança automática no WhatsApp. Preço fixo por plano, teste grátis de 7 dias sem cartão.",
        "keywords": "ERP, ERP para pequenas empresas, ERP para loja, ERP em nuvem, sistema de gestão, PDV, frente de caixa, NFC-e, controle de estoque, crediário, fiado",
        "featureList": FEATURES,
        "offers": offers,
        "publisher": {"@id": ORG_ID},
        "installUrl": "https://app.getaura.com.br",
        "isAccessibleForFree": False,
        "audience": {"@type": "BusinessAudience", "audienceType": "Pequenos e medios comercios do Brasil (MEI, Simples Nacional)"},
        "countriesSupported": "BR",
    }


def strip_tags(s):
    s = re.sub(r"<[^>]+>", "", s)
    return html.unescape(re.sub(r"\s+", " ", s)).strip()


def get(pattern, src, flags=re.S):
    m = re.search(pattern, src, flags)
    return strip_tags(m.group(1)) if m else ""


def page_name(title):
    # "Sistema para loja de roupas — grade ... | Aura" -> "Sistema para loja de roupas"
    # "Planos · Aura — Escolha..." -> "Planos"
    t = re.split(r"\s+[—|·]\s+", title)[0].strip()
    return t or title


def extract_faq(src):
    items = []
    for q, a in re.findall(r'<div class="lp-faq-item">\s*<h3>(.*?)</h3>\s*<p>(.*?)</p>', src, re.S):
        items.append((strip_tags(q), strip_tags(a)))
    for q, a in re.findall(r'<div class="faq-q">(.*?)</div>\s*<div class="faq-a">(.*?)</div>', src, re.S):
        q = re.sub(r'<span class="ic">.*?</span>', "", q, flags=re.S)
        items.append((strip_tags(q), strip_tags(a)))
    return items


def build_graph(fname, src):
    canonical = get(r'<link rel="canonical" href="([^"]+)"', src) or SITE + "/" + fname.replace(".html", "")
    title = get(r"<title>(.*?)</title>", src)
    desc = get(r'<meta name="description" content="([^"]*)"', src)
    # imagem da pagina: respeita o og:image (ex.: /sistema-para-otica usa screenshot proprio)
    image = get(r'<meta property="og:image" content="([^"]+)"', src) or SITE + "/og-image.png"
    is_home = fname == "index.html"
    name = "Início" if is_home else page_name(title)

    graph = []
    if is_home:
        graph += [organization(), website(), software()]
    elif fname == "planos.html":
        graph.append(software())

    crumbs = [("Início", SITE + "/")]
    if fname.startswith("sistema-") or fname in ("frente-de-caixa.html", "emissor-de-nfce.html"):
        crumbs.append(("Segmentos", SITE + "/segmentos"))
    elif fname.startswith("aura-vs-"):
        crumbs.append(("Comparativo", SITE + "/comparativo"))
    if not is_home:
        crumbs.append((name, canonical))

    breadcrumb = {
        "@type": "BreadcrumbList",
        "@id": canonical + "#breadcrumb",
        "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": n, "item": u}
            for i, (n, u) in enumerate(crumbs)
        ],
    }

    webpage = {
        "@type": "WebPage",
        "@id": canonical + "#webpage",
        "url": canonical,
        "name": title,
        "description": desc,
        "inLanguage": "pt-BR",
        "isPartOf": {"@id": SITE_ID},
        "about": {"@id": APP_ID},
        "breadcrumb": {"@id": canonical + "#breadcrumb"},
        "primaryImageOfPage": {"@type": "ImageObject", "url": image},
    }
    graph += [webpage, breadcrumb]

    faq = extract_faq(src)
    if faq:
        graph.append({
            "@type": "FAQPage",
            "@id": canonical + "#faq",
            "url": canonical,
            "inLanguage": "pt-BR",
            "mainEntity": [
                {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}}
                for q, a in faq
            ],
        })
    return graph, len(faq)


START, END = "<!-- jsonld:start -->", "<!-- jsonld:end -->"


BLOCK_RE = re.compile(
    re.escape(START) + r'\s*<script type="application/ld\+json">(.*?)</script>\s*' + re.escape(END), re.S
)


def current_data(src):
    """JSON do bloco que ja esta na pagina, ou None se nao houver/nao for valido."""
    m = BLOCK_RE.search(src)
    if not m:
        return None
    try:
        return json.loads(m.group(1))
    except ValueError:
        return None


def inject(fname, check=False):
    """Devolve True se o arquivo muda. Com check=True so confere, nao grava."""
    path = os.path.join(ROOT, fname)
    src = open(path, encoding="utf-8").read()
    graph, nfaq = build_graph(fname, src)
    data = {"@context": "https://schema.org", "@graph": graph}
    kinds = sorted({g["@type"] for g in graph})
    if current_data(src) == data:
        # Mesmo conteudo, talvez com outra formatacao (ex.: /sistema-para-otica,
        # escrito a mao): nao reescreve so para reformatar.
        print(f"  {fname:52s} {', '.join(kinds)} (igual)")
        return False
    payload = json.dumps(data, ensure_ascii=False, indent=1)
    # </script> dentro de texto quebraria o bloco; escapa por seguranca
    payload = payload.replace("</", "<\\/")
    block = f'{START}\n<script type="application/ld+json">\n{payload}\n</script>\n{END}'
    if START in src and END in src:
        new = re.sub(re.escape(START) + r".*?" + re.escape(END), lambda _: block, src, flags=re.S)
    else:
        if "</head>" not in src:
            print(f"  ! {fname}: sem </head>, pulando")
            return False
        new = src.replace("</head>", block + "\n</head>", 1)
    if new == src:
        return False
    if not check:
        open(path, "w", encoding="utf-8", newline="\n").write(new)
    print(f"  {fname:52s} {', '.join(kinds)}{f' (FAQ x{nfaq})' if nfaq else ''} -> {'MUDARIA' if check else 'atualizado'}")
    return True


def main():
    # sem argumentos: todas as paginas; com argumentos: so esses arquivos
    # (ex.: python scripts/inject-jsonld.py index.html planos.html)
    # --check: nao grava nada; sai com 1 se alguma pagina mudaria.
    args = sys.argv[1:]
    check = "--check" in args
    args = [a for a in args if a != "--check"]
    if args:
        files = [os.path.basename(a) for a in args]
    else:
        files = sorted(os.path.basename(p) for p in glob.glob(os.path.join(ROOT, "*.html")))
        files = [f for f in files if f not in SKIP and not f.startswith(SKIP_PREFIX)]
    print(f"{'Conferindo' if check else 'Injetando'} JSON-LD em {len(files)} paginas:")
    changed = [f for f in files if inject(f, check)]
    if check and changed:
        print(f"\n{len(changed)} pagina(s) mudariam: a fonte do script ficou para tras do HTML.")
        sys.exit(1)
    print(f"\n{len(changed)} pagina(s) {'mudariam' if check else 'atualizadas'}.")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
