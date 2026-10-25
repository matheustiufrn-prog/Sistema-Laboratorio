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
  expensesByCategory: { category: string; amount: number }[]
  year: { year: number; rows: (Sum & { key: string; name: string })[]; totals: Sum }
}

const brl = (v: number) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Fortaleza' })
const fmtDateTime = (iso: string) => new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Fortaleza' })

const th = 'p-2 text-xs font-bold uppercase tracking-wide'

export default function RelatoriosPage() {
  const [month, setMonth] = useState('')
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async (m: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/reports/monthly${m ? `?month=${m}` : ''}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Não foi possível gerar o relatório.')
        return
      }
      setReport(data)
      setMonth(data.month)
    } catch {
      setError('Erro de conexão ao gerar o relatório.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load('')
  }, [])

  const s = report?.summary

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-8 font-sans print:max-w-none print:space-y-4 print:p-0">
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          tr { break-inside: avoid; }
          thead { display: table-header-group; }
        }
      `}</style>

      <div className="flex flex-wrap items-end justify-between gap-4 print:hidden">
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-600">Mês do relatório</label>
          <input
            type="month"
            value={month}
            onChange={(e) => e.target.value && load(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-black outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100"
          />
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          disabled={!report}
          className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-green-700 disabled:opacity-50"
        >
          🖨️ Imprimir / Salvar PDF
        </button>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      {loading && !report && <p className="text-sm text-neutral-500">Gerando relatório...</p>}

      {report && s && (
        <div className={`space-y-6 print:space-y-4 ${loading ? 'opacity-60' : ''}`}>
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
                  <td className="p-2 text-right text-green-700">{brl(report.year.totals.revenueTotal)}</td>
                  <td className="p-2 text-right text-red-600">{brl(report.year.totals.expensesTotal)}</td>
                  <td className="p-2 text-right text-green-800">{brl(report.year.totals.result)}</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-3 text-[11px] text-neutral-500">
              Considera apenas OS concluídas, agrupadas pela data de criação (horário de Brasília). Despesas incluem
              reembolsos do Home Care.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}