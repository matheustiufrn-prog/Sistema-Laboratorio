import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { parseDateInput } from '@/lib/dates'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const session = await getSession()
    if (session?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Somente o administrador pode alterar a data.' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const date = parseDateInput(body.serviceDate)
    if (!date) {
      return NextResponse.json({ error: 'Data inválida.' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({ where: { id }, select: { id: true } })
    if (!order) {
      return NextResponse.json({ error: 'OS não encontrada.' }, { status: 404 })
    }

    await prisma.order.update({ where: { id }, data: { serviceDate: date } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('ERRO AO ALTERAR DATA DA OS:', error)
    return NextResponse.json({ error: 'Erro ao alterar a data da OS.' }, { status: 500 })
  }
}
