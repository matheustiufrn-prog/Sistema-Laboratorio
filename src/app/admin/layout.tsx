'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import LogoutButton from '@/components/LogoutButton'

type NavItem = {
  href: string
  label: string
  icon: string
  adminOnly?: boolean
}

type NavSection = {
  title: string
  items: NavItem[]
}

const SECTIONS: NavSection[] = [
  {
    title: 'Principal',
    items: [{ href: '/admin', label: 'Dashboard Financeiro', icon: '📊', adminOnly: true }],
  },
  {
    title: 'Operação',
    items: [
      { href: '/admin/pacientes', label: 'Pacientes', icon: '🧑‍⚕️' },
      { href: '/admin/exames', label: 'Catálogo de Exames', icon: '🔬' },
      { href: '/admin/orders', label: 'Ordens de Serviço', icon: '📋' },
      { href: '/admin/homecare', label: 'Home Care', icon: '🏠', adminOnly: true },
    ],
  },
  {
    title: 'Administração',
    items: [{ href: '/admin/usuarios', label: 'Utilizadores', icon: '👥', adminOnly: true }],
  },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setUserRole(localStorage.getItem('user_role') || 'USER')
    setUserEmail(localStorage.getItem('user_email') || '')
  }, [pathname])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  const ready = userRole !== null
  const isAdmin = userRole === 'ADMIN'

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  const visibleSections = SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.adminOnly || isAdmin),
  })).filter((section) => section.items.length > 0)

  const initial = (userEmail[0] || 'L').toUpperCase()

  const brand = (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-700 text-lg font-extrabold text-white shadow-md shadow-green-600/30">
        L
      </div>
      <div>
        <p className="text-base font-extrabold leading-tight tracking-wide text-neutral-900">LABORATE</p>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-green-700">
          Gestão Laboratorial
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-neutral-50 font-sans lg:flex">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 lg:hidden">
        {brand}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
        >
          ☰
        </button>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 transform flex-col justify-between border-r border-neutral-200 bg-white transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-64 lg:shrink-0 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 overflow-y-auto">
          <div className="hidden px-6 py-6 lg:block">{brand}</div>

          <div className="flex items-center justify-between px-6 py-4 lg:hidden">
            {brand}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar menu"
              className="rounded-lg px-2 py-1 text-neutral-500 hover:bg-neutral-100"
            >
              ✕
            </button>
          </div>

          <nav className="space-y-6 px-4 pb-6">
            {!ready ? (
              <div className="space-y-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded-xl bg-neutral-100" />
                ))}
              </div>
            ) : (
              visibleSections.map((section) => (
                <div key={section.title} className="space-y-1">
                  <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                    {section.title}
                  </p>

                  {section.items.map((item) => {
                    const active = isActive(item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                          active
                            ? 'bg-green-50 font-semibold text-green-800'
                            : 'font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                        }`}
                      >
                        {active && (
                          <span className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-green-600" />
                        )}
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-lg text-base transition ${
                            active ? 'bg-white shadow-sm' : 'bg-neutral-100 group-hover:bg-white'
                          }`}
                        >
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              ))
            )}
          </nav>
        </div>

        <div className="space-y-3 border-t border-neutral-200 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-neutral-800" title={userEmail}>
                {userEmail || 'Utilizador'}
              </p>
              <span
                className={`mt-0.5 inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                  isAdmin ? 'bg-green-100 text-green-800' : 'bg-neutral-200 text-neutral-700'
                }`}
              >
                {isAdmin ? 'Administrador' : 'Operador'}
              </span>
            </div>
          </div>

          <LogoutButton />
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  )
}