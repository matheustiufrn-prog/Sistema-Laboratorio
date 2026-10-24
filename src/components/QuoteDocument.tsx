'use client'

import { useState } from 'react'

const COMPANY = {
  name: 'LABORATE',
  subtitle: 'Gestão Laboratorial',
  phone: '',
  email: '',
  address: '',
}

const VALIDITY_DAYS = 7

export interface QuoteLine {
  name: string
  price: number
}

export interface QuoteData {
  kind: 'os' | 'homecare'
  id: string
  date: string
  patientName: string
  patientCpf?: string | null
  lines: QuoteLine[]
  examsTotal: number
  collectionFee?: number
  travelFee?: number
  neighborhood?: string
  city?: string
  total: number
}

const brl = (v: number) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function QuoteDocument({ data }: { data: QuoteData }) {
  const [copied, setCopied] = useState(false)

  const number = data.id.slice(0, 8).toUpperCase()
  const issueDate = new Date(data.date)
  const validUntil = new Date(issueDate)
  validUntil.setDate(validUntil.getDate() + VALIDITY_DAYS)
  const isHomeCare = data.kind === 'homecare'

  const buildSummary = () => {
    const lines = [
      `*${COMPANY.name} – Orçamento nº ${number}*`,
      `Paciente: ${data.patientName}`,
      '',
      ...data.lines.map((l) => `• ${l.name}: ${brl(l.price)}`),
    ]
    if (isHomeCare) {
      lines.push(`• Taxa de coleta domiciliar: ${brl(data.collectionFee || 0)}`)
      lines.push(`• Deslocamento: ${brl(data.travelFee || 0)}`)
    }
    lines.push('', `*Total: ${brl(data.total)}*`)
    lines.push(`Válido até ${validUntil.toLocaleDateString('pt-BR')}`)
    return lines.join('\n')
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildSummary())
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      alert('Não foi possível copiar o texto.')
    }
  }

  return (
    <div className="min-h-screen bg-neutral-100 px-4 py-8 font-sans print:bg-white print:p-0">
      <style>{`
        @media print {
          @page { size: A4; margin: 14mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="mx-auto mb-6 flex max-w-3xl flex-wrap items-center justify-between gap-3 print:hidden">
        <button
          type="button"
          onClick={() => window.close()}
          className="text-sm font-semibold text-neutral-600 hover:text-neutral-900"
        >
          ← Fechar
        </button>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            {copied ? 'Copiado ✓' : '📋 Copiar resumo (WhatsApp)'}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-green-700"
          >
            🖨️ Imprimir / Salvar PDF
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-10 shadow-lg print:max-w-none print:rounded-none print:p-0 print:shadow-none">
        <div className="flex items-start justify-between border-b-4 border-green-600 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-600 text-2xl font-extrabold text-white">
              L
            </div>
            <div>
              <p className="text-2xl font-extrabold tracking-wide text-neutral-900">{COMPANY.name}</p>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-green-700">
                {COMPANY.subtitle}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Orçamento</p>
            <p className="text-xl font-extrabold text-neutral-900">nº {number}</p>
            <p className="text-xs text-neutral-500">Emitido em {issueDate.toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Paciente</p>
            <p className="mt-1 font-bold text-neutral-900">{data.patientName}</p>
            {data.patientCpf && <p className="text-neutral-600">CPF: {data.patientCpf}</p>}
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Tipo de atendimento</p>
            <p className="mt-1 font-bold text-neutral-900">
              {isHomeCare ? 'Coleta domiciliar (Home Care)' : 'Atendimento no laboratório'}
            </p>
            {isHomeCare && data.neighborhood && data.city && (
              <p className="text-neutral-600">
                {data.neighborhood}, {data.city}
              </p>
            )}
          </div>
        </div>

        <table className="mt-8 w-full border-collapse text-sm">
          <thead>
            <tr className="bg-green-50 text-left text-green-900">
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Descrição</th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider">Valor</th>
            </tr>
          </thead>
          <tbody>
            {data.lines.map((line, idx) => (
              <tr key={idx} className="border-b border-neutral-200">
                <td className="px-4 py-3 text-neutral-800">{line.name}</td>
                <td className="px-4 py-3 text-right font-semibold text-neutral-800">{brl(line.price)}</td>
              </tr>
            ))}

            {isHomeCare && (
              <>
                <tr className="border-b border-neutral-200">
                  <td className="px-4 py-3 text-neutral-800">Taxa de coleta domiciliar</td>
                  <td className="px-4 py-3 text-right font-semibold text-neutral-800">
                    {brl(data.collectionFee || 0)}
                  </td>
                </tr>
                <tr className="border-b border-neutral-200">
                  <td className="px-4 py-3 text-neutral-800">Taxa de deslocamento</td>
                  <td className="px-4 py-3 text-right font-semibold text-neutral-800">
                    {brl(data.travelFee || 0)}
                  </td>
                </tr>
              </>
            )}
          </tbody>
          <tfoot>
            {isHomeCare && (
              <tr>
                <td className="px-4 pt-4 text-right text-xs font-semibold text-neutral-500">Subtotal dos exames</td>
                <td className="px-4 pt-4 text-right text-sm font-semibold text-neutral-700">
                  {brl(data.examsTotal)}
                </td>
              </tr>
            )}
            <tr>
              <td className="px-4 pt-3 text-right text-sm font-bold uppercase tracking-wider text-neutral-700">
                Total
              </td>
              <td className="px-4 pt-3 text-right text-2xl font-extrabold text-green-700">{brl(data.total)}</td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-10 rounded-xl border border-green-200 bg-green-50 p-4 text-xs leading-relaxed text-green-900">
          Este orçamento é válido até <strong>{validUntil.toLocaleDateString('pt-BR')}</strong> ({VALIDITY_DAYS}{' '}
          dias a partir da emissão). Os valores podem ser reajustados após esse prazo ou caso haja alteração nos
          exames solicitados.
        </div>

        {(COMPANY.phone || COMPANY.email || COMPANY.address) && (
          <div className="mt-8 border-t border-neutral-200 pt-4 text-center text-xs text-neutral-500">
            {[COMPANY.phone, COMPANY.email, COMPANY.address].filter(Boolean).join('  •  ')}
          </div>
        )}
      </div>
    </div>
  )
}