import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  loadFinanceData,
  totalsOf,
  groupByMonth,
  monthlyRows,
  monthLabel,
  summarize,
  orderDescription,
  orderDate,
  homeCareDate,
  round,
} from '@/lib/finance'

export async function GET() {
  try {
    const [data, partners] = await Promise.all([
      loadFinanceData(),
      prisma.partner.findMany({ orderBy: { createdAt: 'asc' } }),
    ])

    const summary = summarize(totalsOf(data))
    const monthly = monthlyRows(groupByMonth(data))

    const recent = [
      ...data.orders.map((o) => ({
        id: o.id,
        kind: 'LAB' as const,
        date: orderDate(o),
        patient: o.patient?.fullName || 'Paciente',
        description: orderDescription(o),
        total: round(o.totalPrice),
      })),
      ...data.homeCare.map((h) => ({
        id: h.id,
        kind: 'HOMECARE' as const,
        date: homeCareDate(h),
        patient: h.patient?.fullName || 'Paciente',
        description: h.items.map((i) => i.exam?.name).filter(Boolean).join(', ') || '-',
        total: round(h.totalPrice),
      })),
    ]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 40)

    const expenses = data.expenses
      .slice()
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .map((e) => ({
        id: e.id,
        description: e.description,
        amount: e.amount,
        category: e.category,
        date: e.date,
      }))

    const revenues = data.manualRevenues
      .slice()
      .sort((a, b) => b.month.localeCompare(a.month))
      .map((r) => ({
        id: r.id,
        description: r.description,
        amount: r.amount,
        month: r.month,
        label: monthLabel(r.month),
      }))

    return NextResponse.json({
      summary,
      monthly,
      recent,
      expenses,
      revenues,
      partners: partners.map((p) => ({ id: p.id, name: p.name, percentage: p.percentage })),
    })
  } catch (error) {
    console.error('ERRO AO GERAR DADOS DO DASHBOARD:', error)
    return NextResponse.json({ error: 'Erro ao carregar o dashboard.' }, { status: 500 })
  }
}
