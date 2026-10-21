import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // 1. Buscar todas as Ordens Concluídas com Paciente e Exames
    const completedOrders = await prisma.order.findMany({
      where: { status: 'CONCLUIDO' },
      include: {
        patient: true,
        items: {
          include: {
            exam: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // 2. Buscar todas as Despesas
    const expenses = await prisma.expense.findMany({
      orderBy: { date: 'desc' }
    })

    // 3. Totais Gerais
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalPrice, 0)
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
    const netProfit = totalRevenue - totalExpenses
    const totalOrders = completedOrders.length

    // 4. Agrupamento Mês a Mês
    const monthlyStats: Record<string, { month: string; revenue: number; expenses: number; ordersCount: number }> = {}

    completedOrders.forEach((order) => {
      const date = new Date(order.createdAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })

      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { month: monthLabel, revenue: 0, expenses: 0, ordersCount: 0 }
      }
      monthlyStats[monthKey].revenue += order.totalPrice
      monthlyStats[monthKey].ordersCount += 1
    })

    expenses.forEach((expense) => {
      const date = new Date(expense.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })

      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { month: monthLabel, revenue: 0, expenses: 0, ordersCount: 0 }
      }
      monthlyStats[monthKey].expenses += expense.amount
    })

    // Ordenar estatísticas mensais da mais recente para a mais antiga
    const monthlyData = Object.keys(monthlyStats)
      .sort((a, b) => b.localeCompare(a))
      .map((key) => monthlyStats[key])

    return NextResponse.json({
      totalRevenue,
      totalExpenses,
      netProfit,
      totalOrders,
      monthlyData,
      recentOrders: completedOrders,
      expenses
    }, { status: 200 })
  } catch (error: any) {
    console.error('Erro ao gerar dados do dashboard:', error)
    return NextResponse.json({ error: 'Erro ao carregar o dashboard.' }, { status: 500 })
  }
}