'use client'

import { useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  role: string
  createdAt: string
}

export default function UsersAdminPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('USER')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [fetchError, setFetchError] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = async () => {
    setLoading(true)
    setFetchError('')
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      if (res.ok) {
        setUsers(data)
      } else {
        setFetchError(data.error || 'Erro ao carregar utilizadores da API.')
      }
    } catch (err) {
      setFetchError('Erro de conexão ao buscar utilizadores.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setError('')

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      })

      const data = await res.json()

      if (res.ok) {
        setMessage('Utilizador cadastrado com sucesso!')
        setEmail('')
        setPassword('')
        fetchUsers()
      } else {
        setError(data.error || 'Erro ao cadastrar utilizador.')
      }
    } catch (err) {
      setError('Erro de conexão com o servidor.')
    }
  }

  const handleDeleteUser = async (id: string, userEmail: string) => {
    if (userEmail === 'admin@afimlab.com') {
      alert('Não é permitido excluir o administrador principal do sistema!')
      return
    }

    if (!confirm(`Deseja realmente excluir o utilizador ${userEmail}?`)) return

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        fetchUsers()
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao excluir utilizador.')
      }
    } catch (err) {
      console.error(err)
      alert('Erro de conexão ao excluir.')
    }
  }

  return (
    <div className="p-8 space-y-8 font-sans max-w-5xl mx-auto">
      <div className="bg-green-800 text-white p-6 rounded-2xl border-l-8 border-green-600 shadow-md">
        <h1 className="text-2xl font-bold">Gestão de Utilizadores e Acessos</h1>
        <p className="text-neutral-400 text-sm mt-1">Cadastre novos operadores ou administradores e gerencie os acessos ativos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Formulário */}
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-neutral-800">➕ Novo Acesso</h2>
          
          {message && <p className="text-xs font-bold text-green-700 bg-green-100 p-2 rounded">{message}</p>}
          {error && <p className="text-xs font-bold text-red-700 bg-red-100 p-2 rounded">{error}</p>}

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">Tipo de Conta</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-2.5 border border-neutral-300 rounded text-sm bg-white text-black font-medium"
              >
                <option value="ADMIN">Administrador (Total)</option>
                <option value="USER">Operador (Padrão)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">E-mail Corporativo</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@afimlab.com"
                className="w-full p-2.5 border border-neutral-300 rounded text-sm text-black"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">Senha de Acesso</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="******"
                className="w-full p-2.5 border border-neutral-300 rounded text-sm text-black"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-2.5 px-4 rounded text-sm transition"
            >
              Cadastrar Acesso
            </button>
          </form>
        </div>

        {/* Tabela de Listagem */}
        <div className="md:col-span-2 bg-white p-6 rounded-xl border border-neutral-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-neutral-800">👥 Utilizadores Cadastrados</h2>
            <button 
              onClick={fetchUsers}
              className="text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold px-3 py-1.5 rounded transition"
            >
              🔄 Atualizar Lista
            </button>
          </div>

          {fetchError && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-xs font-bold">
              Erro ao carregar: {fetchError}
            </div>
          )}

          {loading ? (
            <p className="text-neutral-500 text-sm">A carregar utilizadores...</p>
          ) : users.length === 0 ? (
            <p className="text-neutral-500 text-sm">Nenhum utilizador encontrado na base de dados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-neutral-100 border-b text-neutral-600">
                    <th className="p-3">E-mail</th>
                    <th className="p-3">Cargo</th>
                    <th className="p-3">Data</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b hover:bg-neutral-50">
                      <td className="p-3 font-semibold text-black">{u.email}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                          {u.role === 'ADMIN' ? 'Administrador' : 'Operador'}
                        </span>
                      </td>
                      <td className="p-3 text-neutral-600">{new Date(u.createdAt).toLocaleDateString('pt-BR')}</td>
                      <td className="p-3 text-right">
                        {u.email !== 'admin@afimlab.com' ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id, u.email)}
                            className="bg-red-100 hover:bg-red-200 text-red-700 font-bold px-3 py-1 rounded text-xs transition"
                          >
                            Excluir
                          </button>
                        ) : (
                          <span className="text-xs text-neutral-400 font-medium italic">Protegido</span>
                        )}
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