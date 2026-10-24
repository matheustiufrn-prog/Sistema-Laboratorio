import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const include = {
  patient: true,
  items: { include: { exam: true } },
  reimbursements: { orderBy: { createdAt: 'asc' as const } },
}

export async function GET() {
  try {
    const orders = await prisma.homeCareOrder.findMany({
      include,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(orders)
  } catch (error) {
    console.error('ERRO AO LISTAR HOME CARE:', error)
    return NextResponse.json({ error: 'Erro ao listar ordens de Home Care.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const patientId = String(body.patientId || '')
    const examIds: string[] = Array.isArray(body.examIds) ? body.examIds.map(String) : []
    const neighborhood = String(body.neighborhood || '').trim()
    const city = String(body.city || '').trim()
    const collectionLab = String(body.collectionLab || '').trim()
    const collectionFee = Number(body.collectionFee) || 0
    const travelFee = Number(body.travelFee) || 0

    if (!patientId) {
      return NextResponse.json({ error: 'Selecione um paciente.' }, { status: 400 })
    }
    if (examIds.length === 0) {
      return NextResponse.json({ error: 'Selecione pelo menos um exame.' }, { status: 400 })
    }
    if (!neighborhood || !city) {
      return NextResponse.json({ error: 'Informe o bairro e a cidade da coleta.' }, { status: 400 })
    }
    if (!collectionLab) {
      return NextResponse.json({ error: 'Informe o laboratório que fez a coleta.' }, { status: 400 })
    }
    if (collectionFee < 0 || travelFee < 0) {
      return NextResponse.json({ error: 'As taxas não podem ser negativas.' }, { status: 400 })
    }

    const exams = await prisma.exam.findMany({ where: { id: { in: examIds } } })
    if (exams.length === 0) {
      return NextResponse.json({ error: 'Nenhum exame válido encontrado.' }, { status: 404 })
    }

    const examsTotal = exams.reduce((sum, e) => sum + e.price, 0)
    const totalPrice = examsTotal + collectionFee + travelFee

    const order = await prisma.homeCareOrder.create({
      data: {
        patientId,
        neighborhood,
        city,
        collectionLab,
        collectionFee,
        travelFee,
        examsTotal,
        totalPrice,
        status: 'ORCAMENTO',
        items: { create: exams.map((e) => ({ examId: e.id, price: e.price })) },
      },
      include,
    })

    return NextResponse.json({ success: true, order }, { status: 201 })
  } catch (error) {
    console.error('ERRO AO CRIAR HOME CARE:', error)
    return NextResponse.json({ error: 'Erro ao criar a OS de Home Care.' }, { status: 500 })
  }
}