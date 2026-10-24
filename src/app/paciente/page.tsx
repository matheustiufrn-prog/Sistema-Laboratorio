'use client'

import { useEffect, useState } from 'react'

interface ResultItem {
  id: string
  title: string
  notes: string | null
  fileName: string
  fileSize: number
  createdAt: string
}

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`

export default function PacientePortalPage() {
  const [name, setName] = useState('')
  const [results, setResults] = useState<ResultItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/paciente/results')

        if (res.status === 401 || res.status === 403) {
          window.location.assign('/paciente/login')
          return
        }

        const data = await res.json().catch(() => ({}))

        if (!res.ok) {
          setError(data.error || 'Não foi possível carregar os resultados.')
          return
        }

        setName(data.patient?.fullName || '')
        setResults(data.results || [])
      } catch {
        setError('Erro de conexão ao carregar os resultados.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' })
    } catch (err) {
      console.error(err)
    }
    window.location.assign('/paciente/login')
  }

  const firstName = name.split(' ')[0]

  return (
    <div className="min-h-screen bg-neutral-50 font-sans">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-700 text-lg font-extrabold text-white shadow-md shadow-green-600/30">
              L
            </div>
            <div>
              <p className="text-base font-extrabold leading-tight tracking-wide text-neutral-900">LABORATE</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-green-700">
                Portal do Paciente
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            🚪 Sair
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <div className="rounded-2xl border-l-8 border-green-500 bg-green-800 p-6 text-white shadow-md">
          <h1 className="text-2xl font-bold">{firstName ? `Olá, ${firstName}!` : 'Olá!'}</h1>
          <p className="mt-1 text-sm text-green-100">Aqui estão os resultados dos seus exames.</p>
        </div>

        {loading ? (
          <p className="text-sm text-neutral-500">Carregando seus resultados...</p>
        ) : error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        ) : results.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500 shadow-sm">
            Ainda não há resultados disponíveis. Assim que o laboratório liberar, eles aparecerão aqui.
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="font-bold text-neutral-900">📄 {r.title}</p>
                  <p className="text-xs text-neutral-500">
                    Disponível em {new Date(r.createdAt).toLocaleDateString('pt-BR')} · {formatSize(r.fileSize)}
                  </p>
                  {r.notes && <p className="mt-1 text-sm text-neutral-600">{r.notes}</p>}
                </div>

                <div className="flex gap-2">
                  <a
                    href={`/api/paciente/results/${r.id}?inline=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-bold text-neutral-800 transition hover:bg-neutral-200"
                  >
                    👁️ Visualizar
                  </a>
                  <a
                    href={`/api/paciente/results/${r.id}`}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-green-700"
                  >
                    ⬇️ Baixar PDF
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}