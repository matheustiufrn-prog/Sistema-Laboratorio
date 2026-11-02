import { NextResponse } from 'next/server'
import {
  MONTH_NAMES,
  emptyTotals,
  groupByMonth,
  homeCareDate,
  isValidMonthKey,
  loadFinanceData,
  monthKeyOf,
  monthLabel,
  orderDescription,
  round,
  summarize,
  totalsOf,
  yearRange,
} from '@/lib/finance'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') || monthKeyOf(new Date())

    if (!isValidMonthKey(month)) {
      return NextResponse.json({ error: 'Mês inválido. Use o formato AAAA-MM.' }, { status: 400 })
    }

    const year = Number(month.slice(0, 4))
    const data = await loadFinanceData(yearRange(year))
    const byMonth = groupByMonth(data)

    const orders = data.orders
      .filter((o) => monthKeyOf(o.createdAt) === month)
      .map((o) => {
        const fee = o.consultationFee || 0
        return {
          id: o.id,
          date: o.createdAt,
          patient: o.patient?.fullName || 'Paciente',
          cpf: o.patient?.cpf || '',
          description: orderDescription(o),
          examsTotal: round(o.totalPrice - fee),
          consultationFee: round(fee),
          total: round(o.totalPrice),
        }
      })

    const homeCare = data.homeCare
      .filter((h) => monthKeyOf(homeCareDate(h)) === month)
      .sort((a, b) => homeCareDate(a).getTime() - homeCareDate(b).getTime())
      .map((h) => ({
        id: h.id,
        date: homeCareDate(h),
        patient: h.patient?.fullName || 'Paciente',
        place: `${h.neighborhood}, ${h.city}`,
        lab: h.collectionLab,
        exams: h.items.map((i) => i.exam?.name).filter(Boolean).join(', ') || '-',
        examsTotal: round(h.examsTotal),
        collectionFee: round(h.collectionFee),
        travelFee: round(h.travelFee),
        reimbursementsPending: round(
          h.reimbursements.filter((r) => r.status !== 'PAGO').reduce((s, r) => s + r.amount, 0)
        ),
        reimbursementsPaid: round(
          h.reimbursements.filter((r) => r.status === 'PAGO').reduce((s, r) => s + r.amount, 0)
        ),
        total: round(h.totalPrice),
      }))

    const expenses = data.expenses
      .filter((e) => monthKeyOf(e.date) === month)
      .map((e) => ({
        id: e.id,
        date: e.date,
        description: e.description,
        category: e.category,
        amount: round(e.amount),
      }))

    const categoryMap = new Map<string, number>()
    for (const e of expenses) {
      categoryMap.set(e.category, (categoryMap.get(e.category) || 0) + e.amount)
    }
    const expensesByCategory = Array.from(categoryMap.entries())
      .map(([category, amount]) => ({ category, amount: round(amount) }))
      .sort((a, b) => b.amount - a.amount)

    const yearRows = MONTH_NAMES.map((name, i) => {
      const key = `${year}-${String(i + 1).padStart(2, '0')}`
      return { key, name, ...summarize(byMonth.get(key) ?? emptyTotals()) }
    })

    return NextResponse.json({
      month,
      label: monthLabel(month),
      generatedAt: new Date().toISOString(),
      summary: summarize(byMonth.get(month) ?? emptyTotals()),
      orders,
      homeCare,
      expenses,
      expensesByCategory,
      year: { year, rows: yearRows, totals: summarize(totalsOf(data)) },
    })
  } catch (error) {
    console.error('ERRO AO GERAR RELATÓRIO MENSAL:', error)
    return NextResponse.json({ error: 'Erro ao gerar o relatório.' }, { status: 500 })
  }
}