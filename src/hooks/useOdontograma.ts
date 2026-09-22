'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getOdontograma } from '@/services/odontograma/getOdontograma'
import { setHallazgoCara, setHallazgoDiente, type ResultadoEscritura } from '@/services/odontograma/setHallazgo'
import { removeHallazgo } from '@/services/odontograma/removeHallazgo'
import { setVinculo } from '@/services/odontograma/setVinculo'
import { removeVinculo } from '@/services/odontograma/removeVinculo'
import {
  conMotivo,
  mensajeDeFallo,
  type AccionOdontograma,
  type MotivoFallo,
} from '@/services/odontograma/fallos'
import type { ClavePieza } from '@/lib/odontograma/piezas'
import type {
  Capa,
  Cara,
  CodigoHallazgoCara,
  CodigoHallazgoDiente,
  CodigoHallazgoMulti,
  DientesPorClave,
  PiezasSet,
  Vinculo,
} from '@/lib/odontograma/tipos'
import { useToast } from '@/context/ToastContext'

/**
 * La conexión del odontograma con Firebase (F4-1), en un solo lugar.
 *
 * Es un hook y no parte de la pantalla por dos motivos. Uno: así ningún componente
 * importa un service, ni el SDK, ni arma un path — la pantalla recibe `dientes` y
 * `vinculos` y llama funciones con vocabulario del dominio. Dos: la lógica que importa
 * acá es la del optimismo y el revertido, que es justo la que hay que poder testear sin
 * montar 470 líneas de JSX (ver `useOdontograma.test.ts`).
 *
 * Lo que el hook **no** hace: no decide colores, ni qué cara es la que se clickeó, ni
 * qué hallazgos existen. Eso es la capa de dominio (`lib/odontograma/`) y el hook la
 * consume igual que la pantalla: recibe una `Cara` ya traducida por `caraSemantica()` y
 * nunca construye una.
 */

/** Estado de la lectura inicial. Escribir solo tiene sentido con la lectura en `listo`. */
export type EstadoLectura = 'cargando' | 'listo' | 'error'

interface UseOdontogramaParams {
  /** `null` mientras la ficha del paciente todavía no resolvió. */
  readonly pacienteId: string | null
  readonly clinicId: string | null
  /** El uid del usuario logueado, que queda en el asiento de auditoría de cada evento. */
  readonly uid: string | null
}

export interface OdontogramaConectado {
  readonly dientes: DientesPorClave
  readonly vinculos: Record<string, Vinculo>
  readonly estado: EstadoLectura
  /** Mensaje ya clasificado del fallo de lectura, o `null` si no falló. */
  readonly errorDeLectura: string | null
  readonly recargar: () => void
  readonly guardarHallazgoCara: (
    pieza: ClavePieza,
    cara: Cara,
    capa: Capa,
    codigo: CodigoHallazgoCara,
    de: CodigoHallazgoCara | null
  ) => Promise<void>
  readonly guardarHallazgoDiente: (
    pieza: ClavePieza,
    capa: Capa,
    codigo: CodigoHallazgoDiente,
    de: CodigoHallazgoDiente | null
  ) => Promise<void>
  readonly quitarHallazgoCara: (pieza: ClavePieza, cara: Cara, capa: Capa, de: CodigoHallazgoCara) => Promise<void>
  readonly quitarHallazgoDiente: (pieza: ClavePieza, capa: Capa, de: CodigoHallazgoDiente) => Promise<void>
  readonly guardarVinculo: (
    tipo: CodigoHallazgoMulti,
    capa: Capa,
    piezas: readonly ClavePieza[]
  ) => Promise<void>
  readonly quitarVinculo: (vinculoId: string) => Promise<void>
}

/**
 * Escribe (o borra, con `valor: null`) una hoja `caras/{cara}/{capa}` sobre una copia
 * del estado. Pura y sin mutar: el mismo criterio que `selectores.ts`, que tiene un
 * test dedicado a que no toque el estado que recibe.
 */
function escribirCara(
  estado: DientesPorClave,
  clave: ClavePieza,
  cara: Cara,
  capa: Capa,
  valor: CodigoHallazgoCara | null
): DientesPorClave {
  const pieza = estado[clave] ?? {}
  const hojas = { ...pieza.caras?.[cara] }
  if (valor === null) delete hojas[capa]
  else hojas[capa] = valor
  return { ...estado, [clave]: { ...pieza, caras: { ...pieza.caras, [cara]: hojas } } }
}

/** Lo mismo para la hoja `diente/{capa}`. */
function escribirDiente(
  estado: DientesPorClave,
  clave: ClavePieza,
  capa: Capa,
  valor: CodigoHallazgoDiente | null
): DientesPorClave {
  const pieza = estado[clave] ?? {}
  const hojas = { ...pieza.diente }
  if (valor === null) delete hojas[capa]
  else hojas[capa] = valor
  return { ...estado, [clave]: { ...pieza, diente: hojas } }
}

/**
 * La rama de fallo común a las seis escrituras: deshacer el optimista y decir qué pasó.
 *
 * Es un type guard para que el caller pueda usar los campos extra del éxito —
 * `setVinculo` devuelve `vinculoId` — sin volver a chequear la forma del resultado.
 *
 * Las dos ramas de fallo llevan mensajes de distinta procedencia y eso es a propósito:
 * `{ ok: false, error }` es un rechazo de negocio y su texto ya viene escrito por el
 * service (lo escribió quien conoce la regla); `null` es un fallo técnico y su texto
 * sale de `mensajeDeFallo`, que sabe distinguir un permiso denegado de una caída de red.
 */
function quedoFirme<E extends object>(
  resultado: ResultadoEscritura<E>,
  motivo: MotivoFallo,
  accion: AccionOdontograma,
  deshacer: () => void,
  avisar: (mensaje: string) => void
): resultado is { readonly ok: true } & E {
  if (resultado === null) {
    deshacer()
    avisar(mensajeDeFallo(motivo, accion))
    return false
  }
  if (!resultado.ok) {
    deshacer()
    avisar(resultado.error)
    return false
  }
  return true
}

export function useOdontograma({ pacienteId, clinicId, uid }: UseOdontogramaParams): OdontogramaConectado {
  const [dientes, setDientes] = useState<DientesPorClave>({})
  const [vinculos, setVinculos] = useState<Record<string, Vinculo>>({})
  const [estado, setEstado] = useState<EstadoLectura>('cargando')
  const [errorDeLectura, setErrorDeLectura] = useState<string | null>(null)
  const [reintento, setReintento] = useState(0)

  const { showToast } = useToast()
  const avisar = useCallback((mensaje: string) => showToast('error', mensaje), [showToast])

  /**
   * tempIds que el usuario borró mientras su alta seguía en vuelo. El borrado no pudo
   * ir a Firebase porque todavía no existía el id real; el handler de éxito del alta lo
   * resuelve. Si no, quedaría un vínculo huérfano en `actual/vinculos/` que la pantalla
   * no muestra y nadie puede borrar.
   */
  const bajasPendientesRef = useRef<Set<string>>(new Set())
  /** Contador propio en vez de `Date.now()`: dos altas en el mismo milisegundo colisionaban. */
  const contadorLocalRef = useRef(0)

  useEffect(() => {
    if (!pacienteId || !clinicId) return
    let cancelado = false

    setEstado('cargando')
    setErrorDeLectura(null)

    conMotivo((onFallo) => getOdontograma(pacienteId, clinicId, onFallo)).then(({ resultado, motivo }) => {
      if (cancelado) return
      if (resultado === null) {
        // No se cae a un odontograma vacío: una boca vacía se dibuja igual que una boca
        // sana, así que un fallo de lectura silencioso se leería como "este paciente no
        // tiene nada". La pantalla muestra el error y ofrece reintentar.
        setEstado('error')
        setErrorDeLectura(mensajeDeFallo(motivo, 'cargar'))
        return
      }
      setDientes(resultado.dientes)
      setVinculos(resultado.vinculos)
      setEstado('listo')
    })

    return () => {
      cancelado = true
    }
  }, [pacienteId, clinicId, reintento])

  const recargar = useCallback(() => setReintento((n) => n + 1), [])

  /**
   * Revertir no es volver a escribir `de` a ciegas: entre el optimista y el ack puede
   * haber entrado otra escritura sobre la misma hoja (dos clicks rápidos sobre la misma
   * cara). Si lo que hay ahora no es lo que escribimos, el revertido no corresponde —
   * pisaría un valor más nuevo y dejaría la pantalla mostrando algo que Firebase no
   * tiene. Con 52 piezas y un click por hallazgo, esa carrera es la normal, no la rara.
   */
  const revertirCara = useCallback(
    (clave: ClavePieza, cara: Cara, capa: Capa, escrito: CodigoHallazgoCara | null, de: CodigoHallazgoCara | null) => {
      setDientes((prev) => {
        const actual = prev[clave]?.caras?.[cara]?.[capa] ?? null
        if (actual !== escrito) return prev
        return escribirCara(prev, clave, cara, capa, de)
      })
    },
    []
  )

  const revertirDiente = useCallback(
    (clave: ClavePieza, capa: Capa, escrito: CodigoHallazgoDiente | null, de: CodigoHallazgoDiente | null) => {
      setDientes((prev) => {
        const actual = prev[clave]?.diente?.[capa] ?? null
        if (actual !== escrito) return prev
        return escribirDiente(prev, clave, capa, de)
      })
    },
    []
  )

  /**
   * Los tres datos que toda escritura necesita. `null` mientras la ficha o el login no
   * resolvieron, y también mientras la lectura no esté en `listo`: sin saber qué hay
   * cargado no se puede calcular el `de` de un evento ni revertir a nada sensato.
   *
   * Va en un `useMemo` para que la identidad no cambie en cada render — si cambiara,
   * cambiarían las seis funciones de escritura y con ellas cualquier efecto que dependa
   * de alguna.
   */
  const contexto = useMemo(
    () => (pacienteId && clinicId && uid && estado === 'listo' ? { pacienteId, clinicId, uid } : null),
    [pacienteId, clinicId, uid, estado]
  )

  const guardarHallazgoCara = useCallback(
    async (
      pieza: ClavePieza,
      cara: Cara,
      capa: Capa,
      codigo: CodigoHallazgoCara,
      de: CodigoHallazgoCara | null
    ) => {
      if (!contexto) return
      setDientes((prev) => escribirCara(prev, pieza, cara, capa, codigo))

      const { resultado, motivo } = await conMotivo((onFallo) =>
        setHallazgoCara({ ...contexto, pieza, cara, capa, codigo, de, onFallo })
      )
      quedoFirme(resultado, motivo, 'guardar', () => revertirCara(pieza, cara, capa, codigo, de), avisar)
    },
    [contexto, revertirCara, avisar]
  )

  const guardarHallazgoDiente = useCallback(
    async (pieza: ClavePieza, capa: Capa, codigo: CodigoHallazgoDiente, de: CodigoHallazgoDiente | null) => {
      if (!contexto) return
      setDientes((prev) => escribirDiente(prev, pieza, capa, codigo))

      const { resultado, motivo } = await conMotivo((onFallo) =>
        setHallazgoDiente({ ...contexto, pieza, capa, codigo, de, onFallo })
      )
      quedoFirme(resultado, motivo, 'guardar', () => revertirDiente(pieza, capa, codigo, de), avisar)
    },
    [contexto, revertirDiente, avisar]
  )

  const quitarHallazgoCara = useCallback(
    async (pieza: ClavePieza, cara: Cara, capa: Capa, de: CodigoHallazgoCara) => {
      if (!contexto) return
      setDientes((prev) => escribirCara(prev, pieza, cara, capa, null))

      const { resultado, motivo } = await conMotivo((onFallo) =>
        removeHallazgo({ alcance: 'CARA', ...contexto, pieza, cara, capa, de, onFallo })
      )
      quedoFirme(resultado, motivo, 'borrar', () => revertirCara(pieza, cara, capa, null, de), avisar)
    },
    [contexto, revertirCara, avisar]
  )

  const quitarHallazgoDiente = useCallback(
    async (pieza: ClavePieza, capa: Capa, de: CodigoHallazgoDiente) => {
      if (!contexto) return
      setDientes((prev) => escribirDiente(prev, pieza, capa, null))

      const { resultado, motivo } = await conMotivo((onFallo) =>
        removeHallazgo({ alcance: 'DIENTE', ...contexto, pieza, capa, de, onFallo })
      )
      quedoFirme(resultado, motivo, 'borrar', () => revertirDiente(pieza, capa, null, de), avisar)
    },
    [contexto, revertirDiente, avisar]
  )

  const guardarVinculo = useCallback(
    async (tipo: CodigoHallazgoMulti, capa: Capa, piezas: readonly ClavePieza[]) => {
      if (!contexto) return

      const piezasSet: PiezasSet = {}
      piezas.forEach((clave) => {
        piezasSet[clave] = true
      })
      // El id real lo genera `push()` del lado del service; hasta el ack hace falta uno
      // para poder dibujar el tramo y para poder borrarlo si el usuario se arrepiente.
      const tempId = `local-${++contadorLocalRef.current}`

      setVinculos((prev) => ({ ...prev, [tempId]: { tipo, capa, piezas: piezasSet } }))
      const deshacer = () =>
        setVinculos((prev) => {
          const { [tempId]: _quitado, ...resto } = prev
          return resto
        })

      const { resultado, motivo } = await conMotivo((onFallo) =>
        setVinculo({ ...contexto, tipo, capa, piezas, onFallo })
      )
      if (!quedoFirme(resultado, motivo, 'guardar', deshacer, avisar)) return

      const bajaPendiente = bajasPendientesRef.current.delete(tempId)
      setVinculos((prev) => {
        // Si ya se borró en el intervalo (click en el span antes del ack), no resucitarlo.
        if (!(tempId in prev)) return prev
        const { [tempId]: vinculo, ...resto } = prev
        return { ...resto, [resultado.vinculoId]: vinculo }
      })

      if (bajaPendiente) {
        const baja = await conMotivo((onFallo) =>
          removeVinculo({ ...contexto, vinculoId: resultado.vinculoId, tipo, capa, piezas: piezasSet, onFallo })
        )
        // Sin deshacer: el vínculo ya no está en pantalla y no tiene que volver. Si la
        // baja falla queda huérfano en Firebase, y eso sí hay que decirlo.
        quedoFirme(baja.resultado, baja.motivo, 'borrar', () => {}, avisar)
      }
    },
    [contexto, avisar]
  )

  /**
   * Sin diálogo de confirmación — mismo criterio que "Quitar hallazgo". Si el vínculo
   * todavía tiene su id temporal, el alta sigue en vuelo y no hay nada persistido que
   * borrar: se anota como baja pendiente y `guardarVinculo` la ejecuta al conocer el id.
   */
  const quitarVinculo = useCallback(
    async (vinculoId: string) => {
      const vinculo = vinculos[vinculoId]
      if (!vinculo) return

      setVinculos((prev) => {
        const { [vinculoId]: _quitado, ...resto } = prev
        return resto
      })

      if (vinculoId.startsWith('local-')) {
        bajasPendientesRef.current.add(vinculoId)
        return
      }
      if (!contexto) return

      const { resultado, motivo } = await conMotivo((onFallo) =>
        removeVinculo({
          ...contexto,
          vinculoId,
          tipo: vinculo.tipo,
          capa: vinculo.capa,
          piezas: vinculo.piezas,
          onFallo,
        })
      )
      quedoFirme(
        resultado,
        motivo,
        'borrar',
        () => setVinculos((prev) => ({ ...prev, [vinculoId]: vinculo })),
        avisar
      )
    },
    [vinculos, contexto, avisar]
  )

  return {
    dientes,
    vinculos,
    estado,
    errorDeLectura,
    recargar,
    guardarHallazgoCara,
    guardarHallazgoDiente,
    quitarHallazgoCara,
    quitarHallazgoDiente,
    guardarVinculo,
    quitarVinculo,
  }
}
