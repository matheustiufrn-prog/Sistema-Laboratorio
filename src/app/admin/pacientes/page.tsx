'use client'

import { useState, useEffect } from 'react'

interface Patient {
  id: string
  fullName: string
  cpf: string
  phone: string
  birthDate: string
  address?: string
}

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Campos do formulário
  const [fullName, setFullName] = useState('')
  const [cpf, setCpf] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/patients')
      if (res.ok) {
        const data = await res.json()
        setPatients(data)
      }
    } catch (err) {
      console.error('Erro ao buscar pacientes:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const payload = {
      fullName,
      cpf,
      birthDate,
      phone,
      address,
      email: email || undefined,
      password: password || undefined
    }

    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao cadastrar paciente.')
      }

      setSuccess('Paciente cadastrado com sucesso!')
      setFullName('')
      setCpf('')
      setBirthDate('')
      setPhone('')
      setAddress('')
      setEmail('')
      setPassword('')
      fetchPatients()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este paciente?')) return
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`/api/patients/${id}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao excluir paciente.')
      }

      setSuccess('Paciente excluído com sucesso!')
      fetchPatients()
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="p-8 space-y-8 font-sans max-w-6xl mx-auto">
      <div className="bg-black text-white p-6 rounded-2xl border-l-8 border-orange-500 shadow-md">
        <h1 className="text-2xl font-bold">Gestão de Pacientes</h1>
        <p className="text-neutral-400 text-sm mt-1">Cadastre novos pacientes, consulte o histórico ou exclua registros.</p>
      </div>

      {error && <div className="p-4 bg-red-100 text-red-700 rounded-xl font-medium">{error}</div>}
      {success && <div className="p-4 bg-green-100 text-green-700 rounded-xl font-medium">{success}</div>}

      {/* Formulário de Cadastro */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
        <h2 className="text-lg font-bold mb-4 text-neutral-800">👤 Novo Cadastro</h2>
        <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">Nome Completo</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-2.5 border border-neutral-300 rounded-lg text-sm"
              placeholder="Nome do Paciente"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">CPF</label>
            <input
              type="text"
              required
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              className="w-full p-2.5 border border-neutral-300 rounded-lg text-sm"
              placeholder="000.000.000-00"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">Data de Nascimento</label>
            <input
              type="date"
              required
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full p-2.5 border border-neutral-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">Telefone / WhatsApp</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-2.5 border border-neutral-300 rounded-lg text-sm"
              placeholder="(84) 90000-0000"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-neutral-600 mb-1">Endereço Completo</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2.5 border border-neutral-300 rounded-lg text-sm"
              placeholder="Rua, Número, Bairro, Cidade"
            />
          </div>

          <div className="md:col-span-2 border-t pt-4 mt-2">
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Dados de Acesso do Paciente (Portal)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 border border-neutral-300 rounded-lg text-sm"
                  placeholder="paciente@email.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Senha Inicial</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 border border-neutral-300 rounded-lg text-sm"
                  placeholder="******"
                />
              </div>
            </div>
          </div>

          <div className="md:col-span-2 mt-2">
            <button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg text-sm transition"
            >
              Cadastrar Paciente
            </button>
          </div>
        </form>
      </div>

      {/* Lista de Pacientes */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
        <h2 className="text-lg font-bold mb-4 text-neutral-800">📋 Pacientes Cadastrados</h2>
        {loading ? (
          <p className="text-neutral-500 text-sm">Carregando pacientes...</p>
        ) : patients.length === 0 ? (
          <p className="text-neutral-500 text-sm">Nenhum paciente cadastrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-neutral-100 border-b border-neutral-200 text-neutral-600">
                  <th className="p-3">Nome</th>
                  <th className="p-3">CPF</th>
                  <th className="p-3">Telefone</th>
                  <th className="p-3">Data Nasc.</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="p-3 font-semibold text-black">{patient.fullName}</td>
                    <td className="p-3 text-neutral-600">{patient.cpf}</td>
                    <td className="p-3 text-neutral-600">{patient.phone || '-'}</td>
                    <td className="p-3 text-neutral-600">
                      {new Date(patient.birthDate).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDelete(patient.id)}
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