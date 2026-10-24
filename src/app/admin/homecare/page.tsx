'use client'

import { useState, useEffect } from 'react'

interface Patient {
  id: string
  fullName: string
  cpf?: string | null
}

interface Exam {
  id: string
  name: string
  price: number
}

interface Reimbursement {
  id: string
  description: string
  amount: number
  status: string
}

interface HomeCareOrder {
  id: string
  neighborhood: string
  city: string
  collectionLab: string
  collectionFee: number
  travelFee: number
  examsTotal: number
  totalPrice: number
  status: string
  createdAt: string
  patient?: { fullName: string; cpf?: string | null }
  items: { id: string; price: number; exam?: { name: string } }[]
  reimbursements: Reimbursement[]
}

const brl = (v: number) => `R$ ${Number(v || 0).toFixed(2)}`

export default function HomeCarePage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [orders, setOrders] = useState<HomeCareOrder[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedPatient, setSelectedPatient] = useState('')
  const [selectedExams, setSelectedExams] = useState<string[]>([])
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('')
  const [collectionLab, setCollectionLab] = useState('')
  const [collectionFee, setCollectionFee] = useState('')
  const [travelFee, setTravelFee] = useState('')

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [reimbDesc, setReimbDesc] = useState<Record<string, string>>({})
  const [reimbAmount, setReimbAmount] = useState<Record<string, string>>({})

  const fetchData = async () => {
    try {
      const [resPatients, resExams, resOrders] = await Promise.all([
        fetch('/api/patients'),
        fetch('/api/exams'),
        fetch('/api/homecare'),
      ])
      if (resPatients.ok) setPatients(await resPatients.json())
      if (resExams.ok) setExams(await resExams.json())
      if (resOrders.ok) setOrders(await resOrders.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const knownLabs = Array.from(new Set(orders.map((o) => o.collectionLab).filter(Boolean)))

  const examsSubtotal = exams
    .filter((e) => selectedExams.includes(e.id))
    .reduce((sum, e) => sum + Number(e.price), 0)
  const previewTotal = examsSubtotal + (Number(collectionFee) || 0) + (Number(travelFee) || 0)

  const toggleExam = (id: string) => {
    setSelectedExams((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setError('')

    try {
      const res = await fetch('/api/homecare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient,
          examIds: selectedExams,
          neighborhood,
          city,
          collectionLab,
          collectionFee,
          travelFee,
        }),
      })
      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        setMessage('OS de Home Care criada com sucesso!')
        setSelectedPatient('')
        setSelectedExams([])
        setNeighborhood('')
        setCity('')
        setCollectionFee('')
        setTravelFee('')
        fetchData()
      } else {
        setError(data.error || 'Erro ao criar a OS de Home Care.')
      }
    } catch {
      setError('Erro de conexão ao criar a OS.')
    }
  }

  const handleStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/homecare/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) fetchData()
    else alert('Erro ao atualizar o status da OS.')
  }

  const handleDelete = async (order: HomeCareOrder) => {
    const nome = order.patient?.fullName || 'este paciente'
    const aviso =
      order.status === 'CONCLUIDO'
        ? `Esta OS de ${nome} está CONCLUÍDA e conta no financeiro. Ao excluir, o valor de ${brl(order.totalPrice)} e os reembolsos dela saem do board. Deseja excluir?`
        : `Deseja excluir a OS de Home Care de ${nome}?`
    if (!window.confirm(aviso)) return

    const res = await fetch(`/api/homecare/${order.id}`, { method: 'DELETE' })
    if (res.ok) {
      setMessage('OS excluída com sucesso!')
      fetchData()
    } else {
      alert('Erro ao excluir a OS.')
    }
  }

  const handleAddReimbursement = async (orderId: string) => {
    const description = (reimbDesc[orderId] || '').trim()
    const amount = reimbAmount[orderId] || ''

    const res = await fetch('/api/homecare/reimbursements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ homeCareOrderId: orderId, description, amount }),
    })
    const data = await res.json().catch(() => ({}))

    if (res.ok) {
      setReimbDesc((p) => ({ ...p, [orderId]: '' }))
      setReimbAmount((p) => ({ ...p, [orderId]: '' }))
      fetchData()
    } else {
      alert(data.error || 'Erro ao cadastrar o reembolso.')
    }
  }

  const handleToggleReimbursement = async (r: Reimbursement) => {
    const res = await fetch(`/api/homecare/reimbursements/${r.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: r.status === 'PAGO' ? 'PENDENTE' : 'PAGO' }),
    })
    if (res.ok) fetchData()
    else alert('Erro ao atualizar o reembolso.')
  }

  const handleDeleteReimbursement = async (id: string) => {
    if (!window.confirm('Excluir este reembolso?')) return
    const res = await fetch(`/api/homecare/reimbursements/${id}`, { method: 'DELETE' })
    if (res.ok) fetchData()
    else alert('Erro ao excluir o reembolso.')
  }

  const inputClass =
    'w-full p-2.5 border border-neutral-300 rounded text-sm bg-white text-black outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100'

  return (
    <div className="p-8 space-y-8 font-sans max-w-7xl mx-auto">
      <div className="bg-green-800 text-white p-6 rounded-2xl border-l-8 border-green-500 shadow-md">
        <h1 className="text-2xl font-bold">🏠 Home Care</h1>
        <p className="text-green-100 text-sm mt-1">
          Ordens de serviço de coleta domiciliar, com taxa de coleta, deslocamento e reembolsos.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm space-y-4 h-fit">
          <h2 className="text-lg font-bold text-neutral-800">➕ Nova OS Home Care</h2>

          {message && <p className="text-xs font-bold text-green-700 bg-green-100 p-2 rounded">{message}</p>}
          {error && <p className="text-xs font-bold text-red-700 bg-red-100 p-2 rounded">{error}</p>}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">Paciente</label>
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className={inputClass}
                required
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
              <label className="block text-xs font-semibold text-neutral-600 mb-2">Exames</label>
              <div className="max-h-44 overflow-y-auto space-y-1 border p-3 rounded bg-neutral-50">
                {exams.length === 0 ? (
                  <p className="text-xs text-neutral-500">Nenhum exame cadastrado.</p>
                ) : (
                  exams.map((ex) => (
                    <label
                      key={ex.id}
                      className="flex items-center justify-between text-sm cursor-pointer hover:bg-neutral-100 p-1 rounded"
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedExams.includes(ex.id)}
                          onChange={() => toggleExam(ex.id)}
                          className="rounded"
                        />
                        <span className="font-medium text-black">{ex.name}</span>
                      </span>
                      <span className="font-bold text-green-700 text-xs">{brl(ex.price)}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Bairro da coleta</label>
                <input
                  type="text"
                  required
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Cidade</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">
                Laboratório que fez a coleta
              </label>
              <input
                type="text"
                required
                list="labs-list"
                value={collectionLab}
                onChange={(e) => setCollectionLab(e.target.value)}
                className={inputClass}
              />
              <datalist id="labs-list">
                {knownLabs.map((lab) => (
                  <option key={lab} value={lab} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Taxa de coleta (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={collectionFee}
                  onChange={(e) => setCollectionFee(e.target.value)}
                  placeholder="0.00"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Deslocamento (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={travelFee}
                  onChange={(e) => setTravelFee(e.target.value)}
                  placeholder="0.00"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm space-y-1">
              <div className="flex justify-between text-neutral-600">
                <span>Exames</span>
                <span>{brl(examsSubtotal)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Taxa de coleta</span>
                <span>{brl(Number(collectionFee) || 0)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Deslocamento</span>
                <span>{brl(Number(travelFee) || 0)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-green-800 border-t border-green-200 pt-1">
                <span>Total</span>
                <span>{brl(previewTotal)}</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded text-sm transition"
            >
              Criar OS Home Care
            </button>
          </form>
        </div>

        <div className="xl:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-neutral-800">📋 OS de Home Care</h2>

          {loading ? (
            <p className="text-neutral-500 text-sm">Carregando...</p>
          ) : orders.length === 0 ? (
            <div className="bg-white p-6 rounded-xl border border-neutral-200 text-sm text-neutral-500">
              Nenhuma OS de Home Care registrada.
            </div>
          ) : (
            orders.map((order) => {
              const done = order.status === 'CONCLUIDO'
              const examNames = order.items.map((i) => i.exam?.name).filter(Boolean).join(', ')
              const reimbPending = order.reimbursements
                .filter((r) => r.status !== 'PAGO')
                .reduce((s, r) => s + r.amount, 0)
              const reimbPaid = order.reimbursements
                .filter((r) => r.status === 'PAGO')
                .reduce((s, r) => s + r.amount, 0)

              return (
                <div key={order.id} className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-black">{order.patient?.fullName || 'Paciente'}</p>
                      <p className="text-xs text-neutral-500">
                        {new Date(order.createdAt).toLocaleDateString('pt-BR')} · {order.neighborhood}, {order.city}
                      </p>
                      <p className="text-xs text-neutral-600 mt-1">
                        Coleta feita por: <span className="font-semibold">{order.collectionLab}</span>
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                          done
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }`}
                      >
                        {done ? 'Concluído' : 'Pendente / Orçamento'}
                      </span>

                      <a
                        href={`/orcamento/homecare/${order.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold px-3 py-1 rounded text-xs transition"
                      >
                        🖨️ Orçamento
                      </a>

                      {!done && (
                        <button
                          type="button"
                          onClick={() => handleStatus(order.id, 'CONCLUIDO')}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1 rounded text-xs transition"
                        >
                          Concluir OS
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(order)}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1 rounded text-xs transition"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-600">
                    <span className="font-semibold">Exames:</span> {examNames || '-'}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="bg-neutral-50 border rounded-lg p-3">
                      <p className="text-[10px] font-bold uppercase text-neutral-500">Exames</p>
                      <p className="font-bold text-black">{brl(order.examsTotal)}</p>
                    </div>
                    <div className="bg-neutral-50 border rounded-lg p-3">
                      <p className="text-[10px] font-bold uppercase text-neutral-500">Taxa de coleta</p>
                      <p className="font-bold text-black">{brl(order.collectionFee)}</p>
                    </div>
                    <div className="bg-neutral-50 border rounded-lg p-3">
                      <p className="text-[10px] font-bold uppercase text-neutral-500">Deslocamento</p>
                      <p className="font-bold text-black">{brl(order.travelFee)}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-[10px] font-bold uppercase text-green-700">Total</p>
                      <p className="font-extrabold text-green-800">{brl(order.totalPrice)}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-xs font-bold uppercase text-neutral-500">Reembolsos</h3>
                      <p className="text-xs text-neutral-600">
                        Pendente: <span className="font-bold text-red-600">{brl(reimbPending)}</span> · Pago:{' '}
                        <span className="font-bold text-green-700">{brl(reimbPaid)}</span>
                      </p>
                    </div>

                    {order.reimbursements.length === 0 ? (
                      <p className="text-xs text-neutral-400">Nenhum reembolso lançado.</p>
                    ) : (
                      <div className="space-y-2">
                        {order.reimbursements.map((r) => (
                          <div
                            key={r.id}
                            className="flex flex-wrap items-center justify-between gap-2 p-2 bg-neutral-50 border rounded text-xs"
                          >
                            <span className="font-semibold text-black">{r.description}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-neutral-800">{brl(r.amount)}</span>
                              <button
                                type="button"
                                onClick={() => handleToggleReimbursement(r)}
                                className={`px-2 py-1 rounded font-bold border ${
                                  r.status === 'PAGO'
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                }`}
                              >
                                {r.status === 'PAGO' ? 'Pago ✓' : 'Marcar como pago'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteReimbursement(r.id)}
                                className="bg-red-100 hover:bg-red-200 text-red-700 font-bold px-2 py-1 rounded"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <input
                        type="text"
                        placeholder="Descrição (ex: combustível)"
                        value={reimbDesc[order.id] || ''}
                        onChange={(e) => setReimbDesc((p) => ({ ...p, [order.id]: e.target.value }))}
                        className="flex-1 min-w-40 p-2 border border-neutral-300 rounded text-xs text-black"
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Valor"
                        value={reimbAmount[order.id] || ''}
                        onChange={(e) => setReimbAmount((p) => ({ ...p, [order.id]: e.target.value }))}
                        className="w-28 p-2 border border-neutral-300 rounded text-xs text-black"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddReimbursement(order.id)}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-2 rounded text-xs transition"
                      >
                        + Reembolso
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}