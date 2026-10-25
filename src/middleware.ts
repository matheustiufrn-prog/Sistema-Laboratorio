import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken, SESSION_COOKIE } from '@/lib/auth'

const PUBLIC_PATHS = [
  '/admin/login',
  '/api/auth/login',
  '/api/logout',
  '/paciente/login',
  '/api/paciente/login',
]

const ADMIN_ONLY_API = [
  '/api/users',
  '/api/dashboard',
  '/api/expenses',
  '/api/homecare',
  '/api/reports',
  '/api/medical-records',
]

const ADMIN_ONLY_PAGES = [
  '/admin/usuarios',
  '/admin/homecare',
  '/admin/relatorios',
  '/admin/consultas',
  '/orcamento/homecare',
]

function isPortalPath(p: string) {
  return (
    p === '/paciente' ||
    p.startsWith('/paciente/') ||
    p === '/api/paciente' ||
    p.startsWith('/api/paciente/')
  )
}

function redirectTo(req: NextRequest, path: string) {
  const url = req.nextUrl.clone()
  url.pathname = path
  url.search = ''
  return NextResponse.redirect(url)
}

const deny = () => NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next()
  }

  const isApi = pathname.startsWith('/api/')
  const portal = isPortalPath(pathname)
  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)

  if (!session) {
    if (isApi) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    return redirectTo(req, portal ? '/paciente/login' : '/admin/login')
  }

  // Paciente: só enxerga o portal dele
  if (session.role === 'PATIENT') {
    if (portal) return NextResponse.next()
    return isApi ? deny() : redirectTo(req, '/paciente')
  }

  // Médico: só a aba de consultas e a API de prontuários
  if (session.role === 'DOCTOR') {
    if (isApi) {
      return pathname.startsWith('/api/medical-records') ? NextResponse.next() : deny()
    }
    if (pathname.startsWith('/admin/consultas')) return NextResponse.next()
    return redirectTo(req, '/admin/consultas')
  }

  const isAdmin = session.role === 'ADMIN'

  // Equipe: não usa o portal do paciente
  if (portal) {
    return isApi ? deny() : redirectTo(req, isAdmin ? '/admin' : '/admin/pacientes')
  }

  if (!isAdmin) {
    if (ADMIN_ONLY_API.some((p) => pathname.startsWith(p))) {
      return deny()
    }

    const adminOnlyPage =
      pathname === '/' ||
      pathname === '/admin' ||
      ADMIN_ONLY_PAGES.some((p) => pathname.startsWith(p))

    if (adminOnlyPage) {
      return redirectTo(req, '/admin/pacientes')
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/admin/:path*', '/api/:path*', '/orcamento/:path*', '/paciente/:path*'],
}