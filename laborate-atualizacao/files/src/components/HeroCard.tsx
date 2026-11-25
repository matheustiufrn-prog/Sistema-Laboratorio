'use client'

import { useEffect, useState } from 'react'

interface Props {
  monthLabel: string
  revenue: number
  previousRevenue: number
  result: number
  services: number
  loading: boolean
}

const GOAL_KEY = 'finance_goal'

const brl = (v: number) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const RADIUS = 52
const CIRC = 2 * Math.PI * RADIUS

export default function HeroCard({ monthLabel, revenue, previousRevenue, result, services, loading }: Props) {
  const [name, setName] = useState('')
  const [greeting, setGreeting] = useState('Olá')
  const [goal, setGoal] = useState(0)

  useEffect(() => {
    const email = localStorage.getItem('user_email') || ''
    const raw = email.split('@')[0] || ''
    setName(raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : '')

    const hour = Number(
      new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        hourCycle: 'h23',
        timeZone: 'America/Fortaleza',
      }).format(new Date())
    )
    setGreeting(hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite')

    const saved = Number(localStorage.getItem(GOAL_KEY) || 0)
    if (saved > 0) setGoal(saved)
  }, [])

  const target = goal > 0 ? goal : previousRevenue
  const pct = target > 0 ? (revenue / target) * 100 : 0
  const ringPct = Math.max(0, Math.min(100, pct))
  const remaining = Math.max(0, target - revenue)
  const trend = previousRevenue > 0 ? ((revenue - previousRevenue) / previousRevenue) * 100 : null

  const headline = loading
    ? 'Carregando os números...'
    : revenue <= 0
      ? `Vamos começar ${monthLabel}`
      : trend !== null && trend >= 0
        ? 'Seu laboratório está em alta neste mês'
        : 'Falta pouco para superar o mês passado'

  const subline = loading
    ? ''
    : target <= 0
      ? 'Defina uma meta mensal para acompanhar o progresso.'
      : remaining > 0
        ? `Faltam ${brl(remaining)} para ${goal > 0 ? 'a meta do mês' : 'igualar o mês anterior'}.`
        : goal > 0
          ? 'Meta do mês batida. Parabéns!'
          : 'Você já superou o faturamento do mês anterior.'

  const handleGoal = () => {
    const typed = window.prompt('Meta de faturamento mensal (R$):', goal > 0 ? String(goal) : '')
    if (typed === null) return

    const value = Number(typed.replace(/\./g, '').replace(',', '.'))
    if (!(value >= 0)) return

    if (value === 0) {
      localStorage.removeItem(GOAL_KEY)
      setGoal(0)
    } else {
      localStorage.setItem(GOAL_KEY, String(value))
      setGoal(value)
    }
  }

  return (
    <div className="lift relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-500 via-green-600 to-green-800 p-6 text-white shadow-lg sm:p-8">
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl space-y-3">
          <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-widest backdrop-blur">
            {monthLabel}
          </span>
          <h2 className="text-2xl font-extrabold leading-tight sm:text-3xl">
            {greeting}
            {name ? `, ${name}` : ''}!
          </h2>
          <p className="text-lg font-semibold">{headline}</p>
          {subline && <p className="text-sm text-white/85">{subline}</p>}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleGoal}
              className="rounded-full bg-white px-4 py-2 text-xs font-bold text-green-800 shadow-sm transition hover:bg-green-50"
            >
              🎯 {goal > 0 ? 'Alterar meta' : 'Definir meta'}
            </button>
            <span className="rounded-full bg-white/20 px-3 py-2 text-xs font-semibold backdrop-blur">
              {services} atendimento(s)
            </span>
            <span className="rounded-full bg-white/20 px-3 py-2 text-xs font-semibold backdrop-blur">
              Resultado {brl(result)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center md:pr-4">
          <div className="relative h-36 w-36">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
              <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="10" />
              <circle
                cx="60"
                cy="60"
                r={RADIUS}
                fill="none"
                stroke="#ffffff"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC * (1 - ringPct / 100)}
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold">{loading ? '...' : `${Math.round(pct)}%`}</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/80">
                {goal > 0 ? 'da meta' : 'do mês ant.'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
