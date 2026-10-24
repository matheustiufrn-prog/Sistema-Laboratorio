'use client'

import { useEffect, useState } from 'react'

interface Patient {
  id: string
  fullName: string
  cpf?: string | null
}

interface ResultRow {
  id: string
  patientId: string
  title: string
  notes: string | null
  fileName: string
  fileSize: number
  createdAt: string
  patient?: { fullName: string; cpf?: string | null }
}

const MAX_SIZE = 4 * 1024 * 1024

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`

export default function ResultadosPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [results, setResults] = useState<ResultRow[]>([])
  const [loading, setLoading] = useState(true)

  const [filterPatient, setFilterPatient] = useState('')
  const [patientId, setPatientId] = useState('')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileKey, setFileKey] = useState(0)
  const [uploading, setUploading] = useState(false)

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const fetchResults = async (pid: string) => {
    try {
      const url = pid ? `/api/results?patientId=${encodeURIComponent(pid)}` : '/api/results'
      const res = await fetch(url)
      if (res.ok) setResults(await res.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const preselected = new URLSearchParams(window.location.search).get('patientId') || ''
    setFilterPatient(preselected)
    setPatientId(preselected)

    fetch('/api/patients')
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => setPatients(list))
      .catch(() => setPatients([]))

    fetchResults(preselected)
  }, [])

  const handleFilter = (pid: string) => {
    setFilterPatient(pid)
    setLoading(true)
    fetchResults(pid)
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setError('')

    if (!patientId) {
      setError('Selecione o paciente.')
      return
    }
    if (!file) {
      setError('Anexe o arquivo PDF.')
      return
    }
    if (file.size > MAX_SIZE) {
      setError('O arquivo excede o limite de 4 MB.')
      return
    }

    setUploading(true)

    try {
      const form = new FormData()
      form.append('patientId', patientId)
      form.append('title', title)
      form.append('notes', notes)
      form.append('file', file)

      const res = await fetch('/api/results', { method: 'POST', body: form })
      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        setMessage('Resultado anexado! O paciente já pode baixar pelo portal.')
        setTitle('')
        setNotes('')
        setFile(null)
        setFileKey((k) => k + 1)
        fetchResults(filterPatient)
      } else {
        setError(data.error || 'Erro ao anexar o resultado.')
      }
    } catch {
      setError('Erro de conexão ao anexar o resultado.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (r: ResultRow) => {
    if (!window.confirm(`Excluir o resultado "${r.title}" de ${r.patient?.fullName || 'paciente'}?`)) return

    const res = await fetch(`/api/results/${r.id}`, { method: 'DELETE' })
    if (res.ok) {
      setMessage('Resultado excluído.')
      setError('')
      fetchResults(filterPatient)
    } else {
      setMessage('')
      setError('Erro ao excluir o resultado.')
    }
  }

  const inputClass =
    'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-black outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100'
  const labelClass = 'mb-1 block text-xs font-semibold text-neutral-600'

  return (
    <div className="p-8 space-y-8 font-sans max-w-6xl mx-auto">
      <div className="bg-green-800 text-white p-6 rounded-2xl border-l-8 border-green-500 shadow-md">
        <h1 className="text-2xl font-bold">📄 Resultados de Exames</h1>
        <p className="text-green-100 text-sm mt-1">
          Anexe o PDF do resultado. O paciente com acesso ao portal consegue visualizar e baixar.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm space-y-4 h-fit">
          <h2 className="text-lg font-bold text-neutral-800">➕ Anexar resultado</h2>

          {message && <p className="text-xs font-bold text-green-700 bg-green-100 p-2 rounded">{message}</p>}
          {error && <p className="text-xs font-bold text-red-700 bg-red-100 p-2 rounded">{error}</p>}

          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className={labelClass}>Paciente *</label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                required
                className={inputClass}
              >
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
              <label className={labelClass}>Título *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Hemograma completo"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Observações (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Arquivo PDF (até 4 MB) *</label>
              <input
                key={fileKey}
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-neutral-700 file:mr-3 file:rounded-lg file:border-0 file:bg-green-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-green-800 hover:file:bg-green-100"
              />
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full rounded-lg bg-green-600 py-2.5 text-sm font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? 'Enviando...' : 'Anexar resultado'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-neutral-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-neutral-800">📋 Resultados anexados</h2>
            <select
              value={filterPatient}
              onChange={(e) => handleFilter(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black sm:w-64"
            >
              <option value="">Todos os pacientes</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className="text-sm text-neutral-500">Carregando resultados...</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-neutral-500">Nenhum resultado anexado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-neutral-100 border-b text-neutral-600">
                    <th className="p-3">Data</th>
                    <th className="p-3">Paciente</th>
                    <th className="p-3">Resultado</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-neutral-50">
                      <td className="p-3 text-neutral-600">{new Date(r.createdAt).toLocaleDateString('pt-BR')}</td>
                      <td className="p-3 font-semibold text-black">{r.patient?.fullName || 'Paciente'}</td>
                      <td className="p-3">
                        <p className="font-semibold text-black">{r.title}</p>
                        <p className="text-xs text-neutral-500">
                          {r.fileName} · {formatSize(r.fileSize)}
                        </p>
                        {r.notes && <p className="mt-1 text-xs text-neutral-600">{r.notes}</p>}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <a
                            href={`/api/results/${r.id}?inline=1`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-800 transition hover:bg-neutral-200"
                          >
                            👁️ Ver
                          </a>
                          <a
                            href={`/api/results/${r.id}`}
                            className="rounded bg-green-600 px-3 py-1 text-xs font-bold text-white transition hover:bg-green-700"
                          >
                            ⬇️ Baixar
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDelete(r)}
                            className="rounded bg-red-600 px-3 py-1 text-xs font-bold text-white transition hover:bg-red-700"
                          >
                            Excluir
                          </button>
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
    </div>
  )
}