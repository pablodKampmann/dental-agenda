import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/firebase', () => ({ db: {} }))
vi.mock('firebase/database', () => ({
  ref: vi.fn(() => 'mock-ref'),
  get: vi.fn(),
  query: vi.fn(() => 'mock-query'),
  orderByChild: vi.fn(),
  limitToLast: vi.fn(),
}))

import { getPatients } from '@/services/patients/getPatients'
import { get } from 'firebase/database'

const mockGet = vi.mocked(get)

describe('getPatients', () => {
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
    const result = await getPatients(10, 'clinic-1')
    expect(result).toBeNull()
  })

  it('returns empty list and isFull=false when snapshot is empty', async () => {
    mockGet.mockResolvedValue({ exists: () => false, val: () => null } as any)
    const result = await getPatients(10, 'clinic-1')
    expect(result).toEqual({ patients: [], isFull: false })
  })

  it('returns patients in descending timestamp order (newest first)', async () => {
    const mockData = {
      '1': { id: 1, name: 'Alice', timestamp: 1000 },
      '2': { id: 2, name: 'Bob', timestamp: 2000 },
      '3': { id: 3, name: 'Charlie', timestamp: 3000 },
    }
    mockGet.mockResolvedValue({ exists: () => true, val: () => mockData } as any)

    const result = await getPatients(10, 'clinic-1')
    expect(result?.patients[0].name).toBe('Charlie')
    expect(result?.patients[1].name).toBe('Bob')
    expect(result?.patients[2].name).toBe('Alice')
  })

  it('sets isFull=true when DB has fewer patients than requested quantity', async () => {
    const mockData = {
      '1': { id: 1, timestamp: 1000 },
      '2': { id: 2, timestamp: 2000 },
    }
    mockGet.mockResolvedValue({ exists: () => true, val: () => mockData } as any)

    const result = await getPatients(10, 'clinic-1')
    expect(result?.isFull).toBe(true)
  })

  it('sets isFull=false when returned count equals requested quantity', async () => {
    const mockData = Object.fromEntries(
      Array.from({ length: 5 }, (_, i) => [
        String(i + 1),
        { id: i + 1, timestamp: i * 1000 },
      ])
    )
    mockGet.mockResolvedValue({ exists: () => true, val: () => mockData } as any)

    const result = await getPatients(5, 'clinic-1')
    expect(result?.isFull).toBe(false)
  })
})
