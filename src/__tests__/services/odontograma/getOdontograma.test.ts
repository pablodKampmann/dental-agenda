import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/firebase', () => ({ db: {} }))
vi.mock('firebase/database', () => ({
  ref: vi.fn(() => 'mock-ref'),
  get: vi.fn(),
}))

import { getOdontograma } from '@/services/odontograma/getOdontograma'
import { get } from 'firebase/database'
import { SCHEMA_VERSION } from '@/lib/odontograma/tipos'

const mockGet = vi.mocked(get)

/** Los 32 códigos FDI permanentes, cuadrantes 1–4 — mismo orden que piezas.ts. */
const CODIGOS_PERMANENTES = [
  18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
  48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
]

describe('getOdontograma', () => {
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
    const result = await getOdontograma('paciente-1', 'clinic-1')
    expect(result).toBeNull()
  })

  it('returns the empty odontogram (not null) when the patient has no node yet', async () => {
    mockGet.mockResolvedValue({ exists: () => false, val: () => null } as any)
    const result = await getOdontograma('paciente-1', 'clinic-1')
    expect(result).toEqual({ dientes: {}, vinculos: {}, meta: null })
  })

  it('regression: 32 loaded teeth come back as an object, not an array with holes', async () => {
    const dientes = Object.fromEntries(
      CODIGOS_PERMANENTES.map((codigo) => [
        `t${codigo}`,
        { diente: { existente: 'corona' } },
      ])
    )
    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => ({ dientes, vinculos: {}, meta: null }),
    } as any)

    const result = await getOdontograma('paciente-1', 'clinic-1')

    expect(Array.isArray(result?.dientes)).toBe(false)
    expect(Object.keys(result!.dientes)).toHaveLength(32)
    expect(result?.dientes.t16).toEqual({ diente: { existente: 'corona' } })
    expect(result?.dientes.t48).toEqual({ diente: { existente: 'corona' } })
  })

  it('returns both layers when a face has existente and requerida loaded', async () => {
    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => ({
        dientes: {
          t16: {
            caras: {
              OCLUSAL_INCISAL: { existente: 'obturacion', requerida: 'caries' },
            },
          },
        },
        vinculos: {},
        meta: null,
      }),
    } as any)

    const result = await getOdontograma('paciente-1', 'clinic-1')

    expect(result?.dientes.t16?.caras?.OCLUSAL_INCISAL).toEqual({
      existente: 'obturacion',
      requerida: 'caries',
    })
  })

  it('returns vinculos indexed by pushId', async () => {
    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => ({
        dientes: {},
        vinculos: {
          '-NabcPushId': { tipo: 'protesis_fija', capa: 'existente', piezas: { t14: true, t15: true } },
        },
        meta: null,
      }),
    } as any)

    const result = await getOdontograma('paciente-1', 'clinic-1')

    expect(result?.vinculos['-NabcPushId']).toEqual({
      tipo: 'protesis_fija',
      capa: 'existente',
      piezas: { t14: true, t15: true },
    })
  })

  it('discards a tooth with an invalid key and keeps the rest', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => ({
        dientes: {
          t16: { diente: { existente: 'corona' } },
          'clave-basura': { diente: { existente: 'corona' } },
        },
        vinculos: {},
        meta: null,
      }),
    } as any)

    const result = await getOdontograma('paciente-1', 'clinic-1')

    expect(Object.keys(result!.dientes)).toEqual(['t16'])
    expect(errorSpy).toHaveBeenCalled()

    errorSpy.mockRestore()
  })

  it('discards a single invalid hallazgo code but keeps the rest of the tooth', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => ({
        dientes: {
          t16: {
            caras: {
              OCLUSAL_INCISAL: { existente: 'codigo-que-no-existe', requerida: 'caries' },
            },
          },
        },
        vinculos: {},
        meta: null,
      }),
    } as any)

    const result = await getOdontograma('paciente-1', 'clinic-1')

    expect(result?.dientes.t16?.caras?.OCLUSAL_INCISAL).toEqual({ requerida: 'caries' })
    expect(errorSpy).toHaveBeenCalled()

    errorSpy.mockRestore()
  })

  it('returns null meta when the raw meta shape is invalid, without discarding dientes', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => ({
        dientes: { t16: { diente: { existente: 'corona' } } },
        vinculos: {},
        meta: { updatedAt: 'no-es-un-numero', updatedBy: 'uid-1', schemaVersion: SCHEMA_VERSION },
      }),
    } as any)

    const result = await getOdontograma('paciente-1', 'clinic-1')

    expect(result?.meta).toBeNull()
    expect(result?.dientes.t16).toBeDefined()
    expect(errorSpy).toHaveBeenCalled()

    errorSpy.mockRestore()
  })

  it('returns a valid meta as-is', async () => {
    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => ({
        dientes: {},
        vinculos: {},
        meta: { updatedAt: 1735689600000, updatedBy: 'uid-1', schemaVersion: SCHEMA_VERSION },
      }),
    } as any)

    const result = await getOdontograma('paciente-1', 'clinic-1')

    expect(result?.meta).toEqual({
      updatedAt: 1735689600000,
      updatedBy: 'uid-1',
      schemaVersion: SCHEMA_VERSION,
    })
  })
})