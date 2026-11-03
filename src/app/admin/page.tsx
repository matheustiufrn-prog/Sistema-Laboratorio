'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import HomeCareFinance from '@/components/HomeCareFinance'
import MonthlyReport from '@/components/MonthlyReport'

interface Summary {
  services: number
  revenueTotal: number
  expensesTotal: number
  result: number
  averageTicket: number
}

interface MonthlyRow {
  key: string
  label: string
  services: number
  examsRevenue: number
  consultationsRevenue: number
  homeCareRevenue: number
  manualRevenue: number
  revenueTotal: number
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

type Tab = 'geral' | 'lancamentos' | 'rateio' | 'relatorio' | 'homecare'

const TABS: { id: Tab; label: string }[] = [
  { id: 'geral', label: '📊 Visão geral' },
  { id: 'lancamentos', label: '✍️ Lançamentos' },
  { id: 'rateio', label: '🤝 Rateio' },
  { id: 'relatorio', label: '🗓️ Relatório mensal' },
  { id: 'homecare', label: '🏠 Home Care' },
]

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]
const MONTH_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

const COLORS = {
  revenue: '#16a34a',
  expense: '#ef4444',
  exams: '#16a34a',
  consult: '#0d9488',
  home: '#84cc16',
  manual: '#64748b',
}

const ZERO: MonthlyRow = {
  key: '',
  label: '',
  services: 0,
  examsRevenue: 0,
  consultationsRevenue: 0,
  homeCareRevenue: 0,
  manualRevenue: 0,
  revenueTotal: 0,
  expensesTotal: 0,
  result: 0,
}

const brl = (v: number) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Fortaleza',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const toInputDate = (iso: string) => dateFormatter.format(new Date(iso))

const monthLabel = (key: string) => {
  const [y, m] = key.split('-')
  return `${MONTH_NAMES[Number(m) - 1]} de ${y}`
}

const shortLabel = (key: string) => {
  const [y, m] = key.split('-')
  return `${MONTH_SHORT[Number(m) - 1]}/${y.slice(2)}`
}

const addMonths = (key: string, n: number) => {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + n, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

const growth = (cur: number, prev: number) => (prev === 0 ? null : ((cur - prev) / Math.abs(prev)) * 100)

const pct = (n: number) => `${n.toFixed(1).replace('.', ',')}%`

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

function Delta({ value, inverse = false }: { value: number | null; inverse?: boolean }) {
  if (value === null) return <span className="text-xs text-neutral-400">sem base de comparação</span>
  const up = value >= 0
  const good = inverse ? !up : up
  return (
    <span className={`text-xs font-bold ${good ? 'text-green-600' : 'text-red-600'}`}>
      {up ? '▲' : '▼'} {pct(Math.abs(value))}
      <span className="ml-1 font-normal text-neutral-400">vs mês anterior</span>
    </span>
  )
}

function Kpi({
  label,
  value,
  color,
  footer,
}: {
  label: string
  value: string
  color: string
  footer: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold ${color}`}>{value}</p>
      <div className="mt-2">{footer}</div>
    </div>
  )
}

function BarChart({
  labels,
  series,
}: {
  labels: string[]
  series: { name: string; color: string; values: number[] }[]
}) {
  const W = 720
  const H = 240
  const L = 48
  const R = 8
  const T = 12
  const B = 28
  const plotW = W - L - R
  const plotH = H - T - B
  const max = Math.max(1, ...series.flatMap((s) => s.values))
  const ticks = [0, 0.25, 0.5, 0.75, 1]
  const groupW = plotW / labels.length
  const barW = Math.min(22, (groupW * 0.7) / series.length)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
      {ticks.map((t) => {
        const y = T + plotH - plotH * t
        return (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y} y2={y} stroke="#e5e5e5" strokeDasharray={t === 0 ? undefined : '3 3'} />
            <text x={L - 6} y={y + 3} textAnchor="end" fontSize="10" fill="#737373">
              {compact.format(max * t)}
            </text>
          </g>
        )
      })}
      {labels.map((label, i) => {
        const gx = L + groupW * i + groupW / 2 - (barW * series.length) / 2
        return (
          <g key={`${label}-${i}`}>
            {series.map((s, j) => {
              const v = Math.max(0, s.values[i] || 0)
              const h = (v / max) * plotH
              return (
                <rect
                  key={s.name}
                  x={gx + j * barW}
                  y={T + plotH - h}
                  width={Math.max(1, barW - 2)}
                  height={h}
                  rx={3}
                  fill={s.color}
                >
                  <title>{`${s.name} — ${label}: ${brl(s.values[i] || 0)}`}</title>
                </rect>
              )
            })}
            <text x={L + groupW * i + groupW / 2} y={H - 8} textAnchor="middle" fontSize="10" fill="#737373">
              {label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function LineChart({ labels, values, color }: { labels: string[]; values: number[]; color: string }) {
  const W = 720
  const H = 240
  const L = 48
  const R = 16
  const T = 12
  const B = 28
  const plotW = W - L - R
  const plotH = H - T - B
  const max = Math.max(0, ...values)
  const min = Math.min(0, ...values)
  const span = max - min || 1
  const x = (i: number) => L + (labels.length === 1 ? plotW / 2 : (plotW * i) / (labels.length - 1))
  const y = (v: number) => T + plotH - ((v - min) / span) * plotH
  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(' ')
  const zeroY = y(0)
  const area = `${x(0)},${zeroY} ${points} ${x(values.length - 1)},${zeroY}`
  const ticks = [0, 0.25, 0.5, 0.75, 1]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
      {ticks.map((t) => {
        const v = min + span * t
        const yy = y(v)
        return (
          <g key={t}>
            <line x1={L} x2={W - R} y1={yy} y2={yy} stroke="#e5e5e5" strokeDasharray="3 3" />
            <text x={L - 6} y={yy + 3} textAnchor="end" fontSize="10" fill="#737373">
              {compact.format(v)}
            </text>
          </g>
        )
      })}
      <line x1={L} x2={W - R} y1={zeroY} y2={zeroY} stroke="#a3a3a3" />
      <polygon points={area} fill={color} opacity={0.12} />
      <polyline points={points} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {values.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={4} fill="#fff" stroke={color} strokeWidth={2}>
          <title>{`${labels[i]}: ${brl(v)}`}</title>
        </circle>
      ))}
      {labels.map((label, i) => (
        <text key={`${label}-${i}`} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#737373">
          {label}
        </text>
      ))}
    </svg>
  )
}

function ShareBar({ items }: { items: { label: string; value: number; color: string }[] }) {
  const total = items.reduce((s, i) => s + i.value, 0)
  if (total <= 0) return <p className="text-sm text-neutral-500">Sem receita neste mês.</p>

  return (
    <div className="space-y-3">
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-neutral-100">
        {items
          .filter((i) => i.value > 0)
          .map((i) => (
            <div
              key={i.label}
              style={{ width: `${(i.value / total) * 100}%`, backgroundColor: i.color }}
              title={`${i.label}: ${brl(i.value)}`}
            />
          ))}
      </div>
      <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
        {items.map((i) => (
          <div key={i.label} className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
            <span className="flex items-center gap-2 font-semibold text-neutral-700">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: i.color }} />
              {i.label}
            </span>
            <span className="font-bold text-neutral-900">
              {brl(i.value)}{' '}
              <span className="font-normal text-neutral-500">({((i.value / total) * 100).toFixed(0)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function FinanceiroPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('geral')
  const [month, setMonth] = useState(() => toInputDate(new Date().toISOString()).slice(0, 7))
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
  const [rateioBase, setRateioBase] = useState<'month' | 'year' | 'all'>('month')
  const [showAll, setShowAll] = useState(false)

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard')
      if (res.ok) {
        const data = await res.json()
        setSummary(data.summary ?? null)
        setMonthly(data.monthly ?? [])
        setRecent(data.recent ?? [])
        setExpenses(data.expenses ?? [])
        setRevenues(data.revenues ?? [])
        setPartners(data.partners ?? [])
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
    const aba = new URLSearchParams(window.location.search).get('aba')
    if (aba && TABS.some((t) => t.id === aba)) setTab(aba as Tab)
    setAuthorized(true)
    fetchDashboard()
  }, [router])

  useEffect(() => {
    setRevMonth(month)
    const today = toInputDate(new Date().toISOString())
    setExpDate(today.slice(0, 7) === month ? today : `${month}-01`)
  }, [month])

  const rowMap = useMemo(
    () => new Map(monthly.map((m) => [m.key, m] as [string, MonthlyRow])),
    [monthly]
  )

  const series = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const key = addMonths(month, i - 11)
        return { key, label: shortLabel(key), row: rowMap.get(key) ?? ZERO }
      }),
    [month, rowMap]
  )

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

  const cur = rowMap.get(month) ?? ZERO
  const prev = rowMap.get(addMonths(month, -1)) ?? ZERO
  const margin = cur.revenueTotal ? (cur.result / cur.revenueTotal) * 100 : 0
  const prevMargin = prev.revenueTotal ? (prev.result / prev.revenueTotal) * 100 : 0
  const marginDiff = margin - prevMargin

  const year = month.slice(0, 4)
  const ytd = monthly
    .filter((m) => m.key.startsWith(year))
    .reduce(
      (acc, m) => ({
        revenue: acc.revenue + m.revenueTotal,
        expenses: acc.expenses + m.expensesTotal,
        result: acc.result + m.result,
      }),
      { revenue: 0, expenses: 0, result: 0 }
    )

  const bestMonth = monthly.reduce<MonthlyRow | null>(
    (best, m) => (best === null || m.result > best.result ? m : best),
    null
  )

  const baseResult =
    rateioBase === 'month' ? cur.result : rateioBase === 'year' ? ytd.result : summary?.result ?? 0
  const totalPct = partners.reduce((sum, p) => sum + p.percentage, 0)
  const remainingPct = Math.round((100 - totalPct) * 100) / 100
  const share = (p: number, base: number) => Math.round(base * p) / 100

  const monthRevenues = revenues.filter((r) => showAll || r.month === month)
  const monthExpenses = expenses.filter((e) => showAll || toInputDate(e.date).slice(0, 7) === month)

  const inputClass =
    'w-full rounded-lg border border-neutral-300 bg-white p-2.5 text-sm text-black outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100'
  const labelClass = 'mb-1 block text-xs font-semibold text-neutral-600'
  const cardClass = 'space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm'
  const buttonGreen =
    'rounded-lg bg-green-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-green-700'

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 font-sans sm:p-8 print:max-w-none print:space-y-0 print:p-0">
      <div className="space-y-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-green-800 to-green-600 p-6 text-white shadow-md">
          <div>
            <h1 className="text-2xl font-bold">Financeiro</h1>
            <p className="mt-1 text-sm text-green-100">
              Receitas, despesas, rateio e relatórios em um só lugar. Mês selecionado: {monthLabel(month)}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMonth(addMonths(month, -1))}
              className="rounded-lg bg-white/15 px-3 py-2 text-lg font-bold transition hover:bg-white/25"
              aria-label="Mês anterior"
            >
              ‹
            </button>
            <input
              type="month"
              value={month}
              onChange={(e) => e.target.value && setMonth(e.target.value)}
              className="rounded-lg border-0 bg-white px-3 py-2 text-sm font-semibold text-green-900"
            />
            <button
              type="button"
              onClick={() => setMonth(addMonths(month, 1))}
              className="rounded-lg bg-white/15 px-3 py-2 text-lg font-bold transition hover:bg-white/25"
              aria-label="Próximo mês"
            >
              ›
            </button>
          </div>
        </div>

        {notice && <p className="rounded-lg bg-green-100 p-2 text-xs font-bold text-green-700">{notice}</p>}
        {error && <p className="rounded-lg bg-red-100 p-2 text-xs font-bold text-red-700">{error}</p>}

        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                tab === t.id
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'geral' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Kpi
              label="Faturamento do mês"
              value={loading ? '...' : brl(cur.revenueTotal)}
              color="text-green-700"
              footer={<Delta value={growth(cur.revenueTotal, prev.revenueTotal)} />}
            />
            <Kpi
              label="Despesas do mês"
              value={loading ? '...' : brl(cur.expensesTotal)}
              color="text-red-600"
              footer={<Delta value={growth(cur.expensesTotal, prev.expensesTotal)} inverse />}
            />
            <Kpi
              label="Resultado líquido"
              value={loading ? '...' : brl(cur.result)}
              color={cur.result >= 0 ? 'text-green-800' : 'text-red-700'}
              footer={<Delta value={growth(cur.result, prev.result)} />}
            />
            <Kpi
              label="Margem"
              value={loading ? '...' : pct(margin)}
              color={margin >= 0 ? 'text-green-800' : 'text-red-700'}
              footer={
                <span className={`text-xs font-bold ${marginDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {marginDiff >= 0 ? '▲' : '▼'} {Math.abs(marginDiff).toFixed(1).replace('.', ',')} p.p.
                  <span className="ml-1 font-normal text-neutral-400">vs mês anterior</span>
                </span>
              }
            />
            <Kpi
              label="Atendimentos (OS)"
              value={loading ? '...' : String(cur.services)}
              color="text-neutral-800"
              footer={<Delta value={growth(cur.services, prev.services)} />}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: `Faturamento acumulado em ${year}`, value: ytd.revenue, color: 'text-green-700' },
              { label: `Despesas acumuladas em ${year}`, value: ytd.expenses, color: 'text-red-600' },
              {
                label: `Resultado acumulado em ${year}`,
                value: ytd.result,
                color: ytd.result >= 0 ? 'text-green-800' : 'text-red-700',
              },
            ].map((c) => (
              <div key={c.label} className="rounded-2xl border border-green-200 bg-green-50 p-4">
                <p className="text-[11px] font-bold uppercase text-green-900">{c.label}</p>
                <p className={`mt-1 text-xl font-extrabold ${c.color}`}>{loading ? '...' : brl(c.value)}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className={cardClass}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-neutral-800">Receita × Despesas</h2>
                <div className="flex items-center gap-4 text-xs text-neutral-600">
                  <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS.revenue }} /> Receita
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS.expense }} /> Despesas
                  </span>
                </div>
              </div>
              <p className="text-xs text-neutral-500">Últimos 12 meses até {monthLabel(month)}.</p>
              <BarChart
                labels={series.map((s) => s.label)}
                series={[
                  { name: 'Receita', color: COLORS.revenue, values: series.map((s) => s.row.revenueTotal) },
                  { name: 'Despesas', color: COLORS.expense, values: series.map((s) => s.row.expensesTotal) },
                ]}
              />
            </div>

            <div className={cardClass}>
              <h2 className="text-lg font-bold text-neutral-800">Crescimento do resultado</h2>
              <p className="text-xs text-neutral-500">
                Resultado líquido mês a mês.
                {bestMonth && bestMonth.result > 0 && (
                  <> Melhor mês até agora: {bestMonth.label} ({brl(bestMonth.result)}).</>
                )}
              </p>
              <LineChart
                labels={series.map((s) => s.label)}
                values={series.map((s) => s.row.result)}
                color={COLORS.revenue}
              />
            </div>
          </div>

          <div className={cardClass}>
            <h2 className="text-lg font-bold text-neutral-800">Composição da receita — {monthLabel(month)}</h2>
            <ShareBar
              items={[
                { label: 'Exames (laboratório)', value: cur.examsRevenue, color: COLORS.exams },
                { label: 'Consultas médicas', value: cur.consultationsRevenue, color: COLORS.consult },
                { label: 'Home Care', value: cur.homeCareRevenue, color: COLORS.home },
                { label: 'Receitas lançadas', value: cur.manualRevenue, color: COLORS.manual },
              ]}
            />
          </div>

          <div className={cardClass}>
            <h2 className="text-lg font-bold text-neutral-800">📅 Desempenho mês a mês</h2>
            <p className="text-xs text-neutral-500">Clique em uma linha para selecionar o mês.</p>

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
                      <tr
                        key={m.key}
                        onClick={() => setMonth(m.key)}
                        className={`cursor-pointer border-b hover:bg-neutral-50 ${
                          m.key === month ? 'bg-green-50' : ''
                        }`}
                      >
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
        </div>
      )}

      {tab === 'lancamentos' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3 print:hidden">
            <p className="text-sm text-neutral-600">
              {showAll ? 'Mostrando lançamentos de todos os meses.' : `Mostrando lançamentos de ${monthLabel(month)}.`}
            </p>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-neutral-700">
              <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
              Mostrar todos os meses
            </label>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                    <label className={labelClass}>Receita total (R$)</label>
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
                <button type="submit" className={`${buttonGreen} w-full`}>
                  Lançar receita
                </button>
              </form>

              <div className="max-h-72 space-y-2 overflow-y-auto border-t pt-4">
                <h3 className="text-xs font-bold uppercase text-neutral-500">
                  Receitas lançadas ({monthRevenues.length})
                </h3>
                {monthRevenues.length === 0 ? (
                  <p className="text-xs text-neutral-400">Nenhuma receita lançada.</p>
                ) : (
                  monthRevenues.map((r) => (
                    <div key={r.id} className="space-y-2 rounded-lg border bg-neutral-50 p-3 text-xs">
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
                          onSave={async (v) => {
                            await done(
                              await request(`/api/revenues/${r.id}`, 'PATCH', { month: v }),
                              'Mês da receita atualizado.'
                            )
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className={cardClass}>
              <h2 className="text-lg font-bold text-neutral-800">💸 Registrar despesa</h2>

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
                    className={inputClass}
                  >
                    <option value="Operacional">Operacional</option>
                    <option value="Insumos/Reagentes">Insumos/Reagentes</option>
                    <option value="Manutenção">Manutenção</option>
                    <option value="Administrativo">Administrativo</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
                >
                  Salvar despesa
                </button>
              </form>

              <div className="max-h-72 space-y-2 overflow-y-auto border-t pt-4">
                <h3 className="text-xs font-bold uppercase text-neutral-500">
                  Despesas lançadas ({monthExpenses.length})
                </h3>
                {monthExpenses.length === 0 ? (
                  <p className="text-xs text-neutral-400">Nenhuma despesa lançada.</p>
                ) : (
                  monthExpenses.map((exp) => (
                    <div key={exp.id} className="space-y-2 rounded-lg border bg-neutral-50 p-3 text-xs">
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
                        onSave={async (v) => {
                          await done(
                            await request(`/api/expenses/${exp.id}`, 'PATCH', { date: v }),
                            'Data da despesa atualizada.'
                          )
                        }}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <h2 className="text-lg font-bold text-neutral-800">🧾 Atendimentos concluídos</h2>
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
        </div>
      )}

      {tab === 'rateio' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className={cardClass}>
              <h2 className="text-lg font-bold text-neutral-800">🤝 Sócios e porcentagens</h2>
              <p className="text-xs text-neutral-500">
                A soma das porcentagens não pode passar de 100%. O rateio divide o resultado líquido.
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
                <button type="submit" className={buttonGreen}>
                  Adicionar
                </button>
              </form>

              {partners.length > 0 && Math.abs(remainingPct) > 0.0001 && (
                <p className="rounded-lg bg-yellow-50 p-2 text-xs font-semibold text-yellow-800">
                  Distribuído: {totalPct}%. Ainda não distribuído: {remainingPct}%.
                </p>
              )}

              <div className="space-y-3 border-t pt-4">
                {partners.length === 0 ? (
                  <p className="text-xs text-neutral-400">Nenhum sócio cadastrado.</p>
                ) : (
                  partners.map((p) => (
                    <div key={p.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-black">{p.name}</span>
                        <span className="flex items-center gap-2">
                          <span className="font-bold text-green-700">{p.percentage}%</span>
                          <button
                            type="button"
                            onClick={() => handleEditPartner(p)}
                            className="rounded bg-neutral-100 px-2 py-1 text-xs font-bold text-neutral-800 hover:bg-neutral-200"
                          >
                            Alterar %
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePartner(p)}
                            className="rounded bg-red-100 px-2 py-1 text-xs font-bold text-red-700 hover:bg-red-200"
                          >
                            ✕
                          </button>
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                        <div className="h-full rounded-full bg-green-600" style={{ width: `${Math.min(100, p.percentage)}%` }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className={cardClass}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-neutral-800">Divisão do resultado</h2>
                <select
                  value={rateioBase}
                  onChange={(e) => setRateioBase(e.target.value as 'month' | 'year' | 'all')}
                  className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-black"
                >
                  <option value="month">{monthLabel(month)}</option>
                  <option value="year">Acumulado de {year}</option>
                  <option value="all">Todos os meses</option>
                </select>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-green-50 p-4">
                <span className="text-sm font-semibold text-green-900">Resultado líquido</span>
                <span className={`text-xl font-extrabold ${baseResult >= 0 ? 'text-green-800' : 'text-red-700'}`}>
                  {brl(baseResult)}
                </span>
              </div>

              {partners.length === 0 ? (
                <p className="text-xs text-neutral-400">Cadastre os sócios para ver o rateio.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs text-neutral-500">
                      <th className="p-2">Sócio</th>
                      <th className="p-2 text-right">%</th>
                      <th className="p-2 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partners.map((p) => (
                      <tr key={p.id} className="border-b">
                        <td className="p-2 font-semibold text-black">{p.name}</td>
                        <td className="p-2 text-right text-neutral-700">{p.percentage}%</td>
                        <td
                          className={`p-2 text-right font-bold ${
                            share(p.percentage, baseResult) >= 0 ? 'text-green-700' : 'text-red-700'
                          }`}
                        >
                          {brl(share(p.percentage, baseResult))}
                        </td>
                      </tr>
                    ))}
                    {Math.abs(remainingPct) > 0.0001 && (
                      <tr className="text-neutral-500">
                        <td className="p-2">Não distribuído</td>
                        <td className="p-2 text-right">{remainingPct}%</td>
                        <td className="p-2 text-right">{brl(share(remainingPct, baseResult))}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {partners.length > 0 && (
            <div className={cardClass}>
              <h2 className="text-lg font-bold text-neutral-800">Rateio mês a mês</h2>
              <p className="text-xs text-neutral-500">Últimos 12 meses até {monthLabel(month)}.</p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b bg-neutral-100 text-neutral-600">
                      <th className="p-3">Mês</th>
                      <th className="p-3 text-right">Resultado</th>
                      {partners.map((p) => (
                        <th key={p.id} className="p-3 text-right">
                          {p.name} ({p.percentage}%)
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {series.map((s) => (
                      <tr key={s.key} className={`border-b ${s.key === month ? 'bg-green-50' : ''}`}>
                        <td className="p-3 font-semibold text-black">{monthLabel(s.key)}</td>
                        <td
                          className={`p-3 text-right font-bold ${
                            s.row.result >= 0 ? 'text-green-800' : 'text-red-700'
                          }`}
                        >
                          {brl(s.row.result)}
                        </td>
                        {partners.map((p) => (
                          <td key={p.id} className="p-3 text-right text-neutral-800">
                            {brl(share(p.percentage, s.row.result))}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'relatorio' && <MonthlyReport month={month} />}

      {tab === 'homecare' && <HomeCareFinance />}
    </div>
  )
}
