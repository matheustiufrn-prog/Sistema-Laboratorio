import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SignJWT } from 'jose'
import { cookies } from 'next/headers'
import { SESSION_COOKIE } from '@/lib/auth'

const secretKey = process.env.AUTH_SECRET
const encodedKey = new TextEncoder().encode(secretKey)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios.' }, { status: 400 })
    }

    const cleanEmail = String(email).toLowerCase().trim()

    // 1. Busca o usuário no banco de dados
    const user = await prisma.user.findFirst({
      where: { email: cleanEmail }
    })

    if (!user) {
      return NextResponse.json({ error: 'E-mail ou senha inválidos.' }, { status: 401 })
    }

    // 2. Gera o token de sessão usando o jose e o AUTH_SECRET
    const token = await new SignJWT({ 
      userId: user.id, 
      email: user.email, 
      role: user.role || 'ADMIN' 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(encodedKey)

    // 3. Salva o token usando a constante SESSION_COOKIE que o middleware lê
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 horas
    })

    return NextResponse.json({ success: true, user }, { status: 200 })
    
  } catch (error) {
    console.error('ERRO NO LOGIN:', error)
    return NextResponse.json({ error: 'Erro ao realizar login.' }, { status: 500 })
  }
}