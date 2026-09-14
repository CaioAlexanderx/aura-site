#!/usr/bin/env python3
"""
Injeta JSON-LD (schema.org) em todas as paginas publicas do site.

Uso (na raiz do repo):
    python scripts/inject-jsonld.py

Idempotente: o bloco fica entre <!-- jsonld:start --> e <!-- jsonld:end -->
no <head>; rodar de novo substitui. Rode sempre que criar/alterar uma pagina
(principalmente FAQ e <title>/<meta description>), depois commite o HTML.

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
SKIP_PREFIX = ("Casamento",)

# ---- Precos (fonte da verdade: js/plans-data.js + planos.html) ----
PLANS = [
    ("Essencial", 89.00, 74.17, "PDV, NFC-e (ate 50/mes), estoque com variantes, financeiro basico, 1 usuario."),
    ("Negócio", 169.00, 140.83, "Operacao completa: notas ilimitadas, crediario com cobranca no WhatsApp, CRM, folha, loja online, ate 3 usuarios. Studio ou Dojo incluidos."),
    ("Expansão", 269.00, 224.17, "Multi-CNPJ, usuarios ilimitados, BI, API, multi-gateway, Customer Success dedicado. Studio ou Dojo incluidos."),
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
    "Multi-CNPJ consolidado, API e multi-gateway (plano Expansao)",
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
        "description": "Sistema de gestao em nuvem para lojas: PDV com NFC-e, estoque com grade, troca no caixa, financeiro e crediario com cobranca no WhatsApp. Preco fixo, em portugues.",
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
    for name, monthly, annual, desc in PLANS:
        offers.append({
            "@type": "Offer",
            "name": f"Plano {name} (mensal)",
            "price": f"{monthly:.2f}",
            "priceCurrency": "BRL",
            "url": SITE + "/planos",
            "availability": "https://schema.org/InStock",
            "description": desc,
            "priceSpecification": {
                "@type": "UnitPriceSpecification",
                "price": f"{monthly:.2f}",
                "priceCurrency": "BRL",
                "billingIncrement": 1,
                "unitCode": "MON",
            },
        })
        offers.append({
            "@type": "Offer",
            "name": f"Plano {name} (anual, 2 meses gratis)",
            "price": f"{annual:.2f}",
            "priceCurrency": "BRL",
            "url": SITE + "/planos",
            "availability": "https://schema.org/InStock",
            "description": f"Equivalente mensal no plano anual. {desc}",
            "priceSpecification": {
                "@type": "UnitPriceSpecification",
                "price": f"{annual:.2f}",
                "priceCurrency": "BRL",
                "billingIncrement": 12,
                "unitCode": "MON",
            },
        })
    return {
        "@type": "SoftwareApplication",
        "@id": APP_ID,
        "name": "Aura",
        "alternateName": ["Aura Negócio", "Aura Studio", "Aura Dojô"],
        "url": SITE + "/",
        "applicationCategory": "BusinessApplication",
        "applicationSubCategory": "PDV, ERP e gestao para varejo",
        "operatingSystem": "Web, Android, iOS",
        "inLanguage": "pt-BR",
        "description": "Sistema de gestao para loja: PDV com NFC-e, estoque com grade, troca no caixa, financeiro com DRE e crediario (fiado) com cobranca automatica no WhatsApp. Preco fixo por plano, teste gratis de 7 dias sem cartao.",
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
        "primaryImageOfPage": {"@type": "ImageObject", "url": SITE + "/og-image.png"},
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


def inject(fname):
    path = os.path.join(ROOT, fname)
    src = open(path, encoding="utf-8").read()
    graph, nfaq = build_graph(fname, src)
    payload = json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False, indent=1)
    # </script> dentro de texto quebraria o bloco; escapa por seguranca
    payload = payload.replace("</", "<\\/")
    block = f'{START}\n<script type="application/ld+json">\n{payload}\n</script>\n{END}'
    if START in src and END in src:
        new = re.sub(re.escape(START) + r".*?" + re.escape(END), lambda _: block, src, flags=re.S)
    else:
        if "</head>" not in src:
            print(f"  ! {fname}: sem </head>, pulando")
            return
        new = src.replace("</head>", block + "\n</head>", 1)
    if new != src:
        open(path, "w", encoding="utf-8", newline="\n").write(new)
    kinds = sorted({g["@type"] for g in graph})
    print(f"  {fname:52s} {', '.join(kinds)}{f' (FAQ x{nfaq})' if nfaq else ''}")


def main():
    files = sorted(os.path.basename(p) for p in glob.glob(os.path.join(ROOT, "*.html")))
    files = [f for f in files if f not in SKIP and not f.startswith(SKIP_PREFIX)]
    print(f"Injetando JSON-LD em {len(files)} paginas:")
    for f in files:
        inject(f)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
