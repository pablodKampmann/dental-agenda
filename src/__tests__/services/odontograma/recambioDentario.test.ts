import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/firebase', () => ({ db: {} }))

let pushCounter = 0
vi.mock('firebase/database', () => ({
  ref: vi.fn((_db, path) => path ?? 'mock-ref'),
  child: vi.fn((_db, path) => path),
  update: vi.fn(),
  push: vi.fn(() => ({ key: `evento-${++pushCounter}` })),
  serverTimestamp: vi.fn(() => ({ '.sv': 'timestamp' })),
}))

import { setHallazgoDiente } from '@/services/odontograma/setHallazgo'
import { removeHallazgo } from '@/services/odontograma/removeHallazgo'
import { update } from 'firebase/database'

const mockUpdate = vi.mocked(update)

/**
 * B4-2 — Exfoliación y erupción. No hay código nuevo: el modelo ya soporta el
 * recambio porque `t55` y `t15` son posiciones independientes en `dientes/`. Lo
 * que este test fija es la tentación obvia que describe el issue — «la 55 se
 * transforma en la 15» — para que nadie la implemente así por accidente y se
 * pierda la historia del diente de leche.
 *
 * El recambio son SIEMPRE dos operaciones sobre dos piezas distintas: la 55
 * pasa a `ausente` (se cayó) y, si la 15 estaba marcada `retenida`, se le
 * borra ese hallazgo (erupcionó). No existe ni debería existir una función
 * que "mueva" un hallazgo de una clave a otra.
 */
describe('Recambio dentario (B4-2): la 55 se cae, la 15 erupciona', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    pushCounter = 0
    Object.defineProperty(global.navigator, 'onLine', { value: true, configurable: true })
  })

  it('registra dos eventos, uno por pieza, sobre dos escrituras independientes que no se pisan', async () => {
    mockUpdate.mockResolvedValue(undefined)
    const base = '/clinics/clinic-1/odontogramas/paciente-1'

    // La 55 se cae.
    const cae = await setHallazgoDiente({
      clinicId: 'clinic-1',
      pacienteId: 'paciente-1',
      pieza: 't55',
      capa: 'existente',
      codigo: 'ausente',
      de: null,
      uid: 'uid-1',
    })

    // La 15 venía marcada `retenida` (no había erupcionado cuando le tocaba) y
    // ahora sale: se borra el hallazgo. No es una conversión de la 55.
    const erupciona = await removeHallazgo({
      alcance: 'DIENTE',
      clinicId: 'clinic-1',
      pacienteId: 'paciente-1',
      pieza: 't15',
      capa: 'requerida',
      de: 'retenida',
      uid: 'uid-1',
    })

    expect(cae).toEqual({ ok: true })
    expect(erupciona).toEqual({ ok: true })
    expect(mockUpdate).toHaveBeenCalledTimes(2)

    const [, payloadCae] = mockUpdate.mock.calls[0]
    const [, payloadErupciona] = mockUpdate.mock.calls[1]

    // Cada escritura toca solo el árbol de su propia pieza — la de una nunca
    // nombra ni una key ni un evento de la otra.
    expect(payloadCae[`${base}/actual/dientes/t55/diente/existente`]).toBe('ausente')
    expect(Object.keys(payloadCae).some((k) => k.includes('/t15/'))).toBe(false)

    expect(payloadErupciona[`${base}/actual/dientes/t15/diente/requerida`]).toBeNull()
    expect(Object.keys(payloadErupciona).some((k) => k.includes('/t55/'))).toBe(false)

    // Dos eventos, uno por pieza: el log reconstruye el recambio como dos
    // asientos independientes, nunca como uno solo que mencione a las dos.
    const eventoCaeKey = Object.keys(payloadCae).find((k) => k.includes('/eventos/'))!
    const eventoErupcionaKey = Object.keys(payloadErupciona).find((k) => k.includes('/eventos/'))!

    expect(payloadCae[eventoCaeKey]).toMatchObject({ alcance: 'DIENTE', diente: 't55', de: null, a: 'ausente' })
    expect(payloadErupciona[eventoErupcionaKey]).toMatchObject({
      alcance: 'DIENTE',
      diente: 't15',
      de: 'retenida',
      a: null,
    })
  })

  it('la 55 ausente y la 15 conviven en el mismo odontograma sin conflicto', async () => {
    // Simula el árbol resultante fusionando las hojas que escribe cada
    // update() — no la poda de nodos vacíos que hace Firebase de verdad (eso
    // es responsabilidad del servidor, no de este service), solo que las dos
    // escrituras coexisten sin que una pise la hoja de la otra.
    const hojas: Record<string, unknown> = {}
    mockUpdate.mockImplementation(async (_ref: unknown, payload: Record<string, unknown>) => {
      Object.assign(hojas, payload)
    })

    await setHallazgoDiente({
      clinicId: 'clinic-1',
      pacienteId: 'paciente-1',
      pieza: 't55',
      capa: 'existente',
      codigo: 'ausente',
      de: null,
      uid: 'uid-1',
    })
    await removeHallazgo({
      alcance: 'DIENTE',
      clinicId: 'clinic-1',
      pacienteId: 'paciente-1',
      pieza: 't15',
      capa: 'requerida',
      de: 'retenida',
      uid: 'uid-1',
    })

    const base = '/clinics/clinic-1/odontogramas/paciente-1'
    expect(hojas[`${base}/actual/dientes/t55/diente/existente`]).toBe('ausente')
    expect(hojas[`${base}/actual/dientes/t15/diente/requerida`]).toBeNull()
  })

  it('si la 15 nunca estuvo marcada, erupcionar no requiere ningún cambio: solo se escribe el evento de la 55', async () => {
    // No tener hallazgos es el estado normal de una pieza hasta que le toca
    // salir (decisión de B4-1) — así que el caso más común del recambio no
    // llama a ningún service para la pieza que erupciona.
    mockUpdate.mockResolvedValue(undefined)

    const result = await setHallazgoDiente({
      clinicId: 'clinic-1',
      pacienteId: 'paciente-1',
      pieza: 't55',
      capa: 'existente',
      codigo: 'ausente',
      de: null,
      uid: 'uid-1',
    })

    expect(result).toEqual({ ok: true })
    expect(mockUpdate).toHaveBeenCalledTimes(1)

    const [, payload] = mockUpdate.mock.calls[0]
    expect(Object.keys(payload).some((k) => k.includes('/t15/'))).toBe(false)
  })
})
