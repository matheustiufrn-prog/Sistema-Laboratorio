import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true })

  for (const cookie of request.cookies.getAll()) {
    response.cookies.set(cookie.name, '', {
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    })
  }

  return response
}