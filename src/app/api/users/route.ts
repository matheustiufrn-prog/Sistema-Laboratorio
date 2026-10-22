import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true
      }
    })
    return NextResponse.json(users, { status: 200 })
  } catch (error) {
    console.error('Erro ao listar usuários:', error)
    return NextResponse.json({ error: 'Erro ao buscar usuários.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, role } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios.' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Este e-mail já está cadastrado.' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await prisma.user.create({
      data: {
        email: cleanEmail,
        password: hashedPassword,
        role: role || 'USER'
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Usuário cadastrado com sucesso!',
      user: { id: newUser.id, email: newUser.email, role: newUser.role }
    }, { status: 201 })

  } catch (error: any) {
    console.error('Erro ao cadastrar usuário:', error)
    return NextResponse.json({ error: 'Erro ao cadastrar usuário no banco de dados.' }, { status: 500 })
  }
}