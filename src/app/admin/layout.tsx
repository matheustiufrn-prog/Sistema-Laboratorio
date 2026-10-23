'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import LogoutButton from '@/components/LogoutButton'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const storedRole = localStorage.getItem('user_role') || 'USER'
    const storedEmail = localStorage.getItem('user_email') || ''
    setUserRole(storedRole)
    setUserEmail(storedEmail)
  }, [pathname])

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  const isAdmin = userRole === 'ADMIN'

  const linkClass = (href: string) =>
    `block px-4 py-2.5 rounded-lg transition ${
      pathname === href
        ? 'bg-green-600 text-white font-bold'
        : 'text-neutral-700 hover:bg-green-50 hover:text-green-800'
    }`

  return (
    <div className="flex min-h-screen bg-neutral-50 font-sans">
      <aside className="w-64 shrink-0 bg-white text-neutral-800 border-r border-neutral-200 p-6 flex flex-col justify-between sticky top-0 h-screen overflow-y-auto">
        <div className="space-y-6">
          <div className="text-xl font-extrabold text-green-700 tracking-wider mb-6">LABORATE</div>

          <nav className="space-y-2 text-sm font-medium">
            {isAdmin && (
              <Link href="/admin" className={linkClass('/admin')}>
                📊 Dashboard Financeiro
              </Link>
            )}

            <Link href="/admin/pacientes" className={linkClass('/admin/pacientes')}>
              🧑‍⚕️ Gestão de Pacientes
            </Link>

            <Link href="/admin/exames" className={linkClass('/admin/exames')}>
              🔬 Catálogo de Exames
            </Link>

            <Link href="/admin/orders" className={linkClass('/admin/orders')}>
              📋 Ordens de Serviço
            </Link>

            {isAdmin && (
              <Link href="/admin/usuarios" className={linkClass('/admin/usuarios')}>
                👥 Gestão de Utilizadores
              </Link>
            )}
          </nav>
        </div>

        <div className="mt-6 pt-4 border-t border-neutral-200 space-y-3">
          <div className="text-xs text-neutral-500 space-y-1">
            <p className="truncate font-medium text-neutral-700" title={userEmail}>{userEmail}</p>
            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${isAdmin ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-700'}`}>
              {isAdmin ? 'Administrador' : 'Operador'}
            </span>
          </div>

          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}