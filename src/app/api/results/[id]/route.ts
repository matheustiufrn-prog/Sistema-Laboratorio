import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { pdfResponse } from '@/lib/pdfResponse'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Ctx) {
  try {
    const { id } = await params
    const inline = new URL(request.url).searchParams.get('inline') === '1'

    const result = await prisma.labResult.findUnique({ where: { id } })

    if (!result) {
      return NextResponse.json({ error: 'Resultado não encontrado.' }, { status: 404 })
    }

    return pdfResponse(result.data, result.fileName, inline)
  } catch (error) {
    console.error('ERRO AO BAIXAR RESULTADO:', error)
    return NextResponse.json({ error: 'Erro ao abrir o resultado.' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params
    await prisma.labResult.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('ERRO AO EXCLUIR RESULTADO:', error)
    return NextResponse.json({ error: 'Erro ao excluir o resultado.' }, { status: 500 })
  }
}