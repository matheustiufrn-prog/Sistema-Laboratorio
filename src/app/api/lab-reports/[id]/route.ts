import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { pdfResponse } from '@/lib/pdfResponse'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Ctx) {
  try {
    const { id } = await params
    const inline = new URL(request.url).searchParams.get('inline') === '1'

    const report = await prisma.labReport.findUnique({
      where: { id },
      select: { pdf: true, panel: true, releasedAt: true },
    })

    if (!report) {
      return NextResponse.json({ error: 'Laudo não encontrado.' }, { status: 404 })
    }

    const day = report.releasedAt.toISOString().slice(0, 10).replace(/-/g, '')
    const name = report.panel.includes(',') ? 'exames' : report.panel.toLowerCase()

    return pdfResponse(report.pdf, `laudo-${name}-${day}.pdf`, inline)
  } catch (error) {
    console.error('ERRO AO ABRIR LAUDO:', error)
    return NextResponse.json({ error: 'Erro ao abrir o laudo.' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const session = await getSession()
    if (session?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Somente o administrador pode excluir laudos.' }, { status: 403 })
    }

    const { id } = await params

    const report = await prisma.labReport.findUnique({
      where: { id },
      select: { id: true, labResultId: true },
    })
    if (!report) {
      return NextResponse.json({ error: 'Laudo não encontrado.' }, { status: 404 })
    }

    await prisma.labReport.delete({ where: { id } })
    if (report.labResultId) {
      await prisma.labResult.deleteMany({ where: { id: report.labResultId } })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('ERRO AO EXCLUIR LAUDO:', error)
    return NextResponse.json({ error: 'Erro ao excluir o laudo.' }, { status: 500 })
  }
}
