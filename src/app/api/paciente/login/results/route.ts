import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET() {
  try {
    const session = await getSession()

    if (!session || session.role !== 'PATIENT') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: session.id },
      select: {
        fullName: true,
        results: {
          select: {
            id: true,
            title: true,
            notes: true,
            fileName: true,
            fileSize: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!patient) {
      return NextResponse.json({ error: 'Cadastro de paciente não encontrado.' }, { status: 404 })
    }

    return NextResponse.json({ patient: { fullName: patient.fullName }, results: patient.results })
  } catch (error) {
    console.error('ERRO AO CARREGAR RESULTADOS DO PACIENTE:', error)
    return NextResponse.json({ error: 'Erro ao carregar os resultados.' }, { status: 500 })
  }
}