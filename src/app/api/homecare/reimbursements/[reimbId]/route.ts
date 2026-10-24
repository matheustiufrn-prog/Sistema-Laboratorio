import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Ctx = { params: Promise<{ reimbId: string }> }

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { reimbId } = await params
    const { status } = await request.json()

    if (!['PENDENTE', 'PAGO'].includes(status)) {
      return NextResponse.json({ error: 'Status inválido.' }, { status: 400 })
    }

    const reimbursement = await prisma.homeCareReimbursement.update({
      where: { id: reimbId },
      data: { status, paidAt: status === 'PAGO' ? new Date() : null },
    })

    return NextResponse.json({ success: true, reimbursement })
  } catch (error) {
    console.error('ERRO AO ATUALIZAR REEMBOLSO:', error)
    return NextResponse.json({ error: 'Erro ao atualizar o reembolso.' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { reimbId } = await params
    await prisma.homeCareReimbursement.delete({ where: { id: reimbId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('ERRO AO EXCLUIR REEMBOLSO:', error)
    return NextResponse.json({ error: 'Erro ao excluir o reembolso.' }, { status: 500 })
  }
}