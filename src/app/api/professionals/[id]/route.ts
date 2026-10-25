import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Ctx = { params: Promise<{ id: string }> }

function clean(value: unknown) {
  const s = String(value ?? '').trim()
  return s ? s : null
}

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const session = await getSession()
    if (session?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Somente o administrador pode alterar profissionais.' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const professional = await prisma.professional.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!professional) {
      return NextResponse.json({ error: 'Profissional não encontrado.' }, { status: 404 })
    }

    // Acesso do profissional (criar ou redefinir senha)
    if (body.password !== undefined) {
      const password = String(body.password)

      if (password.length < 6) {
        return NextResponse.json({ error: 'A senha precisa ter pelo menos 6 caracteres.' }, { status: 400 })
      }

      const hash = await bcrypt.hash(password, 10)

      if (professional.user) {
        await prisma.user.update({ where: { id: professional.user.id }, data: { password: hash } })
      } else {
        const email = (clean(body.accessEmail) || '').toLowerCase()

        if (!email || !EMAIL_RE.test(email)) {
          return NextResponse.json({ error: 'Informe um e-mail de acesso válido.' }, { status: 400 })
        }

        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) {
          return NextResponse.json({ error: 'Já existe uma conta com este e-mail.' }, { status: 400 })
        }

        await prisma.user.create({
          data: {
            name: professional.name,
            email,
            password: hash,
            role: 'DOCTOR',
            professional: { connect: { id } },
          },
        })
      }
    }

    const data: Prisma.ProfessionalUpdateInput = {}

    if (body.name !== undefined) {
      const v = String(body.name).trim()
      if (!v) return NextResponse.json({ error: 'O nome não pode ficar vazio.' }, { status: 400 })
      data.name = v
    }
    if (body.specialty !== undefined) {
      const v = String(body.specialty).trim()
      if (!v) return NextResponse.json({ error: 'A especialidade não pode ficar vazia.' }, { status: 400 })
      data.specialty = v
    }
    if (body.registration !== undefined) data.registration = clean(body.registration)
    if (body.phone !== undefined) data.phone = clean(body.phone)
    if (body.consultationPrice !== undefined) {
      const price = Number(body.consultationPrice)
      if (!(price >= 0)) {
        return NextResponse.json({ error: 'Valor de consulta inválido.' }, { status: 400 })
      }
      data.consultationPrice = price
    }
    if (typeof body.active === 'boolean') data.active = body.active

    if (body.linkPatientId) {
      const patient = await prisma.patient.findUnique({
        where: { id: String(body.linkPatientId) },
        select: { id: true },
      })
      if (!patient) {
        return NextResponse.json({ error: 'Paciente não encontrado.' }, { status: 404 })
      }
      data.patients = { connect: { id: patient.id } }
    } else if (body.unlinkPatientId) {
      data.patients = { disconnect: { id: String(body.unlinkPatientId) } }
    }

    if (Object.keys(data).length > 0) {
      await prisma.professional.update({ where: { id }, data })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('ERRO AO ATUALIZAR PROFISSIONAL:', error)
    return NextResponse.json({ error: 'Erro ao atualizar o profissional.' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const session = await getSession()
    if (session?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Somente o administrador pode excluir profissionais.' }, { status: 403 })
    }

    const { id } = await params

    const professional = await prisma.professional.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        _count: { select: { medicalRecords: true, orders: true } },
      },
    })

    if (!professional) {
      return NextResponse.json({ error: 'Profissional não encontrado.' }, { status: 404 })
    }

    if (professional._count.medicalRecords > 0 || professional._count.orders > 0) {
      return NextResponse.json(
        { error: 'Este profissional possui prontuários ou orçamentos vinculados. Desative-o em vez de excluir.' },
        { status: 400 }
      )
    }

    await prisma.professional.delete({ where: { id } })

    if (professional.userId) {
      await prisma.user.delete({ where: { id: professional.userId } })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('ERRO AO EXCLUIR PROFISSIONAL:', error)
    return NextResponse.json({ error: 'Erro ao excluir o profissional.' }, { status: 500 })
  }
}