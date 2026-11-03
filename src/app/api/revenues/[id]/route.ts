import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { isValidMonthKey } from '@/lib/finance'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { id } = await params
    const body = await request.json()

    const data: Prisma.ManualRevenueUpdateInput = {}

    if (body.month !== undefined) {
      const month = String(body.month).trim()
      if (!isValidMonthKey(month)) {
        return NextResponse.json({ error: 'Mês de referência inválido.' }, { status: 400 })
      }
      data.month = month
    }
    if (body.amount !== undefined) {
      const amount = Number(body.amount)
      if (!(amount > 0)) {
        return NextResponse.json({ error: 'Valor inválido.' }, { status: 400 })
      }
      data.amount = amount
    }
    if (body.description !== undefined) {
      data.description = String(body.description).trim()
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nada para atualizar.' }, { status: 400 })
    }

    await prisma.manualRevenue.update({ where: { id }, data })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('ERRO AO ATUALIZAR RECEITA:', error)
    return NextResponse.json({ error: 'Erro ao atualizar a receita.' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params
    await prisma.manualRevenue.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('ERRO AO EXCLUIR RECEITA:', error)
    return NextResponse.json({ error: 'Erro ao excluir a receita.' }, { status: 500 })
  }
}
