#!/usr/bin/env bash
# Aplica a atualização no projeto. Rode dentro da pasta do projeto:
#   bash /caminho/para/apply.sh
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="${1:-$PWD}"

if [ ! -f "$ROOT/package.json" ] || [ ! -d "$ROOT/src/app" ]; then
  echo "ERRO: rode este comando dentro da pasta do projeto (onde fica o package.json)."
  exit 1
fi
cd "$ROOT" || exit 1

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP=".backup-$STAMP"

echo "== 1. Copiando arquivos (cópia de segurança em $BACKUP)"
for f in \
  src/app/admin/liberacao/page.tsx \
  src/app/admin/layout.tsx \
  src/components/HeroCard.tsx \
  src/components/Sparkline.tsx; do
  if [ -f "$f" ]; then
    mkdir -p "$BACKUP/$(dirname "$f")"
    cp "$f" "$BACKUP/$f"
  fi
  mkdir -p "$(dirname "$f")"
  cp "$HERE/files/$f" "$f"
  echo "   ok  $f ($(wc -l < "$f") linhas)"
done

echo "== 2. Estilos (globals.css)"
CSS=src/app/globals.css
if [ ! -f "$CSS" ]; then
  echo "   ERRO: $CSS não encontrado"
else
  if ! grep -q "Tema glass" "$CSS"; then
    cat "$HERE/glass-base.css" >> "$CSS"
    echo "   base do tema glass adicionada"
  else
    echo "   base do tema glass já existia"
  fi
  if ! grep -q "Temas V24" "$CSS"; then
    cat "$HERE/theme-v24.css" >> "$CSS"
    echo "   temas coral e escuro adicionados"
  else
    echo "   temas coral e escuro já existiam"
  fi
fi

echo "== 3. Tela Financeiro"
if [ -f src/app/admin/page.tsx ]; then
  mkdir -p "$BACKUP/src/app/admin"
  cp src/app/admin/page.tsx "$BACKUP/src/app/admin/page.tsx"
  python3 "$HERE/patch_financeiro.py" src/app/admin/page.tsx || echo "   (o ajuste do Financeiro falhou; o restante foi aplicado)"
else
  echo "   src/app/admin/page.tsx não encontrado"
fi

if [ -f .gitignore ] && ! grep -q "^\.backup-" .gitignore; then
  echo ".backup-*" >> .gitignore
fi

echo "== 4. Conferindo se algum arquivo ficou corrompido pela colagem"
BAD="$( (grep -rlE "^cat (>|>>) .*<< '" src 2>/dev/null; grep -rlE "^[A-Z0-9_]+_EOF$" src 2>/dev/null) | sort -u )"
if [ -n "$BAD" ]; then
  echo "   ATENÇÃO: estes arquivos têm restos de comando de colagem dentro e precisam ser regravados:"
  echo "$BAD" | sed 's/^/     - /'
else
  echo "   ok  nenhum arquivo com restos de colagem"
fi

check_min() {
  local f="$1" min="$2"
  if [ -f "$f" ]; then
    local n
    n="$(wc -l < "$f")"
    if [ "$n" -lt "$min" ]; then
      echo "   ATENÇÃO: $f tem só $n linhas (esperado ao menos $min). Pode estar incompleto."
    else
      echo "   ok  $f ($n linhas)"
    fi
  else
    echo "   FALTA: $f"
  fi
}
check_min src/lib/labCatalog.ts 250
check_min src/lib/labPdf.ts 300
check_min src/lib/pdfResponse.ts 10
check_min src/app/api/lab-reports/route.ts 150
check_min 'src/app/api/lab-reports/[id]/route.ts' 45

echo "== 5. Verificação de tipos (pode levar um minuto)"
if npx tsc --noEmit; then
  echo "   ok  nenhum erro de tipo"
else
  echo "   HÁ ERROS acima. Me envie a saída."
fi

echo ""
echo "Pronto. Agora reinicie o sistema:"
echo "   rm -rf .next && npm run dev"
