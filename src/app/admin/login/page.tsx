'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('ADMIN')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      })

      const data = await res.json()

      if (res.ok) {
        // Limpa resíduos antigos
        localStorage.clear()

        // Garante a gravação dos dados no navegador
        const finalRole = data.user?.role || role
        localStorage.setItem('user_role', finalRole)
        localStorage.setItem('user_email', email)

        // Redireciona corretamente conforme o perfil selecionado/retornado
        if (finalRole === 'ADMIN') {
          window.location.href = '/admin'
        } else {
          window.location.href = '/admin/orders'
        }
      } else {
        setError(data.error || 'Credenciais inválidas.')
      }
    } catch (err) {
      setError('Erro ao efetuar login.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4 font-sans">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 p-8 rounded-2xl shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-600 text-white font-black text-2xl mb-2">
            A
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide">AFIM LAB</h1>
          <p className="text-xs font-bold text-orange-500 uppercase tracking-wider">Sistema de Gestão Laboratorial</p>
        </div>

        {error && <div className="p-3 bg-red-950/80 border border-red-500 text-red-200 text-xs font-bold rounded-lg text-center">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Entrar Como</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white font-bold focus:outline-none focus:border-orange-500"
            >
              <option value="ADMIN">🟢 ADMINISTRADOR (Acesso Total)</option>
              <option value="USER">🔵 OPERADOR (Apenas OS e Pacientes)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@afimlab.com"
              className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-lg text-sm transition duration-200 uppercase tracking-wider shadow-lg shadow-orange-600/30"
          >
            {loading ? 'Entrando...' : 'Entrar no Sistema'}
          </button>
        </form>
      </div>
    </div>
  )
}