#!/usr/bin/env python3
"""
Mede se a Aura aparece quando alguem pergunta a uma IA "qual sistema para loja".

Roda as 10 perguntas de docs/geo-monitor-prompts.md no Claude com busca web
ligada (o mesmo caminho que um usuario do claude.ai usa) e registra, por
pergunta: se getaura.com.br apareceu no texto ou nas citacoes, quais URLs do
site foram citadas e quais concorrentes foram mencionados.

Uso (na raiz do repo):
    pip install anthropic
    python scripts/geo-monitor.py                       # Claude Sonnet 5, todas as perguntas
    python scripts/geo-monitor.py --model claude-opus-5 # outro modelo
    python scripts/geo-monitor.py --only 3 7            # so as perguntas 3 e 7
    python scripts/geo-monitor.py --dry-run             # lista as perguntas e sai

Credenciais: ANTHROPIC_API_KEY no ambiente, ou `ant auth login`.
Custo: ~10 chamadas com busca por rodada; alguns centavos de dolar em Sonnet.

Saida: linha por pergunta em docs/geo-monitor-log.csv (append) + resumo no
terminal. Rode toda semana, no mesmo dia, e compare a coluna "aura".
Pra ChatGPT, Gemini e Perplexity a rodada e manual: use as mesmas perguntas
do .md e anote no CSV com --manual (ver docs/geo-monitor-prompts.md).
"""
import argparse
import csv
import datetime as dt
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOG = os.path.join(ROOT, "docs", "geo-monitor-log.csv")
PROMPTS_MD = os.path.join(ROOT, "docs", "geo-monitor-prompts.md")

COMPETITORS = ["bling", "tiny", "nex", "nextar", "kyte", "conta azul", "omie", "linx", "totvs", "vhsys", "gestaoclick", "eGestor", "mercado pago", "stone", "infinitepay", "ton"]

SYSTEM = (
    "Voce e um assistente respondendo a um lojista brasileiro. Responda em portugues, "
    "de forma objetiva, e cite as fontes que usou. Recomende opcoes concretas quando fizer sentido."
)


def load_prompts():
    """Le as perguntas numeradas ("1. ...") de docs/geo-monitor-prompts.md."""
    text = open(PROMPTS_MD, encoding="utf-8").read()
    # so a secao "## As 10 perguntas" (ate o proximo "## ")
    m = re.search(r"^## As 10 perguntas\s*$(.*?)(?=^## )", text, re.M | re.S)
    section = m.group(1) if m else text
    prompts = re.findall(r"^\s*(\d+)\.\s+(.+?)\s*$", section, re.M)
    return [(int(n), p) for n, p in prompts]


def run_claude(model, question):
    import anthropic  # importado aqui pra --dry-run funcionar sem o SDK

    client = anthropic.Anthropic()
    tools = [{
        "type": "web_search_20260209",
        "name": "web_search",
        "max_uses": 5,
        "user_location": {"type": "approximate", "country": "BR", "city": "São Paulo", "region": "São Paulo", "timezone": "America/Sao_Paulo"},
    }]
    messages = [{"role": "user", "content": question}]
    text_parts, cited, searched = [], set(), set()
    for _ in range(4):  # pause_turn: continua a mesma rodada ate encerrar
        resp = client.messages.create(
            model=model, max_tokens=4000, system=SYSTEM, tools=tools, messages=messages,
        )
        for block in resp.content:
            btype = getattr(block, "type", "")
            if btype == "text":
                text_parts.append(block.text)
                for c in (getattr(block, "citations", None) or []):
                    url = getattr(c, "url", None)
                    if url:
                        cited.add(url)
            elif btype == "web_search_tool_result":
                content = getattr(block, "content", None)
                if isinstance(content, list):  # erro vem como objeto, sucesso como lista
                    for r in content:
                        url = getattr(r, "url", None)
                        if url:
                            searched.add(url)
        if resp.stop_reason == "pause_turn":
            messages.append({"role": "assistant", "content": resp.content})
            continue
        break
    return "\n".join(text_parts), cited, searched


def analyze(text, cited, searched):
    low = text.lower()
    aura_urls = sorted(u for u in cited | searched if "getaura.com.br" in u)
    aura_in_text = bool(re.search(r"\baura\b", low)) and ("getaura" in low or "sistema" in low)
    aura_cited = any("getaura.com.br" in u for u in cited)
    comps = sorted({c for c in COMPETITORS if re.search(r"\b" + re.escape(c.lower()) + r"\b", low)})
    if aura_cited:
        status = "citada"
    elif aura_in_text:
        status = "mencionada"
    elif aura_urls:
        status = "so_na_busca"
    else:
        status = "ausente"
    return status, aura_urls, comps


def append_log(rows):
    os.makedirs(os.path.dirname(LOG), exist_ok=True)
    new = not os.path.exists(LOG)
    with open(LOG, "a", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        if new:
            w.writerow(["data", "modelo", "n", "pergunta", "aura", "urls_aura", "concorrentes", "trecho"])
        w.writerows(rows)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="claude-sonnet-5", help="claude-sonnet-5 (padrao) ou claude-opus-5")
    ap.add_argument("--only", nargs="*", type=int, help="numeros das perguntas a rodar")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--manual", nargs=3, metavar=("MODELO", "N", "STATUS"),
                    help="registra uma rodada manual (ex.: --manual chatgpt 3 citada)")
    args = ap.parse_args()

    prompts = load_prompts()
    if args.only:
        prompts = [p for p in prompts if p[0] in set(args.only)]
    today = dt.date.today().isoformat()

    if args.manual:
        modelo, n, status = args.manual
        q = dict(prompts).get(int(n), "")
        append_log([[today, modelo, n, q, status, "", "", ""]])
        print(f"registrado: {modelo} · pergunta {n} · {status}")
        return

    if args.dry_run:
        for n, p in prompts:
            print(f"{n:2d}. {p}")
        return

    rows, summary = [], []
    for n, q in prompts:
        print(f"[{n}/{len(prompts)}] {q[:70]}...", flush=True)
        try:
            text, cited, searched = run_claude(args.model, q)
        except Exception as e:  # rede, auth, rate limit: registra e segue
            print("   erro:", e)
            rows.append([today, args.model, n, q, "erro", "", "", str(e)[:200]])
            continue
        status, aura_urls, comps = analyze(text, cited, searched)
        snippet = re.sub(r"\s+", " ", text)[:240]
        rows.append([today, args.model, n, q, status, " ".join(aura_urls), ", ".join(comps), snippet])
        summary.append((n, status, comps))
        print(f"   aura={status}  concorrentes={', '.join(comps) or '-'}")

    append_log(rows)
    citadas = sum(1 for _, s, _ in summary if s == "citada")
    menc = sum(1 for _, s, _ in summary if s in ("citada", "mencionada"))
    print(f"\n{args.model} · {today}: Aura citada em {citadas}/{len(summary)}, mencionada em {menc}/{len(summary)}. Log: {os.path.relpath(LOG, ROOT)}")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
