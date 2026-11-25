import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { PDFFont, PDFPage } from 'pdf-lib'

// Dados do laboratório que saem no cabeçalho e no rodapé do laudo
export const LAB_INFO = {
  name: 'LABORATE',
  subtitle: 'Laboratório de Análises Clínicas',
  contact: '', // ex.: Tel. (84) 0000-0000 | contato@laboratorio.com | Endereço
  cnes: '',
  technicalResponsible: '', // ex.: Nome do responsável técnico - CRBM/CRF 00000
}

export interface LabPdfItem {
  group?: string
  name: string
  value: string
  unit: string
  ref: string
  flag: 'H' | 'L' | 'A' | null
}

export interface LabPdfSection {
  panelName: string
  material?: string | null
  method?: string | null
  items: LabPdfItem[]
}

export interface LabPdfInput {
  reportId: string
  patient: {
    fullName: string
    cpf?: string | null
    birthDate?: string | null
    gender?: string | null
  }
  professional: { name: string; specialty: string; registration?: string | null }
  collectedAt?: Date | null
  releasedAt: Date
  notes?: string | null
  sections: LabPdfSection[]
}

const PAGE_W = 595.28
const PAGE_H = 841.89
const M = 40
const TZ = 'America/Fortaleza'
const LH = 11
const BOTTOM = 70

const DARK = rgb(0.02, 0.37, 0.18)
const LIGHT = rgb(0.92, 0.97, 0.94)
const GRAY = rgb(0.4, 0.4, 0.4)
const TEXT = rgb(0.1, 0.1, 0.1)
const RED = rgb(0.75, 0.12, 0.12)
const SHADE = rgb(0.96, 0.96, 0.96)
const WHITE = rgb(1, 1, 1)

const COL = { name: M + 6, result: M + 186, unit: M + 292, ref: M + 362 }
const NAME_W = 172
const RESULT_W = 100
const UNIT_W = 66
const REF_W = PAGE_W - M - COL.ref - 4

const EXTRA = new Set([0x2013, 0x2014, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2026, 0x20ac])

// Fontes padrão do PDF só aceitam o conjunto WinAnsi: troca o que não for suportado
function safe(input: string) {
  const s = String(input ?? '')
    .replace(/\u03bc/g, '\u00b5')
    .replace(/\u2265/g, '>=')
    .replace(/\u2264/g, '<=')
    .replace(/\r/g, '')

  return Array.from(s)
    .map((ch) => {
      const c = ch.codePointAt(0) ?? 63
      if (ch === '\n' || (c >= 0x20 && c <= 0x7e) || (c >= 0xa0 && c <= 0xff) || EXTRA.has(c)) return ch
      return '?'
    })
    .join('')
}

const oneLine = (s: string) => safe(s).replace(/\s+/g, ' ').trim()

const dateFmt = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TZ,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})
const dateTimeFmt = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TZ,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const fmtDate = (d: Date) => dateFmt.format(d)
const fmtDateTime = (d: Date) => dateTimeFmt.format(d).replace(',', '')

function parseBirth(birth?: string | null) {
  if (!birth) return null
  const d = new Date(birth.length === 10 ? `${birth}T12:00:00-03:00` : birth)
  return Number.isNaN(d.getTime()) ? null : d
}

function ageFrom(d: Date) {
  const now = new Date()
  let years = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) years--
  return years >= 0 ? `${years} anos` : ''
}

const FLAG_LABEL = { H: 'ALTO', L: 'BAIXO', A: 'ALTERADO' } as const

// Laudo sem sinalizacao de ALTO/BAIXO. Mude para true para voltar a marcar no PDF.
const SHOW_FLAGS: boolean = false

export async function buildLabPdf(input: LabPdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  pdf.setTitle(oneLine(`Laudo de exames - ${input.patient.fullName}`))
  pdf.setCreator(LAB_INFO.name)

  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const multi = input.sections.length > 1
  const pages: PDFPage[] = []
  let page!: PDFPage
  let y = 0
  let shade = false

  const txt = (p: PDFPage, s: string, x: number, yy: number, size: number, f: PDFFont = font, color = TEXT) => {
    const t = oneLine(s)
    if (t) p.drawText(t, { x, y: yy, size, font: f, color })
  }

  const rtxt = (p: PDFPage, s: string, xr: number, yy: number, size: number, f: PDFFont = font, color = TEXT) => {
    const t = oneLine(s)
    if (t) p.drawText(t, { x: xr - f.widthOfTextAtSize(t, size), y: yy, size, font: f, color })
  }

  const ctxt = (p: PDFPage, s: string, xc: number, yy: number, size: number, f: PDFFont = font, color = TEXT) => {
    const t = oneLine(s)
    if (t) p.drawText(t, { x: xc - f.widthOfTextAtSize(t, size) / 2, y: yy, size, font: f, color })
  }

  const wrap = (text: string, f: PDFFont, size: number, maxWidth: number): string[] => {
    const lines: string[] = []
    for (const paragraph of safe(text).split('\n')) {
      const words = paragraph.split(/\s+/).filter(Boolean)
      if (words.length === 0) {
        lines.push('')
        continue
      }
      let line = ''
      for (const w of words) {
        const test = line ? `${line} ${w}` : w
        if (f.widthOfTextAtSize(test, size) <= maxWidth) {
          line = test
        } else {
          if (line) lines.push(line)
          line = w
        }
      }
      if (line) lines.push(line)
    }
    return lines.length ? lines : ['']
  }

  const letterhead = (p: PDFPage) => {
    p.drawRectangle({ x: 0, y: PAGE_H - 64, width: PAGE_W, height: 64, color: DARK })
    txt(p, LAB_INFO.name, M, PAGE_H - 36, 20, bold, WHITE)
    txt(p, LAB_INFO.subtitle, M, PAGE_H - 52, 9, font, rgb(0.85, 0.95, 0.88))
    rtxt(p, 'LAUDO DE EXAMES', PAGE_W - M, PAGE_H - 32, 11, bold, WHITE)
    rtxt(p, `Nº ${input.reportId.slice(0, 8).toUpperCase()}`, PAGE_W - M, PAGE_H - 48, 9, font, rgb(0.85, 0.95, 0.88))
    const info = [LAB_INFO.contact, LAB_INFO.cnes ? `CNES ${LAB_INFO.cnes}` : ''].filter(Boolean).join(' | ')
    if (info) txt(p, info, M, PAGE_H - 78, 8, font, GRAY)
  }

  const addPage = () => {
    page = pdf.addPage([PAGE_W, PAGE_H])
    pages.push(page)
    letterhead(page)
    y = PAGE_H - 96
  }

  const tableHeader = () => {
    page.drawRectangle({ x: M, y: y - 16, width: PAGE_W - 2 * M, height: 16, color: DARK })
    txt(page, 'Parâmetro', COL.name, y - 11, 8, bold, WHITE)
    txt(page, 'Resultado', COL.result, y - 11, 8, bold, WHITE)
    txt(page, 'Unidade', COL.unit, y - 11, 8, bold, WHITE)
    txt(page, 'Valores de referência', COL.ref, y - 11, 8, bold, WHITE)
    y -= 18
    shade = false
  }

  const ensure = (h: number) => {
    if (y - h < BOTTOM) {
      addPage()
      tableHeader()
    }
  }

  addPage()

  // ---- Dados do paciente (uma vez por laudo) --------------------------------
  const birth = parseBirth(input.patient.birthDate)
  const pairs: [string, string][] = [
    ['PACIENTE', input.patient.fullName],
    ['CPF', input.patient.cpf || '-'],
    ['NASCIMENTO', birth ? `${fmtDate(birth)} (${ageFrom(birth)})` : '-'],
    ['SEXO', input.patient.gender || '-'],
    ['DATA DA COLETA', input.collectedAt ? fmtDate(input.collectedAt) : '-'],
    ['DATA DA LIBERAÇÃO', fmtDateTime(input.releasedAt)],
  ]
  const colW = [255, 230]
  const infoRows: { cells: { label: string; lines: string[] }[]; h: number }[] = []

  for (let i = 0; i < pairs.length; i += 2) {
    const cells = [pairs[i], pairs[i + 1]]
      .filter((x): x is [string, string] => Boolean(x))
      .map(([label, value], idx) => ({ label, lines: wrap(value, font, 9, colW[idx] - 8) }))
    const maxLines = Math.max(...cells.map((c) => c.lines.length))
    infoRows.push({ cells, h: 8 + LH * maxLines + 8 })
  }

  const boxH = infoRows.reduce((s, r) => s + r.h, 0) + 6
  const boxTop = y
  page.drawRectangle({
    x: M,
    y: boxTop - boxH,
    width: PAGE_W - 2 * M,
    height: boxH,
    color: LIGHT,
    borderColor: rgb(0.8, 0.9, 0.84),
    borderWidth: 0.6,
  })

  let ry = boxTop - 4
  for (const row of infoRows) {
    row.cells.forEach((cell, idx) => {
      const x = M + 8 + (idx === 0 ? 0 : colW[0])
      txt(page, cell.label, x, ry - 9, 6.5, bold, GRAY)
      cell.lines.forEach((l, li) =>
        txt(page, l, x, ry - 9 - LH * (li + 1), 9, idx === 0 && ry === boxTop - 4 ? bold : font)
      )
    })
    ry -= row.h
  }
  y = boxTop - boxH - 20

  // ---- Título do laudo ------------------------------------------------------
  ctxt(page, (multi ? 'LAUDO DE EXAMES' : input.sections[0].panelName).toUpperCase(), PAGE_W / 2, y, 13, bold, DARK)
  y -= 14

  if (multi) {
    const names = input.sections.map((s) => s.panelName).join(' • ')
    for (const l of wrap(names, font, 8, PAGE_W - 2 * M)) {
      ctxt(page, l, PAGE_W / 2, y, 8, font, GRAY)
      y -= 10
    }
  }
  y -= 8

  // ---- Seções (um exame por seção, todas no mesmo PDF) ------------------------
  const startSection = (s: LabPdfSection) => {
    const meta = [s.material ? `Material: ${s.material}` : '', s.method ? `Método: ${s.method}` : '']
      .filter(Boolean)
      .join(' | ')
    const metaLines = meta ? wrap(meta, font, 7.5, PAGE_W - 2 * M - 12) : []
    const need = (multi ? 26 : 0) + metaLines.length * 10 + 20 + 50

    if (y - need < BOTTOM) addPage()

    if (multi) {
      page.drawRectangle({
        x: M,
        y: y - 20,
        width: PAGE_W - 2 * M,
        height: 20,
        color: LIGHT,
        borderColor: rgb(0.8, 0.9, 0.84),
        borderWidth: 0.6,
      })
      page.drawRectangle({ x: M, y: y - 20, width: 4, height: 20, color: DARK })
      txt(page, s.panelName.toUpperCase(), M + 12, y - 14, 10, bold, DARK)
      y -= 26
    }

    for (const l of metaLines) {
      txt(page, l, M + 2, y - 8, 7.5, font, GRAY)
      y -= 10
    }
    if (metaLines.length) y -= 4

    tableHeader()
  }

  let anyFlag = false

  for (const section of input.sections) {
    startSection(section)
    let lastGroup: string | undefined

    for (const it of section.items) {
      if (it.group && it.group !== lastGroup) {
        ensure(40)
        page.drawRectangle({ x: M, y: y - 14, width: PAGE_W - 2 * M, height: 14, color: rgb(0.88, 0.93, 0.9) })
        txt(page, it.group.toUpperCase(), COL.name, y - 10, 8, bold, DARK)
        y -= 16
        shade = false
        lastGroup = it.group
      }

      const flagged = SHOW_FLAGS && it.flag !== null
      if (flagged) anyFlag = true

      const wide = it.value.length > 40
      const vFont = flagged ? bold : font
      const vColor = flagged ? RED : TEXT
      const flagLabel = it.flag ? FLAG_LABEL[it.flag] : ''

      const nameLines = wrap(it.name, font, 9, NAME_W)
      const refLines = wrap(it.ref || '-', font, 8, REF_W)
      const unitLines = wrap(it.unit || '', font, 8, UNIT_W)
      const valueLines = wrap(it.value, vFont, 9, wide ? PAGE_W - 2 * M - 20 : RESULT_W)

      const firstW = vFont.widthOfTextAtSize(oneLine(valueLines[0]), 9)
      const labelW = flagged ? bold.widthOfTextAtSize(flagLabel, 6.5) : 0
      const inline = flagged && firstW + 4 + labelW <= (wide ? PAGE_W - 2 * M - 20 : RESULT_W)
      const extraLine = flagged && !inline ? 1 : 0

      const topLines = Math.max(
        nameLines.length,
        refLines.length,
        unitLines.length,
        wide ? 1 : valueLines.length + extraLine
      )
      const h = topLines * LH + (wide ? (valueLines.length + extraLine) * LH : 0) + 6

      ensure(h)

      if (shade) page.drawRectangle({ x: M, y: y - h, width: PAGE_W - 2 * M, height: h, color: SHADE })
      shade = !shade

      const ty = y - 9
      nameLines.forEach((l, i) => txt(page, l, COL.name, ty - i * LH, 9))
      unitLines.forEach((l, i) => txt(page, l, COL.unit, ty - i * LH, 8))
      refLines.forEach((l, i) => txt(page, l, COL.ref, ty - i * LH, 8))

      if (!wide) {
        valueLines.forEach((l, i) => txt(page, l, COL.result, ty - i * LH, 9, vFont, vColor))
        if (flagged) {
          if (inline) txt(page, flagLabel, COL.result + firstW + 4, ty, 6.5, bold, RED)
          else txt(page, flagLabel, COL.result, ty - valueLines.length * LH, 6.5, bold, RED)
        }
      } else {
        const base = ty - topLines * LH
        valueLines.forEach((l, i) => txt(page, l, COL.name + 8, base - i * LH, 9, vFont, vColor))
        if (flagged) {
          if (inline) txt(page, flagLabel, COL.name + 8 + firstW + 4, base, 6.5, bold, RED)
          else txt(page, flagLabel, COL.name + 8, base - valueLines.length * LH, 6.5, bold, RED)
        }
      }

      y -= h
    }

    y -= 14
  }

  if (anyFlag) {
    ensure(20)
    txt(
      page,
      'ALTO / BAIXO: resultado acima / abaixo do intervalo de referência informado. ALTERADO: resultado diferente do padrão esperado.',
      M,
      y - 8,
      7,
      font,
      GRAY
    )
    y -= 16
  }

  // ---- Observações ------------------------------------------------------------
  if (input.notes && input.notes.trim()) {
    const lines = wrap(input.notes, font, 9, PAGE_W - 2 * M)
    ensure(30)
    txt(page, 'OBSERVAÇÕES', M, y - 10, 8, bold, DARK)
    y -= 16
    for (const l of lines) {
      ensure(14)
      txt(page, l, M, y - 9, 9)
      y -= LH
    }
    y -= 8
  }

  // ---- Assinatura do profissional que liberou (uma vez) -------------------------
  if (y - 110 < BOTTOM) addPage()
  y -= 34
  const cx = PAGE_W / 2
  page.drawLine({ start: { x: cx - 130, y }, end: { x: cx + 130, y }, thickness: 0.8, color: TEXT })
  ctxt(page, input.professional.name, cx, y - 13, 10, bold)
  ctxt(
    page,
    [input.professional.specialty, input.professional.registration].filter(Boolean).join(' - '),
    cx,
    y - 26,
    9,
    font,
    GRAY
  )
  ctxt(page, `Liberado eletronicamente em ${fmtDateTime(input.releasedAt)}`, cx, y - 38, 8, font, GRAY)

  // ---- Rodapé em todas as páginas ----------------------------------------------
  const reg = input.professional.registration ? `, ${input.professional.registration}` : ''
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: M, y: 54 }, end: { x: PAGE_W - M, y: 54 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
    txt(
      p,
      `Liberado eletronicamente por ${input.professional.name} (${input.professional.specialty}${reg}) em ${fmtDateTime(input.releasedAt)}`,
      M,
      43,
      7,
      font,
      GRAY
    )
    rtxt(p, `Página ${i + 1} de ${pages.length}`, PAGE_W - M, 43, 7, font, GRAY)
    txt(
      p,
      'Os valores de referência podem variar conforme método, equipamento e população. Os resultados devem ser interpretados pelo médico assistente.',
      M,
      33,
      6.5,
      font,
      GRAY
    )
    if (LAB_INFO.technicalResponsible) {
      txt(p, `Responsável técnico: ${LAB_INFO.technicalResponsible}`, M, 23, 6.5, font, GRAY)
    }
  })

  return pdf.save()
}
