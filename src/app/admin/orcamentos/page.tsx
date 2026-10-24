'use client'

import { useEffect, useMemo, useState } from 'react'

type Kind = 'os' | 'homecare'

interface Row {
  id: string
  kind: Kind
  date: string
  patient: string
  cpf: string
  exams: string
  total: number
  done: boolean
  place?: string
}

const brl = (v: number) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function OrcamentosPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [hasHomeCare, setHasHomeCare] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | Kind>('all')

  useEffect(() => {
    const load = async () => {
      try {
        const [resOrders, resHome] = await Promise.all([
          fetch('/api/orders'),
          fetch('/api/homecare'),
        ])

        const list: Row[] = []

        if (resOrders.ok) {
          const orders = await resOrders.json()
          for (const o of orders) {
            list.push({
              id: o.id,
              kind: 'os',
              date: o.createdAt,
              patient: o.patient?.fullName || 'Paciente',
              cpf: o.patient?.cpf || '',
              exams: (o.items || []).map((i: any) => i.exam?.name).filter(Boolean).join(', '),
              total: Number(o.totalPrice) || 0,
              done: o.status === 'CONCLUIDO' || o.status === 'COMPLETED',
            })
          }
        }

        if (resHome.ok) {
          setHasHomeCare(true)
          const homes = await resHome.json()
          for (const o of homes) {
            list.push({
              id: o.id,
              kind: 'homecare',
              date: o.createdAt,
              patient: o.patient?.fullName || 'Paciente',
              cpf: o.patient?.cpf || '',
              exams: (o.items || []).map((i: any) => i.exam?.name).filter(Boolean).join(', '),
              total: Number(o.totalPrice) || 0,
              done: o.status === 'CONCLUIDO',
              place: [o.neighborhood, o.city].filter(Boolean).join(', '),
            })
          }
        }

        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setRows(list)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (filter !== 'all' && r.kind !== filter) return false
      if (!term) return true
      return (
        r.patient.toLowerCase().includes(term) ||
        r.cpf.toLowerCase().includes(term) ||
        r.exams.toLowerCase().includes(term)
      )
    })
  }, [rows, search, filter])

  const tabClass = (active: boolean) =>
    `rounded-lg px-4 py-2 text-sm font-semibold transition ${
      active ? 'bg-green-600 text-white shadow-sm' : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
    }`

  return (
    <div className="p-8 space-y-8 font-sans max-w-6xl mx-auto">
      <div className="bg-green-800 text-white p-6 rounded-2xl border-l-8 border-green-500 shadow-md">
        <h1 className="text-2xl font-bold">🧾 Orçamentos</h1>
        <p className="text-green-100 text-sm mt-1">
          Abra o orçamento de qualquer OS para imprimir ou salvar em PDF e enviar ao paciente.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <button type="button" onClick={() => setFilter('all')} className={tabClass(filter === 'all')}>
              Todos
            </button>
            <button type="button" onClick={() => setFilter('os')} className={tabClass(filter === 'os')}>
              Ordens de Serviço
            </button>
            {hasHomeCare && (
              <button
                type="button"
                onClick={() => setFilter('homecare')}
                className={tabClass(filter === 'homecare')}
              >
                Home Care
              </button>
            )}
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por paciente, CPF ou exame"
            className="w-full sm:w-72 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-black outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100"
          />
        </div>

        {loading ? (
          <p className="text-sm text-neutral-500">Carregando orçamentos...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-neutral-500">Nenhum orçamento encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-neutral-100 border-b text-neutral-600">
                  <th className="p-3">Data</th>
                  <th className="p-3">Paciente</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Exames</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Orçamento</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={`${r.kind}-${r.id}`} className="border-b hover:bg-neutral-50">
                    <td className="p-3 text-neutral-600">{new Date(r.date).toLocaleDateString('pt-BR')}</td>
                    <td className="p-3 font-semibold text-black">
                      {r.patient}
                      {r.cpf && <span className="block text-xs font-normal text-neutral-500">CPF: {r.cpf}</span>}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                          r.kind === 'homecare'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                        }`}
                      >
                        {r.kind === 'homecare' ? '🏠 Home Care' : 'Laboratório'}
                      </span>
                      {r.place && <span className="block mt-1 text-xs text-neutral-500">{r.place}</span>}
                    </td>
                    <td className="p-3 text-xs text-neutral-600 max-w-xs truncate" title={r.exams}>
                      {r.exams || '-'}
                    </td>
                    <td className="p-3 font-bold text-green-700">{brl(r.total)}</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                          r.done
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }`}
                      >
                        {r.done ? 'Concluído' : 'Pendente / Orçamento'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <a
                        href={`/orcamento/${r.kind}/${r.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1.5 rounded text-xs transition"
                      >
                        🖨️ Abrir / Imprimir
                      </a>
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