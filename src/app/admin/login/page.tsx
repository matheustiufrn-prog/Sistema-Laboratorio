'use client'

import { useState } from 'react'
import { useUiMode } from '@/lib/useUiMode'

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="10.5" width="16" height="10" rx="2.5" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </svg>
  )
}

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M4 4l16 16" />}
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
    </svg>
  )
}

export default function LoginPage() {
  const { mode, toggle } = useUiMode()
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

      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data.success || !data.user) {
        setError(
          data.error ||
            (res.status >= 500
              ? 'Erro no servidor. Tente novamente em instantes.'
              : 'E-mail ou senha inválidos.')
        )
        setLoading(false)
        return
      }

      localStorage.setItem('user_role', data.user.role)
      localStorage.setItem('user_email', data.user.email)

      const destination =
        data.user.role === 'ADMIN'
          ? '/admin'
          : data.user.role === 'DOCTOR'
            ? '/admin/consultas'
            : '/admin/pacientes'

      window.location.assign(destination)
    } catch {
      setError('Não foi possível conectar ao servidor. Verifique a conexão e tente de novo.')
      setLoading(false)
    }
  }

  return (
    <div className="aurora flex min-h-screen items-center justify-center px-4 py-10">
      <button
        type="button"
        onClick={toggle}
        className="absolute right-4 top-4 flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50 sm:right-6 sm:top-6"
        aria-label="Alternar entre modo claro e escuro"
      >
        {mode === 'dark' ? <SunIcon /> : <MoonIcon />}
        {mode === 'dark' ? 'Modo claro' : 'Modo escuro'}
      </button>

      <div className="relative w-full max-w-md">
        <div className="pointer-events-none absolute -inset-3 rounded-[2rem] bg-gradient-to-r from-green-500/25 via-cyan-400/20 to-violet-500/25 blur-2xl" />

        <div className="relative rounded-3xl border border-neutral-200 bg-white p-8 shadow-lg sm:p-10">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-700 text-2xl font-extrabold text-white shadow-lg">
              L
            </div>
            <h1 className="mt-4 text-2xl font-extrabold tracking-wide text-neutral-900">LABORATE</h1>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-green-700">
              Gestão médica e laboratorial
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-neutral-600">
                E-mail
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                  <MailIcon />
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full rounded-xl border border-neutral-300 bg-white py-3 pl-10 pr-3 text-sm text-black outline-none transition placeholder:text-neutral-400 focus:border-green-600 focus:ring-4 focus:ring-green-100"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-neutral-600">
                Senha
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                  <LockIcon />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-neutral-300 bg-white py-3 pl-10 pr-11 text-sm text-black outline-none transition placeholder:text-neutral-400 focus:border-green-600 focus:ring-4 focus:ring-green-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-neutral-400 transition hover:text-neutral-700"
                  aria-label={showPassword ? 'Ocultar a senha' : 'Mostrar a senha'}
                >
                  <EyeIcon off={showPassword} />
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-bold tracking-wide text-white transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Entrando...' : 'Entrar no sistema'}
              {!loading && <ArrowIcon />}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-neutral-500">Acesso restrito a colaboradores autorizados</p>
        </div>
      </div>
    </div>
  )
}
