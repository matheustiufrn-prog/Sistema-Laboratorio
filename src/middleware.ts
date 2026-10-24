import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken, SESSION_COOKIE } from '@/lib/auth'

const PUBLIC_PATHS = [
  '/admin/login',
  '/api/auth/login',
  '/api/logout',
  '/paciente/login',
  '/api/paciente/login',
]

const ADMIN_ONLY_API = ['/api/users', '/api/dashboard', '/api/expenses', '/api/homecare']

function isPortalPath(p: string) {
  return (
    p === '/paciente' ||
    p.startsWith('/paciente/') ||
    p === '/api/paciente' ||
    p.startsWith('/api/paciente/')
  )
}

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
    const url = req.nextUrl.clone()
    url.pathname = portal ? '/paciente/login' : '/admin/login'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // Paciente: só enxerga o portal dele
  if (session.role === 'PATIENT') {
    if (portal) {
      return NextResponse.next()
    }
    if (isApi) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }
    const url = req.nextUrl.clone()
    url.pathname = '/paciente'
    url.search = ''
    return NextResponse.redirect(url)
  }

  const isAdmin = session.role === 'ADMIN'

  // Equipe: não usa o portal do paciente
  if (portal) {
    if (isApi) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }
    const url = req.nextUrl.clone()
    url.pathname = isAdmin ? '/admin' : '/admin/pacientes'
    url.search = ''
    return NextResponse.redirect(url)
  }

  if (!isAdmin) {
    if (ADMIN_ONLY_API.some((p) => pathname.startsWith(p))) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const adminOnlyPage =
      pathname === '/' ||
      pathname === '/admin' ||
      pathname.startsWith('/admin/usuarios') ||
      pathname.startsWith('/admin/homecare') ||
      pathname.startsWith('/orcamento/homecare')

    if (adminOnlyPage) {
      const url = req.nextUrl.clone()
      url.pathname = '/admin/pacientes'
      url.search = ''
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/admin/:path*', '/api/:path*', '/orcamento/:path*', '/paciente/:path*'],
}