const TZ = 'America/Fortaleza'
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

// Converte 'AAAA-MM-DD' em uma data ao meio-dia no horário de Brasília,
// para a data nunca "escorregar" para outro dia ou mês por causa de fuso.
export function parseDateInput(value: unknown): Date | null {
  const s = String(value ?? '').trim()
  if (!DATE_RE.test(s)) return null

  const year = Number(s.slice(0, 4))
  if (year < 2000 || year > 2100) return null

  const d = new Date(`${s}T12:00:00-03:00`)
  if (Number.isNaN(d.getTime())) return null

  // Rejeita datas inexistentes, como 31/02
  if (formatter.format(d) !== s) return null

  return d
}

export function todayInBrasilia(): Date {
  return parseDateInput(formatter.format(new Date())) ?? new Date()
}
