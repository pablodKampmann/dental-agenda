import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/firebase', () => ({ db: {} }))
vi.mock('firebase/database', () => ({
  ref: vi.fn(() => 'mock-ref'),
  get: vi.fn(),
}))
vi.mock('@/services/auth/getUser', () => ({
  getUser: vi.fn().mockResolvedValue('clinic-123'),
}))

import { getAppointments } from '@/services/appointments/getAppointments'
import { get } from 'firebase/database'

const mockGet = vi.mocked(get)

describe('getAppointments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(global.navigator, 'onLine', {
      value: true,
      configurable: true,
    })
  })

  it('returns null when offline', async () => {
    Object.defineProperty(global.navigator, 'onLine', {
      value: false,
      configurable: true,
    })
    const result = await getAppointments('09/05/2026')
    expect(result).toBeNull()
  })

  it('returns "vacio" when no appointments exist for the date', async () => {
    mockGet.mockResolvedValue({ exists: () => false, val: () => null } as any)
    const result = await getAppointments('09/05/2026')
    expect(result).toBe('vacio')
  })

  it('enriches appointments with patient data', async () => {
    const appointments = {
      '1': { patientId: 101, time: '09:00' },
    }
    const patientData = { id: 101, name: 'Ana García' }

    mockGet
      .mockResolvedValueOnce({ exists: () => true, val: () => appointments } as any)
      .mockResolvedValueOnce({ exists: () => true, val: () => patientData } as any)

    const result = await getAppointments('09/05/2026') as any
    expect(result['1'].patientData).toEqual(patientData)
  })

  it('removes appointments whose patient no longer exists in DB', async () => {
    const appointments = {
      '1': { patientId: 101, time: '09:00' },
      '2': { patientId: 999, time: '10:00' },
    }

    mockGet
      .mockResolvedValueOnce({ exists: () => true, val: () => appointments } as any)
      .mockResolvedValueOnce({ exists: () => true, val: () => ({ id: 101, name: 'Ana' }) } as any)
      .mockResolvedValueOnce({ exists: () => false, val: () => null } as any)

    const result = await getAppointments('09/05/2026') as any
    expect(result['1']).toBeDefined()
    expect(result['2']).toBeUndefined()
  })
})
