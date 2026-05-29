import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mockeamos Firebase para que no intente conectarse a la DB real
vi.mock('@/lib/firebase', () => ({ db: {} }))
vi.mock('firebase/database', () => ({
  ref: vi.fn(() => 'mock-ref'),
  get: vi.fn(),
  remove: vi.fn(),
}))
vi.mock('@/services/auth/getUser', () => ({
  getUser: vi.fn().mockResolvedValue('clinic-123'),
}))

import { deleteAppointment } from '@/services/appointments/deleteAppointment'
import { get, remove } from 'firebase/database'

const mockGet = vi.mocked(get)
const mockRemove = vi.mocked(remove)

describe('deleteAppointment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRemove.mockResolvedValue(undefined)
    Object.defineProperty(global.navigator, 'onLine', {
      value: true,
      configurable: true,
    })
  })

  it('no llama a remove cuando está offline', async () => {
    Object.defineProperty(global.navigator, 'onLine', {
      value: false,
      configurable: true,
    })

    await deleteAppointment(1, '09052026')

    expect(mockRemove).not.toHaveBeenCalled()
  })

  it('no hace nada si el turno no existe en la DB', async () => {
    // El primer get devuelve que el turno no existe
    mockGet.mockResolvedValue({ exists: () => false } as any)

    await deleteAppointment(1, '09052026')

    expect(mockRemove).not.toHaveBeenCalled()
  })

  it('borra el turno y la referencia del paciente', async () => {
    // Paso 1: get del turno — devuelve el turno con su patientId
    mockGet
      .mockResolvedValueOnce({
        exists: () => true,
        val: () => ({ patientId: 101, time: '09:00' }),
      } as any)
      // Paso 2: get de las citas del paciente — devuelve la lista de fechas
      .mockResolvedValueOnce({
        exists: () => true,
        val: () => ({ '-Abc123': '09052026', '-Xyz999': '15062026' }),
      } as any)

    await deleteAppointment(1, '09052026')

    // Debe haberse llamado remove dos veces: turno + referencia del paciente
    expect(mockRemove).toHaveBeenCalledTimes(2)
  })

  it('borra el turno aunque el paciente no tenga referencias guardadas', async () => {
    mockGet
      .mockResolvedValueOnce({
        exists: () => true,
        val: () => ({ patientId: 101, time: '09:00' }),
      } as any)
      // El paciente no tiene citas guardadas
      .mockResolvedValueOnce({ exists: () => false } as any)

    await deleteAppointment(1, '09052026')

    // Solo se borra el turno, no la referencia del paciente
    expect(mockRemove).toHaveBeenCalledTimes(1)
  })
})
