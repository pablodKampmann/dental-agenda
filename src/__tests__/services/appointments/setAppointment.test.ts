import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/firebase', () => ({ db: {} }))
vi.mock('@/app/page', () => ({}))
vi.mock('firebase/database', () => ({
  ref: vi.fn(() => 'mock-ref'),
  get: vi.fn(),
  set: vi.fn(),
  push: vi.fn(),
}))
vi.mock('@/services/auth/getUser', () => ({
  getUser: vi.fn().mockResolvedValue('clinic-123'),
}))

import { setAppointment } from '@/services/appointments/setAppointment'
import { get, set, push } from 'firebase/database'

const mockGet = vi.mocked(get)
const mockSet = vi.mocked(set)
const mockPush = vi.mocked(push)

const baseDate = {
  date: '09/05/2026',
  dayComplete: 'Sábado 9 de mayo',
  year: 2026,
  time: '09:00',
}

describe('setAppointment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSet.mockResolvedValue(undefined)
    mockPush.mockResolvedValue(undefined as any)
    Object.defineProperty(global.navigator, 'onLine', {
      value: true,
      configurable: true,
    })
  })

  it('does not call set when offline', async () => {
    Object.defineProperty(global.navigator, 'onLine', {
      value: false,
      configurable: true,
    })
    await setAppointment(1, baseDate)
    expect(mockSet).not.toHaveBeenCalled()
  })

  it('assigns id=1 when no appointments exist for the date', async () => {
    mockGet.mockResolvedValue({ val: () => null } as any)

    await setAppointment(42, baseDate)

    const savedData = mockSet.mock.calls[0][1] as any
    expect(savedData.id).toBe(1)
    expect(savedData.patientId).toBe(42)
  })

  it('assigns id = max existing id + 1', async () => {
    mockGet.mockResolvedValue({ val: () => ({ '1': {}, '3': {}, '5': {} }) } as any)

    await setAppointment(42, baseDate)

    const savedData = mockSet.mock.calls[0][1] as any
    expect(savedData.id).toBe(6)
  })

  it('does not include undefined optional time slots', async () => {
    mockGet.mockResolvedValue({ val: () => null } as any)

    await setAppointment(42, baseDate)

    const savedData = mockSet.mock.calls[0][1] as any
    expect(savedData).not.toHaveProperty('time2')
    expect(savedData).not.toHaveProperty('time3')
    expect(savedData).not.toHaveProperty('time4')
  })

  it('includes multi-slot times when provided', async () => {
    mockGet.mockResolvedValue({ val: () => null } as any)

    await setAppointment(42, { ...baseDate, time2: '09:30', time3: '10:00' })

    const savedData = mockSet.mock.calls[0][1] as any
    expect(savedData.time2).toBe('09:30')
    expect(savedData.time3).toBe('10:00')
    expect(savedData).not.toHaveProperty('time4')
  })
})
