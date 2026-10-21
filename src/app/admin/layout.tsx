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

  return (
    <div className="flex min-h-screen bg-neutral-100 font-sans">
      <aside className="w-64 shrink-0 bg-black text-white p-6 flex flex-col justify-between sticky top-0 h-screen overflow-y-auto">
        <div className="space-y-6">
          <div className="text-xl font-extrabold text-orange-500 tracking-wider mb-6">AFIM LAB</div>

          <nav className="space-y-2 text-sm font-medium">
            {isAdmin && (
              <Link href="/admin" className="block px-4 py-2.5 rounded-lg hover:bg-neutral-800 transition">
                📊 Dashboard Financeiro
              </Link>
            )}

            <Link href="/admin/pacientes" className="block px-4 py-2.5 rounded-lg hover:bg-neutral-800 transition">
              🧑‍⚕️ Gestão de Pacientes
            </Link>
            
            <Link href="/admin/exames" className="block px-4 py-2.5 rounded-lg hover:bg-neutral-800 transition">
              🔬 Catálogo de Exames
            </Link>
            
            <Link href="/admin/orders" className="block px-4 py-2.5 rounded-lg hover:bg-neutral-800 transition">
              📋 Ordens de Serviço
            </Link>

            {isAdmin && (
              <Link href="/admin/usuarios" className="block px-4 py-2.5 rounded-lg hover:bg-neutral-800 transition text-orange-400 font-bold">
                👥 Gestão de Utilizadores
              </Link>
            )}
          </nav>
        </div>

        <div className="mt-6 pt-4 border-t border-neutral-800 space-y-3">
          <div className="text-xs text-neutral-400 space-y-1">
            <p className="truncate font-medium text-neutral-300" title={userEmail}>{userEmail}</p>
            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${isAdmin ? 'bg-purple-900 text-purple-200' : 'bg-blue-900 text-blue-200'}`}>
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