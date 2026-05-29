import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/firebase', () => ({ db: {} }))
vi.mock('firebase/database', () => ({
  ref: vi.fn(() => 'mock-ref'),
  get: vi.fn(),
  query: vi.fn(() => 'mock-query'),
  orderByChild: vi.fn(),
  startAt: vi.fn(),
  endAt: vi.fn(),
}))

import { SearchPatient } from '@/services/patients/searchPatient'
import { get } from 'firebase/database'

const mockGet = vi.mocked(get)

describe('SearchPatient', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns empty array when no matches found', async () => {
    mockGet.mockResolvedValue({ exists: () => false, val: () => null } as any)
    const result = await SearchPatient('name', 'xyz', 'clinic-1')
    expect(result).toHaveLength(0)
  })

  it('deduplicates patients that appear across multiple name queries', async () => {
    const alice = { id: 1, name: 'Alice', lastName: 'Smith' }
    const snapshot = { exists: () => true, val: () => ({ '1': alice }) }
    // All 4 name queries return the same patient
    mockGet.mockResolvedValue(snapshot as any)

    const result = await SearchPatient('name', 'alice', 'clinic-1')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(alice)
  })

  it('returns multiple distinct patients from name search', async () => {
    const alice = { id: 1, name: 'Alice' }
    const alan = { id: 2, name: 'Alan' }
    mockGet
      .mockResolvedValueOnce({ exists: () => true, val: () => ({ '1': alice }) } as any)
      .mockResolvedValueOnce({ exists: () => false, val: () => null } as any)
      .mockResolvedValueOnce({ exists: () => true, val: () => ({ '2': alan }) } as any)
      .mockResolvedValueOnce({ exists: () => false, val: () => null } as any)

    const result = await SearchPatient('name', 'al', 'clinic-1')
    expect(result).toHaveLength(2)
  })

  it('searches by DNI and returns matching patient', async () => {
    const patient = { id: 5, name: 'Juan', dni: '12345678' }
    mockGet.mockResolvedValue({ exists: () => true, val: () => ({ '5': patient }) } as any)

    const result = await SearchPatient('dni', '12345678', 'clinic-1')
    expect(result[0]).toEqual(patient)
  })
})
