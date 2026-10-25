import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

function clean(value: unknown) {
  const s = String(value ?? '').trim()
  return s ? s : null
}

const recordSelect = {
  id: true,
  complaint: true,
  evaluation: true,
  diagnosis: true,
  plan: true,
  createdAt: true,
  professional: { select: { name: true, specialty: true, registration: true } },
}

async function doctorProfessional(userId: string) {
  const professional = await prisma.professional.findUnique({ where: { userId } })
  return professional && professional.active ? professional : null
}

async function isLinked(professionalId: string, patientId: string) {
  const link = await prisma.professional.findFirst({
    where: { id: professionalId, patients: { some: { id: patientId } } },
    select: { id: true },
  })
  return Boolean(link)
}

export async function GET(request: Request) {
  try {
    const session = await getSession()

    if (!session || (session.role !== 'ADMIN' && session.role !== 'DOCTOR')) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const patientId = new URL(request.url).searchParams.get('patientId') || ''

    if (!patientId) {
      return NextResponse.json({ error: 'Informe o paciente.' }, { status: 400 })
    }

    if (session.role === 'ADMIN') {
      const records = await prisma.medicalRecord.findMany({
        where: { patientId },
        select: recordSelect,
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json(records)
    }

    const professional = await doctorProfessional(session.id)
    if (!professional) {
      return NextResponse.json({ error: 'Acesso do profissional inativo.' }, { status: 403 })
    }

    if (!(await isLinked(professional.id, patientId))) {
      return NextResponse.json({ error: 'Paciente não vinculado a este profissional.' }, { status: 403 })
    }

    // O médico enxerga apenas os registros que ele mesmo escreveu
    const records = await prisma.medicalRecord.findMany({
      where: { patientId, professionalId: professional.id },
      select: recordSelect,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(records)
  } catch (error) {
    console.error('ERRO AO LISTAR PRONTUÁRIOS:', error)
    return NextResponse.json({ error: 'Erro ao carregar o prontuário.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()

    if (!session || (session.role !== 'ADMIN' && session.role !== 'DOCTOR')) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()

    const patientId = String(body.patientId || '')
    const complaint = clean(body.complaint)
    const evaluation = clean(body.evaluation)
    const diagnosis = clean(body.diagnosis)
    const plan = clean(body.plan)

    if (!patientId) {
      return NextResponse.json({ error: 'Selecione o paciente.' }, { status: 400 })
    }
    if (!complaint && !evaluation && !diagnosis && !plan) {
      return NextResponse.json({ error: 'Preencha pelo menos um campo do prontuário.' }, { status: 400 })
    }

    let professionalId = ''

    if (session.role === 'DOCTOR') {
      const professional = await doctorProfessional(session.id)
      if (!professional) {
        return NextResponse.json({ error: 'Acesso do profissional inativo.' }, { status: 403 })
      }
      professionalId = professional.id
    } else {
      professionalId = String(body.professionalId || '')
      if (!professionalId) {
        return NextResponse.json({ error: 'Selecione o profissional responsável.' }, { status: 400 })
      }
      const exists = await prisma.professional.findUnique({
        where: { id: professionalId },
        select: { id: true },
      })
      if (!exists) {
        return NextResponse.json({ error: 'Profissional não encontrado.' }, { status: 404 })
      }
    }

    if (!(await isLinked(professionalId, patientId))) {
      return NextResponse.json(
        { error: 'Vincule o paciente ao profissional antes de registrar o prontuário.' },
        { status: 400 }
      )
    }

    const record = await prisma.medicalRecord.create({
      data: { patientId, professionalId, complaint, evaluation, diagnosis, plan },
      select: { id: true },
    })

    return NextResponse.json({ success: true, record }, { status: 201 })
  } catch (error) {
    console.error('ERRO AO CRIAR PRONTUÁRIO:', error)
    return NextResponse.json({ error: 'Erro ao salvar o prontuário.' }, { status: 500 })
  }
}