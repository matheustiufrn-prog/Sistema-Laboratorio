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
  revenueTotal: number
  expensesTotal: number
  reimbursementsTotal: number
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

const brl = (v: number) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function AdminDashboardPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)

  const [summary, setSummary] = useState<Summary | null>(null)
  const [monthly, setMonthly] = useState<MonthlyRow[]>([])
  const [recent, setRecent] = useState<RecentItem[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])

  const [expDescription, setExpDescription] = useState('')
  const [expAmount, setExpAmount] = useState('')
  const [expCategory, setExpCategory] = useState('Operacional')
  const [expSuccess, setExpSuccess] = useState('')

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard')
      if (res.ok) {
        const data = await res.json()
        setSummary(data.summary)
        setMonthly(data.monthly || [])
        setRecent(data.recent || [])
        setExpenses(data.expenses || [])
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
    } else {
      setAuthorized(true)
      fetchDashboard()
    }
  }, [router])

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    setExpSuccess('')

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: expDescription, amount: expAmount, category: expCategory }),
      })

      if (res.ok) {
        setExpSuccess('Despesa cadastrada com sucesso!')
        setExpDescription('')
        setExpAmount('')
        fetchDashboard()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta despesa?')) return

    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
      if (res.ok) fetchDashboard()
      else alert('Erro ao excluir despesa.')
    } catch (err) {
      console.error(err)
    }
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
    {
      label: '🩺 Consultas médicas',
      value: s?.consultationsRevenue,
      note: `${s?.consultations ?? 0} consulta(s)`,
    },
    { label: '🏠 Home Care', value: s?.homeCareRevenue, note: `${s?.homeCareOrders ?? 0} OS concluídas` },
  ]

  const inputClass = 'w-full rounded border border-neutral-300 p-2 text-sm text-black'

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-l-8 border-green-500 bg-green-800 p-6 text-white shadow-md">
        <div>
          <h1 className="text-2xl font-bold">Painel Financeiro & Operacional</h1>
          <p className="mt-1 text-sm text-green-100">
            Visão consolidada de exames, consultas e Home Care, com despesas e resultado.
          </p>
        </div>
        <a
          href="/admin/relatorios"
          className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-green-800 shadow-sm transition hover:bg-green-50"
        >
          🗓️ Relatório mensal
        </a>
      </div>

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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
        <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm lg:col-span-2">
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

        <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-neutral-800">💸 Registrar nova despesa</h2>
          {expSuccess && <p className="rounded bg-green-100 p-2 text-xs font-bold text-green-700">{expSuccess}</p>}

          <form onSubmit={handleAddExpense} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-neutral-600">Descrição</label>
              <input
                type="text"
                required
                value={expDescription}
                onChange={(e) => setExpDescription(e.target.value)}
                placeholder="Ex: Reagentes, Aluguel, Energia"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-neutral-600">Valor (R$)</label>
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
              <label className="mb-1 block text-xs font-semibold text-neutral-600">Categoria</label>
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

          <div className="max-h-56 space-y-2 overflow-y-auto border-t pt-4">
            <h3 className="text-xs font-bold uppercase text-neutral-500">Despesas lançadas</h3>
            {expenses.length === 0 ? (
              <p className="text-xs text-neutral-400">Nenhuma despesa lançada.</p>
            ) : (
              expenses.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between rounded border bg-neutral-50 p-2 text-xs"
                >
                  <div>
                    <p className="font-bold text-black">{exp.description}</p>
                    <p className="text-neutral-500">
                      {exp.category} - {new Date(exp.date).toLocaleDateString('pt-BR')}
                    </p>
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
              ))
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-neutral-800">🧾 Últimos atendimentos concluídos</h2>

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
                    <td className="p-3 text-neutral-600">{new Date(r.date).toLocaleDateString('pt-BR')}</td>
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