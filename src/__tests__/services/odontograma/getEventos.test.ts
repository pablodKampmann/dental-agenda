import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/firebase', () => ({ db: {} }))
vi.mock('firebase/database', () => ({
  ref: vi.fn(() => 'mock-ref'),
  get: vi.fn(),
  query: vi.fn(() => 'mock-query'),
  orderByKey: vi.fn(),
  limitToLast: vi.fn(),
}))

import { getEventos, LIMITE_EVENTOS_POR_DEFECTO } from '@/services/odontograma/getEventos'
import { get, ref, limitToLast } from 'firebase/database'

const mockGet = vi.mocked(get)
const mockRef = vi.mocked(ref)
const mockLimitToLast = vi.mocked(limitToLast)

type NodoCrudo = Record<string, unknown>

/** Simula un DataSnapshot que recorre sus hijos en el orden en que se pasan los datos. */
function snapshotDe(entradas: Array<[string, NodoCrudo]>) {
  return {
    exists: () => entradas.length > 0,
    forEach: (callback: (child: { key: string; val: () => NodoCrudo }) => void) => {
      for (const [key, val] of entradas) {
        callback({ key, val: () => val })
      }
    },
  }
}

const EVENTO_CARA_BASE: NodoCrudo = {
  ts: 1000,
  uid: 'uid-1',
  alcance: 'CARA',
  capa: 'requerida',
  diente: 't16',
  cara: 'OCLUSAL_INCISAL',
  de: undefined,
  a: 'caries',
}

describe('getEventos', () => {
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
    const result = await getEventos('paciente-1', 'clinic-1')
    expect(result).toBeNull()
  })

  it('returns an empty array when there is no history yet', async () => {
    mockGet.mockResolvedValue(snapshotDe([]) as any)
    const result = await getEventos('paciente-1', 'clinic-1')
    expect(result).toEqual([])
  })

  it('reads the eventos node, never actual', async () => {
    mockGet.mockResolvedValue(snapshotDe([]) as any)
    await getEventos('paciente-1', 'clinic-1')
    expect(mockRef).toHaveBeenCalledWith({}, '/clinics/clinic-1/odontogramas/paciente-1/eventos')
  })

  it('defaults the limit to 50', async () => {
    mockGet.mockResolvedValue(snapshotDe([]) as any)
    await getEventos('paciente-1', 'clinic-1')
    expect(mockLimitToLast).toHaveBeenCalledWith(LIMITE_EVENTOS_POR_DEFECTO)
  })

  it('honors an explicit limit', async () => {
    mockGet.mockResolvedValue(snapshotDe([]) as any)
    await getEventos('paciente-1', 'clinic-1', 10)
    expect(mockLimitToLast).toHaveBeenCalledWith(10)
  })

  it('falls back to the default limit on an invalid limite (0) instead of failing the read', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockGet.mockResolvedValue(snapshotDe([]) as any)

    const result = await getEventos('paciente-1', 'clinic-1', 0)

    expect(mockLimitToLast).toHaveBeenCalledWith(LIMITE_EVENTOS_POR_DEFECTO)
    expect(result).toEqual([]) // no null: un límite inválido no es un fallo de lectura
    expect(errorSpy).toHaveBeenCalled()

    errorSpy.mockRestore()
  })

  it('falls back to the default limit on a negative or non-integer limite', async () => {
    mockGet.mockResolvedValue(snapshotDe([]) as any)
    vi.spyOn(console, 'error').mockImplementation(() => {})

    await getEventos('paciente-1', 'clinic-1', -5)
    expect(mockLimitToLast).toHaveBeenLastCalledWith(LIMITE_EVENTOS_POR_DEFECTO)

    await getEventos('paciente-1', 'clinic-1', 2.5)
    expect(mockLimitToLast).toHaveBeenLastCalledWith(LIMITE_EVENTOS_POR_DEFECTO)

    vi.mocked(console.error).mockRestore()
  })

  it('returns events in reverse chronological order (newest first)', async () => {
    mockGet.mockResolvedValue(
      snapshotDe([
        ['-Nold', { ...EVENTO_CARA_BASE, ts: 1000 }],
        ['-Nmid', { ...EVENTO_CARA_BASE, ts: 2000 }],
        ['-Nnew', { ...EVENTO_CARA_BASE, ts: 3000 }],
      ]) as any
    )

    const result = await getEventos('paciente-1', 'clinic-1')

    expect(result?.map((e) => e.id)).toEqual(['-Nnew', '-Nmid', '-Nold'])
  })

  it('validates a CARA event and normalizes the missing "de" leaf to null', async () => {
    mockGet.mockResolvedValue(snapshotDe([['-N1', EVENTO_CARA_BASE]]) as any)

    const result = await getEventos('paciente-1', 'clinic-1')

    expect(result).toEqual([
      {
        id: '-N1',
        ts: 1000,
        uid: 'uid-1',
        alcance: 'CARA',
        capa: 'requerida',
        diente: 't16',
        cara: 'OCLUSAL_INCISAL',
        piezas: null,
        de: null,
        a: 'caries',
      },
    ])
  })

  it('validates a DIENTE event without a cara field', async () => {
    mockGet.mockResolvedValue(
      snapshotDe([
        [
          '-N1',
          { ts: 1000, uid: 'uid-1', alcance: 'DIENTE', capa: 'existente', diente: 't16', a: 'corona' },
        ],
      ]) as any
    )

    const result = await getEventos('paciente-1', 'clinic-1')

    expect(result).toEqual([
      {
        id: '-N1',
        ts: 1000,
        uid: 'uid-1',
        alcance: 'DIENTE',
        capa: 'existente',
        diente: 't16',
        cara: null,
        piezas: null,
        de: null,
        a: 'corona',
      },
    ])
  })

  it('validates a MULTI event with piezas instead of diente', async () => {
    mockGet.mockResolvedValue(
      snapshotDe([
        [
          '-N1',
          {
            ts: 1000,
            uid: 'uid-1',
            alcance: 'MULTI',
            capa: 'existente',
            piezas: { t45: true, t46: true, t47: true },
            a: 'protesis_fija',
          },
        ],
      ]) as any
    )

    const result = await getEventos('paciente-1', 'clinic-1')

    expect(result?.[0]).toEqual({
      id: '-N1',
      ts: 1000,
      uid: 'uid-1',
      alcance: 'MULTI',
      capa: 'existente',
      diente: null,
      cara: null,
      piezas: { t45: true, t46: true, t47: true },
      de: null,
      a: 'protesis_fija',
    })
  })

  it('discards a CARA event missing "cara" and keeps the rest of the history', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    mockGet.mockResolvedValue(
      snapshotDe([
        ['-Nbad', { ts: 1000, uid: 'uid-1', alcance: 'CARA', capa: 'requerida', diente: 't16', a: 'caries' }],
        ['-Nok', { ...EVENTO_CARA_BASE, ts: 2000 }],
      ]) as any
    )

    const result = await getEventos('paciente-1', 'clinic-1')

    expect(result?.map((e) => e.id)).toEqual(['-Nok'])
    expect(errorSpy).toHaveBeenCalled()

    errorSpy.mockRestore()
  })

  it('discards a DIENTE event whose "diente" is not a valid pieza key', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    mockGet.mockResolvedValue(
      snapshotDe([
        [
          '-Nbad',
          { ts: 1000, uid: 'uid-1', alcance: 'DIENTE', capa: 'existente', diente: 'clave-basura', a: 'corona' },
        ],
      ]) as any
    )

    const result = await getEventos('paciente-1', 'clinic-1')

    expect(result).toEqual([])
    expect(errorSpy).toHaveBeenCalled()

    errorSpy.mockRestore()
  })

  it('discards a MULTI event without any valid piezas', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    mockGet.mockResolvedValue(
      snapshotDe([
        [
          '-Nbad',
          { ts: 1000, uid: 'uid-1', alcance: 'MULTI', capa: 'existente', piezas: {}, a: 'protesis_fija' },
        ],
      ]) as any
    )

    const result = await getEventos('paciente-1', 'clinic-1')

    expect(result).toEqual([])
    expect(errorSpy).toHaveBeenCalled()

    errorSpy.mockRestore()
  })

  it('discards a MULTI event with a mix of valid and invalid piezas entirely, keeping the rest of the history', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    mockGet.mockResolvedValue(
      snapshotDe([
        [
          '-Nbad',
          {
            ts: 1000,
            uid: 'uid-1',
            alcance: 'MULTI',
            capa: 'existente',
            piezas: { t45: true, t46: true, 'clave-basura': true },
            a: 'protesis_fija',
          },
        ],
        [
          '-Nok',
          {
            ts: 2000,
            uid: 'uid-1',
            alcance: 'MULTI',
            capa: 'existente',
            piezas: { t45: true, t46: true, t47: true },
            a: 'protesis_fija',
          },
        ],
      ]) as any
    )

    const result = await getEventos('paciente-1', 'clinic-1')

    // Angostar el tramo a las dos piezas válidas haría que el asiento diga que el
    // puente abarcaba menos piezas de las que realmente abarcó — se descarta entero.
    expect(result?.map((e) => e.id)).toEqual(['-Nok'])
    expect(errorSpy).toHaveBeenCalled()

    errorSpy.mockRestore()
  })

  it('discards an event with an invalid alcance', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    mockGet.mockResolvedValue(
      snapshotDe([['-Nbad', { ts: 1000, uid: 'uid-1', alcance: 'OTRA', capa: 'existente', diente: 't16' }]]) as any
    )

    const result = await getEventos('paciente-1', 'clinic-1')

    expect(result).toEqual([])
    expect(errorSpy).toHaveBeenCalled()

    errorSpy.mockRestore()
  })

  it('discards an event whose "a" code does not belong to its alcance', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    mockGet.mockResolvedValue(
      snapshotDe([['-Nbad', { ...EVENTO_CARA_BASE, a: 'corona' }]]) as any
    )

    const result = await getEventos('paciente-1', 'clinic-1')

    expect(result).toEqual([])
    expect(errorSpy).toHaveBeenCalled()

    errorSpy.mockRestore()
  })
})
