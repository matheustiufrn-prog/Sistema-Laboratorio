'use client'

import { useEffect, useState } from 'react'

interface Sum {
  services: number
  consultations: number
  labOrders: number
  homeCareOrders: number
  examsRevenue: number
  consultationsRevenue: number
  homeCareExamsRevenue: number
  collectionFees: number
  travelFees: number
  homeCareRevenue: number
  manualRevenue: number
  revenueTotal: number
  operatingExpenses: number
  reimbursementsPending: number
  reimbursementsPaid: number
  reimbursementsTotal: number
  expensesTotal: number
  result: number
  averageTicket: number
}

interface Report {
  month: string
  label: string
  generatedAt: string
  summary: Sum
  orders: {
    id: string
    date: string
    patient: string
    cpf: string
    description: string
    examsTotal: number
    consultationFee: number
    total: number
  }[]
  homeCare: {
    id: string
    date: string
    patient: string
    place: string
    lab: string
    exams: string
    examsTotal: number
    collectionFee: number
    travelFee: number
    reimbursementsPending: number
    reimbursementsPaid: number
    total: number
  }[]
  expenses: { id: string; date: string; description: string; category: string; amount: number }[]
  manualRevenues: { id: string; description: string; amount: number }[]
  expensesByCategory: { category: string; amount: number }[]
  partners: { id: string; name: string; percentage: number; monthAmount: number; yearAmount: number }[]
  year: { year: number; rows: (Sum & { key: string; name: string })[]; totals: Sum }
}

const brl = (v: number) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Fortaleza' })
const fmtDateTime = (iso: string) => new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Fortaleza' })

const th = 'p-2 text-xs font-bold uppercase tracking-wide'

const num = (n: number) => Number(n || 0).toFixed(2).replace('.', ',')
const csvCell = (c: string | number) => `"${String(c).replace(/"/g, '""')}"`

function buildCsv(r: Report) {
  const s = r.summary
  const rows: (string | number)[][] = []

  rows.push(['LABORATE - Relatório financeiro mensal'], [r.label], [])

  rows.push(['RESUMO'])
  rows.push(['Faturamento bruto', num(s.revenueTotal)])
  rows.push(['Despesas totais', num(s.expensesTotal)])
  rows.push(['Resultado líquido', num(s.result)])
  rows.push(['Atendimentos (OS)', s.services], [])

  rows.push(['RECEITA POR ORIGEM'])
  rows.push(['Exames (laboratório)', num(s.examsRevenue)])
  rows.push(['Consultas médicas', num(s.consultationsRevenue)])
  rows.push(['Home Care - exames', num(s.homeCareExamsRevenue)])
  rows.push(['Home Care - taxas de coleta', num(s.collectionFees)])
  rows.push(['Home Care - deslocamento', num(s.travelFees)])
  rows.push(['Receitas lançadas', num(s.manualRevenue)])
  rows.push(['Total', num(s.revenueTotal)], [])

  rows.push(['DESPESAS'])
  for (const c of r.expensesByCategory) rows.push([c.category, num(c.amount)])
  rows.push(['Reembolsos Home Care (pendentes)', num(s.reimbursementsPending)])
  rows.push(['Reembolsos Home Care (pagos)', num(s.reimbursementsPaid)])
  rows.push(['Total', num(s.expensesTotal)], [])

  rows.push(['RATEIO DO RESULTADO'])
  rows.push(['Sócio', 'Porcentagem', `Valor ${r.label}`, `Valor ${r.year.year}`])
  for (const p of r.partners) {
    rows.push([p.name, `${String(p.percentage).replace('.', ',')}%`, num(p.monthAmount), num(p.yearAmount)])
  }
  rows.push([])

  rows.push(['ORDENS DE SERVIÇO CONCLUÍDAS'])
  rows.push(['Data', 'Paciente', 'CPF', 'Itens', 'Exames', 'Consulta', 'Total'])
  for (const o of r.orders) {
    rows.push([fmtDate(o.date), o.patient, o.cpf, o.description, num(o.examsTotal), num(o.consultationFee), num(o.total)])
  }
  rows.push([])

  rows.push(['HOME CARE CONCLUÍDOS'])
  rows.push(['Data', 'Paciente', 'Local', 'Laboratório', 'Exames', 'Valor exames', 'Coleta', 'Deslocamento', 'Reembolsos', 'Total'])
  for (const h of r.homeCare) {
    rows.push([
      fmtDate(h.date), h.patient, h.place, h.lab, h.exams,
      num(h.examsTotal), num(h.collectionFee), num(h.travelFee),
      num(h.reimbursementsPending + h.reimbursementsPaid), num(h.total),
    ])
  }
  rows.push([])

  rows.push(['RECEITAS LANÇADAS'])
  rows.push(['Descrição', 'Valor'])
  for (const m of r.manualRevenues) rows.push([m.description, num(m.amount)])
  rows.push([])

  rows.push(['DESPESAS LANÇADAS'])
  rows.push(['Data', 'Descrição', 'Categoria', 'Valor'])
  for (const e of r.expenses) rows.push([fmtDate(e.date), e.description, e.category, num(e.amount)])
  rows.push([])

  rows.push([`RESUMO MÊS A MÊS - ${r.year.year}`])
  rows.push(['Mês', 'OS', 'Exames', 'Consultas', 'Home Care', 'Lançadas', 'Receita', 'Despesas', 'Resultado'])
  for (const m of r.year.rows) {
    rows.push([
      m.name, m.services, num(m.examsRevenue), num(m.consultationsRevenue), num(m.homeCareRevenue),
      num(m.manualRevenue), num(m.revenueTotal), num(m.expensesTotal), num(m.result),
    ])
  }
  const t = r.year.totals
  rows.push([
    `Total ${r.year.year}`, t.services, num(t.examsRevenue), num(t.consultationsRevenue), num(t.homeCareRevenue),
    num(t.manualRevenue), num(t.revenueTotal), num(t.expensesTotal), num(t.result),
  ])

  return '\uFEFF' + rows.map((row) => row.map(csvCell).join(';')).join('\r\n')
}

export default function MonthlyReport({ month }: { month: string }) {
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`/api/reports/monthly?month=${month}`)
        const data = await res.json().catch(() => ({}))
        if (cancelled) return
        if (!res.ok) {
          setError(data.error || 'Não foi possível gerar o relatório.')
          return
        }
        setReport({
          ...data,
          manualRevenues: data.manualRevenues ?? [],
          partners: data.partners ?? [],
          expensesByCategory: data.expensesByCategory ?? [],
        })
      } catch {
        if (!cancelled) setError('Erro de conexão ao gerar o relatório.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [month])

  const handleExport = () => {
    if (!report) return
    const blob = new Blob([buildCsv(report)], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-financeiro-${report.month}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const s = report?.summary

  return (
    <div className="space-y-4">
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          tr { break-inside: avoid; }
          thead { display: table-header-group; }
        }
      `}</style>

      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-sm text-neutral-600">
          Relatório de <strong>{report?.label || month}</strong>. Troque o mês no topo da página.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={!report}
            className="rounded-lg border border-green-600 bg-white px-5 py-2.5 text-sm font-bold text-green-700 shadow-sm transition hover:bg-green-50 disabled:opacity-50"
          >
            📊 Exportar Excel
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!report}
            className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-green-700 disabled:opacity-50"
          >
            🖨️ Imprimir / Salvar PDF
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      {loading && !report && <p className="text-sm text-neutral-500">Gerando relatório...</p>}

      {report && s && (
        <div className={`space-y-6 rounded-2xl bg-white p-6 print:space-y-4 print:rounded-none print:p-0 ${loading ? 'opacity-60' : ''}`}>
          <div className="flex items-start justify-between border-b-4 border-green-600 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-600 text-2xl font-extrabold text-white">
                L
              </div>
              <div>
                <p className="text-2xl font-extrabold tracking-wide text-neutral-900">LABORATE</p>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-green-700">
                  Gestão Médica e Laboratorial
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                Relatório financeiro mensal
              </p>
              <p className="text-xl font-extrabold text-neutral-900">{report.label}</p>
              <p className="text-xs text-neutral-500">Gerado em {fmtDateTime(report.generatedAt)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: 'Faturamento bruto', value: brl(s.revenueTotal), color: 'text-green-700' },
              { label: 'Despesas totais', value: brl(s.expensesTotal), color: 'text-red-600' },
              {
                label: 'Resultado líquido',
                value: brl(s.result),
                color: s.result >= 0 ? 'text-green-800' : 'text-red-700',
              },
              { label: 'Atendimentos (OS)', value: String(s.services), color: 'text-neutral-800' },
            ].map((c) => (
              <div key={c.label} className="rounded-xl border border-neutral-200 bg-white p-4">
                <p className="text-[11px] font-bold uppercase text-neutral-500">{c.label}</p>
                <p className={`mt-1 text-xl font-extrabold ${c.color}`}>{c.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <h3 className="mb-2 text-sm font-bold text-neutral-800">Receita por origem</h3>
              <table className="w-full text-sm">
                <tbody>
                  {[
                    ['Exames (laboratório)', s.examsRevenue, `${s.labOrders} OS`],
                    ['Consultas médicas', s.consultationsRevenue, `${s.consultations} consulta(s)`],
                    ['Home Care – exames', s.homeCareExamsRevenue, `${s.homeCareOrders} OS`],
                    ['Home Care – taxas de coleta', s.collectionFees, ''],
                    ['Home Care – deslocamento', s.travelFees, ''],
                    ['Receitas lançadas', s.manualRevenue, `${report.manualRevenues.length} lançamento(s)`],
                  ].map(([name, value, note]) => (
                    <tr key={String(name)} className="border-b">
                      <td className="p-2 text-neutral-800">{name}</td>
                      <td className="p-2 text-xs text-neutral-500">{note}</td>
                      <td className="p-2 text-right font-semibold text-green-700">{brl(Number(value))}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="p-2 font-bold text-neutral-900" colSpan={2}>
                      Total
                    </td>
                    <td className="p-2 text-right font-extrabold text-green-700">{brl(s.revenueTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <h3 className="mb-2 text-sm font-bold text-neutral-800">Despesas</h3>
              <table className="w-full text-sm">
                <tbody>
                  {report.expensesByCategory.map((c) => (
                    <tr key={c.category} className="border-b">
                      <td className="p-2 text-neutral-800">{c.category}</td>
                      <td className="p-2 text-right font-semibold text-red-600">{brl(c.amount)}</td>
                    </tr>
                  ))}
                  <tr className="border-b">
                    <td className="p-2 text-neutral-800">Reembolsos Home Care (pendentes)</td>
                    <td className="p-2 text-right font-semibold text-red-600">{brl(s.reimbursementsPending)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 text-neutral-800">Reembolsos Home Care (pagos)</td>
                    <td className="p-2 text-right font-semibold text-red-600">{brl(s.reimbursementsPaid)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-neutral-900">Total</td>
                    <td className="p-2 text-right font-extrabold text-red-600">{brl(s.expensesTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4 print:break-inside-avoid">
            <h3 className="mb-2 text-sm font-bold text-neutral-800">Rateio do resultado entre sócios</h3>
            {report.partners.length === 0 ? (
              <p className="text-xs text-neutral-400">Nenhum sócio cadastrado. Cadastre na aba Rateio.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-green-50 text-green-900">
                    <th className={th}>Sócio</th>
                    <th className={`${th} text-right`}>%</th>
                    <th className={`${th} text-right`}>{report.label}</th>
                    <th className={`${th} text-right`}>Acumulado {report.year.year}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.partners.map((p) => (
                    <tr key={p.id} className="border-b">
                      <td className="p-2 font-semibold text-black">{p.name}</td>
                      <td className="p-2 text-right">{p.percentage}%</td>
                      <td className={`p-2 text-right font-bold ${p.monthAmount >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {brl(p.monthAmount)}
                      </td>
                      <td className={`p-2 text-right font-bold ${p.yearAmount >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {brl(p.yearAmount)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-neutral-100 font-extrabold">
                    <td className="p-2 text-black">Resultado líquido</td>
                    <td className="p-2" />
                    <td className="p-2 text-right">{brl(s.result)}</td>
                    <td className="p-2 text-right">{brl(report.year.totals.result)}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <h3 className="mb-2 text-sm font-bold text-neutral-800">Ordens de serviço concluídas no mês</h3>
            {report.orders.length === 0 ? (
              <p className="text-xs text-neutral-400">Nenhuma OS concluída neste mês.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-green-50 text-green-900">
                    <th className={th}>Data</th>
                    <th className={th}>Paciente</th>
                    <th className={th}>Itens</th>
                    <th className={`${th} text-right`}>Exames</th>
                    <th className={`${th} text-right`}>Consulta</th>
                    <th className={`${th} text-right`}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.orders.map((o) => (
                    <tr key={o.id} className="border-b">
                      <td className="p-2 text-neutral-600">{fmtDate(o.date)}</td>
                      <td className="p-2 font-semibold text-black">{o.patient}</td>
                      <td className="p-2 text-xs text-neutral-600">{o.description}</td>
                      <td className="p-2 text-right">{brl(o.examsTotal)}</td>
                      <td className="p-2 text-right">{brl(o.consultationFee)}</td>
                      <td className="p-2 text-right font-bold text-green-700">{brl(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <h3 className="mb-2 text-sm font-bold text-neutral-800">Home Care concluídos no mês</h3>
            {report.homeCare.length === 0 ? (
              <p className="text-xs text-neutral-400">Nenhuma OS de Home Care concluída neste mês.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-green-50 text-green-900">
                    <th className={th}>Data</th>
                    <th className={th}>Paciente</th>
                    <th className={th}>Local</th>
                    <th className={th}>Laboratório</th>
                    <th className={th}>Exames</th>
                    <th className={`${th} text-right`}>Coleta</th>
                    <th className={`${th} text-right`}>Desloc.</th>
                    <th className={`${th} text-right`}>Reemb.</th>
                    <th className={`${th} text-right`}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.homeCare.map((h) => (
                    <tr key={h.id} className="border-b">
                      <td className="p-2 text-neutral-600">{fmtDate(h.date)}</td>
                      <td className="p-2 font-semibold text-black">{h.patient}</td>
                      <td className="p-2 text-xs text-neutral-600">{h.place}</td>
                      <td className="p-2 text-xs text-neutral-600">{h.lab}</td>
                      <td className="p-2 text-xs text-neutral-600">
                        {h.exams} ({brl(h.examsTotal)})
                      </td>
                      <td className="p-2 text-right">{brl(h.collectionFee)}</td>
                      <td className="p-2 text-right">{brl(h.travelFee)}</td>
                      <td className="p-2 text-right text-red-600">
                        {brl(h.reimbursementsPending + h.reimbursementsPaid)}
                      </td>
                      <td className="p-2 text-right font-bold text-green-700">{brl(h.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <h3 className="mb-2 text-sm font-bold text-neutral-800">Receitas lançadas no mês</h3>
            {report.manualRevenues.length === 0 ? (
              <p className="text-xs text-neutral-400">Nenhuma receita lançada neste mês.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-green-50 text-green-900">
                    <th className={th}>Descrição</th>
                    <th className={`${th} text-right`}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {report.manualRevenues.map((m) => (
                    <tr key={m.id} className="border-b">
                      <td className="p-2 font-semibold text-black">{m.description}</td>
                      <td className="p-2 text-right font-bold text-green-700">{brl(m.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <h3 className="mb-2 text-sm font-bold text-neutral-800">Despesas lançadas no mês</h3>
            {report.expenses.length === 0 ? (
              <p className="text-xs text-neutral-400">Nenhuma despesa lançada neste mês.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-green-50 text-green-900">
                    <th className={th}>Data</th>
                    <th className={th}>Descrição</th>
                    <th className={th}>Categoria</th>
                    <th className={`${th} text-right`}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {report.expenses.map((e) => (
                    <tr key={e.id} className="border-b">
                      <td className="p-2 text-neutral-600">{fmtDate(e.date)}</td>
                      <td className="p-2 font-semibold text-black">{e.description}</td>
                      <td className="p-2 text-neutral-600">{e.category}</td>
                      <td className="p-2 text-right font-bold text-red-600">{brl(e.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4 print:break-before-page">
            <h3 className="mb-2 text-sm font-bold text-neutral-800">Resumo mês a mês — {report.year.year}</h3>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-green-50 text-green-900">
                  <th className={th}>Mês</th>
                  <th className={`${th} text-right`}>OS</th>
                  <th className={`${th} text-right`}>Exames</th>
                  <th className={`${th} text-right`}>Consultas</th>
                  <th className={`${th} text-right`}>Home Care</th>
                  <th className={`${th} text-right`}>Lançadas</th>
                  <th className={`${th} text-right`}>Receita</th>
                  <th className={`${th} text-right`}>Despesas</th>
                  <th className={`${th} text-right`}>Resultado</th>
                </tr>
              </thead>
              <tbody>
                {report.year.rows.map((r) => (
                  <tr
                    key={r.key}
                    className={`border-b ${r.key === report.month ? 'bg-green-50 font-semibold' : ''}`}
                  >
                    <td className="p-2 text-black">{r.name}</td>
                    <td className="p-2 text-right">{r.services}</td>
                    <td className="p-2 text-right">{brl(r.examsRevenue)}</td>
                    <td className="p-2 text-right">{brl(r.consultationsRevenue)}</td>
                    <td className="p-2 text-right">{brl(r.homeCareRevenue)}</td>
                    <td className="p-2 text-right">{brl(r.manualRevenue)}</td>
                    <td className="p-2 text-right text-green-700">{brl(r.revenueTotal)}</td>
                    <td className="p-2 text-right text-red-600">{brl(r.expensesTotal)}</td>
                    <td className={`p-2 text-right font-bold ${r.result >= 0 ? 'text-green-800' : 'text-red-700'}`}>
                      {brl(r.result)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-neutral-100 font-extrabold">
                  <td className="p-2 text-black">Total {report.year.year}</td>
                  <td className="p-2 text-right">{report.year.totals.services}</td>
                  <td className="p-2 text-right">{brl(report.year.totals.examsRevenue)}</td>
                  <td className="p-2 text-right">{brl(report.year.totals.consultationsRevenue)}</td>
                  <td className="p-2 text-right">{brl(report.year.totals.homeCareRevenue)}</td>
                  <td className="p-2 text-right">{brl(report.year.totals.manualRevenue)}</td>
                  <td className="p-2 text-right text-green-700">{brl(report.year.totals.revenueTotal)}</td>
                  <td className="p-2 text-right text-red-600">{brl(report.year.totals.expensesTotal)}</td>
                  <td className="p-2 text-right text-green-800">{brl(report.year.totals.result)}</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-3 text-[11px] text-neutral-500">
              Considera apenas OS concluídas, agrupadas pela data do atendimento (horário de Brasília), mais as receitas
              lançadas no mês de referência. Despesas incluem reembolsos do Home Care. O rateio divide o resultado
              líquido conforme a porcentagem de cada sócio.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
