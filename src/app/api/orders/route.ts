import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const include = {
  patient: true,
  professional: { select: { id: true, name: true, specialty: true } },
  items: { include: { exam: true } },
}

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(orders)
  } catch (error: any) {
    console.error('ERRO AO LISTAR OS:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao listar ordens de serviço.' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const patientId: string | undefined = body.patientId
    const professionalId: string | null = body.professionalId ? String(body.professionalId) : null
    const rawExams: any[] = body.examIds ?? body.exams ?? []

    const examIds: string[] = rawExams
      .map((e: any) => (typeof e === 'string' ? e : e?.id ?? e?.examId))
      .filter(Boolean)

    if (!patientId) {
      return NextResponse.json({ error: 'Selecione um paciente.' }, { status: 400 })
    }

    if (examIds.length === 0 && !professionalId) {
      return NextResponse.json(
        { error: 'Selecione pelo menos um exame ou uma consulta.' },
        { status: 400 }
      )
    }

    // O preço vem sempre do banco, nunca do frontend
    let exams: { id: string; price: number }[] = []
    if (examIds.length > 0) {
      exams = await prisma.exam.findMany({ where: { id: { in: examIds } } })
      if (exams.length === 0) {
        return NextResponse.json({ error: 'Nenhum exame válido encontrado.' }, { status: 404 })
      }
    }

    let consultationFee = 0
    if (professionalId) {
      const professional = await prisma.professional.findUnique({ where: { id: professionalId } })
      if (!professional || !professional.active) {
        return NextResponse.json({ error: 'Profissional inválido ou inativo.' }, { status: 400 })
      }
      consultationFee = professional.consultationPrice
    }

    const examsTotal = exams.reduce((sum, e) => sum + e.price, 0)
    const totalPrice = Math.round((examsTotal + consultationFee) * 100) / 100

    const order = await prisma.order.create({
      data: {
        patientId,
        professionalId,
        consultationFee,
        totalPrice,
        status: 'ORCAMENTO',
        items: { create: exams.map((e) => ({ examId: e.id, price: e.price })) },
      },
      include,
    })

    return NextResponse.json({ success: true, order }, { status: 201 })
  } catch (error: any) {
    console.error('ERRO CRITICO AO CRIAR OS:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao processar a ordem de serviço.' },
      { status: 500 }
    )
  }
}