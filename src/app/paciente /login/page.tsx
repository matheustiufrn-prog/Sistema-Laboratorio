'use client'

import { useState } from 'react'

export default function PacienteLoginPage() {
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
      const res = await fetch('/api/paciente/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data.success) {
        setError(data.error || 'E-mail ou senha inválidos.')
        setLoading(false)
        return
      }

      window.location.assign('/paciente')
    } catch {
      setError('Não foi possível conectar. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-100 px-4 font-sans">
      <div className="w-full max-w-md rounded-2xl border border-green-100 bg-white p-8 shadow-xl sm:p-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-600 text-2xl font-extrabold text-white shadow-md shadow-green-600/30">
            L
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-wide text-neutral-900">LABORATE</h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-green-700">
            Portal do Paciente
          </p>
          <p className="mt-3 text-sm text-neutral-500">Acesse para ver e baixar seus resultados de exames.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-neutral-600">
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
              className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-green-600 focus:ring-4 focus:ring-green-100"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-neutral-600">
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
                className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 pr-20 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-green-600 focus:ring-4 focus:ring-green-100"
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
            className="w-full rounded-lg bg-green-600 py-3 text-sm font-bold tracking-wide text-white shadow-md shadow-green-600/20 transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-neutral-400">
          Não tem acesso? Solicite ao laboratório o seu e-mail e senha.
        </p>
      </div>
    </div>
  )
}