import { prisma } from '@/lib/prisma'

const OFFSET_MS = -3 * 60 * 60 * 1000 // horário de Brasília (UTC-3)
const DONE_STATUS = ['CONCLUIDO', 'COMPLETED']

export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

export const monthKeyOf = (date: Date) => {
  const d = new Date(date.getTime() + OFFSET_MS)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export const isValidMonthKey = (key: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(key)

export const monthLabel = (key: string) => {
  const [y, m] = key.split('-').map(Number)
  return `${MONTH_NAMES[m - 1]} de ${y}`
}

export const yearRange = (year: number) => ({
  start: new Date(Date.UTC(year, 0, 1) - OFFSET_MS),
  end: new Date(Date.UTC(year + 1, 0, 1) - OFFSET_MS),
})

// Data que vale para o financeiro: a data da coleta; se não houver, a de cadastro
export const homeCareDate = (h: { collectionDate: Date | null; createdAt: Date }) =>
  h.collectionDate ?? h.createdAt

export async function loadFinanceData(range?: { start: Date; end: Date }) {
  const createdAt = range ? { gte: range.start, lt: range.end } : undefined

  const [orders, homeCare, expenses] = await Promise.all([
    prisma.order.findMany({
      where: { status: { in: DONE_STATUS }, ...(createdAt ? { createdAt } : {}) },
      include: {
        patient: { select: { fullName: true, cpf: true } },
        professional: { select: { name: true, specialty: true } },
        items: { include: { exam: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.homeCareOrder.findMany({
      where: {
        status: 'CONCLUIDO',
        ...(range
          ? {
              OR: [
                { collectionDate: { gte: range.start, lt: range.end } },
                { collectionDate: null, createdAt: { gte: range.start, lt: range.end } },
              ],
            }
          : {}),
      },
      include: {
        patient: { select: { fullName: true, cpf: true } },
        items: { include: { exam: { select: { name: true } } } },
        reimbursements: true,
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.expense.findMany({
      where: range ? { date: { gte: range.start, lt: range.end } } : undefined,
      orderBy: { date: 'asc' },
    }),
  ])

  return { orders, homeCare, expenses }
}

export type FinanceData = Awaited<ReturnType<typeof loadFinanceData>>

export interface Totals {
  labOrders: number
  homeCareOrders: number
  consultations: number
  examsRevenue: number
  consultationsRevenue: number
  homeCareExamsRevenue: number
  collectionFees: number
  travelFees: number
  expenses: number
  reimbursementsPending: number
  reimbursementsPaid: number
}

export const emptyTotals = (): Totals => ({
  labOrders: 0,
  homeCareOrders: 0,
  consultations: 0,
  examsRevenue: 0,
  consultationsRevenue: 0,
  homeCareExamsRevenue: 0,
  collectionFees: 0,
  travelFees: 0,
  expenses: 0,
  reimbursementsPending: 0,
  reimbursementsPaid: 0,
})

export function addOrder(t: Totals, o: { totalPrice: number; consultationFee: number }) {
  const fee = o.consultationFee || 0
  t.labOrders += 1
  t.examsRevenue += o.totalPrice - fee
  if (fee > 0) {
    t.consultations += 1
    t.consultationsRevenue += fee
  }
}

export function addHomeCare(
  t: Totals,
  h: {
    examsTotal: number
    collectionFee: number
    travelFee: number
    reimbursements: { amount: number; status: string }[]
  }
) {
  t.homeCareOrders += 1
  t.homeCareExamsRevenue += h.examsTotal
  t.collectionFees += h.collectionFee
  t.travelFees += h.travelFee
  for (const r of h.reimbursements) {
    if (r.status === 'PAGO') t.reimbursementsPaid += r.amount
    else t.reimbursementsPending += r.amount
  }
}

export function summarize(t: Totals) {
  const homeCareRevenue = t.homeCareExamsRevenue + t.collectionFees + t.travelFees
  const revenueTotal = t.examsRevenue + t.consultationsRevenue + homeCareRevenue
  const reimbursementsTotal = t.reimbursementsPending + t.reimbursementsPaid
  const expensesTotal = t.expenses + reimbursementsTotal
  const services = t.labOrders + t.homeCareOrders

  return {
    services,
    labOrders: t.labOrders,
    homeCareOrders: t.homeCareOrders,
    consultations: t.consultations,
    examsRevenue: round(t.examsRevenue),
    consultationsRevenue: round(t.consultationsRevenue),
    homeCareExamsRevenue: round(t.homeCareExamsRevenue),
    collectionFees: round(t.collectionFees),
    travelFees: round(t.travelFees),
    homeCareRevenue: round(homeCareRevenue),
    revenueTotal: round(revenueTotal),
    operatingExpenses: round(t.expenses),
    reimbursementsPending: round(t.reimbursementsPending),
    reimbursementsPaid: round(t.reimbursementsPaid),
    reimbursementsTotal: round(reimbursementsTotal),
    expensesTotal: round(expensesTotal),
    result: round(revenueTotal - expensesTotal),
    averageTicket: services ? round(revenueTotal / services) : 0,
  }
}

export type Summary = ReturnType<typeof summarize>

export function totalsOf(data: FinanceData) {
  const t = emptyTotals()
  for (const o of data.orders) addOrder(t, o)
  for (const h of data.homeCare) addHomeCare(t, h)
  for (const e of data.expenses) t.expenses += e.amount
  return t
}

export function groupByMonth(data: FinanceData) {
  const map = new Map<string, Totals>()
  const get = (key: string) => {
    let t = map.get(key)
    if (!t) {
      t = emptyTotals()
      map.set(key, t)
    }
    return t
  }

  for (const o of data.orders) addOrder(get(monthKeyOf(o.createdAt)), o)
  for (const h of data.homeCare) addHomeCare(get(monthKeyOf(homeCareDate(h))), h)
  for (const e of data.expenses) get(monthKeyOf(e.date)).expenses += e.amount

  return map
}

export function monthlyRows(map: Map<string, Totals>) {
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, t]) => ({ key, label: monthLabel(key), ...summarize(t) }))
}

export function orderDescription(o: {
  consultationFee: number
  professional: { name: string } | null
  items: { exam: { name: string } | null }[]
}) {
  const parts: string[] = []
  if (o.consultationFee > 0 || o.professional) {
    parts.push(`Consulta${o.professional ? ` – ${o.professional.name}` : ''}`)
  }
  for (const item of o.items) {
    if (item.exam?.name) parts.push(item.exam.name)
  }
  return parts.join(', ') || '-'
}