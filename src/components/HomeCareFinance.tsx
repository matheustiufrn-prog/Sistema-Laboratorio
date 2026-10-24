'use client'

import { useEffect, useState } from 'react'

interface Summary {
  ordersCount: number
  examsRevenue: number
  collectionFees: number
  travelFees: number
  totalRevenue: number
  reimbursementsPending: number
  reimbursementsPaid: number
  totalReimbursements: number
  result: number
  byLab: { name: string; orders: number; revenue: number }[]
  byCity: { name: string; orders: number; revenue: number }[]
  details: {
    id: string
    date: string
    patient: string
    neighborhood: string
    city: string
    lab: string
    exams: string
    examsTotal: number
    collectionFee: number
    travelFee: number
    reimbursementsPending: number
    reimbursementsPaid: number
    totalPrice: number
  }[]
}

const brl = (v: number) => `R$ ${Number(v || 0).toFixed(2)}`

export default function HomeCareFinance() {
  const [data, setData] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/homecare/summary')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
        <p className="text-sm text-neutral-500">Carregando Home Care...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
        <p className="text-sm text-red-600">Não foi possível carregar o resumo de Home Care.</p>
      </div>
    )
  }

  const cards = [
    { label: 'Receita Home Care', value: data.totalRevenue, color: 'text-green-700' },
    { label: 'Exames', value: data.examsRevenue, color: 'text-neutral-800' },
    { label: 'Taxas de coleta', value: data.collectionFees, color: 'text-neutral-800' },
    { label: 'Deslocamento', value: data.travelFees, color: 'text-neutral-800' },
    { label: 'Reembolsos pendentes', value: data.reimbursementsPending, color: 'text-red-600' },
    { label: 'Reembolsos pagos', value: data.reimbursementsPaid, color: 'text-green-700' },
    {
      label: 'Resultado Home Care',
      value: data.result,
      color: data.result >= 0 ? 'text-green-800' : 'text-red-700',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="bg-green-800 text-white p-5 rounded-2xl border-l-8 border-green-500 shadow-md">
        <h2 className="text-xl font-bold">🏠 Home Care</h2>
        <p className="text-green-100 text-sm mt-1">
          {data.ordersCount} OS concluída(s). Resultado = receita − reembolsos (pendentes e pagos).
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
            <p className="text-[11px] font-bold text-neutral-500 uppercase">{c.label}</p>
            <p className={`text-xl font-extrabold mt-1 ${c.color}`}>{brl(c.value)}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-neutral-800">Por laboratório da coleta</h3>
          {data.byLab.length === 0 ? (
            <p className="text-xs text-neutral-400">Sem dados ainda.</p>
          ) : (
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-neutral-100 text-neutral-600 border-b">
                  <th className="p-2">Laboratório</th>
                  <th className="p-2">OS</th>
                  <th className="p-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {data.byLab.map((l) => (
                  <tr key={l.name} className="border-b">
                    <td className="p-2 font-semibold text-black">{l.name}</td>
                    <td className="p-2 text-neutral-600">{l.orders}</td>
                    <td className="p-2 text-right font-bold text-green-700">{brl(l.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-neutral-800">Por cidade</h3>
          {data.byCity.length === 0 ? (
            <p className="text-xs text-neutral-400">Sem dados ainda.</p>
          ) : (
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-neutral-100 text-neutral-600 border-b">
                  <th className="p-2">Cidade</th>
                  <th className="p-2">OS</th>
                  <th className="p-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {data.byCity.map((c) => (
                  <tr key={c.name} className="border-b">
                    <td className="p-2 font-semibold text-black">{c.name}</td>
                    <td className="p-2 text-neutral-600">{c.orders}</td>
                    <td className="p-2 text-right font-bold text-green-700">{brl(c.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-neutral-800">Detalhamento por OS de Home Care</h3>
        {data.details.length === 0 ? (
          <p className="text-xs text-neutral-400">Nenhuma OS de Home Care concluída até o momento.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-neutral-100 text-neutral-600 border-b">
                  <th className="p-2">Data</th>
                  <th className="p-2">Paciente</th>
                  <th className="p-2">Local</th>
                  <th className="p-2">Laboratório</th>
                  <th className="p-2">Exames</th>
                  <th className="p-2 text-right">Coleta</th>
                  <th className="p-2 text-right">Desloc.</th>
                  <th className="p-2 text-right">Reemb. pend.</th>
                  <th className="p-2 text-right">Reemb. pago</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.details.map((d) => (
                  <tr key={d.id} className="border-b hover:bg-neutral-50">
                    <td className="p-2 text-neutral-600">{new Date(d.date).toLocaleDateString('pt-BR')}</td>
                    <td className="p-2 font-semibold text-black">{d.patient}</td>
                    <td className="p-2 text-neutral-600">
                      {d.neighborhood}, {d.city}
                    </td>
                    <td className="p-2 text-neutral-600">{d.lab}</td>
                    <td className="p-2 text-xs text-neutral-600">
                      {d.exams} <span className="font-bold">({brl(d.examsTotal)})</span>
                    </td>
                    <td className="p-2 text-right">{brl(d.collectionFee)}</td>
                    <td className="p-2 text-right">{brl(d.travelFee)}</td>
                    <td className="p-2 text-right text-red-600">{brl(d.reimbursementsPending)}</td>
                    <td className="p-2 text-right text-green-700">{brl(d.reimbursementsPaid)}</td>
                    <td className="p-2 text-right font-bold text-green-700">{brl(d.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}