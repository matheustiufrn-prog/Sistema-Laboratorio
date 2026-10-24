import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const MAX_SIZE = 4 * 1024 * 1024

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')

    const results = await prisma.labResult.findMany({
      where: patientId ? { patientId } : undefined,
      select: {
        id: true,
        patientId: true,
        title: true,
        notes: true,
        fileName: true,
        fileSize: true,
        createdAt: true,
        patient: { select: { fullName: true, cpf: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(results)
  } catch (error) {
    console.error('ERRO AO LISTAR RESULTADOS:', error)
    return NextResponse.json({ error: 'Erro ao listar resultados.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const form = await request.formData()

    const patientId = String(form.get('patientId') || '')
    const title = String(form.get('title') || '').trim()
    const notes = String(form.get('notes') || '').trim() || null
    const file = form.get('file')

    if (!patientId) {
      return NextResponse.json({ error: 'Selecione o paciente.' }, { status: 400 })
    }
    if (!title) {
      return NextResponse.json({ error: 'Informe um título para o resultado.' }, { status: 400 })
    }
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'Anexe o arquivo PDF do resultado.' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'O arquivo excede o limite de 4 MB.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    if (buffer.subarray(0, 4).toString('latin1') !== '%PDF') {
      return NextResponse.json({ error: 'O arquivo precisa ser um PDF válido.' }, { status: 400 })
    }

    const patient = await prisma.patient.findUnique({ where: { id: patientId }, select: { id: true } })
    if (!patient) {
      return NextResponse.json({ error: 'Paciente não encontrado.' }, { status: 404 })
    }

    const fileName = (file.name || 'resultado.pdf').slice(0, 150)

    const result = await prisma.labResult.create({
      data: {
        patientId,
        title,
        notes,
        fileName,
        fileSize: buffer.length,
        data: buffer,
      },
      select: { id: true, title: true },
    })

    return NextResponse.json({ success: true, result }, { status: 201 })
  } catch (error) {
    console.error('ERRO AO ANEXAR RESULTADO:', error)
    return NextResponse.json({ error: 'Erro ao anexar o resultado.' }, { status: 500 })
  }
}