import { NextResponse } from 'next/server'

export function pdfResponse(data: Uint8Array, fileName: string, inline: boolean) {
  const encoded = encodeURIComponent(fileName).replace(
    /['()*]/g,
    (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase()
  )

  return new NextResponse(new Uint8Array(data), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="resultado.pdf"; filename*=UTF-8''${encoded}`,
      'Content-Length': String(data.byteLength),
      'Cache-Control': 'private, no-store',
    },
  })
}