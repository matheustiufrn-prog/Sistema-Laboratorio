'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    if (!window.confirm('Deseja realmente sair do sistema?')) return

    setLoading(true)

    try {
      // Apaga os cookies de sessão no servidor
      await fetch('/api/logout', { method: 'POST' })
    } catch (err) {
      console.error('Erro ao encerrar sessão:', err)
    }

    // Limpa qualquer dado de sessão guardado no navegador
    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch {}

    // Recarrega por completo para zerar qualquer estado da sessão anterior
    window.location.href = '/admin/login'
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-400 hover:text-white hover:bg-red-600 rounded-lg transition disabled:opacity-50"
    >
      <span>🚪</span>
      <span>{loading ? 'Saindo...' : 'Sair'}</span>
    </button>
  )
}