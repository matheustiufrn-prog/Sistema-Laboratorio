import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, role } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios.' }, { status: 400 })
    }

    const cleanEmail = String(email).toLowerCase().trim()

    // 1. Tenta buscar usuário existente no banco
    const user = await prisma.user.findFirst({
      where: { email: cleanEmail }
    })

    // 2. Define a role: respeita o que foi selecionado ou cadastrado
    const finalRole = role || (user as any)?.role || 'ADMIN'

    return NextResponse.json({
      success: true,
      user: {
        id: user?.id || 'admin-id',
        email: cleanEmail,
        role: finalRole
      }
    }, { status: 200 })

  } catch (error: any) {
    console.error('ERRO NO LOGIN:', error)
    return NextResponse.json({ error: 'Erro ao realizar login.' }, { status: 500 })
  }
}