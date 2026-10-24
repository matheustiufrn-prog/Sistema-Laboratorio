import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createSessionToken, SESSION_COOKIE } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios.' }, { status: 400 })
    }

    const cleanEmail = String(email).toLowerCase().trim()

    const user = await prisma.user.findUnique({ where: { email: cleanEmail } })

    const passwordOk = user ? await bcrypt.compare(String(password), user.password) : false

    if (!user || !passwordOk) {
      return NextResponse.json({ error: 'E-mail ou senha inválidos.' }, { status: 401 })
    }

    if (user.role === 'PATIENT') {
      return NextResponse.json(
        { error: 'Esta é a entrada da equipe. Pacientes devem acessar o portal em /paciente/login.' },
        { status: 403 }
      )
    }

    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      role: user.role,
    })

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, role: user.role },
    })

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    })

    return response
  } catch (error) {
    console.error('ERRO NO LOGIN:', error)
    return NextResponse.json({ error: 'Erro ao realizar login.' }, { status: 500 })
  }
}