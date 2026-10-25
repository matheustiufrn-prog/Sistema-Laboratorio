'use client'

import { useEffect, useState } from 'react'

interface PatientLite {
  id: string
  fullName: string
  cpf?: string | null
}

interface Professional {
  id: string
  name: string
  specialty: string
  registration?: string | null
  phone?: string | null
  consultationPrice: number
  active: boolean
  user?: { email: string } | null
  patients?: PatientLite[]
  _count?: { medicalRecords: number; orders: number }
}

interface Ctx {
  role: string
  professional: { id: string; name: string; specialty: string; registration?: string | null } | null
  patients: PatientLite[]
  professionals: {
    id: string
    name: string
    specialty: string
    registration?: string | null
    active: boolean
    patientIds: string[]
  }[]
}

interface RecordItem {
  id: string
  complaint: string | null
  evaluation: string | null
  diagnosis: string | null
  plan: string | null
  createdAt: string
  professional: { name: string; specialty: string; registration?: string | null }
}

const brl = (v: number) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const inputClass =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-black outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100'
const labelClass = 'mb-1 block text-xs font-semibold text-neutral-600'

export default function ConsultasPage() {
  const [ctx, setCtx] = useState<Ctx | null>(null)
  const [tab, setTab] = useState<'prof' | 'records'>('records')
  const [loadError, setLoadError] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [form, setForm] = useState({
    name: '',
    specialty: '',
    registration: '',
    phone: '',
    consultationPrice: '',
    accessEmail: '',
    password: '',
  })
  const [linkSelect, setLinkSelect] = useState<Record<string, string>>({})

  const [patientId, setPatientId] = useState('')
  const [professionalId, setProfessionalId] = useState('')
  const [records, setRecords] = useState<RecordItem[]>([])
  const [recordForm, setRecordForm] = useState({ complaint: '', evaluation: '', diagnosis: '', plan: '' })
  const [saving, setSaving] = useState(false)

  const isAdmin = ctx?.role === 'ADMIN'

  const loadCtx = async () => {
    const res = await fetch('/api/medical-records/patients')
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setLoadError(data.error || 'Não foi possível carregar os dados.')
      return null
    }
    setCtx(data)
    return data as Ctx
  }

  const loadProfessionals = async () => {
    const res = await fetch('/api/professionals')
    if (res.ok) setProfessionals(await res.json())
  }

  const loadRecords = async (pid: string) => {
    if (!pid) {
      setRecords([])
      return
    }
    const res = await fetch(`/api/medical-records?patientId=${encodeURIComponent(pid)}`)
    setRecords(res.ok ? await res.json() : [])
  }

  useEffect(() => {
    const init = async () => {
      const data = await loadCtx()
      if (data?.role === 'ADMIN') {
        setTab('prof')
        loadProfessionals()
      }
    }
    init()
  }, [])

  useEffect(() => {
    loadRecords(patientId)
    setProfessionalId('')
  }, [patientId])

  const switchTab = (t: 'prof' | 'records') => {
    setTab(t)
    setMessage('')
    setError('')
    if (t === 'records') loadCtx()
    if (t === 'prof') {
      loadProfessionals()
      loadCtx()
    }
  }

  const setF = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value })

  const setR = (key: keyof typeof recordForm) => (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    setRecordForm({ ...recordForm, [key]: e.target.value })

  const handleCreateProfessional = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setError('')

    const res = await fetch('/api/professionals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json().catch(() => ({}))

    if (res.ok) {
      setMessage(
        form.accessEmail
          ? 'Profissional cadastrado! O acesso dele já está ativo.'
          : 'Profissional cadastrado com sucesso!'
      )
      setForm({
        name: '',
        specialty: '',
        registration: '',
        phone: '',
        consultationPrice: '',
        accessEmail: '',
        password: '',
      })
      loadProfessionals()
    } else {
      setError(data.error || 'Erro ao cadastrar o profissional.')
    }
  }

  const patchProfessional = async (id: string, body: Record<string, unknown>, okMessage: string) => {
    setMessage('')
    setError('')

    const res = await fetch(`/api/professionals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))

    if (res.ok) {
      setMessage(okMessage)
      loadProfessionals()
      loadCtx()
    } else {
      setError(data.error || 'Erro ao atualizar o profissional.')
    }
  }

  const handleEditPrice = (p: Professional) => {
    const typed = window.prompt(`Novo valor da consulta de ${p.name} (R$):`, String(p.consultationPrice))
    if (typed === null) return
    const value = Number(typed.replace(',', '.'))
    if (!(value >= 0)) {
      setError('Valor inválido.')
      return
    }
    patchProfessional(p.id, { consultationPrice: value }, 'Valor da consulta atualizado.')
  }

  const handleAccess = (p: Professional) => {
    let accessEmail = p.user?.email || ''
    if (!p.user) {
      const typed = window.prompt(`E-mail de acesso para ${p.name}:`)
      if (!typed) return
      accessEmail = typed.trim()
    }
    const password = window.prompt(`Nova senha de acesso de ${p.name} (mínimo 6 caracteres):`)
    if (!password) return
    patchProfessional(p.id, { password, accessEmail }, 'Acesso do profissional atualizado.')
  }

  const handleDeleteProfessional = async (p: Professional) => {
    if (!window.confirm(`Excluir o profissional ${p.name}?`)) return

    const res = await fetch(`/api/professionals/${p.id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))

    if (res.ok) {
      setError('')
      setMessage('Profissional excluído.')
      loadProfessionals()
    } else {
      setMessage('')
      setError(data.error || 'Erro ao excluir o profissional.')
    }
  }

  const profOptions = (ctx?.professionals || []).filter(
    (p) => p.active && patientId && p.patientIds.includes(patientId)
  )
  const effectiveProfessionalId =
    ctx?.role === 'DOCTOR' ? '' : professionalId || (profOptions.length === 1 ? profOptions[0].id : '')

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setError('')
    setSaving(true)

    try {
      const res = await fetch('/api/medical-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, professionalId: effectiveProfessionalId, ...recordForm }),
      })
      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        setMessage('Registro adicionado ao prontuário.')
        setRecordForm({ complaint: '', evaluation: '', diagnosis: '', plan: '' })
        loadRecords(patientId)
      } else {
        setError(data.error || 'Erro ao salvar o prontuário.')
      }
    } catch {
      setError('Erro de conexão ao salvar o prontuário.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm('Excluir este registro do prontuário? Esta ação não pode ser desfeita.')) return

    const res = await fetch(`/api/medical-records/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setMessage('Registro excluído.')
      loadRecords(patientId)
    } else {
      setError('Erro ao excluir o registro.')
    }
  }

  if (loadError) {
    return (
      <div className="p-8">
        <p className="mx-auto max-w-xl rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-sm font-semibold text-red-700">
          {loadError}
        </p>
      </div>
    )
  }

  if (!ctx) {
    return <div className="p-8 text-sm text-neutral-500">Carregando...</div>
  }

  const tabClass = (active: boolean) =>
    `rounded-lg px-4 py-2 text-sm font-semibold transition ${
      active
        ? 'bg-green-600 text-white shadow-sm'
        : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
    }`

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-8 font-sans">
      <div className="rounded-2xl border-l-8 border-green-500 bg-green-800 p-6 text-white shadow-md">
        <h1 className="text-2xl font-bold">🩺 Consultas Médicas</h1>
        <p className="mt-1 text-sm text-green-100">
          {isAdmin
            ? 'Cadastre profissionais, vincule pacientes e acompanhe os prontuários.'
            : `${ctx.professional?.name || ''}${ctx.professional?.specialty ? ` — ${ctx.professional.specialty}` : ''}`}
        </p>
      </div>

      {isAdmin && (
        <div className="flex gap-2">
          <button type="button" onClick={() => switchTab('prof')} className={tabClass(tab === 'prof')}>
            👨‍⚕️ Profissionais
          </button>
          <button type="button" onClick={() => switchTab('records')} className={tabClass(tab === 'records')}>
            📋 Prontuários
          </button>
        </div>
      )}

      {message && <p className="rounded bg-green-100 p-2 text-xs font-bold text-green-700">{message}</p>}
      {error && <p className="rounded bg-red-100 p-2 text-xs font-bold text-red-700">{error}</p>}

      {isAdmin && tab === 'prof' && (
        <>
          <div className="space-y-5 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-neutral-800">➕ Novo profissional</h2>

            <form onSubmit={handleCreateProfessional} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Nome *</label>
                  <input type="text" required value={form.name} onChange={setF('name')} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Especialidade *</label>
                  <input
                    type="text"
                    required
                    value={form.specialty}
                    onChange={setF('specialty')}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Registro profissional (CRM etc.)</label>
                  <input
                    type="text"
                    value={form.registration}
                    onChange={setF('registration')}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Telefone</label>
                  <input type="text" value={form.phone} onChange={setF('phone')} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Valor da consulta (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form.consultationPrice}
                    onChange={setF('consultationPrice')}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-neutral-500">
                  Acesso ao sistema (para o médico lançar prontuários) — opcional
                </p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>E-mail de acesso</label>
                    <input
                      type="email"
                      value={form.accessEmail}
                      onChange={setF('accessEmail')}
                      autoComplete="off"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Senha (mínimo 6 caracteres)</label>
                    <input
                      type="text"
                      value={form.password}
                      onChange={setF('password')}
                      autoComplete="off"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-green-600 py-3 text-sm font-bold text-white transition hover:bg-green-700"
              >
                Cadastrar profissional
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-neutral-800">👨‍⚕️ Profissionais cadastrados</h2>

            {professionals.length === 0 ? (
              <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
                Nenhum profissional cadastrado.
              </div>
            ) : (
              professionals.map((p) => {
                const linkedIds = new Set((p.patients || []).map((x) => x.id))
                const available = ctx.patients.filter((x) => !linkedIds.has(x.id))

                return (
                  <div key={p.id} className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="flex items-center gap-2 font-bold text-black">
                          {p.name}
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                              p.active
                                ? 'border-green-200 bg-green-50 text-green-700'
                                : 'border-neutral-200 bg-neutral-100 text-neutral-500'
                            }`}
                          >
                            {p.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </p>
                        <p className="text-xs text-neutral-500">
                          {p.specialty}
                          {p.registration ? ` · ${p.registration}` : ''}
                          {p.phone ? ` · ${p.phone}` : ''}
                        </p>
                        <p className="mt-1 text-xs text-neutral-600">
                          Consulta: <span className="font-bold text-green-700">{brl(p.consultationPrice)}</span> ·
                          Acesso:{' '}
                          <span className="font-semibold">{p.user?.email || 'sem acesso ao sistema'}</span>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditPrice(p)}
                          className="rounded bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-800 transition hover:bg-neutral-200"
                        >
                          💲 Valor
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAccess(p)}
                          className="rounded bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-800 transition hover:bg-neutral-200"
                        >
                          🔑 {p.user ? 'Redefinir senha' : 'Criar acesso'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            patchProfessional(
                              p.id,
                              { active: !p.active },
                              p.active ? 'Profissional desativado.' : 'Profissional ativado.'
                            )
                          }
                          className="rounded bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-800 transition hover:bg-neutral-200"
                        >
                          {p.active ? 'Desativar' : 'Ativar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProfessional(p)}
                          className="rounded bg-red-600 px-3 py-1 text-xs font-bold text-white transition hover:bg-red-700"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 border-t pt-4">
                      <p className="text-xs font-bold uppercase text-neutral-500">
                        Pacientes vinculados ({p.patients?.length || 0})
                      </p>

                      {(p.patients || []).length === 0 ? (
                        <p className="text-xs text-neutral-400">Nenhum paciente vinculado.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {(p.patients || []).map((pt) => (
                            <span
                              key={pt.id}
                              className="flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-800"
                            >
                              {pt.fullName}
                              <button
                                type="button"
                                onClick={() =>
                                  patchProfessional(p.id, { unlinkPatientId: pt.id }, 'Paciente desvinculado.')
                                }
                                className="font-bold text-green-700 hover:text-red-600"
                                aria-label="Desvincular"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <select
                          value={linkSelect[p.id] || ''}
                          onChange={(e) => setLinkSelect((s) => ({ ...s, [p.id]: e.target.value }))}
                          className="min-w-56 flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs text-black"
                        >
                          <option value="">-- Escolha o paciente para vincular --</option>
                          {available.map((pt) => (
                            <option key={pt.id} value={pt.id}>
                              {pt.fullName}
                              {pt.cpf ? ` (CPF: ${pt.cpf})` : ''}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={!linkSelect[p.id]}
                          onClick={() => {
                            patchProfessional(p.id, { linkPatientId: linkSelect[p.id] }, 'Paciente vinculado.')
                            setLinkSelect((s) => ({ ...s, [p.id]: '' }))
                          }}
                          className="rounded-lg bg-green-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Vincular
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </>
      )}

      {tab === 'records' && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="h-fit space-y-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-neutral-800">📝 Novo registro</h2>

            <div>
              <label className={labelClass}>Paciente *</label>
              <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className={inputClass}>
                <option value="">-- Escolha o paciente --</option>
                {ctx.patients.map((pt) => (
                  <option key={pt.id} value={pt.id}>
                    {pt.fullName}
                    {pt.cpf ? ` (CPF: ${pt.cpf})` : ''}
                  </option>
                ))}
              </select>
              {!isAdmin && ctx.patients.length === 0 && (
                <p className="mt-2 text-xs text-neutral-500">
                  Nenhum paciente vinculado a você. Peça ao administrador para vincular.
                </p>
              )}
            </div>

            {isAdmin && patientId && (
              <div>
                <label className={labelClass}>Profissional responsável *</label>
                {profOptions.length === 0 ? (
                  <p className="text-xs text-red-600">
                    Nenhum profissional vinculado a este paciente. Vincule na aba Profissionais.
                  </p>
                ) : (
                  <select
                    value={effectiveProfessionalId}
                    onChange={(e) => setProfessionalId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">-- Escolha --</option>
                    {profOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.specialty}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <form onSubmit={handleAddRecord} className="space-y-3">
              <div>
                <label className={labelClass}>Queixa principal</label>
                <textarea rows={2} value={recordForm.complaint} onChange={setR('complaint')} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Avaliação / exame clínico</label>
                <textarea rows={3} value={recordForm.evaluation} onChange={setR('evaluation')} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Diagnóstico</label>
                <textarea rows={2} value={recordForm.diagnosis} onChange={setR('diagnosis')} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Conduta / prescrição</label>
                <textarea rows={3} value={recordForm.plan} onChange={setR('plan')} className={inputClass} />
              </div>

              <button
                type="submit"
                disabled={saving || !patientId || (isAdmin && !effectiveProfessionalId)}
                className="w-full rounded-lg bg-green-600 py-2.5 text-sm font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Adicionar ao prontuário'}
              </button>
              <p className="text-[11px] text-neutral-500">
                Os registros não podem ser editados depois de salvos.
              </p>
            </form>
          </div>

          <div className="space-y-4 lg:col-span-2">
            <h2 className="text-lg font-bold text-neutral-800">📋 Histórico do paciente</h2>

            {!patientId ? (
              <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
                Escolha um paciente para ver o prontuário.
              </div>
            ) : records.length === 0 ? (
              <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
                Nenhum registro no prontuário deste paciente.
              </div>
            ) : (
              records.map((r) => (
                <div key={r.id} className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-black">
                        {new Date(r.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Fortaleza' })}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {r.professional.name} — {r.professional.specialty}
                        {r.professional.registration ? ` · ${r.professional.registration}` : ''}
                      </p>
                    </div>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDeleteRecord(r.id)}
                        className="rounded bg-red-100 px-2 py-1 text-xs font-bold text-red-700 hover:bg-red-200"
                      >
                        ✕ Excluir
                      </button>
                    )}
                  </div>

                  {(
                    [
                      ['Queixa principal', r.complaint],
                      ['Avaliação / exame clínico', r.evaluation],
                      ['Diagnóstico', r.diagnosis],
                      ['Conduta / prescrição', r.plan],
                    ] as [string, string | null][]
                  )
                    .filter(([, value]) => value)
                    .map(([title, value]) => (
                      <div key={title}>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-green-700">{title}</p>
                        <p className="whitespace-pre-wrap text-sm text-neutral-800">{value}</p>
                      </div>
                    ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}