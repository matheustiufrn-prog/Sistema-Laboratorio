'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import LogoutButton from '@/components/LogoutButton'
import Icon, { type IconName } from '@/components/Icon'
import { useUiMode } from '@/lib/useUiMode'

type NavItem = {
  href: string
  label: string
  icon: IconName
  roles: string[]
}

type NavSection = {
  title: string
  items: NavItem[]
}

// Para trocar o nome de um item do menu, edite o campo label.
const SECTIONS: NavSection[] = [
  {
    title: 'Principal',
    items: [
      { href: '/admin', label: 'Financeiro', icon: 'chart', roles: ['ADMIN'] },
      { href: '/admin/relatorios', label: 'Relatório Mensal', icon: 'calendar', roles: ['ADMIN'] },
    ],
  },
  {
    title: 'Operação',
    items: [
      { href: '/admin/pacientes', label: 'Pacientes', icon: 'users', roles: ['ADMIN', 'USER'] },
      { href: '/admin/exames', label: 'Catálogo de Exames', icon: 'flask', roles: ['ADMIN', 'USER'] },
      { href: '/admin/orders', label: 'Ordens de Serviço', icon: 'clipboard', roles: ['ADMIN', 'USER'] },
      { href: '/admin/orcamentos', label: 'Orçamentos', icon: 'receipt', roles: ['ADMIN', 'USER'] },
      { href: '/admin/resultados', label: 'Resultados', icon: 'file', roles: ['ADMIN', 'USER'] },
      { href: '/admin/liberacao', label: 'Liberação de Exames', icon: 'check-circle', roles: ['ADMIN', 'USER'] },
      { href: '/admin/consultas', label: 'Consultas Médicas', icon: 'stethoscope', roles: ['ADMIN', 'DOCTOR'] },
      { href: '/admin/homecare', label: 'Home Care', icon: 'home', roles: ['ADMIN'] },
    ],
  },
  {
    title: 'Administração',
    items: [{ href: '/admin/usuarios', label: 'Utilizadores', icon: 'shield', roles: ['ADMIN'] }],
  },
]

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Administrador',
  DOCTOR: 'Médico(a)',
  USER: 'Operador',
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { mode, toggle } = useUiMode()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setUserRole(localStorage.getItem('user_role') || 'USER')
    setUserEmail(localStorage.getItem('user_email') || '')
  }, [pathname])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  const ready = userRole !== null
  const role = userRole || 'USER'
  const isAdmin = role === 'ADMIN'
  const q = norm(query.trim())
  const dark = mode === 'dark'

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  const visibleSections = SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) => item.roles.includes(role) && (!q || norm(item.label).includes(q))
    ),
  })).filter((section) => section.items.length > 0)

  const initial = (userEmail[0] || 'L').toUpperCase()

  const brand = (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-700 text-lg font-extrabold text-white shadow-md">
        L
      </div>
      <div>
        <p className="text-base font-extrabold leading-tight tracking-wide text-neutral-900">LABORATE</p>
        <p className="text-[10px] font-semibold uppercase leading-tight tracking-widest text-green-700">
          Gestão Médica e Laboratorial
        </p>
      </div>
    </div>
  )

  const searchBox = (
    <div className="px-4 pb-3">
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
          <Icon name="search" className="h-4 w-4" />
        </span>
        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar no menu"
          className="w-full rounded-xl border border-neutral-300 bg-white py-2 pl-9 pr-16 text-sm text-black outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-neutral-200 bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-500">
          Ctrl K
        </kbd>
      </div>
    </div>
  )

  return (
    <div className="aurora min-h-screen font-sans lg:flex">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 print:hidden lg:hidden">
        {brand}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          className="rounded-lg border border-neutral-200 p-2 text-neutral-700 hover:bg-neutral-100"
        >
          <Icon name="menu" className="h-5 w-5" />
        </button>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 print:hidden lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 transform flex-col justify-between border-r border-neutral-200 bg-white transition-transform duration-200 print:hidden lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-64 lg:shrink-0 lg:translate-x-0 ${
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
              className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100"
            >
              <Icon name="x" className="h-5 w-5" />
            </button>
          </div>

          {searchBox}

          <nav className="space-y-6 px-4 pb-6">
            {!ready ? (
              <div className="space-y-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded-xl bg-neutral-100" />
                ))}
              </div>
            ) : visibleSections.length === 0 ? (
              <p className="px-3 text-xs text-neutral-400">Nada encontrado para “{query}”.</p>
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
                          className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                            active
                              ? 'bg-white text-green-700 shadow-sm'
                              : 'bg-neutral-100 text-neutral-500 group-hover:bg-white group-hover:text-neutral-800'
                          }`}
                        >
                          <Icon name={item.icon} className="h-[18px] w-[18px]" />
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
          <button
            type="button"
            onClick={toggle}
            aria-label="Alternar entre modo claro e escuro"
            className="flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
          >
            <span className="flex items-center gap-2">
              <Icon name={dark ? 'moon' : 'sun'} className="h-4 w-4" />
              {dark ? 'Modo escuro' : 'Modo claro'}
            </span>
            <span
              className="relative h-5 w-9 rounded-full transition-colors"
              style={{ background: dark ? 'linear-gradient(135deg, #10b981, #06b6d4)' : 'rgba(148, 163, 184, 0.5)' }}
            >
              <span
                className="absolute top-0.5 h-4 w-4 rounded-full shadow transition-all"
                style={{ backgroundColor: '#ffffff', left: dark ? '18px' : '2px' }}
              />
            </span>
          </button>

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
                {ROLE_LABEL[role] || 'Operador'}
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
