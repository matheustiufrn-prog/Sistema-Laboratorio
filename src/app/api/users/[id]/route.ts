import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.user.delete({
      where: { id: id.trim() }
    })

    return NextResponse.json({ message: 'Usuário excluído com sucesso!' }, { status: 200 })
  } catch (error) {
    console.error('Erro ao excluir usuário:', error)
    return NextResponse.json({ error: 'Erro ao excluir usuário.' }, { status: 500 })
  }
}