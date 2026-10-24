import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const homeCareOrderId = String(body.homeCareOrderId || '')
    const description = String(body.description || '').trim()
    const amount = Number(body.amount)

    if (!homeCareOrderId || !description || !(amount > 0)) {
      return NextResponse.json(
        { error: 'Informe a descrição e um valor maior que zero.' },
        { status: 400 }
      )
    }

    const reimbursement = await prisma.homeCareReimbursement.create({
      data: { homeCareOrderId, description, amount },
    })

    return NextResponse.json({ success: true, reimbursement }, { status: 201 })
  } catch (error) {
    console.error('ERRO AO CRIAR REEMBOLSO:', error)
    return NextResponse.json({ error: 'Erro ao cadastrar o reembolso.' }, { status: 500 })
  }
}