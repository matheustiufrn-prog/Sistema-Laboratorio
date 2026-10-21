import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const exams = await prisma.exam.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(exams, { status: 200 })
  } catch (error) {
    console.error('Erro ao buscar exames:', error)
    return NextResponse.json({ error: 'Erro ao buscar exames.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, category, description, price, deliveryDays } = body

    if (!name || price === undefined) {
      return NextResponse.json({ error: 'Nome e Preço são obrigatórios.' }, { status: 400 })
    }

    const newExam = await prisma.exam.create({
      data: {
        name,
        category: category || 'Geral',
        description: description || '',
        price: parseFloat(price),
        deliveryDays: deliveryDays ? parseInt(deliveryDays) : 1
      }
    })

    return NextResponse.json({ message: 'Exame cadastrado com sucesso!', exam: newExam }, { status: 201 })
  } catch (error: any) {
    console.error('Erro ao cadastrar exame:', error)
    return NextResponse.json({ error: error?.message || 'Erro interno ao processar o cadastro do exame.' }, { status: 500 })
  }
}