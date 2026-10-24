'use client'

import { useState } from 'react'

export default function LogoutButton() {
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)

    try {
      await fetch('/api/logout', { method: 'POST' })
    } catch (err) {
      console.error(err)
    }

    localStorage.removeItem('user_role')
    localStorage.removeItem('user_email')
    window.location.assign('/admin/login')
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span>🚪</span>
      <span>{loading ? 'Saindo...' : 'Sair'}</span>
    </button>
  )
}