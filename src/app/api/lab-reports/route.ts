import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { parseDateInput } from '@/lib/dates'
import { PANELS, computeFlag } from '@/lib/labCatalog'
import { buildLabPdf } from '@/lib/labPdf'

const clip = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max)
const numOrNull = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null)

const isoDay = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Fortaleza',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
const brDay = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Fortaleza',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

function cleanItem(raw: unknown) {
  const r = (raw ?? {}) as Record<string, unknown>
  const value = clip(r.value, 500)
  const min = numOrNull(r.min)
  const max = numOrNull(r.max)
  const thousands = r.thousands === true
  const normal = Array.isArray(r.normal) ? r.normal.slice(0, 20).map((n) => clip(n, 200)) : []

  return {
    group: clip(r.group, 80),
    name: clip(r.name, 120),
    value,
    unit: clip(r.unit, 30),
    ref: clip(r.ref, 300),
    min,
    max,
    flag: computeFlag({ value, min, max, thousands, normal }),
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')

    const reports = await prisma.labReport.findMany({
      where: patientId ? { patientId } : undefined,
      select: {
        id: true,
        title: true,
        panel: true,
        releasedAt: true,
        professionalName: true,
        professionalRegistration: true,
        labResultId: true,
        patient: { select: { fullName: true } },
      },
      orderBy: { releasedAt: 'desc' },
      take: 100,
    })

    return NextResponse.json(reports)
  } catch (error) {
    console.error('ERRO AO LISTAR LAUDOS:', error)
    return NextResponse.json({ error: 'Erro ao listar os laudos.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'USER')) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    const body = await request.json()

    const patient = await prisma.patient.findUnique({ where: { id: String(body.patientId || '') } })
    if (!patient) {
      return NextResponse.json({ error: 'Selecione um paciente cadastrado.' }, { status: 400 })
    }

    const professional = await prisma.professional.findUnique({
      where: { id: String(body.professionalId || '') },
    })
    if (!professional || !professional.active) {
      return NextResponse.json({ error: 'Selecione o profissional que está liberando o laudo.' }, { status: 400 })
    }

    const collectedAt = body.collectedAt ? parseDateInput(body.collectedAt) : null
    if (body.collectedAt && !collectedAt) {
      return NextResponse.json({ error: 'Data da coleta inválida.' }, { status: 400 })
    }

    // Cada seção é um exame (hemograma, bioquímica...). Todas entram no mesmo PDF.
    const rawSections: unknown[] = Array.isArray(body.sections) ? body.sections.slice(0, 8) : []
    const byPanel = new Map<
      string,
      { material: string | null; method: string | null; items: ReturnType<typeof cleanItem>[] }
    >()

    for (const raw of rawSections) {
      const s = (raw ?? {}) as Record<string, unknown>
      const panel = PANELS.find((p) => p.id === s.panel)
      if (!panel) continue

      const items = (Array.isArray(s.items) ? s.items.slice(0, 200) : [])
        .map(cleanItem)
        .filter((i) => i.name && i.value)

      if (items.length === 0) continue

      byPanel.set(panel.id, {
        material: clip(s.material, 200) || null,
        method: clip(s.method, 300) || null,
        items,
      })
    }

    const sections = PANELS.filter((p) => byPanel.has(p.id)).map((p) => ({
      panel: p,
      ...byPanel.get(p.id)!,
    }))

    if (sections.length === 0) {
      return NextResponse.json({ error: 'Preencha pelo menos um resultado.' }, { status: 400 })
    }

    const reportId = randomUUID()
    const releasedAt = new Date()
    const notes = clip(body.notes, 3000) || null

    const pdfBytes = await buildLabPdf({
      reportId,
      patient: {
        fullName: patient.fullName,
        cpf: patient.cpf,
        birthDate: patient.birthDate,
        gender: patient.gender,
      },
      professional: {
        name: professional.name,
        specialty: professional.specialty,
        registration: professional.registration,
      },
      collectedAt,
      releasedAt,
      notes,
      sections: sections.map((s) => ({
        panelName: s.panel.name,
        material: s.material,
        method: s.method,
        items: s.items,
      })),
    })

    const buffer = Buffer.from(pdfBytes)
    const dayLabel = brDay.format(releasedAt)
    const dayCompact = isoDay.format(releasedAt).replace(/-/g, '')
    const single = sections.length === 1

    const title = single
      ? `${sections[0].panel.name} - ${dayLabel}`
      : `Laudo de exames (${sections.map((s) => s.panel.short).join(', ')}) - ${dayLabel}`

    let labResultId: string | null = null
    if (body.publish === true) {
      const published = await prisma.labResult.create({
        data: {
          patientId: patient.id,
          title,
          notes: `Laudo liberado por ${professional.name}`,
          fileName: `laudo-${single ? sections[0].panel.id.toLowerCase() : 'exames'}-${dayCompact}.pdf`,
          fileSize: buffer.length,
          data: buffer,
        },
        select: { id: true },
      })
      labResultId = published.id
    }

    const stored = {
      sections: sections.map((s) => ({
        panel: s.panel.id,
        name: s.panel.name,
        material: s.material,
        method: s.method,
        items: s.items,
      })),
    }

    const report = await prisma.labReport.create({
      data: {
        id: reportId,
        patientId: patient.id,
        professionalId: professional.id,
        professionalName: professional.name,
        professionalSpecialty: professional.specialty,
        professionalRegistration: professional.registration,
        panel: sections.map((s) => s.panel.id).join(','),
        title,
        material: null,
        method: null,
        collectedAt,
        notes,
        items: stored as unknown as Prisma.InputJsonValue,
        pdf: buffer,
        labResultId,
        releasedAt,
      },
      select: { id: true, title: true },
    })

    return NextResponse.json({ success: true, report }, { status: 201 })
  } catch (error) {
    console.error('ERRO AO LIBERAR LAUDO:', error)
    return NextResponse.json({ error: 'Erro ao gerar o laudo em PDF.' }, { status: 500 })
  }
}
