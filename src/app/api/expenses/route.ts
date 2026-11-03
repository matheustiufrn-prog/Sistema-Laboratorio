import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseDateInput, todayInBrasilia } from '@/lib/dates'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const description = String(body.description || '').trim()
    const amount = Number(body.amount)
    const category = String(body.category || '').trim() || 'Operacional'
    const date = body.date ? parseDateInput(body.date) : todayInBrasilia()

    if (!description) {
      return NextResponse.json({ error: 'Informe a descrição da despesa.' }, { status: 400 })
    }
    if (!(amount > 0)) {
      return NextResponse.json({ error: 'Informe um valor maior que zero.' }, { status: 400 })
    }
    if (!date) {
      return NextResponse.json({ error: 'Data inválida.' }, { status: 400 })
    }

    const expense = await prisma.expense.create({
      data: { description, amount, category, date },
    })

    return NextResponse.json({ success: true, expense }, { status: 201 })
  } catch (error) {
    console.error('ERRO AO CRIAR DESPESA:', error)
    return NextResponse.json({ error: 'Erro ao cadastrar a despesa.' }, { status: 500 })
  }
}
