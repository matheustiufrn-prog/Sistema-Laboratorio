import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidMonthKey } from '@/lib/finance'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const description = String(body.description || '').trim()
    const amount = Number(body.amount)
    const month = String(body.month || '').trim()

    if (!(amount > 0)) {
      return NextResponse.json({ error: 'Informe um valor maior que zero.' }, { status: 400 })
    }
    if (!isValidMonthKey(month)) {
      return NextResponse.json({ error: 'Mês de referência inválido.' }, { status: 400 })
    }

    const revenue = await prisma.manualRevenue.create({
      data: { description, amount, month },
    })

    return NextResponse.json({ success: true, revenue }, { status: 201 })
  } catch (error) {
    console.error('ERRO AO LANÇAR RECEITA:', error)
    return NextResponse.json({ error: 'Erro ao lançar a receita.' }, { status: 500 })
  }
}
