import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcrypt'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios.' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()

    // Procura o usuário no banco
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    })

    // Se o usuário admin padrão não existir, cria-o automaticamente para nunca mais dar erro
    if (!user && cleanEmail === 'admin@afimlab.com') {
      const hashedPassword = await bcrypt.hash('123456', 10)
      user = await prisma.user.create({
        data: {
          email: 'admin@afimlab.com',
          password: hashedPassword,
          role: 'ADMIN'
        }
      })
    }

    if (!user) {
      return NextResponse.json({ error: 'E-mail não encontrado.' }, { status: 404 })
    }

    // Compara a senha informada com a senha criptografada no banco
    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Login efetuado com sucesso!',
      user: { email: user.email, role: user.role }
    }, { status: 200 })

  } catch (error: any) {
    console.error('Erro no login:', error)
    return NextResponse.json({ error: 'Erro interno ao realizar login.' }, { status: 500 })
  }
}