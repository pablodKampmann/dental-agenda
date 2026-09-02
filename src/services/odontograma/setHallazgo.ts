import { db } from '@/lib/firebase'
import { ref, update, push, child, serverTimestamp } from 'firebase/database'
import {
  SCHEMA_VERSION,
  type Capa,
  type Cara,
  type ClavePieza,
  type CodigoHallazgoCara,
  type CodigoHallazgoDiente,
  type EventoCara,
  type EventoDiente,
} from '@/lib/odontograma/tipos'

/**
 * Escritura de hallazgos del odontograma: `setHallazgoCara`, `setHallazgoDiente` y
 * `ejecutarHallazgoCaraRequerida` / `ejecutarHallazgoDienteRequerido`.
 *
 * Cada una escribe una sola hoja por capa (`caras/{CARA}/{capa}` o `diente/{capa}`) —
 * poner algo en `requerida` no toca `existente` sobre la misma cara/diente, porque son
 * hojas distintas del árbol. Estado y asiento de auditoría van en un solo `update()`
 * multi-path, atómico: si la escritura falla, no queda ni el estado a medio escribir
 * ni un evento sin su cambio de estado correspondiente.
 *
 * Quien llama ya tiene el valor anterior de la hoja (`de`) — lo leyó vía
 * `selectores.ts` para poder mostrarlo en pantalla — así que estas funciones no hacen
 * una lectura extra a Firebase antes de escribir. Es el mismo criterio "cliente ya
 * tiene el dato" que usa el resto del proyecto (sin servidor propio, sin API REST).
 */

/**
 * Lo que se ESCRIBE no es lo que se LEE. `ts` en los tipos de `tipos.ts` es `number`
 * porque es lo que devuelve la lectura (B2-2). Al escribir, Firebase pide el
 * placeholder de `serverTimestamp()`, que el SDK tipa como `object`, no `number`.
 * Este tipo espeja el evento real cambiando solo `ts` — es el "tipo de escritura
 * aparte" que pide docs/odontograma-pendientes.md §4.3, en vez de un `as any`.
 */
type ParaEscribir<E extends { ts: number }> = Omit<E, 'ts'> & { ts: object }

function basePath(clinicId: string, pacienteId: string): string {
  return `/clinics/${clinicId}/odontogramas/${pacienteId}`
}

/**
 * Reserva la key del próximo evento sin escribir nada todavía — `push()` sin segundo
 * argumento solo genera el id. Se usa como parte del payload del `update()` atómico.
 */
export function nuevaEventoKey(clinicId: string, pacienteId: string): string {
  const key = push(child(ref(db), `${basePath(clinicId, pacienteId)}/eventos`)).key
  if (!key) throw new Error('No se pudo generar la key del evento')
  return key
}

/** Las tres claves de `meta/` que van en todo `update()` que toque el odontograma. */
function metaPayload(clinicId: string, pacienteId: string, uid: string): Record<string, unknown> {
  const base = basePath(clinicId, pacienteId)
  return {
    [`${base}/actual/meta/updatedAt`]: serverTimestamp(),
    [`${base}/actual/meta/updatedBy`]: uid,
    [`${base}/actual/meta/schemaVersion`]: SCHEMA_VERSION,
  }
}

export { basePath }

interface SetHallazgoCaraParams {
  readonly clinicId: string
  readonly pacienteId: string
  readonly pieza: ClavePieza
  readonly cara: Cara
  readonly capa: Capa
  readonly codigo: CodigoHallazgoCara
  /** Lo que había en esa hoja antes de este cambio, o `null` si estaba vacía. */
  readonly de: CodigoHallazgoCara | null
  readonly uid: string
}

/** Escribe un hallazgo de alcance CARA en una hoja `caras/{cara}/{capa}`. */
export async function setHallazgoCara(params: SetHallazgoCaraParams): Promise<boolean | null> {
  const { clinicId, pacienteId, pieza, cara, capa, codigo, de, uid } = params
  try {
    if (!navigator.onLine) throw new Error()

    const base = basePath(clinicId, pacienteId)
    const eventoKey = nuevaEventoKey(clinicId, pacienteId)
    const evento: ParaEscribir<EventoCara> = {
      ts: serverTimestamp(),
      uid,
      alcance: 'CARA',
      capa,
      diente: pieza,
      cara,
      piezas: null,
      de,
      a: codigo,
    }

    await update(ref(db), {
      [`${base}/actual/dientes/${pieza}/caras/${cara}/${capa}`]: codigo,
      ...metaPayload(clinicId, pacienteId, uid),
      [`${base}/eventos/${eventoKey}`]: evento,
    })

    return true
  } catch (error) {
    console.error(error)
    return null
  }
}

interface SetHallazgoDienteParams {
  readonly clinicId: string
  readonly pacienteId: string
  readonly pieza: ClavePieza
  readonly capa: Capa
  readonly codigo: CodigoHallazgoDiente
  readonly de: CodigoHallazgoDiente | null
  readonly uid: string
}

/** Escribe un hallazgo de alcance DIENTE en una hoja `diente/{capa}`. */
export async function setHallazgoDiente(params: SetHallazgoDienteParams): Promise<boolean | null> {
  const { clinicId, pacienteId, pieza, capa, codigo, de, uid } = params
  try {
    if (!navigator.onLine) throw new Error()

    const base = basePath(clinicId, pacienteId)
    const eventoKey = nuevaEventoKey(clinicId, pacienteId)
    const evento: ParaEscribir<EventoDiente> = {
      ts: serverTimestamp(),
      uid,
      alcance: 'DIENTE',
      capa,
      diente: pieza,
      cara: null,
      piezas: null,
      de,
      a: codigo,
    }

    await update(ref(db), {
      [`${base}/actual/dientes/${pieza}/diente/${capa}`]: codigo,
      ...metaPayload(clinicId, pacienteId, uid),
      [`${base}/eventos/${eventoKey}`]: evento,
    })

    return true
  } catch (error) {
    console.error(error)
    return null
  }
}

interface EjecutarHallazgoCaraRequeridaParams {
  readonly clinicId: string
  readonly pacienteId: string
  readonly pieza: ClavePieza
  readonly cara: Cara
  /** Lo que había en `requerida` — lo que se está resolviendo. */
  readonly hallazgoRequerido: CodigoHallazgoCara
  /** El hallazgo resultante, que queda en `existente`. */
  readonly hallazgoResultante: CodigoHallazgoCara
  /** Lo que había en `existente` antes de esta ejecución, o `null` si estaba vacío. */
  readonly existenteAnterior: CodigoHallazgoCara | null
  readonly uid: string
}

/**
 * Cuando una prestación requerida se ejecuta: `null` en `requerida` + el hallazgo
 * resultante en `existente`, en un solo `update()` atómico. Dos hojas cambian, así
 * que se escriben **dos eventos** — uno por transición — para que el log pueda
 * reconstruir las dos por separado. Un solo evento no alcanza: `EventoBase.capa` es
 * un único valor (`existente` *o* `requerida`), no puede documentar ambas hojas a la
 * vez sin perder cuál fue cuál.
 */
export async function ejecutarHallazgoCaraRequerida(
  params: EjecutarHallazgoCaraRequeridaParams
): Promise<boolean | null> {
  const { clinicId, pacienteId, pieza, cara, hallazgoRequerido, hallazgoResultante, existenteAnterior, uid } =
    params
  try {
    if (!navigator.onLine) throw new Error()

    const base = basePath(clinicId, pacienteId)
    const eventoRequeridaKey = nuevaEventoKey(clinicId, pacienteId)
    const eventoExistenteKey = nuevaEventoKey(clinicId, pacienteId)

    const eventoRequerida: ParaEscribir<EventoCara> = {
      ts: serverTimestamp(),
      uid,
      alcance: 'CARA',
      capa: 'requerida',
      diente: pieza,
      cara,
      piezas: null,
      de: hallazgoRequerido,
      a: null,
    }
    const eventoExistente: ParaEscribir<EventoCara> = {
      ts: serverTimestamp(),
      uid,
      alcance: 'CARA',
      capa: 'existente',
      diente: pieza,
      cara,
      piezas: null,
      de: existenteAnterior,
      a: hallazgoResultante,
    }

    await update(ref(db), {
      [`${base}/actual/dientes/${pieza}/caras/${cara}/requerida`]: null,
      [`${base}/actual/dientes/${pieza}/caras/${cara}/existente`]: hallazgoResultante,
      ...metaPayload(clinicId, pacienteId, uid),
      [`${base}/eventos/${eventoRequeridaKey}`]: eventoRequerida,
      [`${base}/eventos/${eventoExistenteKey}`]: eventoExistente,
    })

    return true
  } catch (error) {
    console.error(error)
    return null
  }
}

interface EjecutarHallazgoDienteRequeridoParams {
  readonly clinicId: string
  readonly pacienteId: string
  readonly pieza: ClavePieza
  readonly hallazgoRequerido: CodigoHallazgoDiente
  readonly hallazgoResultante: CodigoHallazgoDiente
  readonly existenteAnterior: CodigoHallazgoDiente | null
  readonly uid: string
}

/** Misma operación que `ejecutarHallazgoCaraRequerida`, para hallazgos de alcance DIENTE. */
export async function ejecutarHallazgoDienteRequerido(
  params: EjecutarHallazgoDienteRequeridoParams
): Promise<boolean | null> {
  const { clinicId, pacienteId, pieza, hallazgoRequerido, hallazgoResultante, existenteAnterior, uid } = params
  try {
    if (!navigator.onLine) throw new Error()

    const base = basePath(clinicId, pacienteId)
    const eventoRequeridaKey = nuevaEventoKey(clinicId, pacienteId)
    const eventoExistenteKey = nuevaEventoKey(clinicId, pacienteId)

    const eventoRequerida: ParaEscribir<EventoDiente> = {
      ts: serverTimestamp(),
      uid,
      alcance: 'DIENTE',
      capa: 'requerida',
      diente: pieza,
      cara: null,
      piezas: null,
      de: hallazgoRequerido,
      a: null,
    }
    const eventoExistente: ParaEscribir<EventoDiente> = {
      ts: serverTimestamp(),
      uid,
      alcance: 'DIENTE',
      capa: 'existente',
      diente: pieza,
      cara: null,
      piezas: null,
      de: existenteAnterior,
      a: hallazgoResultante,
    }

    await update(ref(db), {
      [`${base}/actual/dientes/${pieza}/diente/requerida`]: null,
      [`${base}/actual/dientes/${pieza}/diente/existente`]: hallazgoResultante,
      ...metaPayload(clinicId, pacienteId, uid),
      [`${base}/eventos/${eventoRequeridaKey}`]: eventoRequerida,
      [`${base}/eventos/${eventoExistenteKey}`]: eventoExistente,
    })

    return true
  } catch (error) {
    console.error(error)
    return null
  }
}

export type { ParaEscribir }
