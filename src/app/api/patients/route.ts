import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function clean(value: unknown) {
  const s = String(value ?? '').trim()
  return s ? s : null
}

export async function GET() {
  try {
    const patients = await prisma.patient.findMany({
      include: {
        user: { select: { email: true } },
        _count: { select: { results: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(patients)
  } catch (error) {
    console.error('ERRO AO LISTAR PACIENTES:', error)
    return NextResponse.json({ error: 'Erro ao listar pacientes.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const fullName = String(body.fullName || body.name || '').trim()
    const cpf = clean(body.cpf)
    const phone = clean(body.phone)
    const birthDate = clean(body.birthDate)
    const gender = clean(body.gender)
    const address = clean(body.address)
    const email = (clean(body.email) || '').toLowerCase()
    const password = String(body.password || '')

    if (!fullName) {
      return NextResponse.json({ error: 'Informe o nome completo do paciente.' }, { status: 400 })
    }

    if (cpf) {
      const existingPatient = await prisma.patient.findUnique({ where: { cpf } })
      if (existingPatient) {
        return NextResponse.json({ error: 'Já existe um paciente cadastrado com este CPF.' }, { status: 400 })
      }
    }

    if (password && !email) {
      return NextResponse.json(
        { error: 'Informe o e-mail para criar o acesso ao portal.' },
        { status: 400 }
      )
    }

    let userInput: Prisma.UserCreateNestedOneWithoutPatientInput | undefined

    if (email) {
      if (!EMAIL_RE.test(email)) {
        return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 })
      }
      if (password.length < 6) {
        return NextResponse.json(
          { error: 'A senha do portal precisa ter pelo menos 6 caracteres.' },
          { status: 400 }
        )
      }

      const hash = await bcrypt.hash(password, 10)

      const existingUser = await prisma.user.findUnique({
        where: { email },
        include: { patient: { select: { id: true } } },
      })

      if (existingUser) {
        // Reaproveita acesso órfão (criado em uma tentativa que falhou)
        if (existingUser.role !== 'PATIENT' || existingUser.patient) {
          return NextResponse.json({ error: 'Já existe uma conta com este e-mail.' }, { status: 400 })
        }
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { password: hash, name: fullName },
        })
        userInput = { connect: { id: existingUser.id } }
      } else {
        userInput = {
          create: { name: fullName, email, password: hash, role: 'PATIENT' },
        }
      }
    }

    const patient = await prisma.patient.create({
      data: {
        fullName,
        cpf,
        phone,
        birthDate,
        gender,
        address,
        ...(userInput ? { user: userInput } : {}),
      },
      include: { user: { select: { email: true } } },
    })

    return NextResponse.json({ success: true, patient }, { status: 201 })
  } catch (error) {
    console.error('ERRO AO CRIAR PACIENTE:', error)
    return NextResponse.json({ error: 'Erro ao cadastrar o paciente.' }, { status: 500 })
  }
}