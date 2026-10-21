'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Na tela de login não mostra menu lateral
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-neutral-100">
      {/* Menu Lateral */}
      <aside className="w-64 shrink-0 bg-black text-white p-6 flex flex-col sticky top-0 h-screen overflow-y-auto">
        <div className="text-xl font-extrabold text-orange-500 mb-6">AFIM LAB</div>

        <nav className="space-y-2 text-sm font-medium">
          <Link href="/admin" className="block px-4 py-2.5 rounded-lg hover:bg-neutral-800 transition">
            📊 Dashboard Financeiro
          </Link>
          <Link href="/admin/pacientes" className="block px-4 py-2.5 rounded-lg hover:bg-neutral-800 transition">
            🧑‍⚕️ Gestão de Pacientes
          </Link>
          <Link href="/admin/exames" className="block px-4 py-2.5 rounded-lg hover:bg-neutral-800 transition">
            🔬 Catálogo de Exames
          </Link>
          <Link href="/admin/orders" className="block px-4 py-2.5 rounded-lg hover:bg-neutral-800 transition">
            📋 Ordens de Serviço
          </Link>
          <Link href="/admin/usuarios" className="block px-4 py-2.5 rounded-lg hover:bg-neutral-800 transition text-orange-400 font-bold">
            👥 Gestão de Usuários
          </Link>
        </nav>

        {/* Botão Sair */}
        <div className="mt-6 pt-4 border-t border-neutral-800">
          <LogoutButton />
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}