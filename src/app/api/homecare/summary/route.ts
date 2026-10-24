import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const round = (n: number) => Math.round(n * 100) / 100

export async function GET() {
  try {
    const orders = await prisma.homeCareOrder.findMany({
      where: { status: 'CONCLUIDO' },
      include: {
        patient: true,
        items: { include: { exam: true } },
        reimbursements: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    let examsRevenue = 0
    let collectionFees = 0
    let travelFees = 0
    let reimbursementsPending = 0
    let reimbursementsPaid = 0

    const labMap = new Map<string, { name: string; orders: number; revenue: number }>()
    const cityMap = new Map<string, { name: string; orders: number; revenue: number }>()

    const details = orders.map((o) => {
      const reimbPending = o.reimbursements
        .filter((r) => r.status !== 'PAGO')
        .reduce((s, r) => s + r.amount, 0)
      const reimbPaid = o.reimbursements
        .filter((r) => r.status === 'PAGO')
        .reduce((s, r) => s + r.amount, 0)

      examsRevenue += o.examsTotal
      collectionFees += o.collectionFee
      travelFees += o.travelFee
      reimbursementsPending += reimbPending
      reimbursementsPaid += reimbPaid

      const lab = labMap.get(o.collectionLab) ?? { name: o.collectionLab, orders: 0, revenue: 0 }
      lab.orders += 1
      lab.revenue += o.totalPrice
      labMap.set(o.collectionLab, lab)

      const city = cityMap.get(o.city) ?? { name: o.city, orders: 0, revenue: 0 }
      city.orders += 1
      city.revenue += o.totalPrice
      cityMap.set(o.city, city)

      return {
        id: o.id,
        date: o.createdAt,
        patient: o.patient?.fullName || 'Paciente',
        neighborhood: o.neighborhood,
        city: o.city,
        lab: o.collectionLab,
        exams: o.items.map((i) => i.exam?.name).filter(Boolean).join(', '),
        examsTotal: round(o.examsTotal),
        collectionFee: round(o.collectionFee),
        travelFee: round(o.travelFee),
        reimbursementsPending: round(reimbPending),
        reimbursementsPaid: round(reimbPaid),
        totalPrice: round(o.totalPrice),
      }
    })

    const totalRevenue = examsRevenue + collectionFees + travelFees
    const totalReimbursements = reimbursementsPending + reimbursementsPaid

    return NextResponse.json({
      ordersCount: orders.length,
      examsRevenue: round(examsRevenue),
      collectionFees: round(collectionFees),
      travelFees: round(travelFees),
      totalRevenue: round(totalRevenue),
      reimbursementsPending: round(reimbursementsPending),
      reimbursementsPaid: round(reimbursementsPaid),
      totalReimbursements: round(totalReimbursements),
      result: round(totalRevenue - totalReimbursements),
      byLab: Array.from(labMap.values()).map((x) => ({ ...x, revenue: round(x.revenue) })),
      byCity: Array.from(cityMap.values()).map((x) => ({ ...x, revenue: round(x.revenue) })),
      details,
    })
  } catch (error) {
    console.error('ERRO NO RESUMO HOME CARE:', error)
    return NextResponse.json({ error: 'Erro ao gerar o resumo de Home Care.' }, { status: 500 })
  }
}