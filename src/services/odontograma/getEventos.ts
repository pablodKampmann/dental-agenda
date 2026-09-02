import { db } from '@/lib/firebase'
import { get, ref, query, orderByKey, limitToLast } from 'firebase/database'
import { esClavePieza } from '@/lib/odontograma/piezas'
import { hallazgosPorAlcance } from '@/lib/odontograma/catalogo'
import {
  esAlcance,
  esCapa,
  esCara,
  type CodigoHallazgoCara,
  type CodigoHallazgoDiente,
  type CodigoHallazgoMulti,
  type EventoOdontograma,
  type PiezasSet,
} from '@/lib/odontograma/tipos'

/**
 * Lectura del historial de eventos de un paciente.
 *
 * Lee `/clinics/{clinicId}/odontogramas/{pacienteId}/eventos` — hermano de `actual`,
 * nunca la misma llamada — con `orderByKey()` + `limitToLast(limite)`: las push IDs ya
 * dan el orden cronológico, sin índice extra. Se devuelve en orden inverso (más
 * reciente primero) para que la UI liste el historial sin invertirlo.
 *
 * Es solo lectura: este archivo no importa `set`/`update`/`remove`, y no hay forma de
 * llegar a uno desde acá. El log es append-only por las Security Rules de B2-1; este
 * service ni siquiera podría violarlo si quisiera.
 *
 * Mismo criterio de validación que `getOdontograma` (B2-2): un evento con forma
 * inválida se descarta entero y se loguea con `console.error`, sin romper la lectura
 * del resto del historial.
 */

export const LIMITE_EVENTOS_POR_DEFECTO = 50

export type EventoOdontogramaConId = EventoOdontograma & { readonly id: string }

const CODIGOS_CARA_VALIDOS: ReadonlySet<string> = new Set(
  hallazgosPorAlcance('CARA').map((entrada) => entrada.codigo)
)
const CODIGOS_DIENTE_VALIDOS: ReadonlySet<string> = new Set(
  hallazgosPorAlcance('DIENTE').map((entrada) => entrada.codigo)
)
const CODIGOS_MULTI_VALIDOS: ReadonlySet<string> = new Set(
  hallazgosPorAlcance('MULTI').map((entrada) => entrada.codigo)
)

/**
 * Un `limite` inválido (0, negativo, no entero) no es un fallo de lectura: `limitToLast`
 * del SDK tira excepción con 0 o negativo, y dejarla subir haría que `getEventos`
 * devuelva `null` — que en este service significa "la lectura falló" (offline, error de
 * Firebase). Un límite mal pasado se corrige al valor por defecto y la lectura sigue.
 */
function limiteValido(limite: number): number {
  if (!Number.isInteger(limite) || limite < 1) {
    console.error(
      `getEventos: límite inválido "${limite}", se usa el valor por defecto (${LIMITE_EVENTOS_POR_DEFECTO})`
    )
    return LIMITE_EVENTOS_POR_DEFECTO
  }
  return limite
}

type CodigoTransicion =
  | { readonly ok: true; readonly valor: string | null }
  | { readonly ok: false }

/**
 * Valida `de`/`a`. En Realtime Database `null` es ausencia de clave: si el evento se
 * escribió con esa hoja en `null`, acá llega `undefined`, no `null` — se normaliza de
 * vuelta a `null` para el dominio.
 */
function validarCodigoTransicion(
  valor: unknown,
  codigosValidos: ReadonlySet<string>,
  campo: 'de' | 'a',
  contexto: string
): CodigoTransicion {
  if (valor === undefined) return { ok: true, valor: null }
  if (typeof valor === 'string' && codigosValidos.has(valor)) return { ok: true, valor }

  console.error(`getEventos: campo "${campo}" inválido "${String(valor)}" en ${contexto}, se descarta el evento`)
  return { ok: false }
}

/**
 * Valida el `piezas` de un evento MULTI.
 *
 * A propósito **no** usa el criterio de `vinculos` en `getOdontograma` (B2-2), donde
 * una clave inválida se descarta y el resto del set se conserva: ahí `actual` es
 * estado vivo, se puede releer y corregir. Acá el resultado es un asiento de un log
 * append-only e inmutable — angostar el tramo no degradaría la lectura, cambiaría lo
 * que el evento dice que pasó (un puente de tres piezas quedaría registrado como de
 * dos). Por eso cualquier clave inválida descarta el evento **entero**, no solo esa
 * clave. Son dos semánticas distintas a propósito: no unificar con `getOdontograma`.
 */
function validarPiezasSet(raw: unknown, contexto: string): PiezasSet | null {
  if (typeof raw !== 'object' || raw === null) {
    console.error(`getEventos: "piezas" inválido en ${contexto}, se descarta el evento`, raw)
    return null
  }

  const piezas: PiezasSet = {}
  for (const clave of Object.keys(raw as Record<string, unknown>)) {
    if (!esClavePieza(clave)) {
      console.error(`getEventos: clave de pieza inválida "${clave}" en ${contexto}, se descarta el evento`)
      return null
    }
    piezas[clave] = true
  }

  return piezas
}

/**
 * Valida un evento crudo contra la unión discriminada por `alcance`: CARA lleva
 * `diente` + `cara`, DIENTE lleva `diente` sin `cara`, MULTI lleva `piezas` en vez de
 * `diente`. Un evento que no encaja en ninguna de las tres formas se descarta entero.
 */
function validarEvento(raw: unknown, id: string): EventoOdontogramaConId | null {
  const contexto = `evento "${id}"`

  if (typeof raw !== 'object' || raw === null) {
    console.error(`getEventos: ${contexto} con forma inválida, se descarta`, raw)
    return null
  }

  const nodo = raw as Record<string, unknown>

  if (typeof nodo.ts !== 'number') {
    console.error(`getEventos: ${contexto} sin "ts" numérico, se descarta`, nodo.ts)
    return null
  }
  if (typeof nodo.uid !== 'string') {
    console.error(`getEventos: ${contexto} sin "uid", se descarta`, nodo.uid)
    return null
  }
  if (!esCapa(nodo.capa)) {
    console.error(`getEventos: ${contexto} con capa inválida "${String(nodo.capa)}", se descarta`)
    return null
  }
  if (!esAlcance(nodo.alcance)) {
    console.error(`getEventos: ${contexto} con alcance inválido "${String(nodo.alcance)}", se descarta`)
    return null
  }

  const base = { id, ts: nodo.ts, uid: nodo.uid, capa: nodo.capa }

  if (nodo.alcance === 'CARA') {
    if (!esClavePieza(nodo.diente)) {
      console.error(`getEventos: ${contexto} de alcance CARA sin "diente" válido, se descarta`)
      return null
    }
    if (!esCara(nodo.cara)) {
      console.error(`getEventos: ${contexto} de alcance CARA sin "cara" válida, se descarta`)
      return null
    }
    const de = validarCodigoTransicion(nodo.de, CODIGOS_CARA_VALIDOS, 'de', contexto)
    const a = validarCodigoTransicion(nodo.a, CODIGOS_CARA_VALIDOS, 'a', contexto)
    if (!de.ok || !a.ok) return null

    return {
      ...base,
      alcance: 'CARA',
      diente: nodo.diente,
      cara: nodo.cara,
      piezas: null,
      de: de.valor as CodigoHallazgoCara | null,
      a: a.valor as CodigoHallazgoCara | null,
    }
  }

  if (nodo.alcance === 'DIENTE') {
    if (!esClavePieza(nodo.diente)) {
      console.error(`getEventos: ${contexto} de alcance DIENTE sin "diente" válido, se descarta`)
      return null
    }
    const de = validarCodigoTransicion(nodo.de, CODIGOS_DIENTE_VALIDOS, 'de', contexto)
    const a = validarCodigoTransicion(nodo.a, CODIGOS_DIENTE_VALIDOS, 'a', contexto)
    if (!de.ok || !a.ok) return null

    return {
      ...base,
      alcance: 'DIENTE',
      diente: nodo.diente,
      cara: null,
      piezas: null,
      de: de.valor as CodigoHallazgoDiente | null,
      a: a.valor as CodigoHallazgoDiente | null,
    }
  }

  // alcance === 'MULTI'
  const piezas = validarPiezasSet(nodo.piezas, contexto)
  if (piezas === null) return null // ya logueado adentro de validarPiezasSet
  if (Object.keys(piezas).length === 0) {
    console.error(`getEventos: ${contexto} de alcance MULTI sin piezas válidas, se descarta`)
    return null
  }
  const de = validarCodigoTransicion(nodo.de, CODIGOS_MULTI_VALIDOS, 'de', contexto)
  const a = validarCodigoTransicion(nodo.a, CODIGOS_MULTI_VALIDOS, 'a', contexto)
  if (!de.ok || !a.ok) return null

  return {
    ...base,
    alcance: 'MULTI',
    diente: null,
    cara: null,
    piezas,
    de: de.valor as CodigoHallazgoMulti | null,
    a: a.valor as CodigoHallazgoMulti | null,
  }
}

export async function getEventos(
  pacienteId: string,
  clinicId: string,
  limite: number = LIMITE_EVENTOS_POR_DEFECTO
): Promise<EventoOdontogramaConId[] | null> {
  try {
    if (!navigator.onLine) {
      throw new Error()
    }

    const dbRef = ref(db, `/clinics/${clinicId}/odontogramas/${pacienteId}/eventos`)
    const queryRef = query(dbRef, orderByKey(), limitToLast(limiteValido(limite)))
    const snapshot = await get(queryRef)

    if (!snapshot.exists()) {
      return []
    }

    // `limitToLast` + `orderByKey` entrega los últimos N en orden cronológico
    // ascendente (push IDs). Se recorre en ese orden y se invierte al final para que
    // el resultado quede en orden cronológico inverso, como pide el contrato.
    const eventos: EventoOdontogramaConId[] = []
    snapshot.forEach((child) => {
      if (!child.key) return
      const evento = validarEvento(child.val(), child.key)
      if (evento) eventos.push(evento)
    })

    return eventos.reverse()
  } catch (error) {
    console.error(error)
    return null
  }
}
