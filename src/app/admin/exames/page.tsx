'use client'

import { useState, useEffect } from 'react'

interface Exam {
  id: string
  name: string
  category: string
  price: number
  deliveryDays: number
  description?: string
}

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('')
  const [deliveryDays, setDeliveryDays] = useState('1')

  const fetchExams = async () => {
    try {
      const res = await fetch('/api/exams')
      if (res.ok) {
        const data = await res.json()
        setExams(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExams()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const payload = { name, category, price, deliveryDays }

    try {
      let res
      if (editingId) {
        res = await fetch(`/api/exams/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      } else {
        res = await fetch('/api/exams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao processar exame.')
      }

      setSuccess(editingId ? 'Exame atualizado com sucesso!' : 'Exame cadastrado com sucesso!')
      clearForm()
      fetchExams()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleEdit = (exam: Exam) => {
    setEditingId(exam.id)
    setName(exam.name)
    setCategory(exam.category || '')
    setPrice(exam.price.toString())
    setDeliveryDays(exam.deliveryDays ? exam.deliveryDays.toString() : '1')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este exame?')) return
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`/api/exams/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao excluir exame.')
      }
      setSuccess('Exame excluído com sucesso!')
      fetchExams()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const clearForm = () => {
    setEditingId(null)
    setName('')
    setCategory('')
    setPrice('')
    setDeliveryDays('1')
  }

  return (
    <div className="p-8 space-y-8 font-sans max-w-6xl mx-auto">
      <div className="bg-black text-white p-6 rounded-2xl border-l-8 border-blue-500 shadow-md">
        <h1 className="text-2xl font-bold">Catálogo de Exames & Preços</h1>
        <p className="text-neutral-400 text-sm mt-1">Gerencie os exames oferecidos pelo posto de coleta.</p>
      </div>

      {error && <div className="p-4 bg-red-100 text-red-700 rounded-xl font-medium">{error}</div>}
      {success && <div className="p-4 bg-green-100 text-green-700 rounded-xl font-medium">{success}</div>}

      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
        <h2 className="text-lg font-bold mb-4 text-neutral-800">
          {editingId ? '✏️ Editar Exame' : '➕ Novo Exame'}
        </h2>
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">Nome do Exame</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 border border-neutral-300 rounded-lg text-sm"
              placeholder="Ex: HEMOGRAMA"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">Categoria / Amostra</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2.5 border border-neutral-300 rounded-lg text-sm"
              placeholder="Ex: SANGUE"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">Preço (R$)</label>
            <input
              type="number"
              step="0.01"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full p-2.5 border border-neutral-300 rounded-lg text-sm"
              placeholder="12.00"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">Prazo de Entrega (Dias úteis)</label>
            <input
              type="number"
              value={deliveryDays}
              onChange={(e) => setDeliveryDays(e.target.value)}
              className="w-full p-2.5 border border-neutral-300 rounded-lg text-sm"
              placeholder="1"
            />
          </div>

          <div className="md:col-span-2 flex gap-2 mt-2">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg text-sm transition"
            >
              {editingId ? 'Salvar Alterações' : 'Cadastrar Exame'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={clearForm}
                className="bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-bold py-2.5 px-4 rounded-lg text-sm"
              >
                Cancelar Edição
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
        <h2 className="text-lg font-bold mb-4 text-neutral-800">Exames Disponíveis no Catálogo</h2>
        {loading ? (
          <p className="text-neutral-500 text-sm">Carregando exames...</p>
        ) : exams.length === 0 ? (
          <p className="text-neutral-500 text-sm">Nenhum exame cadastrado no catálogo.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-neutral-100 border-b border-neutral-200 text-neutral-600">
                  <th className="p-3">Nome do Exame</th>
                  <th className="p-3">Categoria</th>
                  <th className="p-3">Preço</th>
                  <th className="p-3">Prazo</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => (
                  <tr key={exam.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="p-3 font-semibold text-black">{exam.name}</td>
                    <td className="p-3 text-neutral-600">{exam.category || '-'}</td>
                    <td className="p-3 font-bold text-green-700">R$ {exam.price.toFixed(2)}</td>
                    <td className="p-3 text-neutral-600">{exam.deliveryDays || 1} dia(s)</td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(exam)}
                        className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded text-xs font-bold"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(exam.id)}
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