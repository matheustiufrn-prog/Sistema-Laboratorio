import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

type Ctx = { params: Promise<{ id: string }> }

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const session = await getSession()

    if (session?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Somente o administrador pode excluir registros de prontuário.' },
        { status: 403 }
      )
    }

    const { id } = await params
    await prisma.medicalRecord.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('ERRO AO EXCLUIR PRONTUÁRIO:', error)
    return NextResponse.json({ error: 'Erro ao excluir o registro.' }, { status: 500 })
  }
}