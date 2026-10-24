'use client'

import { useEffect, useState } from 'react'

interface Patient {
  id: string
  fullName: string
  cpf?: string | null
  phone?: string | null
  birthDate?: string | null
  address?: string | null
  user?: { email: string } | null
  _count?: { results: number }
}

export default function PacientesPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  const [fullName, setFullName] = useState('')
  const [cpf, setCpf] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/patients')
      if (res.ok) setPatients(await res.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setIsAdmin(localStorage.getItem('user_role') === 'ADMIN')
    fetchPatients()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setError('')
    setSaving(true)

    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, cpf, birthDate, gender, phone, address, email, password }),
      })
      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        setMessage(
          email
            ? 'Paciente cadastrado! O acesso ao portal já está ativo.'
            : 'Paciente cadastrado com sucesso!'
        )
        setFullName('')
        setCpf('')
        setBirthDate('')
        setGender('')
        setPhone('')
        setAddress('')
        setEmail('')
        setPassword('')
        fetchPatients()
      } else {
        setError(data.error || 'Erro ao cadastrar o paciente.')
      }
    } catch {
      setError('Erro de conexão ao cadastrar o paciente.')
    } finally {
      setSaving(false)
    }
  }

  const handleResetPassword = async (p: Patient) => {
    let accessEmail = p.user?.email || ''

    if (!p.user) {
      const typed = window.prompt(`E-mail de acesso ao portal para ${p.fullName}:`)
      if (!typed) return
      accessEmail = typed.trim()
    }

    const newPassword = window.prompt(
      `Nova senha do portal para ${p.fullName} (mínimo 6 caracteres):`
    )
    if (!newPassword) return

    const res = await fetch(`/api/patients/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword, email: accessEmail }),
    })
    const data = await res.json().catch(() => ({}))

    if (res.ok) {
      setError('')
      setMessage(`Acesso de ${p.fullName} atualizado.`)
      fetchPatients()
    } else {
      setMessage('')
      setError(data.error || 'Erro ao atualizar o acesso.')
    }
  }

  const handleDelete = async (p: Patient) => {
    const aviso = `Excluir o paciente ${p.fullName}?\n\nIsso também apaga as ordens de serviço, os orçamentos Home Care, os resultados anexados e o acesso ao portal dele. Os valores dessas OS saem do financeiro.\n\nEsta ação não pode ser desfeita.`
    if (!window.confirm(aviso)) return

    const res = await fetch(`/api/patients/${p.id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))

    if (res.ok) {
      setError('')
      setMessage('Paciente excluído com sucesso!')
      fetchPatients()
    } else {
      setMessage('')
      setError(data.error || 'Erro ao excluir o paciente.')
    }
  }

  const inputClass =
    'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-black outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100'
  const labelClass = 'mb-1 block text-xs font-semibold text-neutral-600'

  return (
    <div className="p-8 space-y-8 font-sans max-w-6xl mx-auto">
      <div className="bg-green-800 text-white p-6 rounded-2xl border-l-8 border-green-500 shadow-md">
        <h1 className="text-2xl font-bold">Gestão de Pacientes</h1>
        <p className="text-green-100 text-sm mt-1">
          Cadastre pacientes e, se quiser, crie o acesso ao portal para ele baixar os resultados.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm space-y-5">
        <h2 className="text-lg font-bold text-neutral-800">➕ Novo Paciente</h2>

        {message && <p className="text-xs font-bold text-green-700 bg-green-100 p-2 rounded">{message}</p>}
        {error && <p className="text-xs font-bold text-red-700 bg-red-100 p-2 rounded">{error}</p>}

        <form onSubmit={handleCreate} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className={labelClass}>Nome completo *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>CPF</label>
              <input type="text" value={cpf} onChange={(e) => setCpf(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Telefone</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Data de nascimento</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Sexo</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputClass}>
                <option value="">Não informado</option>
                <option value="Feminino">Feminino</option>
                <option value="Masculino">Masculino</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Endereço completo</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-neutral-500">
              Dados de acesso do paciente (portal) — opcional
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Senha inicial (mínimo 6 caracteres)</label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="off"
                  className={inputClass}
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-neutral-500">
              Com e-mail e senha preenchidos, o paciente entra em /paciente/login e baixa os resultados.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-green-600 py-3 text-sm font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Cadastrando...' : 'Cadastrar Paciente'}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-neutral-800">📋 Pacientes Cadastrados</h2>

        {loading ? (
          <p className="text-sm text-neutral-500">Carregando pacientes...</p>
        ) : patients.length === 0 ? (
          <p className="text-sm text-neutral-500">Nenhum paciente cadastrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-neutral-100 border-b text-neutral-600">
                  <th className="p-3">Paciente</th>
                  <th className="p-3">Contato</th>
                  <th className="p-3">Portal</th>
                  <th className="p-3">Resultados</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-neutral-50">
                    <td className="p-3 font-semibold text-black">
                      {p.fullName}
                      {p.cpf && <span className="block text-xs font-normal text-neutral-500">CPF: {p.cpf}</span>}
                    </td>
                    <td className="p-3 text-neutral-600">{p.phone || '-'}</td>
                    <td className="p-3">
                      {p.user?.email ? (
                        <span className="rounded-md border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">
                          {p.user.email}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400">Sem acesso</span>
                      )}
                    </td>
                    <td className="p-3">
                      <a
                        href={`/admin/resultados?patientId=${p.id}`}
                        className="text-xs font-bold text-green-700 hover:underline"
                      >
                        📄 {p._count?.results ?? 0} resultado(s)
                      </a>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleResetPassword(p)}
                          className="rounded bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-800 transition hover:bg-neutral-200"
                        >
                          🔑 {p.user ? 'Redefinir senha' : 'Criar acesso'}
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDelete(p)}
                            className="rounded bg-red-600 px-3 py-1 text-xs font-bold text-white transition hover:bg-red-700"
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