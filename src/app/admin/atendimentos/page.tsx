'use client'

import { useState, useEffect } from 'react'

interface Patient {
  id: string
  fullName: string
  cpf: string
}

interface Exam {
  id: string
  name: string
  category: string
  price: number
}

interface OrderItem {
  id: string
  examId: string
  price: number
  exam?: { name: string }
}

interface Order {
  id: string
  patientId: string
  patient: Patient
  totalPrice: number
  status: string
  createdAt: string
  items: OrderItem[]
}

export default function OrdersPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  
  const [selectedPatient, setSelectedPatient] = useState('')
  const [selectedExams, setSelectedExams] = useState<string[]>([])
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchData = async () => {
    try {
      const [patRes, exRes, ordRes] = await Promise.all([
        fetch('/api/patients'),
        fetch('/api/exams'),
        fetch('/api/orders')
      ])

      if (patRes.ok) setPatients(await patRes.json())
      if (exRes.ok) setExams(await exRes.json())
      if (ordRes.ok) setOrders(await ordRes.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleExamToggle = (examId: string) => {
    if (selectedExams.includes(examId)) {
      setSelectedExams(selectedExams.filter(id => id !== examId))
    } else {
      setSelectedExams([...selectedExams, examId])
    }
  }

  const calculateTotal = () => {
    return selectedExams.reduce((sum, examId) => {
      const exam = exams.find(e => e.id === examId)
      return sum + (exam ? Number(exam.price) : 0)
    }, 0)
  }

  const handleCreateOrder = async (status: 'ORCAMENTO' | 'CONCLUIDO') => {
    setError('')
    setSuccess('')

    if (!selectedPatient) {
      setError('Por favor, selecione um paciente.')
      return
    }

    if (selectedExams.length === 0) {
      setError('Selecione pelo menos um exame.')
      return
    }

    const items = selectedExams.map(examId => {
      const exam = exams.find(e => e.id === examId)
      return {
        examId: examId,
        price: exam ? Number(exam.price) : 0
      }
    })

    const payload = {
      patientId: selectedPatient,
      totalPrice: calculateTotal(),
      items,
      status
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao registrar atendimento.')

      setSuccess(status === 'ORCAMENTO' ? 'Orçamento salvo com sucesso!' : 'Atendimento concluído com sucesso!')
      setSelectedPatient('')
      setSelectedExams([])
      fetchData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!res.ok) throw new Error('Erro ao atualizar status.')
      fetchData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDeleteOrder = async (id: string) => {
    if (!confirm('Deseja excluir esta Ordem de Serviço?')) return
    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir.')
      fetchData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div className="p-8 space-y-8 font-sans max-w-6xl mx-auto">
      <div className="bg-black text-white p-6 rounded-2xl border-l-8 border-yellow-500 shadow-md">
        <h1 className="text-2xl font-bold">Atendimentos & Ordens de Serviço</h1>
        <p className="text-neutral-400 text-sm mt-1">Crie orçamentos ou conclua atendimentos para contabilizar no Dashboard.</p>
      </div>

      {error && <div className="p-4 bg-red-100 text-red-700 rounded-xl font-medium">{error}</div>}
      {success && <div className="p-4 bg-green-100 text-green-700 rounded-xl font-medium">{success}</div>}

      {/* Formulário de Nova OS */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-neutral-800">📋 Novo Atendimento / Orçamento</h2>

        <div>
          <label className="block text-xs font-semibold text-neutral-600 mb-1">Selecione o Paciente</label>
          <select
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            className="w-full p-2.5 border border-neutral-300 rounded-lg text-sm bg-white text-black"
          >
            <option value="">-- Escolha um Paciente --</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.fullName} (CPF: {p.cpf})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-600 mb-2">Selecione os Exames</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-neutral-200 rounded-lg">
            {exams.map(exam => (
              <label key={exam.id} className="flex items-center space-x-2 p-2 hover:bg-neutral-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedExams.includes(exam.id)}
                  onChange={() => handleExamToggle(exam.id)}
                  className="rounded text-blue-600"
                />
                <span className="text-sm font-medium text-black">{exam.name} ({exam.category}) - <strong className="text-green-700">R$ {Number(exam.price).toFixed(2)}</strong></span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center bg-neutral-50 p-4 rounded-lg border">
          <span className="font-bold text-neutral-700">Valor Total:</span>
          <span className="text-xl font-extrabold text-green-700">R$ {calculateTotal().toFixed(2)}</span>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => handleCreateOrder('ORCAMENTO')}
            className="flex-1 bg-neutral-600 hover:bg-neutral-700 text-white font-bold py-3 px-4 rounded-lg text-sm transition"
          >
            📄 Salvar como Orçamento
          </button>
          <button
            type="button"
            onClick={() => handleCreateOrder('CONCLUIDO')}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg text-sm transition"
          >
             Concluir Atendimento (Faturar)
          </button>
        </div>
      </div>

      {/* Histórico */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
        <h2 className="text-lg font-bold mb-4 text-neutral-800">📊 Histórico de Ordens de Serviço</h2>
        {loading ? (
          <p className="text-neutral-500 text-sm">Carregando...</p>
        ) : orders.length === 0 ? (
          <p className="text-neutral-500 text-sm">Nenhum atendimento registrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-neutral-100 border-b border-neutral-200 text-neutral-600">
                  <th className="p-3">Data</th>
                  <th className="p-3">Paciente</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Total</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="p-3 text-neutral-600">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td className="p-3 font-semibold text-black">{order.patient?.fullName || 'Desconhecido'}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        order.status === 'CONCLUIDO' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {order.status === 'CONCLUIDO' ? 'Concluído' : 'Orçamento'}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-green-700">R$ {Number(order.totalPrice).toFixed(2)}</td>
                    <td className="p-3 text-right space-x-2">
                      {order.status === 'ORCAMENTO' ? (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'CONCLUIDO')}
                          className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded text-xs font-bold"
                        >
                          Aprovar/Concluir
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'ORCAMENTO')}
                          className="bg-amber-100 text-amber-800 hover:bg-amber-200 px-3 py-1 rounded text-xs font-bold"
                        >
                          Voltar p/ Orçamento
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded text-xs font-bold"
                      >
                        Excluir
                      </button>
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