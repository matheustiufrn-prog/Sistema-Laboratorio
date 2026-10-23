'use client'

import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || 'E-mail ou senha inválidos.')
        setLoading(false)
        return
      }

      localStorage.setItem('user_role', data.user.role)
      localStorage.setItem('user_email', data.user.email)

      window.location.assign(data.user.role === 'ADMIN' ? '/admin' : '/admin/pacientes')
    } catch {
      setError('Não foi possível conectar. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-green-100 p-8 sm:p-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-green-600 text-white text-2xl font-extrabold flex items-center justify-center shadow-md shadow-green-600/30">
            L
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-wide text-neutral-900">LABORATE</h1>
          <p className="mt-1 text-xs font-semibold tracking-widest text-green-700 uppercase">
            Sistema de Gestão Laboratorial
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-neutral-600 mb-1.5">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-neutral-600 mb-1.5">
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 pr-20 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-green-700 hover:text-green-800"
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-green-600 py-3 text-sm font-bold tracking-wide text-white shadow-md shadow-green-600/20 transition hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'Entrar no sistema'}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-neutral-400">© LABORATE</p>
      </div>
    </div>
  )
}