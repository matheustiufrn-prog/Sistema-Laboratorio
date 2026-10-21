'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')

  // Estados separados para o Login
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [selectedRole, setSelectedRole] = useState('OPERATOR')

  // Estados separados para o Cadastro
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [registerRole, setRegisterRole] = useState('OPERATOR')
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ text: '', type: '' })

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao realizar login.')

      if (data.user.role !== selectedRole) {
        throw new Error(`Esta conta não tem permissão de ${selectedRole === 'ADMIN' ? 'Administrador' : 'Operador'}.`)
      }

      localStorage.setItem('afim_lab_admin', JSON.stringify(data.user))

      setMessage({ text: 'Login bem-sucedido! Redirecionando...', type: 'success' })
      setTimeout(() => {
        router.push(selectedRole === 'ADMIN' ? '/admin' : '/admin/pacientes')
      }, 1000)
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ text: '', type: '' })

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail, password: regPassword, role: registerRole })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar utilizador.')

      setMessage({ text: 'Credencial cadastrada com sucesso! Agora você pode entrar.', type: 'success' })
      setRegEmail('')
      setRegPassword('')
      setActiveTab('login')
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-black border border-neutral-800 rounded-2xl shadow-2xl p-8 space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-orange-500 rounded-xl mx-auto flex items-center justify-center text-black font-extrabold text-2xl shadow-lg shadow-orange-500/20">
            A
          </div>
          <h1 className="text-2xl font-black text-white tracking-wider">AFIM LAB</h1>
          <p className="text-xs text-orange-400 font-semibold uppercase tracking-widest">Sistema de Gestão Laboratorial</p>
        </div>

        <div className="grid grid-cols-2 p-1 bg-neutral-900 rounded-xl border border-neutral-800">
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setMessage({ text: '', type: '' }); }}
            className={`py-2.5 text-sm font-bold rounded-lg transition duration-200 ${
              activeTab === 'login'
                ? 'bg-orange-500 text-black shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
             Entrar
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setMessage({ text: '', type: '' }); }}
            className={`py-2.5 text-sm font-bold rounded-lg transition duration-200 ${
              activeTab === 'register'
                ? 'bg-orange-500 text-black shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            ➕ Novo Acesso
          </button>
        </div>

        {message.text && (
          <div className={`p-3 rounded-lg text-sm font-medium text-center ${
            message.type === 'success' ? 'bg-green-950/80 text-green-400 border border-green-800' : 'bg-red-950/80 text-red-400 border border-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* FORMULÁRIO DE LOGIN */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Entrar como</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                <option value="OPERATOR">🟢 OPERADOR</option>
                <option value="ADMIN">🟢🟢 ADMINISTRAÇÃO</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">E-mail</label>
              <input
                type="email"
                required
                placeholder="seu.email@afimlab.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Senha</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-black font-extrabold py-3 rounded-lg transition duration-200 disabled:opacity-50 shadow-lg shadow-orange-500/20"
            >
              {loading ? 'Acessando...' : 'Entrar no Sistema'}
            </button>
          </form>
        )}

        {/* FORMULÁRIO DE CADASTRO */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Tipo de Nova Conta</label>
              <select
                value={registerRole}
                onChange={(e) => setRegisterRole(e.target.value)}
                className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                <option value="OPERATOR">🟢🟢 Operador (Pacientes e Ordens de Serviço)</option>
                <option value="ADMIN">🟢🟢 Administrador (Acesso Total e Financeiro)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">E-mail Corporativo</label>
              <input
                type="email"
                required
                placeholder="funcionario@afimlab.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Criar Senha</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-black font-extrabold py-3 rounded-lg transition duration-200 disabled:opacity-50 shadow-lg shadow-orange-500/20"
            >
              {loading ? 'Cadastrando...' : 'Cadastrar Novo Acesso'}
            </button>
          </form>
        )}

      </div>
    </div>
  )
}