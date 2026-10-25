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

interface ProfessionalOption {
  id: string
  name: string
  specialty: string
  consultationPrice: number
  active: boolean
}

interface Order {
  id: string
  totalPrice: number
  consultationFee?: number
  status: string
  createdAt: string
  patient?: { fullName: string; cpf?: string | null }
  professional?: { name: string; specialty: string } | null
  items: { exam: { name: string } }[]
}

const brl = (v: number) => `R$ ${Number(v || 0).toFixed(2)}`

export default function OrdersAdminPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [professionals, setProfessionals] = useState<ProfessionalOption[]>([])
  const [orders, setOrders] = useState<Order[]>([])

  const [selectedPatient, setSelectedPatient] = useState('')
  const [selectedExams, setSelectedExams] = useState<string[]>([])
  const [selectedProfessional, setSelectedProfessional] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const fetchData = async () => {
    try {
      const [resPatients, resExams, resOrders, resProfessionals] = await Promise.all([
        fetch('/api/patients'),
        fetch('/api/exams'),
        fetch('/api/orders'),
        fetch('/api/professionals'),
      ])

      if (resPatients.ok) setPatients(await resPatients.json())
      if (resExams.ok) setExams(await resExams.json())
      if (resOrders.ok) setOrders(await resOrders.json())
      if (resProfessionals.ok) setProfessionals(await resProfessionals.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const activeProfessionals = professionals.filter((p) => p.active)
  const chosenProfessional = activeProfessionals.find((p) => p.id === selectedProfessional)

  const examsSubtotal = exams
    .filter((e) => selectedExams.includes(e.id))
    .reduce((sum, e) => sum + Number(e.price), 0)
  const consultationValue = chosenProfessional ? Number(chosenProfessional.consultationPrice) : 0
  const previewTotal = examsSubtotal + consultationValue

  const handleToggleExam = (examId: string) => {
    setSelectedExams((prev) =>
      prev.includes(examId) ? prev.filter((id) => id !== examId) : [...prev, examId]
    )
  }

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setError('')

    if (!selectedPatient) {
      setError('Selecione um paciente.')
      return
    }

    if (selectedExams.length === 0 && !selectedProfessional) {
      setError('Selecione pelo menos um exame ou uma consulta para o orçamento.')
      return
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient,
          examIds: selectedExams,
          professionalId: selectedProfessional || null,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        setMessage('Ordem de serviço / orçamento criado com sucesso!')
        setSelectedPatient('')
        setSelectedExams([])
        setSelectedProfessional('')
        fetchData()
      } else {
        setError(data.error || 'Erro ao criar ordem de serviço.')
      }
    } catch {
      setError('Erro de conexão ao criar ordem.')
    }
  }

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        fetchData()
      } else {
        alert(data.error || `Erro ao atualizar status da OS (código ${res.status}).`)
      }
    } catch (err) {
      console.error(err)
      alert('Erro de conexão ao atualizar status da OS.')
    }
  }

  const handleDeleteOrder = async (order: Order, isCompleted: boolean) => {
    const nome = order.patient?.fullName || 'este paciente'

    const aviso = isCompleted
      ? `Esta OS de ${nome} já está CONCLUÍDA e conta no financeiro.\n\nAo excluir, ela será removida da lista e o valor de ${brl(order.totalPrice)} sairá do board financeiro.\n\nEsta ação não pode ser desfeita. Deseja excluir?`
      : `Deseja excluir a OS de ${nome}?\n\nEsta ação não pode ser desfeita.`

    if (!window.confirm(aviso)) return

    try {
      const res = await fetch(`/api/orders/${order.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        setMessage('Ordem de serviço excluída com sucesso!')
        setError('')
        fetchData()
      } else {
        alert(data.error || `Erro ao excluir a OS (código ${res.status}).`)
      }
    } catch (err) {
      console.error(err)
      alert('Erro de conexão ao excluir a OS.')
    }
  }

  const selectClass =
    'w-full p-2.5 border border-neutral-300 rounded text-sm bg-white text-black font-medium'

  return (
    <div className="p-8 space-y-8 font-sans max-w-6xl mx-auto">
      <div className="bg-green-800 text-white p-6 rounded-2xl border-l-8 border-green-600 shadow-md">
        <h1 className="text-2xl font-bold">Gestão de Ordens de Serviço & Orçamentos</h1>
        <p className="text-green-100 text-sm mt-1">
          Crie orçamentos com exames e consultas e conclua as OS para alimentar o financeiro.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm space-y-4 h-fit">
          <h2 className="text-lg font-bold text-neutral-800">➕ Novo Orçamento / OS</h2>

          {message && <p className="text-xs font-bold text-green-700 bg-green-100 p-2 rounded">{message}</p>}
          {error && <p className="text-xs font-bold text-red-700 bg-red-100 p-2 rounded">{error}</p>}

          <form onSubmit={handleCreateOrder} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">Selecionar Paciente</label>
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className={selectClass}
                required
              >
                <option value="">-- Escolha o Paciente --</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName}
                    {p.cpf ? ` (CPF: ${p.cpf})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">
                Consulta médica (opcional)
              </label>
              <select
                value={selectedProfessional}
                onChange={(e) => setSelectedProfessional(e.target.value)}
                className={selectClass}
              >
                <option value="">Sem consulta</option>
                {activeProfessionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.specialty} — {brl(p.consultationPrice)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-2">Exames Disponíveis</label>
              <div className="max-h-48 overflow-y-auto space-y-2 border p-3 rounded bg-neutral-50">
                {exams.length === 0 ? (
                  <p className="text-xs text-neutral-500">Nenhum exame cadastrado no catálogo.</p>
                ) : (
                  exams.map((ex) => (
                    <label
                      key={ex.id}
                      className="flex items-center justify-between text-sm cursor-pointer hover:bg-neutral-100 p-1 rounded"
                    >
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedExams.includes(ex.id)}
                          onChange={() => handleToggleExam(ex.id)}
                          className="rounded text-green-700 focus:ring-green-600"
                        />
                        <span className="font-medium text-black">{ex.name}</span>
                      </div>
                      <span className="font-bold text-green-700 text-xs">{brl(ex.price)}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm space-y-1">
              <div className="flex justify-between text-neutral-600">
                <span>Exames</span>
                <span>{brl(examsSubtotal)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Consulta</span>
                <span>{brl(consultationValue)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-green-800 border-t border-green-200 pt-1">
                <span>Total</span>
                <span>{brl(previewTotal)}</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-2.5 px-4 rounded text-sm transition"
            >
              Criar Orçamento / OS
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-neutral-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-neutral-800">📋 Ordens de Serviço Cadastradas</h2>

          {loading ? (
            <p className="text-neutral-500 text-sm">Carregando ordens...</p>
          ) : orders.length === 0 ? (
            <p className="text-neutral-500 text-sm">Nenhuma ordem de serviço registrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-neutral-100 border-b text-neutral-600">
                    <th className="p-3">Paciente</th>
                    <th className="p-3">Itens</th>
                    <th className="p-3">Total</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const parts: string[] = []
                    if (order.professional || Number(order.consultationFee) > 0) {
                      parts.push(`Consulta${order.professional ? ` – ${order.professional.name}` : ''}`)
                    }
                    for (const item of order.items || []) {
                      if (item.exam?.name) parts.push(item.exam.name)
                    }
                    const itemsText = parts.join(', ') || '-'
                    const isCompleted = order.status === 'CONCLUIDO' || order.status === 'COMPLETED'

                    return (
                      <tr key={order.id} className="border-b hover:bg-neutral-50">
                        <td className="p-3 font-semibold text-black">{order.patient?.fullName || 'Paciente'}</td>
                        <td className="p-3 text-neutral-600 text-xs max-w-xs truncate" title={itemsText}>
                          {itemsText}
                        </td>
                        <td className="p-3 font-bold text-green-700">{brl(order.totalPrice)}</td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                              isCompleted
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                            }`}
                          >
                            {isCompleted ? 'Concluído' : 'Pendente / Orçamento'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={`/orcamento/os/${order.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold px-3 py-1 rounded text-xs transition"
                            >
                              🖨️ Orçamento
                            </a>

                            {!isCompleted ? (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(order.id, 'CONCLUIDO')}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1 rounded text-xs transition"
                              >
                                Concluir OS
                              </button>
                            ) : (
                              <span className="text-xs text-neutral-400 font-medium italic">Finalizado</span>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteOrder(order, isCompleted)}
                              className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1 rounded text-xs transition"
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}