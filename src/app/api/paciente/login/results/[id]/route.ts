import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { pdfResponse } from '@/lib/pdfResponse'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Ctx) {
  try {
    const session = await getSession()

    if (!session || session.role !== 'PATIENT') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const inline = new URL(request.url).searchParams.get('inline') === '1'

    const result = await prisma.labResult.findUnique({
      where: { id },
      include: { patient: { select: { userId: true } } },
    })

    // Só entrega se o resultado for deste paciente
    if (!result || result.patient.userId !== session.id) {
      return NextResponse.json({ error: 'Resultado não encontrado.' }, { status: 404 })
    }

    return pdfResponse(result.data, result.fileName, inline)
  } catch (error) {
    console.error('ERRO AO BAIXAR RESULTADO DO PACIENTE:', error)
    return NextResponse.json({ error: 'Erro ao abrir o resultado.' }, { status: 500 })
  }
}