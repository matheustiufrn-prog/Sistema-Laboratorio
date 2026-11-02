import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { parseDateInput } from '@/lib/dates'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { id } = await params
    const body = await request.json()

    const data: Prisma.HomeCareOrderUpdateInput = {}

    if (body.status !== undefined) {
      if (!['ORCAMENTO', 'CONCLUIDO'].includes(body.status)) {
        return NextResponse.json({ error: 'Status inválido.' }, { status: 400 })
      }
      data.status = body.status
    }

    if (body.collectionDate !== undefined) {
      const date = parseDateInput(body.collectionDate)
      if (!date) {
        return NextResponse.json({ error: 'Data da coleta inválida.' }, { status: 400 })
      }
      data.collectionDate = date
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nada para atualizar.' }, { status: 400 })
    }

    const order = await prisma.homeCareOrder.update({ where: { id }, data })
    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error('ERRO AO ATUALIZAR HOME CARE:', error)
    return NextResponse.json({ error: 'Erro ao atualizar a OS.' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params
    await prisma.homeCareOrder.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('ERRO AO EXCLUIR HOME CARE:', error)
    return NextResponse.json({ error: 'Erro ao excluir a OS.' }, { status: 500 })
  }
}