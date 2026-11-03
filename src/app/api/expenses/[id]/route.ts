import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { parseDateInput } from '@/lib/dates'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { id } = await params
    const body = await request.json()

    const data: Prisma.ExpenseUpdateInput = {}

    if (body.description !== undefined) {
      const v = String(body.description).trim()
      if (!v) return NextResponse.json({ error: 'A descrição não pode ficar vazia.' }, { status: 400 })
      data.description = v
    }
    if (body.amount !== undefined) {
      const v = Number(body.amount)
      if (!(v > 0)) return NextResponse.json({ error: 'Valor inválido.' }, { status: 400 })
      data.amount = v
    }
    if (body.category !== undefined) {
      data.category = String(body.category).trim() || 'Operacional'
    }
    if (body.date !== undefined) {
      const d = parseDateInput(body.date)
      if (!d) return NextResponse.json({ error: 'Data inválida.' }, { status: 400 })
      data.date = d
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nada para atualizar.' }, { status: 400 })
    }

    await prisma.expense.update({ where: { id }, data })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('ERRO AO ATUALIZAR DESPESA:', error)
    return NextResponse.json({ error: 'Erro ao atualizar a despesa.' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params
    await prisma.expense.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('ERRO AO EXCLUIR DESPESA:', error)
    return NextResponse.json({ error: 'Erro ao excluir a despesa.' }, { status: 500 })
  }
}
