import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Context = { params: Promise<{ id: string }> | { id: string } }

const orderInclude = {
  patient: true,
  items: {
    include: {
      exam: true,
    },
  },
}

// Normaliza os status aceitos para os valores do schema
function normalizeStatus(value: string): string | null {
  const s = value.toUpperCase()
  if (s === 'COMPLETED' || s === 'CONCLUIDO') return 'CONCLUIDO'
  if (s === 'PENDING' || s === 'ORCAMENTO') return 'ORCAMENTO'
  return null
}

async function updateStatus(request: Request, context: Context) {
  try {
    const { id } = await context.params

    let status: string | null = 'CONCLUIDO'
    try {
      const body = await request.json()
      if (body?.status) status = normalizeStatus(String(body.status))
    } catch {
      // sem body, mantém CONCLUIDO
    }

    if (!status) {
      return NextResponse.json({ error: 'Status inválido.' }, { status: 400 })
    }

    const existing = await prisma.order.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Ordem de serviço não encontrada.' },
        { status: 404 }
      )
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: orderInclude,
    })

    return NextResponse.json({ success: true, order: updatedOrder })
  } catch (error: any) {
    console.error('ERRO AO ATUALIZAR STATUS DA OS:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar status da OS.' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request, context: Context) {
  return updateStatus(request, context)
}

export async function PUT(request: Request, context: Context) {
  return updateStatus(request, context)
}

export async function GET(_request: Request, context: Context) {
  try {
    const { id } = await context.params

    const order = await prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Ordem de serviço não encontrada.' },
        { status: 404 }
      )
    }

    return NextResponse.json(order)
  } catch (error: any) {
    console.error('ERRO AO BUSCAR OS:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar a OS.' },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const { id } = await context.params

    await prisma.order.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('ERRO AO EXCLUIR OS:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao excluir a OS.' },
      { status: 500 }
    )
  }
}