import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, category, description, price, deliveryDays } = body

    const updatedExam = await prisma.exam.update({
      where: { id: id.trim() },
      data: {
        ...(name && { name }),
        ...(category !== undefined && { category }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(deliveryDays !== undefined && { deliveryDays: parseInt(deliveryDays) })
      }
    })

    return NextResponse.json({ message: 'Exame atualizado com sucesso!', exam: updatedExam }, { status: 200 })
  } catch (error) {
    console.error('Erro ao atualizar exame:', error)
    return NextResponse.json({ error: 'Erro ao atualizar exame.' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.exam.delete({
      where: { id: id.trim() }
    })

    return NextResponse.json({ message: 'Exame excluído com sucesso!' }, { status: 200 })
  } catch (error) {
    console.error('Erro ao excluir exame:', error)
    return NextResponse.json({ error: 'Não é possível excluir exames vinculados a Ordens de Serviço existentes.' }, { status: 500 })
  }
}