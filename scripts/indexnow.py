#!/usr/bin/env python3
"""
Avisa os buscadores (via IndexNow) que paginas do site mudaram.

IndexNow e um protocolo aberto aceito por Bing, Yandex, Seznam, Naver e Yep.
O indice do Bing alimenta ChatGPT (busca), Copilot e parte do Perplexity, entao
avisar o Bing na hora encurta o tempo ate a IA "ver" a pagina nova.
O Google nao usa IndexNow (usa o sitemap.xml + Search Console).

Uso (na raiz do repo, DEPOIS do `wrangler deploy`):
    python scripts/indexnow.py                 # envia todas as URLs do sitemap.xml
    python scripts/indexnow.py /planos /llms.txt   # envia so essas URLs

A chave fica no arquivo <chave>.txt na raiz do site (servido em
https://www.getaura.com.br/<chave>.txt). O script encontra o arquivo sozinho.
Nao rode antes do deploy: o Bing valida a chave buscando esse arquivo em prod.
"""
import json
import os
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HOST = "www.getaura.com.br"
ENDPOINT = "https://api.indexnow.org/indexnow"


def find_key():
    for f in os.listdir(ROOT):
        if re.fullmatch(r"[0-9a-f]{32}\.txt", f):
            key = open(os.path.join(ROOT, f), encoding="utf-8").read().strip()
            if key == f[:-4]:
                return key
    sys.exit("Chave IndexNow nao encontrada: esperado um arquivo <32 hex>.txt na raiz com o proprio nome como conteudo.")


def sitemap_urls():
    tree = ET.parse(os.path.join(ROOT, "sitemap.xml"))
    ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    return [loc.text.strip() for loc in tree.findall(".//s:loc", ns)]


def main():
    key = find_key()
    args = sys.argv[1:]
    if args:
        urls = [a if a.startswith("http") else f"https://{HOST}{a if a.startswith('/') else '/' + a}" for a in args]
    else:
        urls = sitemap_urls() + [f"https://{HOST}/llms.txt"]
    # confere que a chave esta publicada antes de gastar a chamada
    key_url = f"https://{HOST}/{key}.txt"
    try:
        with urllib.request.urlopen(key_url, timeout=20) as r:
            if r.read().decode().strip() != key:
                sys.exit(f"{key_url} nao devolve a chave. Fez o deploy?")
    except Exception as e:
        sys.exit(f"Nao consegui ler {key_url}: {e}. Fez o deploy?")

    body = json.dumps({"host": HOST, "key": key, "keyLocation": key_url, "urlList": urls}).encode()
    req = urllib.request.Request(ENDPOINT, data=body, headers={"Content-Type": "application/json; charset=utf-8"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            print(f"IndexNow: HTTP {r.status} para {len(urls)} URLs")
    except urllib.error.HTTPError as e:
        print(f"IndexNow: HTTP {e.code} {e.reason}: {e.read().decode(errors='replace')[:300]}")
        sys.exit(1)
    for u in urls:
        print("  ", u)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
