import { describe, it, expect, vi, beforeEach } from 'vitest'
import { caraSemantica } from '@/lib/odontograma/caras'

vi.mock('@/lib/firebase', () => ({ db: {} }))

let pushCounter = 0
vi.mock('firebase/database', () => ({
  ref: vi.fn((_db, path) => path ?? 'mock-ref'),
  child: vi.fn((_db, path) => path),
  update: vi.fn(),
  push: vi.fn(() => ({ key: `evento-${++pushCounter}` })),
  serverTimestamp: vi.fn(() => ({ '.sv': 'timestamp' })),
}))

import {
  setHallazgoCara,
  setHallazgoDiente,
  ejecutarHallazgoCaraRequerida,
  ejecutarHallazgoDienteRequerido,
} from '@/services/odontograma/setHallazgo'
import { removeHallazgo } from '@/services/odontograma/removeHallazgo'
import { update } from 'firebase/database'
import { SCHEMA_VERSION } from '@/lib/odontograma/tipos'

const mockUpdate = vi.mocked(update)

/**
 * Nadie escribe una cara a mano fuera del dominio (regla del propio proyecto,
 * ver caras.test.ts) -- asi que las caras de prueba salen de caraSemantica(),
 * no de un literal tipeado aca. 'center' es invariante de cuadrante; el
 * segundo valor sale de una posicion lateral en un cuadrante concreto.
 */
const CARA_CENTRO_T16 = caraSemantica('center', 1)
const CARA_LATERAL_T26 = caraSemantica('left', 2)

describe('setHallazgo / removeHallazgo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    pushCounter = 0
    Object.defineProperty(global.navigator, 'onLine', {
      value: true,
      configurable: true,
    })
  })

  it('returns null when offline and never calls update', async () => {
    Object.defineProperty(global.navigator, 'onLine', {
      value: false,
      configurable: true,
    })
    const result = await setHallazgoCara({
      clinicId: 'clinic-1',
      pacienteId: 'paciente-1',
      pieza: 't16',
      cara: CARA_CENTRO_T16,
      capa: 'requerida',
      codigo: 'caries',
      de: null,
      uid: 'uid-1',
    })
    expect(result).toBeNull()
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('setHallazgoCara writes the leaf, meta, and one event in a single update()', async () => {
    mockUpdate.mockResolvedValue(undefined)

    const result = await setHallazgoCara({
      clinicId: 'clinic-1',
      pacienteId: 'paciente-1',
      pieza: 't16',
      cara: CARA_CENTRO_T16,
      capa: 'requerida',
      codigo: 'caries',
      de: null,
      uid: 'uid-1',
    })

    expect(result).toBe(true)
    expect(mockUpdate).toHaveBeenCalledTimes(1)

    const [, payload] = mockUpdate.mock.calls[0]
    const base = '/clinics/clinic-1/odontogramas/paciente-1'

    expect(payload[`${base}/actual/dientes/t16/caras/${CARA_CENTRO_T16}/requerida`]).toBe('caries')
    expect(payload[`${base}/actual/meta/updatedAt`]).toEqual({ '.sv': 'timestamp' })
    expect(payload[`${base}/actual/meta/updatedBy`]).toBe('uid-1')
    expect(payload[`${base}/actual/meta/schemaVersion`]).toBe(SCHEMA_VERSION)

    const eventoKey = Object.keys(payload).find((k) => k.includes('/eventos/'))!
    const evento = payload[eventoKey] as any
    expect(evento).toMatchObject({
      uid: 'uid-1',
      alcance: 'CARA',
      capa: 'requerida',
      diente: 't16',
      cara: CARA_CENTRO_T16,
      piezas: null,
      de: null,
      a: 'caries',
    })
    expect(evento.ts).toEqual({ '.sv': 'timestamp' })
  })

  it('setHallazgoCara on requerida does not touch the existente leaf (different path)', async () => {
    mockUpdate.mockResolvedValue(undefined)
    await setHallazgoCara({
      clinicId: 'clinic-1',
      pacienteId: 'paciente-1',
      pieza: 't16',
      cara: CARA_CENTRO_T16,
      capa: 'requerida',
      codigo: 'caries',
      de: null,
      uid: 'uid-1',
    })

    const [, payload] = mockUpdate.mock.calls[0]
    const base = '/clinics/clinic-1/odontogramas/paciente-1'
    expect(payload[`${base}/actual/dientes/t16/caras/${CARA_CENTRO_T16}/existente`]).toBeUndefined()
  })

  it('setHallazgoDiente writes to diente/{capa}, not caras/', async () => {
    mockUpdate.mockResolvedValue(undefined)
    await setHallazgoDiente({
      clinicId: 'clinic-1',
      pacienteId: 'paciente-1',
      pieza: 't11',
      capa: 'existente',
      codigo: 'corona',
      de: null,
      uid: 'uid-1',
    })

    const [, payload] = mockUpdate.mock.calls[0]
    const base = '/clinics/clinic-1/odontogramas/paciente-1'
    expect(payload[`${base}/actual/dientes/t11/diente/existente`]).toBe('corona')

    const eventoKey = Object.keys(payload).find((k) => k.includes('/eventos/'))!
    expect(payload[eventoKey]).toMatchObject({
      alcance: 'DIENTE',
      cara: null,
      diente: 't11',
      de: null,
      a: 'corona',
    })
  })

  it('ejecutarHallazgoCaraRequerida clears requerida, sets existente, and writes two events', async () => {
    mockUpdate.mockResolvedValue(undefined)

    const result = await ejecutarHallazgoCaraRequerida({
      clinicId: 'clinic-1',
      pacienteId: 'paciente-1',
      pieza: 't26',
      cara: CARA_LATERAL_T26,
      hallazgoRequerido: 'caries',
      hallazgoResultante: 'obturacion',
      existenteAnterior: null,
      uid: 'uid-1',
    })

    expect(result).toBe(true)
    expect(mockUpdate).toHaveBeenCalledTimes(1)

    const [, payload] = mockUpdate.mock.calls[0]
    const base = '/clinics/clinic-1/odontogramas/paciente-1'

    expect(payload[`${base}/actual/dientes/t26/caras/${CARA_LATERAL_T26}/requerida`]).toBeNull()
    expect(payload[`${base}/actual/dientes/t26/caras/${CARA_LATERAL_T26}/existente`]).toBe('obturacion')

    const eventoKeys = Object.keys(payload).filter((k) => k.includes('/eventos/'))
    expect(eventoKeys).toHaveLength(2)

    const eventos = eventoKeys.map((k) => payload[k] as any)
    const eventoRequerida = eventos.find((e) => e.capa === 'requerida')
    const eventoExistente = eventos.find((e) => e.capa === 'existente')

    expect(eventoRequerida).toMatchObject({ de: 'caries', a: null, cara: CARA_LATERAL_T26, diente: 't26' })
    expect(eventoExistente).toMatchObject({ de: null, a: 'obturacion', cara: CARA_LATERAL_T26, diente: 't26' })
  })

  it('ejecutarHallazgoDienteRequerido works the same way for alcance DIENTE', async () => {
    mockUpdate.mockResolvedValue(undefined)

    await ejecutarHallazgoDienteRequerido({
      clinicId: 'clinic-1',
      pacienteId: 'paciente-1',
      pieza: 't18',
      hallazgoRequerido: 'extraccion',
      hallazgoResultante: 'ausente',
      existenteAnterior: null,
      uid: 'uid-1',
    })

    const [, payload] = mockUpdate.mock.calls[0]
    const base = '/clinics/clinic-1/odontogramas/paciente-1'

    expect(payload[`${base}/actual/dientes/t18/diente/requerida`]).toBeNull()
    expect(payload[`${base}/actual/dientes/t18/diente/existente`]).toBe('ausente')

    const eventoKeys = Object.keys(payload).filter((k) => k.includes('/eventos/'))
    expect(eventoKeys).toHaveLength(2)
    const eventos = eventoKeys.map((k) => payload[k] as any)
    expect(eventos.every((e) => e.alcance === 'DIENTE' && e.cara === null)).toBe(true)
  })

  it('removeHallazgo (CARA) writes null to the leaf and an event with a: null, keeping the previous event untouched', async () => {
    mockUpdate.mockResolvedValue(undefined)

    const result = await removeHallazgo({
      alcance: 'CARA',
      clinicId: 'clinic-1',
      pacienteId: 'paciente-1',
      pieza: 't16',
      cara: CARA_CENTRO_T16,
      capa: 'existente',
      de: 'obturacion',
      uid: 'uid-1',
    })

    expect(result).toBe(true)
    const [, payload] = mockUpdate.mock.calls[0]
    const base = '/clinics/clinic-1/odontogramas/paciente-1'

    expect(payload[`${base}/actual/dientes/t16/caras/${CARA_CENTRO_T16}/existente`]).toBeNull()

    const eventoKey = Object.keys(payload).find((k) => k.includes('/eventos/'))!
    expect(payload[eventoKey]).toMatchObject({ de: 'obturacion', a: null, capa: 'existente' })

    // No debería tocar ninguna key que empiece igual pero sea un evento viejo:
    // este test solo escribe UN evento nuevo, la inmutabilidad del resto la
    // garantizan las Security Rules de B2-1, no este service.
    const eventoKeys = Object.keys(payload).filter((k) => k.includes('/eventos/'))
    expect(eventoKeys).toHaveLength(1)
  })

  it('removeHallazgo (DIENTE) writes to diente/{capa}', async () => {
    mockUpdate.mockResolvedValue(undefined)

    await removeHallazgo({
      alcance: 'DIENTE',
      clinicId: 'clinic-1',
      pacienteId: 'paciente-1',
      pieza: 't11',
      capa: 'existente',
      de: 'corona',
      uid: 'uid-1',
    })

    const [, payload] = mockUpdate.mock.calls[0]
    const base = '/clinics/clinic-1/odontogramas/paciente-1'
    expect(payload[`${base}/actual/dientes/t11/diente/existente`]).toBeNull()

    const eventoKey = Object.keys(payload).find((k) => k.includes('/eventos/'))!
    expect(payload[eventoKey]).toMatchObject({ alcance: 'DIENTE', cara: null, de: 'corona', a: null })
  })

  it('returns null and logs when update() rejects', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockUpdate.mockRejectedValue(new Error('network down'))

    const result = await setHallazgoCara({
      clinicId: 'clinic-1',
      pacienteId: 'paciente-1',
      pieza: 't16',
      cara: CARA_CENTRO_T16,
      capa: 'requerida',
      codigo: 'caries',
      de: null,
      uid: 'uid-1',
    })

    expect(result).toBeNull()
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })
})
