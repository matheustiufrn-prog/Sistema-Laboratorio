import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (session.role === 'ADMIN') {
      const [patients, professionals] = await Promise.all([
        prisma.patient.findMany({
          select: { id: true, fullName: true, cpf: true },
          orderBy: { fullName: 'asc' },
        }),
        prisma.professional.findMany({
          select: {
            id: true,
            name: true,
            specialty: true,
            registration: true,
            active: true,
            patients: { select: { id: true } },
          },
          orderBy: { name: 'asc' },
        }),
      ])

      return NextResponse.json({
        role: 'ADMIN',
        professional: null,
        patients,
        professionals: professionals.map((p) => ({
          id: p.id,
          name: p.name,
          specialty: p.specialty,
          registration: p.registration,
          active: p.active,
          patientIds: p.patients.map((x) => x.id),
        })),
      })
    }

    if (session.role === 'DOCTOR') {
      const professional = await prisma.professional.findUnique({
        where: { userId: session.id },
        select: {
          id: true,
          name: true,
          specialty: true,
          registration: true,
          active: true,
          patients: {
            select: { id: true, fullName: true, cpf: true },
            orderBy: { fullName: 'asc' },
          },
        },
      })

      if (!professional || !professional.active) {
        return NextResponse.json(
          { error: 'Acesso do profissional inativo ou não encontrado.' },
          { status: 403 }
        )
      }

      return NextResponse.json({
        role: 'DOCTOR',
        professional: {
          id: professional.id,
          name: professional.name,
          specialty: professional.specialty,
          registration: professional.registration,
        },
        patients: professional.patients,
        professionals: [],
      })
    }

    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  } catch (error) {
    console.error('ERRO AO CARREGAR CONTEXTO DE PRONTUÁRIOS:', error)
    return NextResponse.json({ error: 'Erro ao carregar os dados.' }, { status: 500 })
  }
}