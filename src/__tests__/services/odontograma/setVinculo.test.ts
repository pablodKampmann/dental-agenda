import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/firebase', () => ({ db: {} }))

let pushCounter = 0
vi.mock('firebase/database', () => ({
  ref: vi.fn((_db, path) => path ?? 'mock-ref'),
  child: vi.fn((_db, path) => path),
  update: vi.fn(),
  push: vi.fn(() => ({ key: `id-${++pushCounter}` })),
  serverTimestamp: vi.fn(() => ({ '.sv': 'timestamp' })),
}))

import { setVinculo, validarTramo } from '@/services/odontograma/setVinculo'
import { removeVinculo } from '@/services/odontograma/removeVinculo'
import { update } from 'firebase/database'
import { SCHEMA_VERSION } from '@/lib/odontograma/tipos'

const mockUpdate = vi.mocked(update)

describe('validarTramo', () => {
  it('rejects a single tooth', () => {
    const resultado = validarTramo(['t16'])
    expect(resultado).toEqual({ ok: false, error: expect.any(String) })
  })

  it('rejects a repeated tooth', () => {
    const resultado = validarTramo(['t16', 't16'])
    expect(resultado.ok).toBe(false)
  })

  it('rejects teeth from different arcadas', () => {
    // t16 (superior, cuadrante 1) + t46 (inferior, cuadrante 4)
    const resultado = validarTramo(['t16', 't46'])
    expect(resultado.ok).toBe(false)
  })

  it('rejects teeth from different denticiones even in the same arcada', () => {
    // t16 (permanente, fila 1) + t55 (temporaria, fila 3) — ambas SUPERIOR
    const resultado = validarTramo(['t16', 't55'])
    expect(resultado.ok).toBe(false)
  })

  it('rejects non-contiguous teeth (gap in ordenVisual)', () => {
    // fila 1: ...18,17,16,15,14... — t16 y t14 saltean t15
    const resultado = validarTramo(['t16', 't14'])
    expect(resultado.ok).toBe(false)
  })

  it('accepts contiguous teeth in the same arcada and fila', () => {
    // fila 1: 18,17,16,15,14 — t16,t15,t14 son contiguos
    const resultado = validarTramo(['t16', 't15', 't14'])
    expect(resultado).toEqual({ ok: true })
  })

  it('accepts contiguous teeth regardless of the order passed in', () => {
    const resultado = validarTramo(['t14', 't16', 't15'])
    expect(resultado).toEqual({ ok: true })
  })
})

describe('setVinculo / removeVinculo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    pushCounter = 0
    Object.defineProperty(global.navigator, 'onLine', {
      value: true,
      configurable: true,
    })
  })

  it('returns a validation error (not null, not a throw) for an invalid tramo, and never calls update', async () => {
    const resultado = await setVinculo({
      clinicId: 'clinic-1',
      pacienteId: 'paciente-1',
      tipo: 'protesis_fija',
      capa: 'existente',
      piezas: ['t16'],
      uid: 'uid-1',
    })

    expect(resultado).toEqual({ ok: false, error: expect.any(String) })
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('rejects protesis_fija over a temporary tramo (B4-1), even though the tramo itself is geometrically valid', async () => {
    // t54, t55 — contiguas, misma arcada y fila: pasan validarTramo. El rechazo es
    // por dentición, no por geometría.
    const resultado = await setVinculo({
      clinicId: 'clinic-1',
      pacienteId: 'paciente-1',
      tipo: 'protesis_fija',
      capa: 'existente',
      piezas: ['t54', 't55'],
      uid: 'uid-1',
    })

    expect(resultado).toEqual({ ok: false, error: expect.any(String) })
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('accepts protesis_removible over a temporary tramo', async () => {
    mockUpdate.mockResolvedValue(undefined)
    const resultado = await setVinculo({
      clinicId: 'clinic-1',
      pacienteId: 'paciente-1',
      tipo: 'protesis_removible',
      capa: 'existente',
      piezas: ['t54', 't55'],
      uid: 'uid-1',
    })

    expect(resultado).toEqual({ ok: true, vinculoId: expect.any(String) })
  })

  it('returns null when offline (technical failure, not validation)', async () => {
    Object.defineProperty(global.navigator, 'onLine', {
      value: false,
      configurable: true,
    })
    const resultado = await setVinculo({
      clinicId: 'clinic-1',
      pacienteId: 'paciente-1',
      tipo: 'protesis_fija',
      capa: 'existente',
      piezas: ['t16', 't15'],
      uid: 'uid-1',
    })
    expect(resultado).toBeNull()
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('writes the vinculo, meta, and one event with the full tramo in piezas', async () => {
    mockUpdate.mockResolvedValue(undefined)

    const resultado = await setVinculo({
      clinicId: 'clinic-1',
      pacienteId: 'paciente-1',
      tipo: 'protesis_fija',
      capa: 'existente',
      piezas: ['t16', 't15', 't14'],
      uid: 'uid-1',
    })

    expect(resultado).toEqual({ ok: true, vinculoId: expect.any(String) })
    expect(mockUpdate).toHaveBeenCalledTimes(1)

    const [, payload] = mockUpdate.mock.calls[0]
    const base = '/clinics/clinic-1/odontogramas/paciente-1'
    const vinculoId = (resultado as { ok: true; vinculoId: string }).vinculoId

    const vinculo = payload[`${base}/actual/vinculos/${vinculoId}`] as any
    expect(vinculo).toEqual({
      tipo: 'protesis_fija',
      capa: 'existente',
      piezas: { t16: true, t15: true, t14: true },
    })

    expect(payload[`${base}/actual/meta/schemaVersion`]).toBe(SCHEMA_VERSION)

    const eventoKey = Object.keys(payload).find((k) => k.includes('/eventos/'))!
    const evento = payload[eventoKey] as any
    expect(evento).toMatchObject({
      alcance: 'MULTI',
      diente: null,
      cara: null,
      de: null,
      a: 'protesis_fija',
      piezas: { t16: true, t15: true, t14: true },
    })
  })

  it('removeVinculo writes null to the vinculo leaf and an event with the full tramo and a: null', async () => {
    mockUpdate.mockResolvedValue(undefined)

    const resultado = await removeVinculo({
      clinicId: 'clinic-1',
      pacienteId: 'paciente-1',
      vinculoId: 'id-abc',
      tipo: 'protesis_removible',
      capa: 'existente',
      piezas: { t16: true, t15: true },
      uid: 'uid-1',
    })

    expect(resultado).toBe(true)
    const [, payload] = mockUpdate.mock.calls[0]
    const base = '/clinics/clinic-1/odontogramas/paciente-1'

    expect(payload[`${base}/actual/vinculos/id-abc`]).toBeNull()
    expect(payload[`${base}/actual/meta/updatedAt`]).toEqual({ '.sv': 'timestamp' })
    expect(payload[`${base}/actual/meta/updatedBy`]).toBe('uid-1')
    expect(payload[`${base}/actual/meta/schemaVersion`]).toBe(SCHEMA_VERSION)

    const eventoKey = Object.keys(payload).find((k) => k.includes('/eventos/'))!
    expect(payload[eventoKey]).toMatchObject({
      alcance: 'MULTI',
      de: 'protesis_removible',
      a: null,
      piezas: { t16: true, t15: true },
    })

    // Mismo criterio que removeHallazgo: un solo evento nuevo en el payload, sin
    // tocar ninguna key de un evento anterior.
    const eventoKeys = Object.keys(payload).filter((k) => k.includes('/eventos/'))
    expect(eventoKeys).toHaveLength(1)
  })

  it('a later removeVinculo does not wipe out the event written by setVinculo (simulated multi-write store)', async () => {
    // Mismo motivo que en setHallazgo.test.ts: el mock de `update()` de arriba no
    // simula que solo se tocan las keys recibidas, así que se arma un store en
    // memoria que sí lo hace, para probar la invariante entre dos escrituras reales.
    //
    // Esto prueba que EL SERVICE no arma un payload que pise un evento anterior.
    // No prueba (ni puede probar, mockeando Firebase) la inmutabilidad del log
    // frente a otro cliente -- esa garantía es de las Security Rules (B2-1),
    // verificadas a mano hasta que exista el emulador, no de este test.
    const store: Record<string, unknown> = {}
    const applyUpdate = (payload: Record<string, unknown>) => {
      for (const [path, value] of Object.entries(payload)) {
        const segments = path.split('/').filter(Boolean)
        let node = store as Record<string, unknown>
        for (let i = 0; i < segments.length - 1; i++) {
          const seg = segments[i]
          if (typeof node[seg] !== 'object' || node[seg] === null) node[seg] = {}
          node = node[seg] as Record<string, unknown>
        }
        const last = segments[segments.length - 1]
        if (value === null) delete node[last]
        else node[last] = value
      }
    }
    mockUpdate.mockImplementation(async (_ref: unknown, payload: Record<string, unknown>) => {
      applyUpdate(payload)
    })

    const alta = await setVinculo({
      clinicId: 'clinic-1',
      pacienteId: 'paciente-1',
      tipo: 'protesis_fija',
      capa: 'existente',
      piezas: ['t16', 't15'],
      uid: 'uid-1',
    })
    const vinculoId = (alta as { ok: true; vinculoId: string }).vinculoId

    await removeVinculo({
      clinicId: 'clinic-1',
      pacienteId: 'paciente-1',
      vinculoId,
      tipo: 'protesis_fija',
      capa: 'existente',
      piezas: { t16: true, t15: true },
      uid: 'uid-1',
    })

    const eventos = (store as any).clinics['clinic-1'].odontogramas['paciente-1'].eventos as Record<string, any>
    const eventosList = Object.values(eventos)

    expect(eventosList).toHaveLength(2)
    expect(eventosList).toContainEqual(expect.objectContaining({ de: null, a: 'protesis_fija' }))
    expect(eventosList).toContainEqual(expect.objectContaining({ de: 'protesis_fija', a: null }))
  })

  it('removeVinculo returns null when offline', async () => {
    Object.defineProperty(global.navigator, 'onLine', {
      value: false,
      configurable: true,
    })
    const resultado = await removeVinculo({
      clinicId: 'clinic-1',
      pacienteId: 'paciente-1',
      vinculoId: 'id-abc',
      tipo: 'protesis_fija',
      capa: 'existente',
      piezas: { t16: true, t15: true },
      uid: 'uid-1',
    })
    expect(resultado).toBeNull()
    expect(mockUpdate).not.toHaveBeenCalled()
  })
})
