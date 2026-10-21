import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { date: 'desc' }
    })
    return NextResponse.json(expenses, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar despesas.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { description, amount, category, date } = body

    if (!description || amount === undefined) {
      return NextResponse.json({ error: 'Descrição e valor são obrigatórios.' }, { status: 400 })
    }

    const newExpense = await prisma.expense.create({
      data: {
        description,
        amount: parseFloat(amount),
        category: category || 'Operacional',
        date: date ? new Date(date) : new Date()
      }
    })

    return NextResponse.json({ message: 'Despesa registrada!', expense: newExpense }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao cadastrar despesa.' }, { status: 500 })
  }
}