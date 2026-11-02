import { NextResponse } from 'next/server'
import {
  loadFinanceData,
  totalsOf,
  groupByMonth,
  monthlyRows,
  summarize,
  orderDescription,
  homeCareDate,
  round,
} from '@/lib/finance'

export async function GET() {
  try {
    const data = await loadFinanceData()

    const summary = summarize(totalsOf(data))
    const monthly = monthlyRows(groupByMonth(data))

    const recent = [
      ...data.orders.map((o) => ({
        id: o.id,
        kind: 'LAB' as const,
        date: o.createdAt,
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
      .slice(0, 15)

    const expenses = data.expenses
      .slice()
      .reverse()
      .map((e) => ({
        id: e.id,
        description: e.description,
        amount: e.amount,
        category: e.category,
        date: e.date,
      }))

    return NextResponse.json({ summary, monthly, recent, expenses })
  } catch (error) {
    console.error('ERRO AO GERAR DADOS DO DASHBOARD:', error)
    return NextResponse.json({ error: 'Erro ao carregar o dashboard.' }, { status: 500 })
  }
}