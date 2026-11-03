import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const name = String(body.name || '').trim()
    const percentage = Number(body.percentage)

    if (!name) {
      return NextResponse.json({ error: 'Informe o nome do sócio.' }, { status: 400 })
    }
    if (!(percentage > 0 && percentage <= 100)) {
      return NextResponse.json({ error: 'A porcentagem precisa estar entre 0 e 100.' }, { status: 400 })
    }

    const agg = await prisma.partner.aggregate({ _sum: { percentage: true } })
    const current = agg._sum.percentage ?? 0

    if (current + percentage > 100.0001) {
      return NextResponse.json(
        { error: `A soma passaria de 100%. Já distribuído: ${current}%.` },
        { status: 400 }
      )
    }

    const partner = await prisma.partner.create({ data: { name, percentage } })
    return NextResponse.json({ success: true, partner }, { status: 201 })
  } catch (error) {
    console.error('ERRO AO CADASTRAR SÓCIO:', error)
    return NextResponse.json({ error: 'Erro ao cadastrar o sócio.' }, { status: 500 })
  }
}
