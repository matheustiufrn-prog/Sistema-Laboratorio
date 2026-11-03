import { redirect } from 'next/navigation'

export default function RelatoriosRedirect() {
  redirect('/admin?aba=relatorio')
}
