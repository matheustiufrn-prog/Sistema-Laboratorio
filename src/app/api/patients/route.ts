import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const patients = await prisma.patient.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(patients, { status: 200 })
  } catch (error) {
    console.error('Erro ao buscar pacientes:', error)
    return NextResponse.json({ error: 'Erro ao buscar pacientes.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const fullName = body.fullName || body.name
    const { cpf, birthDate, phone, address, email, password } = body

    if (!fullName || !cpf || !birthDate) {
      return NextResponse.json({ error: 'Preencha os campos obrigatórios.' }, { status: 400 })
    }

    let userId: string | undefined = undefined

    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return NextResponse.json({ error: 'Já existe uma conta com este e-mail.' }, { status: 400 })
      }

      const hashedPassword = await bcrypt.hash(password || '123456', 10)
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'PATIENT'
        }
      })
      userId = user.id
    }

    const existingPatient = await prisma.patient.findFirst({ where: { cpf } })
    if (existingPatient) {
      return NextResponse.json({ error: 'Já existe um paciente cadastrado com este CPF.' }, { status: 400 })
    }

    const patientData: any = {
      fullName,
      cpf,
      birthDate: new Date(`${birthDate}T00:00:00.000Z`),
      phone: phone || '',
      address: address || '',
      ...(userId && { userId })
    }

    const newPatient = await prisma.patient.create({
      data: patientData
    })

    return NextResponse.json({ message: 'Paciente cadastrado com sucesso!', patient: newPatient }, { status: 201 })
  } catch (error: any) {
    console.error('Erro ao cadastrar paciente:', error)
    return NextResponse.json({ error: error?.message || 'Erro interno ao processar o cadastro.' }, { status: 500 })
  }
}