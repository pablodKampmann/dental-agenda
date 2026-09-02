/**
 * Tipos del dominio del odontograma. Es el vocabulario que comparten las constantes,
 * los servicios y la UI: nadie redeclara la forma de un hallazgo por su cuenta.
 *
 * Espeja el árbol de `/clinics/{clinicId}/odontogramas/{pacienteId}/` documentado en
 * `docs/odontograma-backend.md`. Cambiar algo de acá es cambiar el contrato de datos.
 *
 * Sin Firebase, sin React y sin `any`.
 */

import type { ClavePieza, CodigoPieza } from './piezas'

/**
 * Las claves de pieza no se redeclaran: son las de la tabla FDI, derivadas de los 52
 * códigos. Se re-exportan para que el resto del odontograma tenga un solo import.
 */
export type { ClavePieza, CodigoPieza }

/** Las cinco caras clínicas. Es lo que se persiste, no lo que se clickea. */
export const CARAS = ['MESIAL', 'DISTAL', 'VESTIBULAR', 'LINGUAL_PALATINO', 'OCLUSAL_INCISAL'] as const
export type Cara = (typeof CARAS)[number]

/**
 * Un `Set` resuelve la pertenencia sin tocar la cadena de prototipos —`.has()` no es
 * `in`—, así que alcanza con esto. `piezas.ts` necesita `Object.create(null)` porque su
 * índice se consulta con `in` sobre un objeto; acá no hace falta ese cuidado.
 */
const CARAS_VALIDAS: ReadonlySet<string> = new Set<string>(CARAS)

/** Guard para lo que llega de afuera: Firebase, una URL, un formulario. */
export function esCara(valor: unknown): valor is Cara {
  return typeof valor === 'string' && CARAS_VALIDAS.has(valor)
}

/**
 * Las dos capas de la ficha. `existente` es lo que el paciente ya tiene, `requerida` lo
 * que hay que hacerle — y conviven sobre la misma cara o el mismo diente: una pieza
 * puede tener una corona puesta y una endodoncia pendiente.
 *
 * El color sale de la capa y de ningún otro lado: existente = ROJO, requerida = AZUL.
 * Es la convención de la ficha en papel de la clínica, invertida respecto de MINSA.
 */
export const CAPAS = ['existente', 'requerida'] as const
export type Capa = (typeof CAPAS)[number]

const CAPAS_VALIDAS: ReadonlySet<string> = new Set<string>(CAPAS)

/** Guard para lo que llega de afuera: Firebase, una URL, un formulario. */
export function esCapa(valor: unknown): valor is Capa {
  return typeof valor === 'string' && CAPAS_VALIDAS.has(valor)
}

/** A qué se le aplica un hallazgo: una cara, la pieza entera, o un tramo de piezas. */
export const ALCANCES = ['CARA', 'DIENTE', 'MULTI'] as const
export type Alcance = (typeof ALCANCES)[number]

const ALCANCES_VALIDOS: ReadonlySet<string> = new Set<string>(ALCANCES)

/**
 * Guard para lo que llega de afuera. Sin consumidor todavía —hoy `Alcance` solo se usa
 * en tipos que ya validan lo que envuelven—, pero B2-5 (`getEventos`) va a leer
 * `evento.alcance` crudo de Firebase y va a necesitar justo esto. Se agrega ahora para
 * que ese servicio no tenga que reinventar la lista a mano, que es la duplicación que
 * esta refactorización vino a sacar.
 */
export function esAlcance(valor: unknown): valor is Alcance {
  return typeof valor === 'string' && ALCANCES_VALIDOS.has(valor)
}

/**
 * Posición geométrica dentro del cuadrado del diente: lo que el usuario clickea.
 * No es una cara: `left` es distal en los cuadrantes 1 y 4, y mesial en los 2 y 3.
 * La traducción a `Cara` la hace `caraSemantica()` y es el único lugar donde ocurre.
 */
export type FacePosition = 'top' | 'right' | 'bottom' | 'left' | 'center'

/** Hallazgos de alcance CARA: se guardan en una cara puntual. */
export type CodigoHallazgoCara = 'caries' | 'obturacion' | 'sellante' | 'fractura'

/** Hallazgos de alcance DIENTE: aplican a la pieza entera. */
export type CodigoHallazgoDiente =
  | 'ausente'
  | 'corona'
  | 'endodoncia'
  | 'implante'
  | 'remanente'
  | 'extraccion'
  | 'no_erupcionada'

/** Hallazgos de alcance MULTI: abarcan un tramo de piezas y viven en `vinculos`. */
export type CodigoHallazgoMulti = 'protesis_fija' | 'protesis_removible'

/**
 * Los 13 hallazgos del catálogo v1. Viven acá y no en el catálogo porque son valores
 * persistidos —lo que queda escrito en la hoja `caras/{CARA}/{capa}`— y porque los
 * tipos de abajo los necesitan. El catálogo de B1-3 los describe (nombre, grafismo,
 * capa por defecto); esta unión declara cuáles existen.
 */
export type CodigoHallazgo = CodigoHallazgoCara | CodigoHallazgoDiente | CodigoHallazgoMulti

/**
 * El nodo de una cara con hallazgos: una hoja por capa. Las dos pueden estar cargadas
 * a la vez (una obturación existente y una caries requerida sobre la misma cara), y
 * escribir una no toca la otra. Una cara sin hallazgos no existe en el árbol.
 */
export type HallazgoCara = Partial<Record<Capa, CodigoHallazgoCara>>

/** Lo mismo para la pieza entera: el nodo `diente/`, una hoja por capa. */
export type HallazgoDiente = Partial<Record<Capa, CodigoHallazgoDiente>>

/**
 * Estado de una pieza. Las dos ramas son opcionales porque solo se persiste lo anómalo:
 * un diente sano no está en el árbol, y uno con caries no tiene nodo `diente`.
 * Preguntarle cosas a este estado es tarea de los selectores de B1-5, no del render.
 */
export interface EstadoDiente {
  /** Solo las caras que tienen al menos un hallazgo. */
  readonly caras?: Partial<Record<Cara, HallazgoCara>>
  /** Hallazgos de la pieza entera: corona, ausente, endodoncia, extracción. */
  readonly diente?: HallazgoDiente
}

/**
 * Set de piezas tal como lo guarda Firebase: `{ t45: true, t46: true, t47: true }`.
 * No es un array — el orden de las piezas lo da `ordenVisual` de la tabla FDI, no el
 * JSON, y las claves llevan el prefijo `t` por la misma razón que en `dientes`.
 */
export type PiezasSet = Partial<Record<ClavePieza, true>>

/**
 * Prótesis fija o removible: un hallazgo que abarca varias piezas. Es un nodo aparte
 * porque no pertenece a ninguna pieza en particular.
 */
export interface Vinculo {
  readonly tipo: CodigoHallazgoMulti
  readonly capa: Capa
  /**
   * Que sean al menos dos, contiguas y de la misma arcada lo valida el servicio de B2-4.
   */
  readonly piezas: PiezasSet
}

/** Versión del esquema con la que se escribe hoy. Un solo lugar donde vive el número. */
export const SCHEMA_VERSION = 1

/** Cabecera de `actual/`: quién tocó el odontograma por última vez y cuándo. */
export interface MetaOdontograma {
  /** Resuelto por `serverTimestamp()` al escribir, nunca por el reloj del cliente. */
  readonly updatedAt: number
  /** `uid` del usuario logueado. */
  readonly updatedBy: string
  readonly schemaVersion: typeof SCHEMA_VERSION
}

/**
 * El mapa de piezas con hallazgos. Mapa y nunca array: por eso las claves llevan el
 * prefijo `t` (ver `piezas.ts`). Parcial porque las piezas sanas no están en el árbol
 * — un odontograma vacío es `{}`, no 52 entradas.
 */
export type DientesPorClave = Partial<Record<ClavePieza, EstadoDiente>>

/**
 * El nodo `actual/` completo, que es lo que devuelve la lectura del odontograma.
 * `meta` es `null` mientras el paciente no tenga nada escrito: la pantalla dibuja la
 * boca sana sin ramas especiales.
 */
export interface OdontogramaActual {
  readonly dientes: DientesPorClave
  /** Indexado por el `pushId` que generó el alta del vínculo. */
  readonly vinculos: Record<string, Vinculo>
  readonly meta: MetaOdontograma | null
}

/**
 * Lo que comparte todo asiento del log. `de` → `a` registra la transición, para poder
 * reconstruir la historia clínica: un borrado es un evento con `a: null`, no la
 * desaparición del evento anterior.
 *
 * El parámetro es el subconjunto del catálogo que puede aparecer en ese alcance: un
 * evento de cara no puede asentar una corona.
 */
interface EventoBase<C extends CodigoHallazgo> {
  /**
   * Resuelto por `serverTimestamp()`. Al escribir, el servicio manda el placeholder
   * del SDK en este campo; lo que queda guardado y se lee es el número.
   */
  readonly ts: number
  readonly uid: string
  readonly capa: Capa
  /** El hallazgo que había en esa hoja, o `null` si estaba vacía. */
  readonly de: C | null
  /** El hallazgo que quedó, o `null` si fue un borrado. */
  readonly a: C | null
}

/** Asiento sobre una cara: la única variante que lleva `cara`. */
export interface EventoCara extends EventoBase<CodigoHallazgoCara> {
  readonly alcance: 'CARA'
  readonly diente: ClavePieza
  readonly cara: Cara
  readonly piezas: null
}

/** Asiento sobre la pieza entera: corona, ausente, endodoncia, extracción. */
export interface EventoDiente extends EventoBase<CodigoHallazgoDiente> {
  readonly alcance: 'DIENTE'
  readonly diente: ClavePieza
  readonly cara: null
  readonly piezas: null
}

/**
 * Asiento de un vínculo multi-pieza. Guarda el **tramo entero** en `piezas` y deja
 * `diente` en `null`: un puente abarca varias piezas y elegir una arbitraria haría que
 * el asiento no represente lo que pasó.
 */
export interface EventoMulti extends EventoBase<CodigoHallazgoMulti> {
  readonly alcance: 'MULTI'
  readonly diente: null
  readonly cara: null
  readonly piezas: PiezasSet
}

/**
 * Asiento del log append-only, discriminado por `alcance`. La unión es lo que hace
 * cumplir la regla del contrato —se llena `diente` o `piezas`, según el alcance— sin
 * que ningún servicio tenga que acordarse de chequearla.
 */
export type EventoOdontograma = EventoCara | EventoDiente | EventoMulti
