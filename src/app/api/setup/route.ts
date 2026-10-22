import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const hashedPassword = await bcrypt.hash('123456', 10)

    const admin = await prisma.user.upsert({
      where: { email: 'admin@afimlab.com' },
      update: {
        password: hashedPassword,
        role: 'ADMIN'
      },
      create: {
        name: 'Administrador',
        email: 'admin@afimlab.com',
        password: hashedPassword,
        role: 'ADMIN'
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Utilizador administrador criado com sucesso!', 
      admin: { email: admin.email, role: admin.role } 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}