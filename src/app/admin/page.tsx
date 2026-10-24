'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import HomeCareFinance from '@/components/HomeCareFinance'

interface OrderItem {
  id: string
  exam?: {
    name: string
  }
}

interface Order {
  id: string
  totalPrice: number
  createdAt: string
  patient?: {
    fullName: string
    cpf: string
  }
  items: OrderItem[]
}

interface MonthlyStat {
  month: string
  revenue: number
  expenses: number
  ordersCount: number
}

interface Expense {
  id: string
  description: string
  amount: number
  category: string
  date: string
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [netProfit, setNetProfit] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)

  const [monthlyData, setMonthlyData] = useState<MonthlyStat[]>([])
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  const [expDescription, setExpDescription] = useState('')
  const [expAmount, setExpAmount] = useState('')
  const [expCategory, setExpCategory] = useState('Operacional')
  const [expSuccess, setExpSuccess] = useState('')

  useEffect(() => {
    const storedRole = localStorage.getItem('user_role')
    const storedEmail = localStorage.getItem('user_email') || ''

    const isAdmin = storedRole === 'ADMIN' || storedEmail.toLowerCase().includes('admin')

    if (!isAdmin) {
      router.push('/admin/orders')
    } else {
      setAuthorized(true)
      fetchDashboard()
    }
  }, [router])

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard')
      if (res.ok) {
        const data = await res.json()
        setTotalRevenue(data.totalRevenue || 0)
        setTotalExpenses(data.totalExpenses || 0)
        setNetProfit(data.netProfit || 0)
        setTotalOrders(data.totalOrders || 0)
        setMonthlyData(data.monthlyData || [])
        setRecentOrders(data.recentOrders || [])
        setExpenses(data.expenses || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    setExpSuccess('')

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: expDescription,
          amount: expAmount,
          category: expCategory
        })
      })

      if (res.ok) {
        setExpSuccess('Despesa cadastrada com sucesso!')
        setExpDescription('')
        setExpAmount('')
        fetchDashboard()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta despesa?')) return

    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        fetchDashboard()
      } else {
        alert('Erro ao excluir despesa.')
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (!authorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-100">
        <p className="text-sm font-semibold text-neutral-500">A verificar permissões de acesso...</p>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 font-sans max-w-7xl mx-auto">
      <div className="bg-green-800 text-white p-6 rounded-2xl border-l-8 border-green-500 shadow-md">
        <h1 className="text-2xl font-bold">Painel Financeiro & Operacional</h1>
        <p className="text-green-100 text-sm mt-1">Acompanhe receitas, despesas, margem líquida e o detalhe dos exames por paciente.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <p className="text-xs font-bold text-neutral-500 uppercase">Faturamento Bruto</p>
          <p className="text-2xl font-extrabold text-green-700 mt-1">
            {loading ? '...' : `R$ ${totalRevenue.toFixed(2)}`}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <p className="text-xs font-bold text-neutral-500 uppercase">Despesas Totais</p>
          <p className="text-2xl font-extrabold text-red-600 mt-1">
            {loading ? '...' : `R$ ${totalExpenses.toFixed(2)}`}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <p className="text-xs font-bold text-neutral-500 uppercase">Lucro Líquido</p>
          <p className={`text-2xl font-extrabold mt-1 ${netProfit >= 0 ? 'text-blue-600' : 'text-red-700'}`}>
            {loading ? '...' : `R$ ${netProfit.toFixed(2)}`}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <p className="text-xs font-bold text-neutral-500 uppercase">Atendimentos Concluídos</p>
          <p className="text-2xl font-extrabold text-neutral-800 mt-1">
            {loading ? '...' : totalOrders}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-neutral-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-neutral-800">📅 Desempenho Mês a Mês</h2>
          {loading ? (
            <p className="text-neutral-500 text-sm">Carregando...</p>
          ) : monthlyData.length === 0 ? (
            <p className="text-neutral-500 text-sm">Nenhum dado mensal registrado ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-neutral-100 border-b text-neutral-600">
                    <th className="p-3">Mês/Ano</th>
                    <th className="p-3">Atendimentos</th>
                    <th className="p-3">Faturamento</th>
                    <th className="p-3">Despesas</th>
                    <th className="p-3 text-right">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((m, idx) => {
                    const balance = m.revenue - m.expenses
                    return (
                      <tr key={idx} className="border-b hover:bg-neutral-50">
                        <td className="p-3 font-semibold capitalize text-black">{m.month}</td>
                        <td className="p-3 font-medium text-neutral-700">{m.ordersCount} OS</td>
                        <td className="p-3 font-bold text-green-700">R$ {m.revenue.toFixed(2)}</td>
                        <td className="p-3 font-bold text-red-600">R$ {m.expenses.toFixed(2)}</td>
                        <td className={`p-3 text-right font-extrabold ${balance >= 0 ? 'text-blue-600' : 'text-red-700'}`}>
                          R$ {balance.toFixed(2)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-neutral-800">💸 Registrar Nova Despesa</h2>
          {expSuccess && <p className="text-xs font-bold text-green-700 bg-green-100 p-2 rounded">{expSuccess}</p>}
          <form onSubmit={handleAddExpense} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">Descrição</label>
              <input
                type="text"
                required
                value={expDescription}
                onChange={(e) => setExpDescription(e.target.value)}
                placeholder="Ex: Reagentes, Aluguel, Energia"
                className="w-full p-2 border border-neutral-300 rounded text-sm text-black"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                required
                value={expAmount}
                onChange={(e) => setExpAmount(e.target.value)}
                placeholder="150.00"
                className="w-full p-2 border border-neutral-300 rounded text-sm text-black"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">Categoria</label>
              <select
                value={expCategory}
                onChange={(e) => setExpCategory(e.target.value)}
                className="w-full p-2 border border-neutral-300 rounded text-sm bg-white text-black"
              >
                <option value="Operacional">Operacional</option>
                <option value="Insumos/Reagentes">Insumos/Reagentes</option>
                <option value="Manutenção">Manutenção</option>
                <option value="Administrativo">Administrativo</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm transition"
            >
              Salvar Despesa
            </button>
          </form>

          <div className="border-t pt-4 space-y-2 max-h-56 overflow-y-auto">
            <h3 className="text-xs font-bold text-neutral-500 uppercase">Despesas Lançadas</h3>
            {expenses.length === 0 ? (
              <p className="text-xs text-neutral-400">Nenhuma despesa lançada.</p>
            ) : (
              expenses.map((exp) => (
                <div key={exp.id} className="flex justify-between items-center p-2 bg-neutral-50 rounded text-xs border">
                  <div>
                    <p className="font-bold text-black">{exp.description}</p>
                    <p className="text-neutral-500">{exp.category} - {new Date(exp.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-red-600">R$ {Number(exp.amount).toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="bg-red-100 hover:bg-red-200 text-red-700 font-bold px-2 py-1 rounded"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-neutral-800">🔬 Detalhamento: Pacientes x Exames Realizados</h2>
        {loading ? (
          <p className="text-neutral-500 text-sm">Carregando detalhes...</p>
        ) : recentOrders.length === 0 ? (
          <p className="text-neutral-500 text-sm">Nenhum atendimento concluído até o momento.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-neutral-100 border-b text-neutral-600">
                  <th className="p-3">Data</th>
                  <th className="p-3">Paciente</th>
                  <th className="p-3">CPF</th>
                  <th className="p-3">Exames Realizados</th>
                  <th className="p-3 text-right">Valor Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => {
                  const examList = order.items.map(item => item.exam?.name).filter(Boolean).join(', ')
                  return (
                    <tr key={order.id} className="border-b hover:bg-neutral-50">
                      <td className="p-3 text-neutral-600">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</td>
                      <td className="p-3 font-semibold text-black">{order.patient?.fullName || 'Paciente'}</td>
                      <td className="p-3 text-neutral-600">{order.patient?.cpf || '-'}</td>
                      <td className="p-3">
                        <span className="bg-blue-50 text-blue-800 px-2.5 py-1 rounded-md text-xs font-semibold border border-blue-200">
                          {examList || 'Exames não especificados'}
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-green-700">R$ {Number(order.totalPrice).toFixed(2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <HomeCareFinance />
    </div>
  )
}