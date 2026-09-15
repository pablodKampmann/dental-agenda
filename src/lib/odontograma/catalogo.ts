/**
 * Catálogo v1 de hallazgos: las 13 entradas de la tabla del contrato de datos.
 *
 * Es el único lugar donde se decide qué hallazgos ofrece el sistema. Los servicios
 * validan el `tipo` que reciben contra el catálogo, pero no lo conocen entrada por
 * entrada: sumar o sacar un hallazgo no toca la persistencia.
 *
 * Sale de unir los nueve del prototipo con los cuatro que solo estaban en la ficha en
 * papel de la clínica. `codigo`, `abrev` y `grafismo` se copian tal cual del prototipo
 * donde existen, justamente para que el front lo consuma sin tabla de traducción.
 *
 * Sin Firebase, sin React y sin `any`.
 */

import type {
  Alcance,
  Capa,
  CodigoHallazgo,
  CodigoHallazgoCara,
  CodigoHallazgoDiente,
  CodigoHallazgoMulti,
} from './tipos'
import type { Denticion } from './piezas'

/**
 * Cómo se dibuja el hallazgo. Son los mismos valores que el `render` del prototipo
 * —`fill`, `cross`, `box`, `letter`, `screw`, `stump`— más los dos que la ficha necesita
 * y él no tiene: `equals` es el signo `=` de la extracción, y `span` el rectángulo que
 * abarca el tramo de piezas de una prótesis.
 *
 * El grafismo dice la forma, nunca el color: el color sale de la capa, vía `colorDe()`.
 * Por eso `ausente` y `retenida` pueden compartir `cross` sin ambigüedad.
 */
export type Grafismo = 'fill' | 'cross' | 'box' | 'letter' | 'screw' | 'stump' | 'equals' | 'span'

/**
 * Una entrada del catálogo. Los parámetros de tipo son los que dejan que
 * `hallazgosPorAlcance()` devuelva entradas ya angostadas: filtrar por `'CARA'` da
 * hallazgos cuyo `codigo` es un `CodigoHallazgoCara`, así que el compilador no deja
 * ofrecer una corona sobre una cara.
 */
export interface EntradaHallazgo<
  C extends CodigoHallazgo = CodigoHallazgo,
  A extends Alcance = Alcance,
> {
  /** El valor que se persiste en la hoja `caras/{CARA}/{capa}` o `diente/{capa}`. */
  readonly codigo: C
  /** Nombre completo, para el picker y la historia clínica. */
  readonly nombre: string
  /**
   * Sigla de presentación: la dibuja el grafismo `letter` y etiqueta el picker.
   * **No se persiste.** Si la odontóloga usa otras siglas se cambian acá, sin tocar un
   * solo dato guardado.
   */
  readonly abrev: string
  readonly alcance: A
  readonly grafismo: Grafismo
  /**
   * Qué capa viene preseleccionada en el picker. Las 13 aceptan las dos, así que esto
   * es un default y no una restricción — el selector de capa queda siempre habilitado.
   * Por eso no hay `capasPermitidas`: sería redundante con «siempre ambas».
   */
  readonly capaPorDefecto: Capa
  /**
   * A qué denticiones aplica. A diferencia de las capas, acá **no** son siempre las dos:
   * un implante o una prótesis fija no tienen sentido sobre una pieza temporaria, así
   * que el campo existe de verdad y `setHallazgoDiente`/`setVinculo` lo hacen cumplir.
   * Los cuatro hallazgos de cara aplican a las dos sin restricción, igual que la mayoría
   * de los de pieza entera — las excepciones son las que importan clínicamente.
   */
  readonly denticiones: readonly Denticion[]
}

/**
 * Las 13 entradas, en el orden de la tabla del contrato: primero las de cara, después
 * las de pieza entera, y al final las dos prótesis.
 *
 * `as const satisfies` es lo que sostiene el angostamiento por alcance: `as const` fija
 * los literales y `satisfies` verifica la forma de cada entrada sin borrarlos.
 */
const AMBAS_DENTICIONES: readonly Denticion[] = ['PERMANENTE', 'TEMPORARIA']
const SOLO_PERMANENTE: readonly Denticion[] = ['PERMANENTE']

export const HALLAZGOS = [
  { codigo: 'caries', nombre: 'Caries', abrev: 'C', alcance: 'CARA', grafismo: 'fill', capaPorDefecto: 'requerida', denticiones: AMBAS_DENTICIONES },
  { codigo: 'obturacion', nombre: 'Obturación', abrev: 'O', alcance: 'CARA', grafismo: 'fill', capaPorDefecto: 'existente', denticiones: AMBAS_DENTICIONES },
  { codigo: 'sellante', nombre: 'Sellante', abrev: 'S', alcance: 'CARA', grafismo: 'fill', capaPorDefecto: 'existente', denticiones: AMBAS_DENTICIONES },
  { codigo: 'fractura', nombre: 'Fractura', abrev: 'F', alcance: 'CARA', grafismo: 'fill', capaPorDefecto: 'existente', denticiones: AMBAS_DENTICIONES },
  { codigo: 'ausente', nombre: 'Pieza ausente', abrev: 'X', alcance: 'DIENTE', grafismo: 'cross', capaPorDefecto: 'existente', denticiones: AMBAS_DENTICIONES },
  { codigo: 'corona', nombre: 'Corona', abrev: 'Co', alcance: 'DIENTE', grafismo: 'box', capaPorDefecto: 'existente', denticiones: AMBAS_DENTICIONES },
  { codigo: 'endodoncia', nombre: 'Endodoncia', abrev: 'E', alcance: 'DIENTE', grafismo: 'letter', capaPorDefecto: 'existente', denticiones: AMBAS_DENTICIONES },
  // Un implante necesita hueso maduro: no va sobre una pieza temporaria.
  { codigo: 'implante', nombre: 'Implante', abrev: 'I', alcance: 'DIENTE', grafismo: 'screw', capaPorDefecto: 'existente', denticiones: SOLO_PERMANENTE },
  { codigo: 'remanente', nombre: 'Remanente radicular', abrev: 'RR', alcance: 'DIENTE', grafismo: 'stump', capaPorDefecto: 'existente', denticiones: AMBAS_DENTICIONES },
  { codigo: 'extraccion', nombre: 'Extracción', abrev: 'Ex', alcance: 'DIENTE', grafismo: 'equals', capaPorDefecto: 'requerida', denticiones: AMBAS_DENTICIONES },
  // Aspa igual que `ausente`: en la ficha las dos son un aspa y las separa el color, que
  // sale de la capa. Por eso una arranca en `existente` y la otra en `requerida`.
  //
  // No es «todavía no salió» — eso es lo normal para la edad y no se marca. Es una pieza
  // (permanente o temporaria) que no erupcionó o no exfolió cuando le tocaba: retenida o
  // impactada. Ver la nota de B4-1 en docs/odontograma-backend.md.
  { codigo: 'retenida', nombre: 'Pieza retenida o impactada', abrev: 'RI', alcance: 'DIENTE', grafismo: 'cross', capaPorDefecto: 'requerida', denticiones: AMBAS_DENTICIONES },
  // Una prótesis fija va sobre pilares permanentes: no aplica a un tramo temporario.
  { codigo: 'protesis_fija', nombre: 'Prótesis fija', abrev: 'PF', alcance: 'MULTI', grafismo: 'span', capaPorDefecto: 'existente', denticiones: SOLO_PERMANENTE },
  { codigo: 'protesis_removible', nombre: 'Prótesis removible', abrev: 'PR', alcance: 'MULTI', grafismo: 'span', capaPorDefecto: 'existente', denticiones: AMBAS_DENTICIONES },
] as const satisfies readonly EntradaHallazgo[]

/** La unión de las 13 entradas literales, cada una con su código y su alcance exactos. */
export type EntradaDelCatalogo = (typeof HALLAZGOS)[number]

/** Las entradas de un alcance dado, ya angostadas. */
export type EntradaDeAlcance<A extends Alcance> = Extract<EntradaDelCatalogo, { alcance: A }>

/**
 * El catálogo tiene que cubrir exactamente el vocabulario persistido que declara
 * `tipos.ts`, ni más ni menos. Si se agrega una entrada acá y no se agrega su código
 * allá —o al revés— estas líneas rompen el build, en vez de dejar un hallazgo que
 * aparece en el picker y después no se puede guardar.
 */
type Asegura<T extends true> = T
type MismoConjunto<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false

type _CubreElVocabulario = Asegura<MismoConjunto<EntradaDelCatalogo['codigo'], CodigoHallazgo>>
type _CubreLasCaras = Asegura<MismoConjunto<EntradaDeAlcance<'CARA'>['codigo'], CodigoHallazgoCara>>
type _CubreLosDientes = Asegura<MismoConjunto<EntradaDeAlcance<'DIENTE'>['codigo'], CodigoHallazgoDiente>>
type _CubreLosMulti = Asegura<MismoConjunto<EntradaDeAlcance<'MULTI'>['codigo'], CodigoHallazgoMulti>>

const esDeAlcance =
  <A extends Alcance>(alcance: A) =>
  (entrada: EntradaDelCatalogo): entrada is EntradaDeAlcance<A> =>
    entrada.alcance === alcance

/**
 * El catálogo particionado por alcance. Se arma una sola vez al importar el módulo: el
 * picker se abre en cada click y no tiene por qué recorrer las 13 entradas cada vez.
 */
const HALLAZGOS_POR_ALCANCE: { readonly [A in Alcance]: readonly EntradaDeAlcance<A>[] } = {
  CARA: HALLAZGOS.filter(esDeAlcance('CARA')),
  DIENTE: HALLAZGOS.filter(esDeAlcance('DIENTE')),
  MULTI: HALLAZGOS.filter(esDeAlcance('MULTI')),
}

/**
 * Los hallazgos que se ofrecen para un alcance, para armar el picker filtrado: al
 * clickear una cara aparecen solo los de cara, al clickear el diente los de pieza
 * entera. Las prótesis van aparte porque antes hay que seleccionar varias piezas.
 */
export function hallazgosPorAlcance<A extends Alcance>(alcance: A): readonly EntradaDeAlcance<A>[] {
  return HALLAZGOS_POR_ALCANCE[alcance]
}

/**
 * Índice por código. Sin prototipo, igual que el de `piezas.ts`: el guard de abajo
 * pregunta con `in`, y un objeto literal daría por válidos `'toString'`, `'constructor'`
 * y `'__proto__'` — que es exactamente el tipo de basura que puede bajar de Firebase.
 */
const indicePorCodigo = Object.create(null) as Record<CodigoHallazgo, EntradaDelCatalogo>
for (const hallazgo of HALLAZGOS) {
  indicePorCodigo[hallazgo.codigo] = hallazgo
}

export const HALLAZGOS_POR_CODIGO: Readonly<Record<CodigoHallazgo, EntradaDelCatalogo>> = indicePorCodigo

/** Guard para lo que llega de afuera: Firebase, una URL, un formulario. */
export function esCodigoHallazgo(valor: unknown): valor is CodigoHallazgo {
  return typeof valor === 'string' && valor in HALLAZGOS_POR_CODIGO
}

/** La entrada de un código ya validado. */
export function hallazgoDe(codigo: CodigoHallazgo): EntradaDelCatalogo {
  return HALLAZGOS_POR_CODIGO[codigo]
}

/**
 * Si un hallazgo tiene sentido clínico sobre una pieza de esa dentición. La autoridad
 * es esta función —vía `setHallazgoDiente` y `setVinculo`— y no el picker del front,
 * que la va a usar para filtrar opciones pero no reemplaza la validación acá.
 */
export function aplicaADenticion(codigo: CodigoHallazgo, denticion: Denticion): boolean {
  return hallazgoDe(codigo).denticiones.includes(denticion)
}
