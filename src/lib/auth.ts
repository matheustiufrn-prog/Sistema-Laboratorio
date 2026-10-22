import { SignJWT, jwtVerify } from 'jose'

export const SESSION_COOKIE = 'session'

export type Session = { id: string; email: string; role: string }

function getSecret() {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET não definida')
  return new TextEncoder().encode(secret)
}

export async function createSessionToken(session: Session) {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getSecret())
}

export async function verifySessionToken(token?: string): Promise<Session | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return {
      id: String(payload.id),
      email: String(payload.email),
      role: String(payload.role),
    }
  } catch {
    return null
  }
}