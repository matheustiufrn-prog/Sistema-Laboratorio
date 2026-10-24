import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { id } = await params
    const { status } = await request.json()

    if (!['ORCAMENTO', 'CONCLUIDO'].includes(status)) {
      return NextResponse.json({ error: 'Status inválido.' }, { status: 400 })
    }

    const order = await prisma.homeCareOrder.update({ where: { id }, data: { status } })
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