import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const fullName = body.fullName || body.name
    const { cpf, birthDate, phone, address } = body

    const updatedPatient = await prisma.patient.update({
      where: { id: id.trim() },
      data: { 
        ...(fullName && { fullName }),
        ...(cpf && { cpf }),
        ...(birthDate && { birthDate: new Date(birthDate).toISOString() }),
        ...(phone && { phone }),
        ...(address !== undefined && { address })
      }
    })

    return NextResponse.json({ message: 'Paciente atualizado com sucesso!', patient: updatedPatient }, { status: 200 })
  } catch (error) {
    console.error('Erro ao atualizar paciente:', error)
    return NextResponse.json({ error: 'Erro ao atualizar paciente.' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id?.trim()

    // 1. Busca o paciente para pegar o userId vinculado e verificar ordens
    const patient = await prisma.patient.findUnique({
      where: { id },
      select: { userId: true }
    })

    if (!patient) {
      return NextResponse.json({ error: 'Paciente não encontrado.' }, { status: 404 })
    }

    // 2. Apaga primeiro as ordens de serviço do paciente (se existirem)
    await prisma.order.deleteMany({
      where: { patientId: id }
    })

    // 3. Apaga o registro do paciente
    await prisma.patient.delete({
      where: { id }
    })

    // 4. Se houver um usuário de acesso (Portal) associado, apaga também
    if (patient.userId) {
      await prisma.user.delete({
        where: { id: patient.userId }
      }).catch(() => {
        // Ignora se o usuário já tiver sido removido
      })
    }

    return NextResponse.json({ message: 'Paciente excluído com sucesso!' }, { status: 200 })
  } catch (error: any) {
    console.error('Erro ao excluir paciente:', error)
    return NextResponse.json({ error: error?.message || 'Erro ao excluir paciente.' }, { status: 500 })
  }
}