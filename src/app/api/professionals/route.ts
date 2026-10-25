import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function clean(value: unknown) {
  const s = String(value ?? '').trim()
  return s ? s : null
}

export async function GET() {
  try {
    const session = await getSession()
    const isAdmin = session?.role === 'ADMIN'

    const list = await prisma.professional.findMany({
      include: {
        user: { select: { email: true } },
        patients: { select: { id: true, fullName: true, cpf: true }, orderBy: { fullName: 'asc' } },
        _count: { select: { medicalRecords: true, orders: true } },
      },
      orderBy: { name: 'asc' },
    })

    if (!isAdmin) {
      return NextResponse.json(
        list.map((p) => ({
          id: p.id,
          name: p.name,
          specialty: p.specialty,
          registration: p.registration,
          consultationPrice: p.consultationPrice,
          active: p.active,
        }))
      )
    }

    return NextResponse.json(list)
  } catch (error) {
    console.error('ERRO AO LISTAR PROFISSIONAIS:', error)
    return NextResponse.json({ error: 'Erro ao listar profissionais.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (session?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Somente o administrador pode cadastrar profissionais.' }, { status: 403 })
    }

    const body = await request.json()

    const name = String(body.name || '').trim()
    const specialty = String(body.specialty || '').trim()
    const registration = clean(body.registration)
    const phone = clean(body.phone)
    const price = Number(body.consultationPrice)
    const accessEmail = (clean(body.accessEmail) || '').toLowerCase()
    const password = String(body.password || '')

    if (!name || !specialty) {
      return NextResponse.json({ error: 'Informe o nome e a especialidade.' }, { status: 400 })
    }
    if (!(price >= 0)) {
      return NextResponse.json({ error: 'Informe o valor da consulta.' }, { status: 400 })
    }
    if (password && !accessEmail) {
      return NextResponse.json({ error: 'Informe o e-mail de acesso do profissional.' }, { status: 400 })
    }

    let hash: string | null = null

    if (accessEmail) {
      if (!EMAIL_RE.test(accessEmail)) {
        return NextResponse.json({ error: 'E-mail de acesso inválido.' }, { status: 400 })
      }
      if (password.length < 6) {
        return NextResponse.json(
          { error: 'A senha de acesso precisa ter pelo menos 6 caracteres.' },
          { status: 400 }
        )
      }
      const existing = await prisma.user.findUnique({ where: { email: accessEmail } })
      if (existing) {
        return NextResponse.json({ error: 'Já existe uma conta com este e-mail.' }, { status: 400 })
      }
      hash = await bcrypt.hash(password, 10)
    }

    const professional = await prisma.professional.create({
      data: {
        name,
        specialty,
        registration,
        phone,
        consultationPrice: price,
        ...(hash
          ? { user: { create: { name, email: accessEmail, password: hash, role: 'DOCTOR' } } }
          : {}),
      },
      include: { user: { select: { email: true } } },
    })

    return NextResponse.json({ success: true, professional }, { status: 201 })
  } catch (error) {
    console.error('ERRO AO CRIAR PROFISSIONAL:', error)
    return NextResponse.json({ error: 'Erro ao cadastrar o profissional.' }, { status: 500 })
  }
}