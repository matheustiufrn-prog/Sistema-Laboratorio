import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { id } = await params
    const body = await request.json()

    const data: Prisma.PartnerUpdateInput = {}

    if (body.name !== undefined) {
      const name = String(body.name).trim()
      if (!name) {
        return NextResponse.json({ error: 'O nome não pode ficar vazio.' }, { status: 400 })
      }
      data.name = name
    }

    if (body.percentage !== undefined) {
      const percentage = Number(body.percentage)
      if (!(percentage > 0 && percentage <= 100)) {
        return NextResponse.json({ error: 'A porcentagem precisa estar entre 0 e 100.' }, { status: 400 })
      }

      const agg = await prisma.partner.aggregate({
        where: { NOT: { id } },
        _sum: { percentage: true },
      })
      const others = agg._sum.percentage ?? 0

      if (others + percentage > 100.0001) {
        return NextResponse.json(
          { error: `A soma passaria de 100%. Os outros sócios somam ${others}%.` },
          { status: 400 }
        )
      }
      data.percentage = percentage
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nada para atualizar.' }, { status: 400 })
    }

    await prisma.partner.update({ where: { id }, data })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('ERRO AO ATUALIZAR SÓCIO:', error)
    return NextResponse.json({ error: 'Erro ao atualizar o sócio.' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params
    await prisma.partner.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('ERRO AO EXCLUIR SÓCIO:', error)
    return NextResponse.json({ error: 'Erro ao excluir o sócio.' }, { status: 500 })
  }
}
