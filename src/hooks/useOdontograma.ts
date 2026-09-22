'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getOdontograma } from '@/services/odontograma/getOdontograma'
import {
  setHallazgoCara,
  setHallazgoDiente,
  ejecutarHallazgoCaraRequerida,
  ejecutarHallazgoDienteRequerido,
  type ResultadoEscritura,
} from '@/services/odontograma/setHallazgo'
import { removeHallazgo } from '@/services/odontograma/removeHallazgo'
import { setVinculo } from '@/services/odontograma/setVinculo'
import { removeVinculo } from '@/services/odontograma/removeVinculo'
import {
  conMotivo,
  mensajeDeFallo,
  type AccionOdontograma,
  type MotivoFallo,
} from '@/services/odontograma/fallos'
import { hallazgoDe } from '@/lib/odontograma/catalogo'
import type { ClavePieza } from '@/lib/odontograma/piezas'
import type {
  Capa,
  Cara,
  CodigoHallazgo,
  CodigoHallazgoCara,
  CodigoHallazgoDiente,
  CodigoHallazgoMulti,
  DientesPorClave,
  EventoOdontograma,
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
 * nunca construye una. Tampoco arma la Historia Clínica: de cada escritura emite el
 * `EventoOdontograma` que acaba de pintar (`onEventoOptimista`) y, si la escritura no
 * quedó, avisa que hay que descartarlo (`onEventoDescartado`) — quien traduce eso a una
 * entrada del timeline es `eventoAEntrada`, del lado de la pantalla.
 */

/** Estado de la lectura inicial. Escribir solo tiene sentido con la lectura en `listo`. */
export type EstadoLectura = 'cargando' | 'listo' | 'error'

/**
 * Qué hacer con un pedido de baja de vínculo. Un alta que sigue en vuelo se deshace en
 * el acto —es cancelar la propia acción recién hecha, no borrar un registro— y un
 * vínculo ya persistido pide confirmación, que es de la pantalla y no del hook.
 */
export type PedidoDeBaja = 'deshecho' | 'requiere_confirmacion' | 'inexistente'

interface UseOdontogramaParams {
  /** `null` mientras la ficha del paciente todavía no resolvió. */
  readonly pacienteId: string | null
  readonly clinicId: string | null
  /** El uid del usuario logueado, que queda en el asiento de auditoría de cada evento. */
  readonly uid: string | null
  /** El evento que la escritura acaba de pintar en pantalla, antes del ack de Firebase. */
  readonly onEventoOptimista?: (tempId: string, evento: EventoOdontograma) => void
  /** La escritura no quedó: ese evento nunca ocurrió y hay que sacarlo del timeline. */
  readonly onEventoDescartado?: (tempId: string) => void
}

export interface OdontogramaConectado {
  readonly dientes: DientesPorClave
  readonly vinculos: Record<string, Vinculo>
  readonly estado: EstadoLectura
  /** Mensaje ya clasificado del fallo de lectura, o `null` si no falló. */
  readonly errorDeLectura: string | null
  readonly recargar: () => void
  /** Hay una escritura del picker en vuelo — el panel no se cierra antes de saber el resultado. */
  readonly guardando: boolean
  /** Ids de vínculo cuya baja está en vuelo, para el spinner de `VinculoSpan`. */
  readonly vinculosPendientes: ReadonlySet<string>
  readonly guardarHallazgoCara: (
    pieza: ClavePieza,
    cara: Cara,
    capa: Capa,
    codigo: CodigoHallazgoCara,
    de: CodigoHallazgoCara | null,
    nota?: string
  ) => Promise<void>
  readonly guardarHallazgoDiente: (
    pieza: ClavePieza,
    capa: Capa,
    codigo: CodigoHallazgoDiente,
    de: CodigoHallazgoDiente | null,
    nota?: string
  ) => Promise<void>
  readonly ejecutarHallazgoCara: (
    pieza: ClavePieza,
    cara: Cara,
    hallazgoRequerido: CodigoHallazgoCara,
    hallazgoResultante: CodigoHallazgoCara,
    existenteAnterior: CodigoHallazgoCara | null,
    nota?: string
  ) => Promise<void>
  readonly ejecutarHallazgoDiente: (
    pieza: ClavePieza,
    hallazgoRequerido: CodigoHallazgoDiente,
    hallazgoResultante: CodigoHallazgoDiente,
    existenteAnterior: CodigoHallazgoDiente | null,
    nota?: string
  ) => Promise<void>
  readonly quitarHallazgoCara: (pieza: ClavePieza, cara: Cara, capa: Capa, de: CodigoHallazgoCara) => Promise<void>
  readonly quitarHallazgoDiente: (pieza: ClavePieza, capa: Capa, de: CodigoHallazgoDiente) => Promise<void>
  readonly guardarVinculo: (
    tipo: CodigoHallazgoMulti,
    capa: Capa,
    piezas: readonly ClavePieza[],
    nota?: string
  ) => Promise<void>
  /** Resuelve el caso `local-` en el acto; para un vínculo real solo dice que hay que confirmar. */
  readonly pedirQuitarVinculo: (vinculoId: string) => PedidoDeBaja
  /** La baja real, ya confirmada. No es optimista: ver el comentario de `quitarVinculo`. */
  readonly quitarVinculo: (vinculoId: string) => Promise<void>
}

/**
 * Texto del toast de éxito, siempre con verbo — a propósito **no** reusa
 * `entrada.hallazgo.nombreHallazgo` de `eventoAEntrada`: ese label está pensado para
 * leerse dentro de la tarjeta del timeline, con el chip de pieza/capa arriba dando
 * contexto (un hallazgo nuevo en "existente" es ahí solo el nombre, ej. "Caries"). Un
 * toast es una frase sola, sin nada alrededor — necesita su propio verbo siempre.
 */
function mensajeExito(accion: 'guardar' | 'quitar' | 'ejecutar', codigo: CodigoHallazgo, capa: Capa): string {
  const nombre = hallazgoDe(codigo).nombre
  if (accion === 'ejecutar') return `Plan realizado: ${nombre}`
  if (accion === 'guardar') return capa === 'requerida' ? `Planificación guardada: ${nombre}` : `Hallazgo guardado: ${nombre}`
  return capa === 'requerida' ? `Planificación descartada: ${nombre}` : `Hallazgo retirado: ${nombre}`
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
 * La rama de fallo común a las escrituras: deshacer el optimista y decir qué pasó.
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

export function useOdontograma({
  pacienteId,
  clinicId,
  uid,
  onEventoOptimista,
  onEventoDescartado,
}: UseOdontogramaParams): OdontogramaConectado {
  const [dientes, setDientes] = useState<DientesPorClave>({})
  const [vinculos, setVinculos] = useState<Record<string, Vinculo>>({})
  const [estado, setEstado] = useState<EstadoLectura>('cargando')
  const [errorDeLectura, setErrorDeLectura] = useState<string | null>(null)
  const [reintento, setReintento] = useState(0)
  const [guardando, setGuardando] = useState(false)
  const [vinculosPendientes, setVinculosPendientes] = useState<ReadonlySet<string>>(new Set())

  const { showToast } = useToast()
  const avisar = useCallback((mensaje: string) => showToast('error', mensaje), [showToast])
  const festejar = useCallback(
    (accion: 'guardar' | 'quitar' | 'ejecutar', codigo: CodigoHallazgo, capa: Capa) =>
      showToast('success', mensajeExito(accion, codigo, capa)),
    [showToast]
  )

  /**
   * Los dos callbacks del timeline viven en un ref y no en las dependencias de cada
   * escritura: la pantalla los define inline, así que cambian de identidad en cada
   * render, y meterlos como dependencia rearmaría las ocho funciones de escritura en
   * cada render con ellas cualquier efecto que dependa de alguna.
   */
  const eventosRef = useRef({ onEventoOptimista, onEventoDescartado })
  eventosRef.current = { onEventoOptimista, onEventoDescartado }

  /**
   * tempIds que el usuario borró mientras su alta seguía en vuelo. El borrado no pudo
   * ir a Firebase porque todavía no existía el id real; el handler de éxito del alta lo
   * resuelve. Si no, quedaría un vínculo huérfano en `actual/vinculos/` que la pantalla
   * no muestra y nadie puede borrar.
   */
  const bajasPendientesRef = useRef<Set<string>>(new Set())
  /** Contador propio en vez de `Date.now()`: dos altas en el mismo milisegundo colisionaban. */
  const contadorLocalRef = useRef(0)
  const nuevoTempId = useCallback(() => `local-${++contadorLocalRef.current}`, [])

  const emitir = useCallback((tempId: string, evento: EventoOdontograma) => {
    eventosRef.current.onEventoOptimista?.(tempId, evento)
  }, [])
  const descartar = useCallback((tempId: string) => {
    eventosRef.current.onEventoDescartado?.(tempId)
  }, [])

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
   * cambiarían las funciones de escritura y con ellas cualquier efecto que dependa
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
      de: CodigoHallazgoCara | null,
      nota?: string
    ) => {
      if (!contexto) return
      const tempId = nuevoTempId()
      setDientes((prev) => escribirCara(prev, pieza, cara, capa, codigo))
      emitir(tempId, {
        ts: Date.now(),
        uid: contexto.uid,
        alcance: 'CARA',
        capa,
        diente: pieza,
        cara,
        piezas: null,
        de,
        a: codigo,
        ...(nota ? { nota } : {}),
      })
      setGuardando(true)

      const { resultado, motivo } = await conMotivo((onFallo) =>
        setHallazgoCara({ ...contexto, pieza, cara, capa, codigo, de, nota, onFallo })
      )
      const deshacer = () => {
        revertirCara(pieza, cara, capa, codigo, de)
        descartar(tempId)
      }
      if (quedoFirme(resultado, motivo, 'guardar', deshacer, avisar)) festejar('guardar', codigo, capa)
      setGuardando(false)
    },
    [contexto, revertirCara, avisar, festejar, emitir, descartar, nuevoTempId]
  )

  const guardarHallazgoDiente = useCallback(
    async (
      pieza: ClavePieza,
      capa: Capa,
      codigo: CodigoHallazgoDiente,
      de: CodigoHallazgoDiente | null,
      nota?: string
    ) => {
      if (!contexto) return
      const tempId = nuevoTempId()
      setDientes((prev) => escribirDiente(prev, pieza, capa, codigo))
      emitir(tempId, {
        ts: Date.now(),
        uid: contexto.uid,
        alcance: 'DIENTE',
        capa,
        diente: pieza,
        cara: null,
        piezas: null,
        de,
        a: codigo,
        ...(nota ? { nota } : {}),
      })
      setGuardando(true)

      const { resultado, motivo } = await conMotivo((onFallo) =>
        setHallazgoDiente({ ...contexto, pieza, capa, codigo, de, nota, onFallo })
      )
      const deshacer = () => {
        revertirDiente(pieza, capa, codigo, de)
        descartar(tempId)
      }
      if (quedoFirme(resultado, motivo, 'guardar', deshacer, avisar)) festejar('guardar', codigo, capa)
      setGuardando(false)
    },
    [contexto, revertirDiente, avisar, festejar, emitir, descartar, nuevoTempId]
  )

  /**
   * Cierra un plan cargado en `requerida`: lo borra ahí y escribe el resultado (que puede
   * diferir de lo planeado) en `existente`. Del lado del service es un solo `update()`
   * atómico; acá se reflejan las dos hojas en local antes de confirmar, mismo patrón
   * optimista que el resto. Solo se emite **un** evento (la mitad `existente`) — la mitad
   * `requerida` la descarta `eventoAEntrada` a propósito, ver su comentario.
   */
  const ejecutarHallazgoCara = useCallback(
    async (
      pieza: ClavePieza,
      cara: Cara,
      hallazgoRequerido: CodigoHallazgoCara,
      hallazgoResultante: CodigoHallazgoCara,
      existenteAnterior: CodigoHallazgoCara | null,
      nota?: string
    ) => {
      if (!contexto) return
      const tempId = nuevoTempId()
      setDientes((prev) => {
        const sinRequerida = escribirCara(prev, pieza, cara, 'requerida', null)
        return escribirCara(sinRequerida, pieza, cara, 'existente', hallazgoResultante)
      })
      emitir(tempId, {
        ts: Date.now(),
        uid: contexto.uid,
        alcance: 'CARA',
        capa: 'existente',
        diente: pieza,
        cara,
        piezas: null,
        de: existenteAnterior,
        a: hallazgoResultante,
        origen: 'plan_realizado',
        ...(nota ? { nota } : {}),
      })
      setGuardando(true)

      const { resultado, motivo } = await conMotivo((onFallo) =>
        ejecutarHallazgoCaraRequerida({
          ...contexto,
          pieza,
          cara,
          hallazgoRequerido,
          hallazgoResultante,
          existenteAnterior,
          nota,
          onFallo,
        })
      )
      const deshacer = () => {
        revertirCara(pieza, cara, 'requerida', null, hallazgoRequerido)
        revertirCara(pieza, cara, 'existente', hallazgoResultante, existenteAnterior)
        descartar(tempId)
      }
      if (quedoFirme(resultado, motivo, 'guardar', deshacer, avisar)) {
        festejar('ejecutar', hallazgoResultante, 'existente')
      }
      setGuardando(false)
    },
    [contexto, revertirCara, avisar, festejar, emitir, descartar, nuevoTempId]
  )

  /** La misma ejecución de plan, a nivel pieza completa. */
  const ejecutarHallazgoDiente = useCallback(
    async (
      pieza: ClavePieza,
      hallazgoRequerido: CodigoHallazgoDiente,
      hallazgoResultante: CodigoHallazgoDiente,
      existenteAnterior: CodigoHallazgoDiente | null,
      nota?: string
    ) => {
      if (!contexto) return
      const tempId = nuevoTempId()
      setDientes((prev) => {
        const sinRequerida = escribirDiente(prev, pieza, 'requerida', null)
        return escribirDiente(sinRequerida, pieza, 'existente', hallazgoResultante)
      })
      emitir(tempId, {
        ts: Date.now(),
        uid: contexto.uid,
        alcance: 'DIENTE',
        capa: 'existente',
        diente: pieza,
        cara: null,
        piezas: null,
        de: existenteAnterior,
        a: hallazgoResultante,
        origen: 'plan_realizado',
        ...(nota ? { nota } : {}),
      })
      setGuardando(true)

      const { resultado, motivo } = await conMotivo((onFallo) =>
        ejecutarHallazgoDienteRequerido({
          ...contexto,
          pieza,
          hallazgoRequerido,
          hallazgoResultante,
          existenteAnterior,
          nota,
          onFallo,
        })
      )
      const deshacer = () => {
        revertirDiente(pieza, 'requerida', null, hallazgoRequerido)
        revertirDiente(pieza, 'existente', hallazgoResultante, existenteAnterior)
        descartar(tempId)
      }
      if (quedoFirme(resultado, motivo, 'guardar', deshacer, avisar)) {
        festejar('ejecutar', hallazgoResultante, 'existente')
      }
      setGuardando(false)
    },
    [contexto, revertirDiente, avisar, festejar, emitir, descartar, nuevoTempId]
  )

  const quitarHallazgoCara = useCallback(
    async (pieza: ClavePieza, cara: Cara, capa: Capa, de: CodigoHallazgoCara) => {
      if (!contexto) return
      const tempId = nuevoTempId()
      setDientes((prev) => escribirCara(prev, pieza, cara, capa, null))
      emitir(tempId, {
        ts: Date.now(),
        uid: contexto.uid,
        alcance: 'CARA',
        capa,
        diente: pieza,
        cara,
        piezas: null,
        de,
        a: null,
      })
      setGuardando(true)

      const { resultado, motivo } = await conMotivo((onFallo) =>
        removeHallazgo({ alcance: 'CARA', ...contexto, pieza, cara, capa, de, onFallo })
      )
      const deshacer = () => {
        revertirCara(pieza, cara, capa, null, de)
        descartar(tempId)
      }
      if (quedoFirme(resultado, motivo, 'borrar', deshacer, avisar)) festejar('quitar', de, capa)
      setGuardando(false)
    },
    [contexto, revertirCara, avisar, festejar, emitir, descartar, nuevoTempId]
  )

  const quitarHallazgoDiente = useCallback(
    async (pieza: ClavePieza, capa: Capa, de: CodigoHallazgoDiente) => {
      if (!contexto) return
      const tempId = nuevoTempId()
      setDientes((prev) => escribirDiente(prev, pieza, capa, null))
      emitir(tempId, {
        ts: Date.now(),
        uid: contexto.uid,
        alcance: 'DIENTE',
        capa,
        diente: pieza,
        cara: null,
        piezas: null,
        de,
        a: null,
      })
      setGuardando(true)

      const { resultado, motivo } = await conMotivo((onFallo) =>
        removeHallazgo({ alcance: 'DIENTE', ...contexto, pieza, capa, de, onFallo })
      )
      const deshacer = () => {
        revertirDiente(pieza, capa, null, de)
        descartar(tempId)
      }
      if (quedoFirme(resultado, motivo, 'borrar', deshacer, avisar)) festejar('quitar', de, capa)
      setGuardando(false)
    },
    [contexto, revertirDiente, avisar, festejar, emitir, descartar, nuevoTempId]
  )

  const guardarVinculo = useCallback(
    async (tipo: CodigoHallazgoMulti, capa: Capa, piezas: readonly ClavePieza[], nota?: string) => {
      if (!contexto) return

      const piezasSet: PiezasSet = {}
      piezas.forEach((clave) => {
        piezasSet[clave] = true
      })
      // El id real lo genera `push()` del lado del service; hasta el ack hace falta uno
      // para poder dibujar el tramo y para poder borrarlo si el usuario se arrepiente.
      const tempId = nuevoTempId()

      setVinculos((prev) => ({ ...prev, [tempId]: { tipo, capa, piezas: piezasSet } }))
      emitir(tempId, {
        ts: Date.now(),
        uid: contexto.uid,
        alcance: 'MULTI',
        capa,
        diente: null,
        cara: null,
        piezas: piezasSet,
        de: null,
        a: tipo,
        ...(nota ? { nota } : {}),
      })
      setGuardando(true)

      const deshacer = () => {
        setVinculos((prev) => {
          const { [tempId]: _quitado, ...resto } = prev
          return resto
        })
        descartar(tempId)
      }

      const { resultado, motivo } = await conMotivo((onFallo) =>
        setVinculo({ ...contexto, tipo, capa, piezas, nota, onFallo })
      )
      if (!quedoFirme(resultado, motivo, 'guardar', deshacer, avisar)) {
        setGuardando(false)
        return
      }
      festejar('guardar', tipo, capa)

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
      setGuardando(false)
    },
    [contexto, avisar, festejar, emitir, descartar, nuevoTempId]
  )

  /**
   * El alta todavía en vuelo (`local-...`) sigue sin confirmación: es deshacer la propia
   * acción recién hecha, no borrar un registro ya persistido, y no hay nada en Firebase
   * que limpiar todavía — se anota en `bajasPendientesRef` y `guardarVinculo` la ejecuta
   * al conocer el id real. Un vínculo real sí pide confirmación, que la arma la pantalla.
   */
  const pedirQuitarVinculo = useCallback(
    (vinculoId: string): PedidoDeBaja => {
      if (!vinculos[vinculoId]) return 'inexistente'
      if (!vinculoId.startsWith('local-')) return 'requiere_confirmacion'

      setVinculos((prev) => {
        const { [vinculoId]: _quitado, ...resto } = prev
        return resto
      })
      bajasPendientesRef.current.add(vinculoId)
      return 'deshecho'
    },
    [vinculos]
  )

  /**
   * A diferencia del resto de las escrituras del módulo, la baja de un vínculo **no** es
   * optimista: el tramo se queda dibujado con su spinner (`vinculosPendientes`) hasta que
   * Firebase confirma, en vez de desaparecer y reaparecer si falla. Es el mismo grafismo
   * el que da el feedback, así que no hace falta revertir nada.
   */
  const quitarVinculo = useCallback(
    async (vinculoId: string) => {
      const vinculo = vinculos[vinculoId]
      if (!vinculo || !contexto) return

      setVinculosPendientes((prev) => new Set(prev).add(vinculoId))

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

      setVinculosPendientes((prev) => {
        const next = new Set(prev)
        next.delete(vinculoId)
        return next
      })

      if (!quedoFirme(resultado, motivo, 'borrar', () => {}, avisar)) return

      setVinculos((prev) => {
        const { [vinculoId]: _quitado, ...resto } = prev
        return resto
      })
      emitir(nuevoTempId(), {
        ts: Date.now(),
        uid: contexto.uid,
        alcance: 'MULTI',
        capa: vinculo.capa,
        diente: null,
        cara: null,
        piezas: vinculo.piezas,
        de: vinculo.tipo,
        a: null,
      })
      festejar('quitar', vinculo.tipo, vinculo.capa)
    },
    [vinculos, contexto, avisar, festejar, emitir, nuevoTempId]
  )

  return {
    dientes,
    vinculos,
    estado,
    errorDeLectura,
    recargar,
    guardando,
    vinculosPendientes,
    guardarHallazgoCara,
    guardarHallazgoDiente,
    ejecutarHallazgoCara,
    ejecutarHallazgoDiente,
    quitarHallazgoCara,
    quitarHallazgoDiente,
    guardarVinculo,
    pedirQuitarVinculo,
    quitarVinculo,
  }
}
