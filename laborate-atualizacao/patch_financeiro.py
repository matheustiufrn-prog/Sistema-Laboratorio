#!/usr/bin/env python3
"""Ajusta src/app/admin/page.tsx (tela Financeiro).

- importa HeroCard e Sparkline
- troca o componente Kpi por uma versão com gráfico pequeno e efeito de elevação
- passa o gráfico pequeno aos 4 indicadores principais
- insere o cartão de destaque (HeroCard) acima dos indicadores

Pode rodar mais de uma vez: o que já foi aplicado é ignorado.
Só grava o arquivo se todas as etapas passarem.
"""
import re
import sys

if len(sys.argv) != 2:
    print('uso: patch_financeiro.py caminho/para/page.tsx')
    sys.exit(2)

path = sys.argv[1]
src = open(path, encoding='utf-8').read()
original = src
results = []
failed = False


def ok(msg):
    results.append('  OK        ' + msg)


def skipped(msg):
    results.append('  JA FEITO  ' + msg)


def fail(msg):
    global failed
    failed = True
    results.append('  FALHOU    ' + msg)


NEW_KPI = '''function Kpi({
  label,
  value,
  color,
  footer,
  spark,
}: {
  label: string
  value: string
  color: string
  footer: React.ReactNode
  spark?: number[]
}) {
  return (
    <div className="lift rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold ${color}`}>{value}</p>
      {spark && spark.length > 1 && (
        <div className={`mt-2 ${color}`}>
          <Sparkline values={spark} />
        </div>
      )}
      <div className="mt-2">{footer}</div>
    </div>
  )
}
'''

# 1. imports -----------------------------------------------------------------
if '@/components/HeroCard' in src:
    skipped('imports')
else:
    anchor = "import MonthlyReport from '@/components/MonthlyReport'\n"
    if src.count(anchor) == 1:
        src = src.replace(
            anchor,
            anchor
            + "import HeroCard from '@/components/HeroCard'\n"
            + "import Sparkline from '@/components/Sparkline'\n",
            1,
        )
        ok('imports de HeroCard e Sparkline')
    else:
        fail('nao achei a linha de import do MonthlyReport')

# 2. componente Kpi ---------------------------------------------------------
if 'spark?: number[]' in src:
    skipped('componente Kpi')
else:
    m = re.search(r'function Kpi\(\{.*?\n\}\n', src, re.S)
    if m:
        src = src[: m.start()] + NEW_KPI + src[m.end():]
        ok('componente Kpi com grafico pequeno')
    else:
        fail('nao achei a funcao Kpi')

# 3. grafico pequeno nos indicadores ------------------------------------------
sparks = [
    ('label="Faturamento do mês"', 'revenueTotal'),
    ('label="Despesas do mês"', 'expensesTotal'),
    ('label="Resultado líquido"', 'result'),
    ('label="Atendimentos (OS)"', 'services'),
]
for label, field in sparks:
    prop = 'spark={series.slice(-6).map((s) => s.row.%s)}' % field
    if prop in src:
        skipped('grafico em ' + label)
    elif src.count(label) == 1:
        src = src.replace(label, label + '\n              ' + prop, 1)
        ok('grafico em ' + label)
    else:
        fail('nao achei exatamente um ' + label)

# 4. cartao de destaque ---------------------------------------------------------
if '<HeroCard' in src:
    skipped('cartao de destaque')
else:
    grid = '<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">'
    m = re.search(r'^([ \t]*)' + re.escape(grid), src, re.M)
    if m and src.count(grid) == 1:
        ind = m.group(1)
        hero = (
            ind + '<HeroCard\n'
            + ind + '  monthLabel={monthLabel(month)}\n'
            + ind + '  revenue={cur.revenueTotal}\n'
            + ind + '  previousRevenue={prev.revenueTotal}\n'
            + ind + '  result={cur.result}\n'
            + ind + '  services={cur.services}\n'
            + ind + '  loading={loading}\n'
            + ind + '/>\n\n'
        )
        src = src[: m.start()] + hero + src[m.start():]
        ok('cartao de destaque acima dos indicadores')
    else:
        fail('nao achei a grade de indicadores')

print('Ajuste da tela Financeiro:')
print('\n'.join(results))

if failed:
    print('\nNada foi gravado. Me envie esta saida que eu ajusto.')
    sys.exit(1)

if src != original:
    open(path, 'w', encoding='utf-8').write(src)
    print('\nArquivo atualizado.')
else:
    print('\nNada a fazer (tudo ja estava aplicado).')
