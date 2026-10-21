'use client'

import { useState, useEffect } from 'react'

interface Patient {
  id: string
  fullName: string
  cpf: string
  birthDate: string
  phone: string
  address?: string | null
  email?: string | null
}

export default function PatientsContent() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)

  const [fullName, setFullName] = useState('')
  const [cpf, setCpf] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/patients')
      if (res.ok) {
        setPatients(await res.json())
      }
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error)
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ text: '', type: '' })

    try {
      const url = editingId ? `/api/patients/${editingId}` : '/api/patients'
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, cpf, birthDate, phone, address, email, password })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar paciente.')

      setMessage({ 
        text: editingId ? 'Paciente atualizado com sucesso!' : 'Paciente cadastrado com sucesso!', 
        type: 'success' 
      })
      
      handleResetForm()
      fetchPatients()
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleEditPatient = (patient: Patient) => {
    setEditingId(patient.id)
    setFullName(patient.fullName || '')
    setCpf(patient.cpf || '')
    setBirthDate(patient.birthDate ? patient.birthDate.split('T')[0] : '')
    setPhone(patient.phone || '')
    setAddress(patient.address || '')
    setEmail(patient.email || '')
    setPassword('')
  }

  const handleResetForm = () => {
    setEditingId(null)
    setFullName('')
    setCpf('')
    setBirthDate('')
    setPhone('')
    setAddress('')
    setEmail('')
    setPassword('')
  }

  const handleDeletePatient = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este paciente?')) return

    try {
      const res = await fetch(`/api/patients/${id}`, {
        method: 'DELETE'
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Erro ao excluir paciente.')

      setMessage({ text: 'Paciente excluído com sucesso!', type: 'success' })
      fetchPatients()
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' })
    }
  }

  return (
    <div className="p-8 space-y-8 font-sans bg-neutral-50 min-h-screen">
      <div className="bg-black text-white p-8 rounded-2xl shadow-xl border-l-8 border-orange-500">
        <h1 className="text-3xl font-extrabold tracking-wide">Gestão de Pacientes</h1>
        <p className="text-neutral-400 mt-1 text-base">
          Cadastre novos pacientes, consulte o histórico, edite ou exclua registros do posto de coleta.
        </p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-md font-medium ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Formulário de Cadastro / Edição */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-black">
            {editingId ? '✏️ Editar Cadastro de Paciente' : '👤 Novo Cadastro'}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={handleResetForm}
              className="text-xs text-orange-600 font-bold hover:underline"
            >
              Cancelar Edição
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700">Nome Completo</label>
              <input
                type="text"
                required
                placeholder="Nome do Paciente"
                value={fullName || ''}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full p-2.5 border border-neutral-300 rounded-lg text-neutral-900 focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700">CPF</label>
              <input
                type="text"
                required
                placeholder="000.000.000-00"
                value={cpf || ''}
                onChange={(e) => setCpf(e.target.value)}
                className="mt-1 w-full p-2.5 border border-neutral-300 rounded-lg text-neutral-900 focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700">Data de Nascimento</label>
              <input
                type="date"
                required
                value={birthDate || ''}
                onChange={(e) => setBirthDate(e.target.value)}
                className="mt-1 w-full p-2.5 border border-neutral-300 rounded-lg text-neutral-900 focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700">Telefone / WhatsApp</label>
              <input
                type="text"
                required
                placeholder="(84) 90000-0000"
                value={phone || ''}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full p-2.5 border border-neutral-300 rounded-lg text-neutral-900 focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700">Endereço Completo</label>
            <input
              type="text"
              placeholder="Rua, Número, Bairro, Cidade"
              value={address || ''}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1 w-full p-2.5 border border-neutral-300 rounded-lg text-neutral-900 focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          {!editingId && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-neutral-100">
              <div className="md:col-span-2">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Dados de Acesso do Paciente (Portal)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">E-mail</label>
                <input
                  type="email"
                  required
                  placeholder="paciente@email.com"
                  value={email || ''}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full p-2.5 border border-neutral-300 rounded-lg text-neutral-900 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700">Senha Inicial</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password || ''}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full p-2.5 border border-neutral-300 rounded-lg text-neutral-900 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-black font-extrabold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 shadow-md shadow-orange-500/20"
          >
            {loading ? 'Salvando...' : editingId ? 'Atualizar Dados do Paciente' : 'Cadastrar Paciente'}
          </button>
        </form>
      </div>

      {/* Tabela de Pacientes Cadastrados com Ações */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
        <h2 className="text-xl font-bold text-black mb-4">📋 Pacientes Cadastrados</h2>

        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-100 border-b border-neutral-200 text-neutral-600 text-sm">
                <th className="p-3">Nome</th>
                <th className="p-3">CPF</th>
                <th className="p-3">Telefone</th>
                <th className="p-3">E-mail</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-neutral-500">
                    Nenhum paciente cadastrado.
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr key={patient.id} className="border-b border-neutral-100 hover:bg-neutral-50 text-neutral-800 text-sm">
                    <td className="p-3 font-semibold text-black">{patient.fullName}</td>
                    <td className="p-3">{patient.cpf}</td>
                    <td className="p-3">{patient.phone}</td>
                    <td className="p-3 text-neutral-600">{patient.email || '-'}</td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleEditPatient(patient)}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded-md text-xs font-bold transition"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeletePatient(patient.id)}
                        className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-md text-xs font-bold transition"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}