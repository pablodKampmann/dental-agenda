import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { caraSemantica } from '@/lib/odontograma/caras'
import type { ResultadoEscritura } from '@/services/odontograma/setHallazgo'

const { showToast } = vi.hoisted(() => ({ showToast: vi.fn() }))
vi.mock('@/context/ToastContext', () => ({ useToast: () => ({ showToast }) }))

vi.mock('@/services/odontograma/getOdontograma', () => ({ getOdontograma: vi.fn() }))
vi.mock('@/services/odontograma/setHallazgo', () => ({
  setHallazgoCara: vi.fn(),
  setHallazgoDiente: vi.fn(),
}))
vi.mock('@/services/odontograma/removeHallazgo', () => ({ removeHallazgo: vi.fn() }))
vi.mock('@/services/odontograma/setVinculo', () => ({ setVinculo: vi.fn() }))
vi.mock('@/services/odontograma/removeVinculo', () => ({ removeVinculo: vi.fn() }))

import { useOdontograma } from '@/hooks/useOdontograma'
import { getOdontograma } from '@/services/odontograma/getOdontograma'
import { setHallazgoCara, setHallazgoDiente } from '@/services/odontograma/setHallazgo'
import { removeHallazgo } from '@/services/odontograma/removeHallazgo'
import { setVinculo } from '@/services/odontograma/setVinculo'
import { removeVinculo } from '@/services/odontograma/removeVinculo'

/** Nadie escribe una cara a mano fuera del dominio: sale de `caraSemantica()`. */
const CARA = caraSemantica('center', 1)

const VACIO = { dientes: {}, vinculos: {}, meta: null }

/** Una promesa que se resuelve cuando el test quiere: es lo que hace visible el optimismo. */
function diferido<T>() {
  let resolver: (valor: T) => void = () => {}
  const promesa = new Promise<T>((r) => {
    resolver = r
  })
  return { promesa, resolver }
}

async function montar(uid: string | null = 'uid-1') {
  const hook = renderHook(() => useOdontograma({ pacienteId: 'p1', clinicId: 'c1', uid }))
  await waitFor(() => expect(hook.result.current.estado).not.toBe('cargando'))
  return hook
}

function caraDe(dientes: ReturnType<typeof useOdontograma>['dientes']) {
  return dientes.t16?.caras?.[CARA]?.existente
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getOdontograma).mockResolvedValue(VACIO)
})

describe('useOdontograma — lectura', () => {
  it('deja la lectura en `listo` con lo que devolvió el service', async () => {
    vi.mocked(getOdontograma).mockResolvedValue({
      dientes: { t16: { caras: { [CARA]: { existente: 'obturacion' } } } },
      vinculos: { v1: { tipo: 'protesis_fija', capa: 'existente', piezas: { t14: true, t15: true } } },
      meta: null,
    })

    const { result } = await montar()

    expect(result.current.estado).toBe('listo')
    expect(caraDe(result.current.dientes)).toBe('obturacion')
    expect(Object.keys(result.current.vinculos)).toEqual(['v1'])
  })

  it('no espera que la pantalla arme un path: le pasa los ids al service', async () => {
    await montar()
    expect(getOdontograma).toHaveBeenCalledWith('p1', 'c1', expect.any(Function))
  })

  /**
   * La regresión peligrosa de la feature: un arco vacío y un arco que no se pudo leer se
   * dibujan igual. Si la lectura falla, el hook **no** se cae a un odontograma vacío.
   */
  it('un fallo de lectura queda en `error`, no en una boca sana', async () => {
    vi.mocked(getOdontograma).mockImplementation(async (_p, _c, onFallo) => {
      onFallo?.('SIN_PERMISO', { code: 'PERMISSION_DENIED' })
      return null
    })

    const { result } = await montar()

    expect(result.current.estado).toBe('error')
    expect(result.current.dientes).toEqual({})
    expect(result.current.errorDeLectura?.toLowerCase()).toContain('permiso')
    expect(result.current.errorDeLectura?.toLowerCase()).not.toMatch(/conexi[oó]n|red|internet/)
  })

  it('el motivo de la lectura distingue la falta de conexión', async () => {
    vi.mocked(getOdontograma).mockImplementation(async (_p, _c, onFallo) => {
      onFallo?.('SIN_CONEXION', new Error())
      return null
    })

    const { result } = await montar()

    expect(result.current.errorDeLectura?.toLowerCase()).toContain('conexión')
  })

  it('recargar reintenta la lectura', async () => {
    vi.mocked(getOdontograma).mockResolvedValueOnce(null)
    const { result } = await montar()
    expect(result.current.estado).toBe('error')

    vi.mocked(getOdontograma).mockResolvedValue(VACIO)
    await act(async () => {
      result.current.recargar()
    })

    await waitFor(() => expect(result.current.estado).toBe('listo'))
    expect(getOdontograma).toHaveBeenCalledTimes(2)
  })

  it('sin paciente todavía no lee nada', async () => {
    renderHook(() => useOdontograma({ pacienteId: null, clinicId: 'c1', uid: 'uid-1' }))
    expect(getOdontograma).not.toHaveBeenCalled()
  })
})

describe('useOdontograma — escritura optimista', () => {
  it('pinta el hallazgo antes de que la escritura resuelva', async () => {
    const { promesa, resolver } = diferido<ResultadoEscritura>()
    vi.mocked(setHallazgoCara).mockReturnValue(promesa)

    const { result } = await montar()

    let enVuelo!: Promise<void>
    act(() => {
      enVuelo = result.current.guardarHallazgoCara('t16', CARA, 'existente', 'obturacion', null)
    })

    // Todavía no llegó la respuesta y el hallazgo ya está en pantalla.
    expect(caraDe(result.current.dientes)).toBe('obturacion')

    await act(async () => {
      resolver({ ok: true })
      await enVuelo
    })

    expect(caraDe(result.current.dientes)).toBe('obturacion')
    expect(showToast).not.toHaveBeenCalled()
  })

  it('un fallo técnico revierte al valor anterior y dice el motivo', async () => {
    vi.mocked(setHallazgoCara).mockImplementation(async (params) => {
      params.onFallo?.('SIN_PERMISO', { code: 'PERMISSION_DENIED' })
      return null
    })

    const { result } = await montar()

    await act(async () => {
      await result.current.guardarHallazgoCara('t16', CARA, 'existente', 'obturacion', null)
    })

    expect(caraDe(result.current.dientes)).toBeUndefined()
    expect(showToast).toHaveBeenCalledWith('error', expect.stringContaining('permiso'))
    // Y el mensaje no es el de red: es el bug de signIn.ts que no se repite.
    const mensaje = vi.mocked(showToast).mock.calls[0][1].toLowerCase()
    expect(mensaje).not.toMatch(/conexi[oó]n|red|internet/)
  })

  it('revertir vuelve al hallazgo que había, no a vacío', async () => {
    vi.mocked(getOdontograma).mockResolvedValue({
      dientes: { t16: { caras: { [CARA]: { existente: 'obturacion' } } } },
      vinculos: {},
      meta: null,
    })
    vi.mocked(setHallazgoCara).mockResolvedValue(null)

    const { result } = await montar()

    await act(async () => {
      await result.current.guardarHallazgoCara('t16', CARA, 'existente', 'fractura', 'obturacion')
    })

    expect(caraDe(result.current.dientes)).toBe('obturacion')
  })

  /**
   * Con 52 piezas y un click por hallazgo, dos escrituras sobre la misma hoja se pisan.
   * Si la primera falla **después** de que la segunda ya pintó, revertir a ciegas dejaría
   * la pantalla mostrando algo que Firebase no tiene. El revertido solo corre si lo que
   * está en pantalla sigue siendo lo que esa escritura puso.
   */
  it('el revertido de una escritura vieja no pisa a una más nueva', async () => {
    const primera = diferido<ResultadoEscritura>()
    vi.mocked(setHallazgoCara).mockReturnValueOnce(primera.promesa).mockResolvedValue({ ok: true })

    const { result } = await montar()

    let vuelo1!: Promise<void>
    act(() => {
      vuelo1 = result.current.guardarHallazgoCara('t16', CARA, 'existente', 'obturacion', null)
    })
    await act(async () => {
      await result.current.guardarHallazgoCara('t16', CARA, 'existente', 'fractura', 'obturacion')
    })
    expect(caraDe(result.current.dientes)).toBe('fractura')

    // Ahora falla la primera, la vieja.
    await act(async () => {
      primera.resolver(null)
      await vuelo1
    })

    expect(caraDe(result.current.dientes)).toBe('fractura')
  })

  it('un rechazo de negocio muestra el mensaje del service tal cual', async () => {
    vi.mocked(setHallazgoDiente).mockResolvedValue({
      ok: false,
      error: 'Implante no aplica a piezas de dentición temporaria.',
    })

    const { result } = await montar()

    await act(async () => {
      await result.current.guardarHallazgoDiente('t55', 'existente', 'implante', null)
    })

    expect(result.current.dientes.t55?.diente?.existente).toBeUndefined()
    expect(showToast).toHaveBeenCalledWith('error', 'Implante no aplica a piezas de dentición temporaria.')
  })

  it('borrar un hallazgo también es optimista y reversible', async () => {
    vi.mocked(getOdontograma).mockResolvedValue({
      dientes: { t16: { caras: { [CARA]: { existente: 'obturacion' } } } },
      vinculos: {},
      meta: null,
    })
    const { promesa, resolver } = diferido<ResultadoEscritura>()
    vi.mocked(removeHallazgo).mockReturnValue(promesa)

    const { result } = await montar()

    let enVuelo!: Promise<void>
    act(() => {
      enVuelo = result.current.quitarHallazgoCara('t16', CARA, 'existente', 'obturacion')
    })
    expect(caraDe(result.current.dientes)).toBeUndefined()

    await act(async () => {
      resolver(null)
      await enVuelo
    })

    expect(caraDe(result.current.dientes)).toBe('obturacion')
    expect(showToast).toHaveBeenCalledWith('error', expect.stringContaining('No se pudo borrar'))
  })

  it('no escribe si la lectura no está en `listo`', async () => {
    vi.mocked(getOdontograma).mockResolvedValue(null)
    const { result } = await montar()

    await act(async () => {
      await result.current.guardarHallazgoCara('t16', CARA, 'existente', 'obturacion', null)
    })

    expect(setHallazgoCara).not.toHaveBeenCalled()
  })

  it('no escribe sin uid: el asiento de auditoría no puede quedar sin autor', async () => {
    const { result } = await montar(null)

    await act(async () => {
      await result.current.guardarHallazgoCara('t16', CARA, 'existente', 'obturacion', null)
    })

    expect(setHallazgoCara).not.toHaveBeenCalled()
  })

  it('le pasa al service el uid y los ids, y nunca una posición de pantalla', async () => {
    vi.mocked(setHallazgoCara).mockResolvedValue({ ok: true })
    const { result } = await montar()

    await act(async () => {
      await result.current.guardarHallazgoCara('t16', CARA, 'requerida', 'caries', null)
    })

    expect(setHallazgoCara).toHaveBeenCalledWith(
      expect.objectContaining({
        clinicId: 'c1',
        pacienteId: 'p1',
        uid: 'uid-1',
        pieza: 't16',
        cara: CARA,
        capa: 'requerida',
        codigo: 'caries',
        de: null,
      })
    )
  })
})

describe('useOdontograma — vínculos multi-pieza', () => {
  const PIEZAS = ['t14', 't15', 't16'] as const

  it('dibuja el tramo con un id temporal y lo cambia por el real al confirmar', async () => {
    const { promesa, resolver } = diferido<ResultadoEscritura<{ vinculoId: string }>>()
    vi.mocked(setVinculo).mockReturnValue(promesa)

    const { result } = await montar()

    let enVuelo!: Promise<void>
    act(() => {
      enVuelo = result.current.guardarVinculo('protesis_fija', 'existente', PIEZAS)
    })

    const temporal = Object.keys(result.current.vinculos)
    expect(temporal).toHaveLength(1)
    expect(temporal[0]).toMatch(/^local-/)

    await act(async () => {
      resolver({ ok: true, vinculoId: 'push-1' })
      await enVuelo
    })

    expect(Object.keys(result.current.vinculos)).toEqual(['push-1'])
    expect(result.current.vinculos['push-1'].piezas).toEqual({ t14: true, t15: true, t16: true })
  })

  it('un alta que falla saca el tramo de la pantalla y explica por qué', async () => {
    vi.mocked(setVinculo).mockImplementation(async (params) => {
      params.onFallo?.('SIN_CONEXION', new Error())
      return null
    })

    const { result } = await montar()

    await act(async () => {
      await result.current.guardarVinculo('protesis_fija', 'existente', PIEZAS)
    })

    expect(result.current.vinculos).toEqual({})
    expect(showToast).toHaveBeenCalledWith('error', expect.stringContaining('conexión'))
  })

  it('un tramo inválido rebota con el mensaje del service, que es la autoridad', async () => {
    vi.mocked(setVinculo).mockResolvedValue({
      ok: false,
      error: 'Las piezas del vínculo tienen que ser contiguas, sin saltear piezas.',
    })

    const { result } = await montar()

    await act(async () => {
      await result.current.guardarVinculo('protesis_fija', 'existente', ['t14', 't16'])
    })

    expect(result.current.vinculos).toEqual({})
    expect(showToast).toHaveBeenCalledWith(
      'error',
      'Las piezas del vínculo tienen que ser contiguas, sin saltear piezas.'
    )
  })

  it('borrar un vínculo persistido es optimista y reversible', async () => {
    const vinculo = { tipo: 'protesis_fija', capa: 'existente', piezas: { t14: true, t15: true } } as const
    vi.mocked(getOdontograma).mockResolvedValue({ dientes: {}, vinculos: { 'push-1': vinculo }, meta: null })
    vi.mocked(removeVinculo).mockResolvedValue(null)

    const { result } = await montar()

    await act(async () => {
      await result.current.quitarVinculo('push-1')
    })

    expect(result.current.vinculos['push-1']).toEqual(vinculo)
    expect(showToast).toHaveBeenCalledWith('error', expect.stringContaining('No se pudo borrar'))
  })

  /**
   * El caso que dejaba basura en Firebase: se borra el tramo mientras el alta sigue en
   * vuelo. El id real todavía no existe, así que la baja se anota y se ejecuta cuando el
   * alta lo resuelve. Sin esto queda un vínculo en `actual/vinculos/` que la pantalla no
   * muestra y nadie puede borrar.
   */
  it('una baja pedida durante el alta se ejecuta con el id real, sin dejar huérfanos', async () => {
    const { promesa, resolver } = diferido<ResultadoEscritura<{ vinculoId: string }>>()
    vi.mocked(setVinculo).mockReturnValue(promesa)
    vi.mocked(removeVinculo).mockResolvedValue({ ok: true })

    const { result } = await montar()

    let alta!: Promise<void>
    act(() => {
      alta = result.current.guardarVinculo('protesis_fija', 'existente', PIEZAS)
    })
    const temporal = Object.keys(result.current.vinculos)[0]

    await act(async () => {
      await result.current.quitarVinculo(temporal)
    })
    expect(result.current.vinculos).toEqual({})
    expect(removeVinculo).not.toHaveBeenCalled()

    await act(async () => {
      resolver({ ok: true, vinculoId: 'push-1' })
      await alta
    })

    expect(result.current.vinculos).toEqual({})
    expect(removeVinculo).toHaveBeenCalledWith(
      expect.objectContaining({ vinculoId: 'push-1', tipo: 'protesis_fija', capa: 'existente' })
    )
  })
})
