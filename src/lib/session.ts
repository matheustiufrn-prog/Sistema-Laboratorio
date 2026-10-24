import { cookies } from 'next/headers'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth'

export async function getSession() {
  const store = await cookies()
  return verifySessionToken(store.get(SESSION_COOKIE)?.value)
}