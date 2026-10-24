'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import QuoteDocument, { QuoteData } from '@/components/QuoteDocument'

export default function QuotePage() {
  const params = useParams<{ tipo: string; id: string }>()
  const tipo = params.tipo
  const id = params.id

  const [data, setData] = useState<QuoteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        if (tipo !== 'os' && tipo !== 'homecare') {
          setError('Tipo de orçamento inválido.')
          return
        }

        const res = await fetch(tipo === 'os' ? '/api/orders' : '/api/homecare')

        if (res.status === 401 || res.status === 403) {
          setError('Você não tem permissão para ver este orçamento.')
          return
        }
        if (!res.ok) {
          setError('Não foi possível carregar o orçamento.')
          return
        }

        const list = await res.json()
        const order = Array.isArray(list) ? list.find((o: any) => o.id === id) : null

        if (!order) {
          setError('Orçamento não encontrado.')
          return
        }

        const lines = (order.items || []).map((item: any) => ({
          name: item.exam?.name || 'Exame',
          price: Number(item.price) || 0,
        }))

        if (tipo === 'os') {
          setData({
            kind: 'os',
            id: order.id,
            date: order.createdAt,
            patientName: order.patient?.fullName || 'Paciente',
            patientCpf: order.patient?.cpf,
            lines,
            examsTotal: Number(order.totalPrice) || 0,
            total: Number(order.totalPrice) || 0,
          })
        } else {
          setData({
            kind: 'homecare',
            id: order.id,
            date: order.createdAt,
            patientName: order.patient?.fullName || 'Paciente',
            patientCpf: order.patient?.cpf,
            lines,
            examsTotal: Number(order.examsTotal) || 0,
            collectionFee: Number(order.collectionFee) || 0,
            travelFee: Number(order.travelFee) || 0,
            neighborhood: order.neighborhood,
            city: order.city,
            total: Number(order.totalPrice) || 0,
          })
        }
      } catch {
        setError('Erro de conexão ao carregar o orçamento.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [tipo, id])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100">
        <p className="text-sm font-semibold text-neutral-500">Carregando orçamento...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
        <p className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-sm font-semibold text-red-700">
          {error || 'Orçamento indisponível.'}
        </p>
      </div>
    )
  }

  return <QuoteDocument data={data} />
}