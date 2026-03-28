#!/usr/bin/env python3
from pathlib import Path
import re
import sys

def main():
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(".")
    index_path = root / "demo" / "index.html"

    if not index_path.exists():
        raise SystemExit(f"Arquivo não encontrado: {index_path}")

    html = index_path.read_text(encoding="utf-8")

    style_match = re.search(r"<style>\s*(.*?)\s*</style>", html, flags=re.DOTALL | re.IGNORECASE)
    if not style_match:
        raise SystemExit("Bloco <style> não encontrado no index.html")

    script_matches = list(re.finditer(r"<script>\s*(.*?)\s*</script>", html, flags=re.DOTALL | re.IGNORECASE))
    if not script_matches:
        raise SystemExit("Bloco <script> inline não encontrado no index.html")

    # Usa o último script inline, que é onde está o app principal
    app_script_match = script_matches[-1]

    css_content = style_match.group(1).strip() + "\n"
    js_content = app_script_match.group(1).strip() + "\n"

    styles_path = root / "demo" / "styles.css"
    appjs_path = root / "demo" / "app.js"
    backup_path = root / "demo" / "index.inline.backup.html"

    backup_path.write_text(html, encoding="utf-8")
    styles_path.write_text(css_content, encoding="utf-8")
    appjs_path.write_text(js_content, encoding="utf-8")

    updated = html
    updated = (
        updated[:style_match.start()]
        + '<link rel="stylesheet" href="./styles.css">\n'
        + updated[style_match.end():]
    )

    # Recalcula match do último script sobre o HTML original e reaplica no HTML atualizado
    # para evitar substituir scripts externos que possam existir antes.
    script_matches_updated_source = list(re.finditer(r"<script>\s*(.*?)\s*</script>", html, flags=re.DOTALL | re.IGNORECASE))
    last_script = script_matches_updated_source[-1]
    # Localiza o mesmo bloco no HTML atualizado por conteúdo
    inline_script_block = html[last_script.start():last_script.end()]
    updated = updated.replace(inline_script_block, '<script src="./app.js"></script>', 1)

    index_path.write_text(updated, encoding="utf-8")

    print("Separação concluída com sucesso.")
    print(f"- Backup: {backup_path}")
    print(f"- CSS:    {styles_path}")
    print(f"- JS:     {appjs_path}")
    print(f"- HTML:   {index_path}")

if __name__ == "__main__":
    main()
