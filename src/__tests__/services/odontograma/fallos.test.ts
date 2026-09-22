import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { caraSemantica } from '@/lib/odontograma/caras'

vi.mock('@/lib/firebase', () => ({ db: {} }))

vi.mock('firebase/database', () => ({
  ref: vi.fn((_db, path) => path ?? 'mock-ref'),
  child: vi.fn((_db, path) => path),
  update: vi.fn(),
  get: vi.fn(),
  query: vi.fn(),
  orderByKey: vi.fn(),
  limitToLast: vi.fn(),
  push: vi.fn(() => ({ key: 'evento-1' })),
  serverTimestamp: vi.fn(() => ({ '.sv': 'timestamp' })),
}))

import {
  clasificarFallo,
  mensajeDeFallo,
  conMotivo,
  ErrorSinConexion,
  type MotivoFallo,
} from '@/services/odontograma/fallos'
import { setHallazgoCara, setHallazgoDiente } from '@/services/odontograma/setHallazgo'
import { getOdontograma } from '@/services/odontograma/getOdontograma'
import { update, get } from 'firebase/database'

const mockUpdate = vi.mocked(update)
const mockGet = vi.mocked(get)

/** Nadie escribe una cara a mano fuera del dominio: sale de `caraSemantica()`. */
const CARA_CENTRO_T16 = caraSemantica('center', 1)

function setOnLine(valor: boolean) {
  Object.defineProperty(global.navigator, 'onLine', { value: valor, configurable: true })
}

describe('clasificarFallo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setOnLine(true)
  })

  it('reconoce el guard de offline de los services', () => {
    expect(clasificarFallo(new ErrorSinConexion())).toBe<MotivoFallo>('SIN_CONEXION')
  })

  it('reconoce el permission-denied de Firebase, venga en el code o en el mensaje', () => {
    // Realtime Database lo pone en `code` en las lecturas...
    expect(clasificarFallo({ code: 'PERMISSION_DENIED' })).toBe<MotivoFallo>('SIN_PERMISO')
    // ...y en el mensaje en las escrituras.
    expect(clasificarFallo(new Error('PERMISSION_DENIED: Permission denied'))).toBe<MotivoFallo>('SIN_PERMISO')
    expect(clasificarFallo('permission denied')).toBe<MotivoFallo>('SIN_PERMISO')
  })

  /**
   * El corazón del criterio de F4-1 y del bug de `signIn.ts:37`: si el servidor dijo que
   * falta permiso, el motivo es el permiso — aunque además se haya caído la conexión.
   * Reportarlo como problema de red manda a buscar el problema donde no está.
   */
  it('el permiso denegado gana sobre la inferencia de red', () => {
    setOnLine(false)
    expect(clasificarFallo({ code: 'PERMISSION_DENIED' })).toBe<MotivoFallo>('SIN_PERMISO')
  })

  it('un error cualquiera con el navegador offline es falta de conexión', () => {
    setOnLine(false)
    expect(clasificarFallo(new Error('network request failed'))).toBe<MotivoFallo>('SIN_CONEXION')
  })

  it('un error cualquiera estando online es desconocido, no "sin conexión"', () => {
    expect(clasificarFallo(new Error('boom'))).toBe<MotivoFallo>('DESCONOCIDO')
    expect(clasificarFallo(undefined)).toBe<MotivoFallo>('DESCONOCIDO')
  })
})

describe('mensajeDeFallo', () => {
  /**
   * La regresión que este test cuida no es de formato: es que el mensaje de "no tenés
   * permiso" no puede hablar de la conexión. Es exactamente lo que hace hoy
   * `signIn.ts:37` y lo que docs/odontograma-pendientes.md §1.5 B pide no repetir.
   */
  it('el mensaje de permiso no habla de red ni de conexión', () => {
    for (const accion of ['guardar', 'borrar', 'cargar'] as const) {
      const mensaje = mensajeDeFallo('SIN_PERMISO', accion)
      expect(mensaje.toLowerCase()).not.toMatch(/conexi[oó]n|red|internet|offline/)
      expect(mensaje.toLowerCase()).toContain('permiso')
    }
  })

  it('el mensaje de falta de conexión sí habla de la conexión', () => {
    expect(mensajeDeFallo('SIN_CONEXION', 'guardar').toLowerCase()).toContain('conexión')
  })

  it('cada motivo dice qué hacer, y son cosas distintas', () => {
    const conexion = mensajeDeFallo('SIN_CONEXION', 'guardar')
    const permiso = mensajeDeFallo('SIN_PERMISO', 'guardar')
    const desconocido = mensajeDeFallo('DESCONOCIDO', 'guardar')
    expect(new Set([conexion, permiso, desconocido]).size).toBe(3)
    // Reintentar sirve si se cayó la red y no sirve si falta un permiso: el mensaje lo dice.
    expect(conexion.toLowerCase()).toContain('probá de nuevo')
    expect(permiso.toLowerCase()).toContain('no lo va a resolver')
  })

  it('una escritura avisa que el cambio se deshizo; una lectura no, porque no deshizo nada', () => {
    expect(mensajeDeFallo('SIN_CONEXION', 'guardar')).toContain('se deshizo')
    expect(mensajeDeFallo('SIN_CONEXION', 'borrar')).toContain('se deshizo')
    expect(mensajeDeFallo('SIN_CONEXION', 'cargar')).not.toContain('se deshizo')
  })
})

/**
 * Los tests de arriba prueban el clasificador solo. Estos prueban el camino completo:
 * que el motivo efectivamente **salga** del `catch` de un service real. Es la parte que
 * no se podía hacer antes, porque el `catch` devolvía `null` y se comía el error.
 */
describe('los services reportan el motivo sin cambiar su valor de retorno', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    setOnLine(true)
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    errorSpy.mockRestore()
  })

  const paramsDeCara = {
    clinicId: 'clinic-1',
    pacienteId: 'paciente-1',
    pieza: 't16',
    cara: CARA_CENTRO_T16,
    capa: 'requerida',
    codigo: 'caries',
    de: null,
    uid: 'uid-1',
  } as const

  it('setHallazgoCara: permission-denied reporta SIN_PERMISO y sigue devolviendo null', async () => {
    mockUpdate.mockRejectedValue({ code: 'PERMISSION_DENIED', message: 'Permission denied' })

    const { resultado, motivo } = await conMotivo((onFallo) =>
      setHallazgoCara({ ...paramsDeCara, onFallo })
    )

    // El contrato de `ResultadoEscritura` no se movió: el fallo técnico sigue siendo `null`.
    expect(resultado).toBeNull()
    expect(motivo).toBe<MotivoFallo>('SIN_PERMISO')
  })

  it('setHallazgoCara: offline reporta SIN_CONEXION y no llama a update()', async () => {
    setOnLine(false)

    const { resultado, motivo } = await conMotivo((onFallo) =>
      setHallazgoCara({ ...paramsDeCara, onFallo })
    )

    expect(resultado).toBeNull()
    expect(motivo).toBe<MotivoFallo>('SIN_CONEXION')
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('un rechazo de negocio no reporta ningún motivo técnico', async () => {
    // Un implante en una pieza temporaria: el catálogo dice SOLO_PERMANENTE, así que el
    // service rechaza por regla de negocio. No es un fallo técnico y no tiene motivo que
    // clasificar — el mensaje lo escribe el service, que es quien conoce la regla.
    mockUpdate.mockResolvedValue(undefined)
    const reportes: MotivoFallo[] = []

    const resultado = await setHallazgoDiente({
      clinicId: 'clinic-1',
      pacienteId: 'paciente-1',
      pieza: 't55',
      capa: 'existente',
      codigo: 'implante',
      de: null,
      uid: 'uid-1',
      onFallo: (m) => reportes.push(m),
    })

    expect(resultado).toEqual({ ok: false, error: expect.stringContaining('Implante') })
    expect(reportes).toEqual([])
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('un éxito tampoco reporta nada', async () => {
    mockUpdate.mockResolvedValue(undefined)
    const reportes: MotivoFallo[] = []

    const resultado = await setHallazgoCara({ ...paramsDeCara, onFallo: (m) => reportes.push(m) })

    expect(resultado).toEqual({ ok: true })
    expect(reportes).toEqual([])
  })

  it('getOdontograma: permission-denied reporta SIN_PERMISO', async () => {
    mockGet.mockRejectedValue({ code: 'PERMISSION_DENIED', message: 'Permission denied' })

    const { resultado, motivo } = await conMotivo((onFallo) =>
      getOdontograma('paciente-1', 'clinic-1', onFallo)
    )

    expect(resultado).toBeNull()
    expect(motivo).toBe<MotivoFallo>('SIN_PERMISO')
  })

  it('getOdontograma: un paciente sin odontograma no es un fallo', async () => {
    mockGet.mockResolvedValue({ exists: () => false } as never)
    const reportes: MotivoFallo[] = []

    const resultado = await getOdontograma('paciente-1', 'clinic-1', (m) => reportes.push(m))

    expect(resultado).toEqual({ dientes: {}, vinculos: {}, meta: null })
    expect(reportes).toEqual([])
  })

  it('sin onFallo, los services se comportan igual que antes', async () => {
    mockUpdate.mockRejectedValue(new Error('boom'))
    await expect(setHallazgoCara(paramsDeCara)).resolves.toBeNull()
  })
})
