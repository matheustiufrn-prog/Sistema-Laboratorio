import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Listar todas as ordens de serviço
export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        patient: true,
        items: {
          include: {
            exam: true,
          },
        },
      },
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

// Criar nova ordem de serviço / orçamento
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Aceita diferentes formatos vindos do frontend
    const patientId: string | undefined = body.patientId
    const rawExams: any[] = body.examIds ?? body.exams ?? []

    // Normaliza: aceita ["id1","id2"] ou [{ id: "id1" }, ...]
    const examIds: string[] = rawExams
      .map((e: any) => (typeof e === 'string' ? e : e?.id ?? e?.examId))
      .filter(Boolean)

    // 1. Validação
    if (!patientId) {
      return NextResponse.json(
        { error: 'Selecione um paciente.' },
        { status: 400 }
      )
    }

    if (examIds.length === 0) {
      return NextResponse.json(
        { error: 'Selecione pelo menos um exame.' },
        { status: 400 }
      )
    }

    // 2. Buscar os exames no banco (o preço vem do banco, não do frontend)
    const exams = await prisma.exam.findMany({
      where: { id: { in: examIds } },
    })

    if (exams.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum exame válido encontrado.' },
        { status: 404 }
      )
    }

    const totalPrice = exams.reduce((sum, exam) => sum + exam.price, 0)

    // 3. Criar a OS como orçamento (sem itens aninhados)
    const newOrder = await prisma.order.create({
      data: {
        patientId,
        totalPrice,
        status: 'ORCAMENTO',
      },
    })

    // 4. Criar os itens da OS separadamente, agora COM o price
    for (const exam of exams) {
      await prisma.orderItem.create({
        data: {
          orderId: newOrder.id,
          examId: exam.id,
          price: exam.price,
        },
      })
    }

    // 5. Retornar a ordem completa com paciente e itens
    const completeOrder = await prisma.order.findUnique({
      where: { id: newOrder.id },
      include: {
        patient: true,
        items: {
          include: {
            exam: true,
          },
        },
      },
    })

    return NextResponse.json(
      { success: true, order: completeOrder },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('ERRO CRITICO AO CRIAR OS:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao processar a ordem de serviço.' },
      { status: 500 }
    )
  }
}