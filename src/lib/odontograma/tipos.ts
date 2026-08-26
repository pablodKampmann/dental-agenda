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
export type Cara = 'MESIAL' | 'DISTAL' | 'VESTIBULAR' | 'LINGUAL_PALATINO' | 'OCLUSAL_INCISAL'

/**
 * Las dos capas de la ficha. `existente` es lo que el paciente ya tiene, `requerida` lo
 * que hay que hacerle — y conviven sobre la misma cara o el mismo diente: una pieza
 * puede tener una corona puesta y una endodoncia pendiente.
 *
 * El color sale de la capa y de ningún otro lado: existente = ROJO, requerida = AZUL.
 * Es la convención de la ficha en papel de la clínica, invertida respecto de MINSA.
 */
export type Capa = 'existente' | 'requerida'

/** A qué se le aplica un hallazgo: una cara, la pieza entera, o un tramo de piezas. */
export type Alcance = 'CARA' | 'DIENTE' | 'MULTI'

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
 * Prótesis fija o removible: un hallazgo que abarca varias piezas. Es un nodo aparte
 * porque no pertenece a ninguna pieza en particular.
 */
export interface Vinculo {
  readonly tipo: CodigoHallazgoMulti
  readonly capa: Capa
  /**
   * Set de Firebase (`{ t45: true, t46: true, t47: true }`), no un array: el orden lo
   * da `ordenVisual` de la tabla FDI. Que sean al menos dos, contiguas y de la misma
   * arcada lo valida el servicio de B2-4.
   */
  readonly piezas: Partial<Record<ClavePieza, true>>
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
 * Asiento del log append-only. Registra la transición (`de` → `a`) para poder
 * reconstruir la historia clínica: un borrado es un evento con `a: null`, no la
 * desaparición del evento anterior.
 */
export interface EventoOdontograma {
  /**
   * Resuelto por `serverTimestamp()`. Al escribir, el servicio manda el placeholder
   * del SDK en este campo; lo que queda guardado y se lee es el número.
   */
  readonly ts: number
  readonly uid: string
  readonly alcance: Alcance
  readonly capa: Capa
  /**
   * La pieza del asiento. En un evento `MULTI` el tramo son varias piezas y este campo
   * no las representa: cómo las identifica el evento de un vínculo lo define B2-4.
   * Las reglas de B2-1 exigen que el campo esté presente.
   */
  readonly diente: ClavePieza
  /** La cara afectada en un evento `CARA`; `null` cuando el alcance es DIENTE o MULTI. */
  readonly cara: Cara | null
  /** El hallazgo que había en esa hoja, o `null` si estaba vacía. */
  readonly de: CodigoHallazgo | null
  /** El hallazgo que quedó, o `null` si fue un borrado. */
  readonly a: CodigoHallazgo | null
}
