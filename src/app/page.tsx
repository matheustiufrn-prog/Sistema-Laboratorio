'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import HomeCareFinance from '@/components/HomeCareFinance'

interface Summary {
  services: number
  consultations: number
  examsRevenue: number
  consultationsRevenue: number
  homeCareRevenue: number
  manualRevenue: number
  revenueTotal: number
  expensesTotal: number
  result: number
  averageTicket: number
  labOrders: number
  homeCareOrders: number
}

interface MonthlyRow {
  key: string
  label: string
  services: number
  examsRevenue: number
  consultationsRevenue: number
  homeCareRevenue: number
  manualRevenue: number
  expensesTotal: number
  result: number
}

interface RecentItem {
  id: string
  kind: 'LAB' | 'HOMECARE'
  date: string
  patient: string
  description: string
  total: number
}

interface Expense {
  id: string
  description: string
  amount: number
  category: string
  date: string
}

interface Revenue {
  id: string
  description: string
  amount: number
  month: string
  label: string
}

interface Partner {
  id: string
  name: string
  percentage: number
}

const brl = (v: number) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Fortaleza',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const toInputDate = (iso: string) => dateFormatter.format(new Date(iso))

async function request(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, data }
}

function DateEditor({
  value,
  type = 'date',
  onSave,
}: {
  value: string
  type?: 'date' | 'month'
  onSave: (v: string) => Promise<void>
}) {
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setDraft(value)
  }, [value])

  const changed = draft !== '' && draft !== value

  return (
    <div className="flex items-center gap-1">
      <input
        type={type}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="rounded border border-neutral-300 bg-white px-2 py-1 text-xs text-black"
      />
      {changed && (
        <button
          type="button"
          disabled={saving}
          onClick={async () => {
            setSaving(true)
            await onSave(draft)
            setSaving(false)
          }}
          className="rounded bg-green-600 px-2 py-1 text-xs font-bold text-white transition hover:bg-green-700 disabled:opacity-60"
        >
          Salvar
        </button>
      )}
    </div>
  )
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const [summary, setSummary] = useState<Summary | null>(null)
  const [monthly, setMonthly] = useState<MonthlyRow[]>([])
  const [recent, setRecent] = useState<RecentItem[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [revenues, setRevenues] = useState<Revenue[]>([])
  const [partners, setPartners] = useState<Partner[]>([])

  const [expDescription, setExpDescription] = useState('')
  const [expAmount, setExpAmount] = useState('')
  const [expCategory, setExpCategory] = useState('Operacional')
  const [expDate, setExpDate] = useState('')

  const [revDescription, setRevDescription] = useState('')
  const [revAmount, setRevAmount] = useState('')
  const [revMonth, setRevMonth] = useState('')

  const [partnerName, setPartnerName] = useState('')
  const [partnerPct, setPartnerPct] = useState('')
  const [rateioMonth, setRateioMonth] = useState('all')

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard')
      if (res.ok) {
        const data = await res.json()
        setSummary(data.summary)
        setMonthly(data.monthly || [])
        setRecent(data.recent || [])
        setExpenses(data.expenses || [])
        setRevenues(data.revenues || [])
        setPartners(data.partners || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (localStorage.getItem('user_role') !== 'ADMIN') {
      router.push('/admin/pacientes')
      return
    }
    const today = toInputDate(new Date().toISOString())
    setExpDate(today)
    setRevMonth(today.slice(0, 7))
    setAuthorized(true)
    fetchDashboard()
  }, [router])

  const done = async (result: { ok: boolean; data: { error?: string } }, okMessage: string) => {
    if (result.ok) {
      setError('')
      setNotice(okMessage)
      await fetchDashboard()
    } else {
      setNotice('')
      setError(result.data.error || 'Não foi possível concluir a ação.')
    }
  }

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await request('/api/expenses', 'POST', {
      description: expDescription,
      amount: expAmount,
      category: expCategory,
      date: expDate,
    })
    if (result.ok) {
      setExpDescription('')
      setExpAmount('')
    }
    await done(result, 'Despesa cadastrada com sucesso!')
  }

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta despesa?')) return
    await done(await request(`/api/expenses/${id}`, 'DELETE'), 'Despesa excluída.')
  }

  const handleAddRevenue = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await request('/api/revenues', 'POST', {
      description: revDescription,
      amount: revAmount,
      month: revMonth,
    })
    if (result.ok) {
      setRevDescription('')
      setRevAmount('')
    }
    await done(result, 'Receita lançada com sucesso!')
  }

  const handleDeleteRevenue = async (id: string) => {
    if (!confirm('Excluir esta receita lançada?')) return
    await done(await request(`/api/revenues/${id}`, 'DELETE'), 'Receita excluída.')
  }

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await request('/api/partners', 'POST', {
      name: partnerName,
      percentage: partnerPct,
    })
    if (result.ok) {
      setPartnerName('')
      setPartnerPct('')
    }
    await done(result, 'Sócio cadastrado.')
  }

  const handleEditPartner = async (p: Partner) => {
    const typed = window.prompt(`Nova porcentagem de ${p.name} (%):`, String(p.percentage))
    if (typed === null) return
    await done(
      await request(`/api/partners/${p.id}`, 'PATCH', { percentage: typed.replace(',', '.') }),
      'Porcentagem atualizada.'
    )
  }

  const handleDeletePartner = async (p: Partner) => {
    if (!confirm(`Remover ${p.name} do rateio?`)) return
    await done(await request(`/api/partners/${p.id}`, 'DELETE'), 'Sócio removido.')
  }

  const saveRecentDate = async (item: RecentItem, value: string) => {
    const result =
      item.kind === 'LAB'
        ? await request(`/api/orders/${item.id}/date`, 'PATCH', { serviceDate: value })
        : await request(`/api/homecare/${item.id}`, 'PATCH', { collectionDate: value })
    await done(result, 'Data atualizada. O valor passou para o mês da nova data.')
  }

  if (!authorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-100">
        <p className="text-sm font-semibold text-neutral-500">A verificar permissões de acesso...</p>
      </div>
    )
  }

  const s = summary
  const value = (n: number | undefined) => (loading || n === undefined ? '...' : brl(n))

  const cards = [
    { label: 'Faturamento bruto', value: value(s?.revenueTotal), color: 'text-green-700' },
    { label: 'Despesas totais', value: value(s?.expensesTotal), color: 'text-red-600' },
    {
      label: 'Resultado líquido',
      value: value(s?.result),
      color: (s?.result ?? 0) >= 0 ? 'text-green-800' : 'text-red-700',
    },
    { label: 'Ticket médio', value: value(s?.averageTicket), color: 'text-neutral-800' },
  ]

  const streams = [
    { label: '🔬 Exames (laboratório)', value: s?.examsRevenue, note: `${s?.labOrders ?? 0} OS concluídas` },
    { label: '🩺 Consultas médicas', value: s?.consultationsRevenue, note: `${s?.consultations ?? 0} consulta(s)` },
    { label: '🏠 Home Care', value: s?.homeCareRevenue, note: `${s?.homeCareOrders ?? 0} OS concluídas` },
    { label: '✍️ Receitas lançadas', value: s?.manualRevenue, note: `${revenues.length} lançamento(s)` },
  ]

  const baseResult =
    rateioMonth === 'all' ? s?.result ?? 0 : monthly.find((m) => m.key === rateioMonth)?.result ?? 0
  const totalPct = partners.reduce((sum, p) => sum + p.percentage, 0)
  const share = (pct: number) => Math.round(baseResult * pct) / 100
  const remainingPct = Math.round((100 - totalPct) * 100) / 100

  const inputClass = 'w-full rounded border border-neutral-300 p-2 text-sm text-black'
  const labelClass = 'mb-1 block text-xs font-semibold text-neutral-600'
  const cardClass = 'space-y-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm'

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-l-8 border-green-500 bg-green-800 p-6 text-white shadow-md">
        <div>
          <h1 className="text-2xl font-bold">Painel Financeiro & Operacional</h1>
          <p className="mt-1 text-sm text-green-100">
            Visão consolidada de exames, consultas, Home Care e receitas lançadas, com despesas, resultado e rateio.
          </p>
        </div>
        <a
          href="/admin/relatorios"
          className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-green-800 shadow-sm transition hover:bg-green-50"
        >
          🗓️ Relatório mensal
        </a>
      </div>

      {notice && <p className="rounded bg-green-100 p-2 text-xs font-bold text-green-700">{notice}</p>}
      {error && <p className="rounded bg-red-100 p-2 text-xs font-bold text-red-700">{error}</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase text-neutral-500">{c.label}</p>
            <p className={`mt-1 text-2xl font-extrabold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-neutral-800">Receita por origem</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {streams.map((x) => (
            <div key={x.label} className="rounded-xl border border-green-200 bg-green-50 p-5">
              <p className="text-sm font-bold text-green-900">{x.label}</p>
              <p className="mt-1 text-2xl font-extrabold text-green-700">{value(x.value)}</p>
              <p className="mt-1 text-xs text-green-800">{x.note}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className={`${cardClass} lg:col-span-2`}>
          <h2 className="text-lg font-bold text-neutral-800">📅 Desempenho mês a mês</h2>

          {loading ? (
            <p className="text-sm text-neutral-500">Carregando...</p>
          ) : monthly.length === 0 ? (
            <p className="text-sm text-neutral-500">Nenhum dado mensal registrado ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b bg-neutral-100 text-neutral-600">
                    <th className="p-3">Mês</th>
                    <th className="p-3">OS</th>
                    <th className="p-3">Exames</th>
                    <th className="p-3">Consultas</th>
                    <th className="p-3">Home Care</th>
                    <th className="p-3">Lançadas</th>
                    <th className="p-3">Despesas</th>
                    <th className="p-3 text-right">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {monthly.map((m) => (
                    <tr key={m.key} className="border-b hover:bg-neutral-50">
                      <td className="p-3 font-semibold text-black">{m.label}</td>
                      <td className="p-3 text-neutral-700">{m.services}</td>
                      <td className="p-3 font-semibold text-green-700">{brl(m.examsRevenue)}</td>
                      <td className="p-3 font-semibold text-green-700">{brl(m.consultationsRevenue)}</td>
                      <td className="p-3 font-semibold text-green-700">{brl(m.homeCareRevenue)}</td>
                      <td className="p-3 font-semibold text-green-700">{brl(m.manualRevenue)}</td>
                      <td className="p-3 font-semibold text-red-600">{brl(m.expensesTotal)}</td>
                      <td
                        className={`p-3 text-right font-extrabold ${
                          m.result >= 0 ? 'text-green-800' : 'text-red-700'
                        }`}
                      >
                        {brl(m.result)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className={cardClass}>
          <h2 className="text-lg font-bold text-neutral-800">💸 Registrar nova despesa</h2>

          <form onSubmit={handleAddExpense} className="space-y-3">
            <div>
              <label className={labelClass}>Descrição</label>
              <input
                type="text"
                required
                value={expDescription}
                onChange={(e) => setExpDescription(e.target.value)}
                placeholder="Ex: Reagentes, Aluguel, Energia"
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  placeholder="150.00"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Data</label>
                <input
                  type="date"
                  required
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Categoria</label>
              <select
                value={expCategory}
                onChange={(e) => setExpCategory(e.target.value)}
                className={`${inputClass} bg-white`}
              >
                <option value="Operacional">Operacional</option>
                <option value="Insumos/Reagentes">Insumos/Reagentes</option>
                <option value="Manutenção">Manutenção</option>
                <option value="Administrativo">Administrativo</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full rounded bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
            >
              Salvar despesa
            </button>
          </form>

          <div className="max-h-72 space-y-2 overflow-y-auto border-t pt-4">
            <h3 className="text-xs font-bold uppercase text-neutral-500">Despesas lançadas</h3>
            {expenses.length === 0 ? (
              <p className="text-xs text-neutral-400">Nenhuma despesa lançada.</p>
            ) : (
              expenses.map((exp) => (
                <div key={exp.id} className="space-y-2 rounded border bg-neutral-50 p-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-black">{exp.description}</p>
                      <p className="text-neutral-500">{exp.category}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-red-600">{brl(exp.amount)}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="rounded bg-red-100 px-2 py-1 font-bold text-red-700 hover:bg-red-200"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <DateEditor
                    value={toInputDate(exp.date)}
                    onSave={async (v) =>
                      done(await request(`/api/expenses/${exp.id}`, 'PATCH', { date: v }), 'Data da despesa atualizada.')
                    }
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className={cardClass}>
          <h2 className="text-lg font-bold text-neutral-800">✍️ Lançar receita do mês</h2>
          <p className="text-xs text-neutral-500">
            Use para receitas que não estão nas OS do sistema. O valor conta no mês de referência escolhido.
          </p>

          <form onSubmit={handleAddRevenue} className="space-y-3">
            <div>
              <label className={labelClass}>Descrição (opcional)</label>
              <input
                type="text"
                value={revDescription}
                onChange={(e) => setRevDescription(e.target.value)}
                placeholder="Ex: Faturamento convênio"
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Valor total (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={revAmount}
                  onChange={(e) => setRevAmount(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Mês de referência</label>
                <input
                  type="month"
                  required
                  value={revMonth}
                  onChange={(e) => setRevMonth(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded bg-green-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-green-700"
            >
              Lançar receita
            </button>
          </form>

          <div className="max-h-64 space-y-2 overflow-y-auto border-t pt-4">
            <h3 className="text-xs font-bold uppercase text-neutral-500">Receitas lançadas</h3>
            {revenues.length === 0 ? (
              <p className="text-xs text-neutral-400">Nenhuma receita lançada.</p>
            ) : (
              revenues.map((r) => (
                <div key={r.id} className="space-y-2 rounded border bg-neutral-50 p-2 text-xs">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-black">{r.description || 'Receita lançada'}</p>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-green-700">{brl(r.amount)}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteRevenue(r.id)}
                        className="rounded bg-red-100 px-2 py-1 font-bold text-red-700 hover:bg-red-200"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500">Mês:</span>
                    <DateEditor
                      type="month"
                      value={r.month}
                      onSave={async (v) =>
                        done(await request(`/api/revenues/${r.id}`, 'PATCH', { month: v }), 'Mês da receita atualizado.')
                      }
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={cardClass}>
          <h2 className="text-lg font-bold text-neutral-800">🤝 Rateio entre sócios</h2>
          <p className="text-xs text-neutral-500">
            Divide o resultado líquido entre os sócios, conforme a porcentagem de cada um.
          </p>

          <form onSubmit={handleAddPartner} className="grid grid-cols-1 gap-3 sm:grid-cols-5">
            <input
              type="text"
              required
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              placeholder="Nome do sócio"
              className={`${inputClass} sm:col-span-3`}
            />
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              required
              value={partnerPct}
              onChange={(e) => setPartnerPct(e.target.value)}
              placeholder="%"
              className={inputClass}
            />
            <button
              type="submit"
              className="rounded bg-green-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-green-700"
            >
              Adicionar
            </button>
          </form>

          {partners.length > 0 && Math.abs(remainingPct) > 0.0001 && (
            <p className="rounded bg-yellow-50 p-2 text-xs font-semibold text-yellow-800">
              Distribuído: {totalPct}%. Ainda não distribuído: {remainingPct}%.
            </p>
          )}

          <div className="space-y-1 border-t pt-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase text-neutral-500">Base do rateio</h3>
              <select
                value={rateioMonth}
                onChange={(e) => setRateioMonth(e.target.value)}
                className="rounded border border-neutral-300 bg-white px-2 py-1 text-xs text-black"
              >
                <option value="all">Todos os meses</option>
                {monthly.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-between rounded bg-green-50 p-2 text-sm">
              <span className="font-semibold text-green-900">Resultado líquido</span>
              <span className={`font-extrabold ${baseResult >= 0 ? 'text-green-800' : 'text-red-700'}`}>
                {brl(baseResult)}
              </span>
            </div>

            {partners.length === 0 ? (
              <p className="pt-2 text-xs text-neutral-400">Cadastre os sócios para ver o rateio.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-xs text-neutral-500">
                    <th className="p-2">Sócio</th>
                    <th className="p-2 text-right">%</th>
                    <th className="p-2 text-right">Valor</th>
                    <th className="p-2" />
                  </tr>
                </thead>
                <tbody>
                  {partners.map((p) => (
                    <tr key={p.id} className="border-b">
                      <td className="p-2 font-semibold text-black">{p.name}</td>
                      <td className="p-2 text-right text-neutral-700">{p.percentage}%</td>
                      <td
                        className={`p-2 text-right font-bold ${
                          share(p.percentage) >= 0 ? 'text-green-700' : 'text-red-700'
                        }`}
                      >
                        {brl(share(p.percentage))}
                      </td>
                      <td className="p-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleEditPartner(p)}
                          className="mr-1 rounded bg-neutral-100 px-2 py-1 text-xs font-bold text-neutral-800 hover:bg-neutral-200"
                        >
                          %
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePartner(p)}
                          className="rounded bg-red-100 px-2 py-1 text-xs font-bold text-red-700 hover:bg-red-200"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                  {Math.abs(remainingPct) > 0.0001 && (
                    <tr className="text-neutral-500">
                      <td className="p-2">Não distribuído</td>
                      <td className="p-2 text-right">{remainingPct}%</td>
                      <td className="p-2 text-right">{brl(share(remainingPct))}</td>
                      <td />
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <h2 className="text-lg font-bold text-neutral-800">🧾 Últimos atendimentos concluídos</h2>
        <p className="text-xs text-neutral-500">
          Altere a data de um atendimento para ele passar a contar no mês correto. Mostrando os 40 mais recentes.
        </p>

        {loading ? (
          <p className="text-sm text-neutral-500">Carregando detalhes...</p>
        ) : recent.length === 0 ? (
          <p className="text-sm text-neutral-500">Nenhum atendimento concluído até o momento.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-neutral-100 text-neutral-600">
                  <th className="p-3">Data</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Paciente</th>
                  <th className="p-3">Itens</th>
                  <th className="p-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={`${r.kind}-${r.id}`} className="border-b hover:bg-neutral-50">
                    <td className="p-3">
                      <DateEditor value={toInputDate(r.date)} onSave={(v) => saveRecentDate(r, v)} />
                    </td>
                    <td className="p-3">
                      <span className="rounded-md border border-green-200 bg-green-50 px-2 py-1 text-xs font-bold text-green-700">
                        {r.kind === 'HOMECARE' ? '🏠 Home Care' : 'Laboratório'}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-black">{r.patient}</td>
                    <td className="max-w-xs truncate p-3 text-xs text-neutral-600" title={r.description}>
                      {r.description}
                    </td>
                    <td className="p-3 text-right font-bold text-green-700">{brl(r.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <HomeCareFinance />
    </div>
  )
}