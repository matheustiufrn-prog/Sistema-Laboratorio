'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  PANELS,
  boundsFromText,
  computeFlag,
  parseNum,
  resolveRef,
  type LabPanel,
  type Sex,
} from '@/lib/labCatalog'

interface PatientOpt {
  id: string
  fullName: string
  cpf?: string | null
  gender?: string | null
  user?: { email: string } | null
}

interface ProfOpt {
  id: string
  name: string
  specialty: string
  registration?: string | null
  active: boolean
}

interface HistoryItem {
  id: string
  title: string
  panel: string
  releasedAt: string
  professionalName: string
  professionalRegistration?: string | null
  labResultId?: string | null
  patient: { fullName: string }
}

interface RowView {
  key: string
  group: string
  name: string
  unit: string
  refText: string
  min: number | null
  max: number | null
  thousands: boolean
  normal: string[]
  options: string[]
  absOf?: string
  custom: boolean
}

interface CustomRow {
  key: string
  name: string
  unit: string
  ref: string
}

interface Meta {
  material: string
  method: string
}

const dayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Fortaleza',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const toInputDate = (iso: string) => dayFormatter.format(new Date(iso))
const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Fortaleza', dateStyle: 'short', timeStyle: 'short' })

const inputClass =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100'
const labelClass = 'mb-1 block text-xs font-semibold text-neutral-600'
const cardClass = 'space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm'

const FLAG_STYLE = {
  H: 'border-red-300 bg-red-50 text-red-700',
  L: 'border-blue-300 bg-blue-50 text-blue-700',
  A: 'border-amber-300 bg-amber-50 text-amber-700',
} as const
const FLAG_TEXT = { H: 'ALTO', L: 'BAIXO', A: 'ALTERADO' } as const

const INITIAL_META = Object.fromEntries(
  PANELS.map((p) => [p.id, { material: p.material, method: p.method }])
) as Record<string, Meta>

function buildRows(
  panel: LabPanel,
  sex: Sex | null,
  refEdits: Record<string, string>,
  custom: CustomRow[]
): RowView[] {
  const list: RowView[] = []

  for (const g of panel.groups) {
    for (const p of g.params) {
      const key = `${panel.id}.${p.key}`
      const r = resolveRef(p, sex)
      const edited = refEdits[key]
      const thousands = p.unit.startsWith('/mm')
      const bounds = edited !== undefined ? boundsFromText(edited, thousands) : { min: r.min, max: r.max }

      list.push({
        key,
        group: g.name,
        name: p.name,
        unit: p.unit,
        refText: edited ?? r.text,
        min: bounds.min,
        max: bounds.max,
        thousands,
        normal: p.normal ?? [],
        options: p.options ?? [],
        absOf: p.absOf ? `${panel.id}.${p.absOf}` : undefined,
        custom: false,
      })
    }
  }

  for (const c of custom) {
    const thousands = c.unit.startsWith('/mm')
    const text = refEdits[c.key] ?? c.ref
    const bounds = boundsFromText(text, thousands)

    list.push({
      key: c.key,
      group: 'Outros parâmetros',
      name: c.name,
      unit: c.unit,
      refText: text,
      min: bounds.min,
      max: bounds.max,
      thousands,
      normal: [],
      options: [],
      custom: true,
    })
  }

  return list
}

export default function LiberacaoPage() {
  const [patients, setPatients] = useState<PatientOpt[]>([])
  const [professionals, setProfessionals] = useState<ProfOpt[]>([])
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isAdmin, setIsAdmin] = useState(false)

  const [patientId, setPatientId] = useState('')
  const [professionalId, setProfessionalId] = useState('')
  const [activeId, setActiveId] = useState<string>(PANELS[0].id)
  const [collectedAt, setCollectedAt] = useState('')
  const [sexMode, setSexMode] = useState<'auto' | Sex>('auto')
  const [publish, setPublish] = useState(true)
  const [notes, setNotes] = useState('')

  const [values, setValues] = useState<Record<string, string>>({})
  const [refEdits, setRefEdits] = useState<Record<string, string>>({})
  const [customRows, setCustomRows] = useState<Record<string, CustomRow[]>>({})
  const [meta, setMeta] = useState<Record<string, Meta>>(INITIAL_META)
  const [cName, setCName] = useState('')
  const [cUnit, setCUnit] = useState('')
  const [cRef, setCRef] = useState('')

  const [releasing, setReleasing] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [lastRelease, setLastRelease] = useState<{ id: string; title: string } | null>(null)
  const [historyFilter, setHistoryFilter] = useState('')

  const activePanel = PANELS.find((p) => p.id === activeId) ?? PANELS[0]
  const patient = patients.find((p) => p.id === patientId)
  const autoSex: Sex | null = patient?.gender === 'Masculino' ? 'M' : patient?.gender === 'Feminino' ? 'F' : null
  const sex: Sex | null = sexMode === 'auto' ? autoSex : sexMode

  const loadHistory = async (pid: string) => {
    const res = await fetch(`/api/lab-reports${pid ? `?patientId=${encodeURIComponent(pid)}` : ''}`)
    if (res.ok) setHistory(await res.json())
  }

  useEffect(() => {
    setIsAdmin(localStorage.getItem('user_role') === 'ADMIN')
    setCollectedAt(toInputDate(new Date().toISOString()))

    fetch('/api/patients')
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => setPatients(list))
      .catch(() => setPatients([]))

    fetch('/api/professionals')
      .then((r) => (r.ok ? r.json() : []))
      .then((list: ProfOpt[]) => setProfessionals(list.filter((p) => p.active)))
      .catch(() => setProfessionals([]))

    loadHistory('')
  }, [])

  useEffect(() => {
    if (patient) setPublish(Boolean(patient.user))
  }, [patientId])

  const rowsByPanel = useMemo(() => {
    const out: Record<string, RowView[]> = {}
    for (const p of PANELS) out[p.id] = buildRows(p, sex, refEdits, customRows[p.id] ?? [])
    return out
  }, [sex, refEdits, customRows])

  const countOf = (panelId: string) =>
    (rowsByPanel[panelId] ?? []).filter((r) => (values[r.key] || '').trim() !== '').length

  const totalFilled = PANELS.reduce((sum, p) => sum + countOf(p.id), 0)
  const filledPanels = PANELS.filter((p) => countOf(p.id) > 0)

  const activeRows = rowsByPanel[activeId] ?? []
  const groups = useMemo(() => {
    const order: string[] = []
    const map = new Map<string, RowView[]>()
    for (const r of activeRows) {
      if (!map.has(r.group)) {
        map.set(r.group, [])
        order.push(r.group)
      }
      map.get(r.group)!.push(r)
    }
    return order.map((name) => ({ name, rows: map.get(name)! }))
  }, [activeRows])

  const needsSex = activePanel.groups.some((g) => g.params.some((p) => p.ref.M && p.ref.F && !p.ref.ALL))
  const activeMeta = meta[activeId] ?? INITIAL_META[activeId]

  const calcAbsolutes = () => {
    const rows = rowsByPanel['HEMOGRAMA'] ?? []
    const total = parseNum(values['HEMOGRAMA.leuco'] || '', true)
    if (total === null) {
      setError('Informe os leucócitos totais para calcular os valores absolutos.')
      return
    }
    setError('')
    const next = { ...values }
    for (const r of rows) {
      if (!r.absOf) continue
      const pct = parseNum(values[r.absOf] || '')
      if (pct !== null) next[r.key] = Math.round((total * pct) / 100).toLocaleString('pt-BR')
    }
    setValues(next)
  }

  const addCustom = () => {
    if (!cName.trim()) return
    const row: CustomRow = {
      key: `${activeId}.custom-${Date.now()}`,
      name: cName.trim(),
      unit: cUnit.trim(),
      ref: cRef.trim(),
    }
    setCustomRows((c) => ({ ...c, [activeId]: [...(c[activeId] ?? []), row] }))
    setCName('')
    setCUnit('')
    setCRef('')
  }

  const removeCustom = (key: string) =>
    setCustomRows((c) => ({ ...c, [activeId]: (c[activeId] ?? []).filter((r) => r.key !== key) }))

  const resetForm = () => {
    setValues({})
    setRefEdits({})
    setCustomRows({})
    setMeta(INITIAL_META)
    setNotes('')
  }

  const handleRelease = async () => {
    setError('')
    setMessage('')
    setLastRelease(null)

    if (!patientId) {
      setError('Selecione o paciente.')
      return
    }
    if (!professionalId) {
      setError('Selecione o profissional que está liberando o laudo.')
      return
    }

    const sections = filledPanels.map((p) => ({
      panel: p.id,
      material: meta[p.id]?.material ?? p.material,
      method: meta[p.id]?.method ?? p.method,
      items: (rowsByPanel[p.id] ?? [])
        .filter((r) => (values[r.key] || '').trim() !== '')
        .map((r) => ({
          group: r.group,
          name: r.name,
          value: (values[r.key] || '').trim(),
          unit: r.unit,
          ref: r.refText,
          min: r.min,
          max: r.max,
          thousands: r.thousands,
          normal: r.normal,
        })),
    }))

    if (sections.length === 0) {
      setError('Preencha pelo menos um resultado.')
      return
    }

    const prof = professionals.find((p) => p.id === professionalId)
    const names = filledPanels.map((p) => p.short).join(', ')
    const confirmText = `Liberar UM laudo em PDF com: ${names}\nPaciente: ${patient?.fullName}\nProfissional: ${prof?.name}\n\nDepois de liberado, o laudo não pode ser editado.`
    if (!window.confirm(confirmText)) return

    setReleasing(true)
    try {
      const res = await fetch('/api/lab-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          professionalId,
          collectedAt,
          notes,
          publish,
          sections,
        }),
      })
      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        setLastRelease(data.report)
        setMessage(
          publish
            ? 'Laudo liberado em um único PDF! Ele já está disponível no portal do paciente.'
            : 'Laudo liberado em um único PDF!'
        )
        resetForm()
        loadHistory(historyFilter)
      } else {
        setError(data.error || 'Erro ao liberar o laudo.')
      }
    } catch {
      setError('Erro de conexão ao liberar o laudo.')
    } finally {
      setReleasing(false)
    }
  }

  const handleDelete = async (h: HistoryItem) => {
    if (!window.confirm(`Excluir o laudo "${h.title}" de ${h.patient.fullName}? Ele também sai do portal do paciente.`))
      return
    const res = await fetch(`/api/lab-reports/${h.id}`, { method: 'DELETE' })
    if (res.ok) {
      setMessage('Laudo excluído.')
      loadHistory(historyFilter)
    } else {
      setError('Erro ao excluir o laudo.')
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-8 font-sans">
      <div className="rounded-2xl border-l-8 border-green-500 bg-green-800 p-6 text-white shadow-md">
        <h1 className="text-2xl font-bold">🧪 Liberação de Exames</h1>
        <p className="mt-1 text-sm text-green-100">
          Preencha um ou mais exames e gere um único laudo em PDF, com o profissional responsável.
        </p>
      </div>

      {message && (
        <div className="space-y-2 rounded-xl bg-green-100 p-4 text-sm font-bold text-green-800">
          <p>{message}</p>
          {lastRelease && (
            <div className="flex flex-wrap gap-2">
              <a
                href={`/api/lab-reports/${lastRelease.id}?inline=1`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-green-600 px-4 py-2 text-xs font-bold text-white hover:bg-green-700"
              >
                👁️ Abrir PDF
              </a>
              <a
                href={`/api/lab-reports/${lastRelease.id}`}
                className="rounded-lg bg-white px-4 py-2 text-xs font-bold text-green-800 hover:bg-green-50"
              >
                ⬇️ Baixar PDF
              </a>
            </div>
          )}
        </div>
      )}
      {error && <p className="rounded-xl bg-red-100 p-3 text-sm font-bold text-red-700">{error}</p>}

      <div className={cardClass}>
        <h2 className="text-lg font-bold text-neutral-800">1. Paciente e profissional</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>Paciente cadastrado *</label>
            <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className={inputClass}>
              <option value="">-- Escolha o paciente --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName}
                  {p.cpf ? ` (CPF: ${p.cpf})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Profissional que libera o laudo *</label>
            <select value={professionalId} onChange={(e) => setProfessionalId(e.target.value)} className={inputClass}>
              <option value="">-- Escolha o profissional --</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.specialty}
                  {p.registration ? ` — ${p.registration}` : ''}
                </option>
              ))}
            </select>
            {professionals.length === 0 && (
              <p className="mt-1 text-xs text-red-600">
                Nenhum profissional ativo. Cadastre em Consultas Médicas → Profissionais.
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>Data da coleta</label>
            <input type="date" value={collectedAt} onChange={(e) => setCollectedAt(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Sexo para os valores de referência</label>
            <select value={sexMode} onChange={(e) => setSexMode(e.target.value as 'auto' | Sex)} className={inputClass}>
              <option value="auto">
                Automático (cadastro do paciente
                {autoSex ? `: ${autoSex === 'M' ? 'Masculino' : 'Feminino'}` : ': não informado'})
              </option>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
            </select>
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-neutral-700">
          <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
          Disponibilizar o laudo no portal do paciente
          {patient && !patient.user && (
            <span className="font-normal text-neutral-500">(este paciente ainda não tem acesso ao portal)</span>
          )}
        </label>
      </div>

      <div className={cardClass}>
        <div>
          <h2 className="text-lg font-bold text-neutral-800">2. Exames do laudo</h2>
          <p className="text-xs text-neutral-500">
            Troque de aba e preencha quantos exames quiser. Todos os exames com resultado saem juntos em um único PDF.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {PANELS.map((p) => {
            const n = countOf(p.id)
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActiveId(p.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  activeId === p.id
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                {p.short}
                {n > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      activeId === p.id ? 'bg-white text-green-700' : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {n}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="rounded-lg bg-green-50 p-3 text-xs font-semibold text-green-900">
          {filledPanels.length === 0
            ? 'Nenhum resultado preenchido ainda.'
            : `No laudo: ${filledPanels.map((p) => `${p.short} (${countOf(p.id)})`).join(' • ')}`}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <h3 className="text-base font-bold text-neutral-800">{activePanel.name}</h3>
          {activePanel.id === 'HEMOGRAMA' && (
            <button
              type="button"
              onClick={calcAbsolutes}
              className="rounded-lg border border-green-600 bg-white px-4 py-2 text-xs font-bold text-green-700 transition hover:bg-green-50"
            >
              🧮 Calcular valores absolutos
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>Material</label>
            <input
              type="text"
              value={activeMeta.material}
              onChange={(e) => setMeta((m) => ({ ...m, [activeId]: { ...activeMeta, material: e.target.value } }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Método</label>
            <input
              type="text"
              value={activeMeta.method}
              onChange={(e) => setMeta((m) => ({ ...m, [activeId]: { ...activeMeta, method: e.target.value } }))}
              className={inputClass}
            />
          </div>
        </div>

        <p className="text-xs text-neutral-500">
          As referências são faixas comuns para adultos: confira com a bula do seu método e ajuste na coluna de
          referência, se precisar.
        </p>

        {needsSex && !sex && (
          <p className="rounded-lg bg-yellow-50 p-2 text-xs font-semibold text-yellow-800">
            O sexo do paciente não está informado: as referências mostram homens e mulheres e nada é sinalizado como alto
            ou baixo. Escolha o sexo acima para sinalizar os valores alterados.
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b bg-neutral-100 text-xs uppercase tracking-wide text-neutral-600">
                <th className="p-2">Parâmetro</th>
                <th className="w-56 p-2">Resultado</th>
                <th className="w-28 p-2">Unidade</th>
                <th className="w-64 p-2">Valores de referência</th>
              </tr>
            </thead>
            {groups.map((g) => (
              <tbody key={g.name}>
                <tr className="bg-green-50">
                  <td colSpan={4} className="p-2 text-xs font-bold uppercase tracking-wide text-green-900">
                    {g.name}
                  </td>
                </tr>
                {g.rows.map((r) => {
                  const value = values[r.key] || ''
                  const flag = computeFlag({ value, min: r.min, max: r.max, thousands: r.thousands, normal: r.normal })
                  return (
                    <tr key={r.key} className="border-b">
                      <td className="p-2 font-semibold text-black">
                        {r.name}
                        {r.custom && (
                          <button
                            type="button"
                            onClick={() => removeCustom(r.key)}
                            className="ml-2 text-xs font-bold text-red-600"
                          >
                            remover
                          </button>
                        )}
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            inputMode={r.options.length ? 'text' : 'decimal'}
                            list={r.options.length ? `dl-${r.key}` : undefined}
                            value={value}
                            onChange={(e) => setValues((v) => ({ ...v, [r.key]: e.target.value }))}
                            className={`${inputClass} ${flag ? 'border-red-400 font-bold text-red-700' : ''}`}
                          />
                          {flag && (
                            <span
                              className={`whitespace-nowrap rounded border px-2 py-1 text-[10px] font-bold ${FLAG_STYLE[flag]}`}
                            >
                              {FLAG_TEXT[flag]}
                            </span>
                          )}
                        </div>
                        {r.options.length > 0 && (
                          <datalist id={`dl-${r.key}`}>
                            {r.options.map((o) => (
                              <option key={o} value={o} />
                            ))}
                          </datalist>
                        )}
                      </td>
                      <td className="p-2 text-xs text-neutral-600">{r.unit || '-'}</td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={r.refText}
                          onChange={(e) => setRefEdits((x) => ({ ...x, [r.key]: e.target.value }))}
                          className="w-full rounded border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs text-neutral-700"
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            ))}
          </table>
        </div>

        <div className="grid grid-cols-1 gap-2 border-t pt-4 sm:grid-cols-5">
          <input
            type="text"
            value={cName}
            onChange={(e) => setCName(e.target.value)}
            placeholder="Novo parâmetro"
            className={`${inputClass} sm:col-span-2`}
          />
          <input type="text" value={cUnit} onChange={(e) => setCUnit(e.target.value)} placeholder="Unidade" className={inputClass} />
          <input
            type="text"
            value={cRef}
            onChange={(e) => setCRef(e.target.value)}
            placeholder="Referência (ex.: 10 a 20)"
            className={inputClass}
          />
          <button
            type="button"
            onClick={addCustom}
            className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-bold text-neutral-800 transition hover:bg-neutral-200"
          >
            + Adicionar
          </button>
        </div>
      </div>

      <div className={cardClass}>
        <div>
          <label className={labelClass}>Observações do laudo (opcional)</label>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-neutral-600">
            {totalFilled} resultado(s) em {filledPanels.length} exame(s). Será gerado 1 PDF.
          </p>
          <button
            type="button"
            onClick={handleRelease}
            disabled={releasing}
            className="rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {releasing ? 'Gerando PDF...' : '✅ Liberar laudo em PDF'}
          </button>
        </div>
      </div>

      <div className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-neutral-800">📋 Laudos liberados</h2>
          <select
            value={historyFilter}
            onChange={(e) => {
              setHistoryFilter(e.target.value)
              loadHistory(e.target.value)
            }}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black"
          >
            <option value="">Todos os pacientes</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName}
              </option>
            ))}
          </select>
        </div>

        {history.length === 0 ? (
          <p className="text-sm text-neutral-500">Nenhum laudo liberado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-neutral-100 text-neutral-600">
                  <th className="p-3">Liberado em</th>
                  <th className="p-3">Paciente</th>
                  <th className="p-3">Exame(s)</th>
                  <th className="p-3">Profissional</th>
                  <th className="p-3">Portal</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-b hover:bg-neutral-50">
                    <td className="p-3 text-neutral-600">{fmtDateTime(h.releasedAt)}</td>
                    <td className="p-3 font-semibold text-black">{h.patient.fullName}</td>
                    <td className="p-3 text-neutral-700">{h.title}</td>
                    <td className="p-3 text-xs text-neutral-600">
                      {h.professionalName}
                      {h.professionalRegistration ? ` — ${h.professionalRegistration}` : ''}
                    </td>
                    <td className="p-3 text-xs">
                      {h.labResultId ? (
                        <span className="rounded border border-green-200 bg-green-50 px-2 py-1 font-bold text-green-700">
                          Disponível
                        </span>
                      ) : (
                        <span className="text-neutral-400">Não</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <a
                          href={`/api/lab-reports/${h.id}?inline=1`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-800 hover:bg-neutral-200"
                        >
                          👁️ Ver
                        </a>
                        <a
                          href={`/api/lab-reports/${h.id}`}
                          className="rounded bg-green-600 px-3 py-1 text-xs font-bold text-white hover:bg-green-700"
                        >
                          ⬇️ Baixar
                        </a>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDelete(h)}
                            className="rounded bg-red-600 px-3 py-1 text-xs font-bold text-white hover:bg-red-700"
                          >
                            Excluir
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
