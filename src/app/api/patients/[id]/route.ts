import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Ctx = { params: Promise<{ id: string }> }

// Define ou redefine a senha de acesso do paciente ao portal
export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { id } = await params
    const body = await request.json()
    const password = String(body.password || '')

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha precisa ter pelo menos 6 caracteres.' },
        { status: 400 }
      )
    }

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!patient) {
      return NextResponse.json({ error: 'Paciente não encontrado.' }, { status: 404 })
    }

    const hash = await bcrypt.hash(password, 10)

    if (patient.user) {
      await prisma.user.update({ where: { id: patient.user.id }, data: { password: hash } })
      return NextResponse.json({ success: true })
    }

    const email = String(body.email || '').trim().toLowerCase()

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: 'Informe um e-mail válido para criar o acesso.' },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Já existe uma conta com este e-mail.' }, { status: 400 })
    }

    await prisma.user.create({
      data: {
        name: patient.fullName,
        email,
        password: hash,
        role: 'PATIENT',
        patient: { connect: { id: patient.id } },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('ERRO AO ATUALIZAR ACESSO DO PACIENTE:', error)
    return NextResponse.json({ error: 'Erro ao atualizar o acesso do paciente.' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Somente o administrador pode excluir pacientes.' }, { status: 403 })
    }

    const { id } = await params

    const patient = await prisma.patient.findUnique({
      where: { id },
      select: { id: true, userId: true },
    })

    if (!patient) {
      return NextResponse.json({ error: 'Paciente não encontrado.' }, { status: 404 })
    }

    await prisma.patient.delete({ where: { id } })

    if (patient.userId) {
      await prisma.user.delete({ where: { id: patient.userId } })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('ERRO AO EXCLUIR PACIENTE:', error)
    return NextResponse.json({ error: 'Erro ao excluir o paciente.' }, { status: 500 })
  }
}