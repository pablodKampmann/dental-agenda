import { describe, it, expect } from 'vitest'
import { appointmentBalance, computeAppointmentBalances } from '@/lib/paymentBalances'
import type { Payment } from '@/services/payments/getPayments'

function payment(overrides: Partial<Payment>): Payment {
  return { id: 'p1', patientId: 1, date: '01/01/2026', amount: 0, method: 'Efectivo', ts: 0, ...overrides }
}

const appointment = {
  id: 5,
  date: '10/09/2026',
  time: '10:00',
  treatments: [
    { id: 't1', name: 'Consulta', price: 1000 },
    { id: 't2', name: 'Composite', price: 2000 },
  ],
}

describe('appointmentBalance()', () => {
  it('saldo completo cuando no hay pagos vinculados', () => {
    const balance = appointmentBalance(appointment, [])
    expect(balance).toMatchObject({ total: 3000, paid: 0, saldo: 3000 })
  })

  it('descuenta solo los pagos vinculados a ese turno (mismo id y fecha)', () => {
    const payments = [
      payment({ amount: 1000, appointmentId: 5, appointmentDate: '10/09/2026' }),
      // mismo id, otra fecha (el id solo es único dentro de su día) — no debe contar
      payment({ amount: 500, appointmentId: 5, appointmentDate: '11/09/2026' }),
      // pago suelto, sin turno — tampoco debe contar
      payment({ amount: 999 }),
    ]
    const balance = appointmentBalance(appointment, payments)
    expect(balance).toMatchObject({ total: 3000, paid: 1000, saldo: 2000 })
  })

  it('saldo negativo si se pagó de más (no se clampea acá)', () => {
    const payments = [payment({ amount: 5000, appointmentId: 5, appointmentDate: '10/09/2026' })]
    expect(appointmentBalance(appointment, payments).saldo).toBe(-2000)
  })

  it('total 0 en un turno sin tratamientos', () => {
    const vacio = { id: 9, date: '10/09/2026', time: '11:00', treatments: [] }
    expect(appointmentBalance(vacio, []).total).toBe(0)
  })
})

describe('computeAppointmentBalances()', () => {
  it('descarta los turnos sin tratamientos (nada que cobrar)', () => {
    const conTratamientos = appointment
    const sinTratamientos = { id: 9, date: '10/09/2026', time: '11:00', treatments: [] }
    const result = computeAppointmentBalances([conTratamientos, sinTratamientos], [])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(5)
  })
})
