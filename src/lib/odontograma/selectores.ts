/**
 * Selectores de vista del odontograma.
 *
 * Las preguntas que el componente le hace al estado, resueltas acá y no inline en el
 * JSX. Son funciones puras: reciben el mapa de piezas tal como lo devuelve la lectura,
 * y devuelven lo que el render necesita dibujar.
 *
 * **El componente pasa posiciones geométricas y nunca ve una `Cara`.** `hallazgoDeCara()`
 * recibe `top` o `left` y resuelve la cara semántica por dentro, con `caraSemantica()`
 * de `caras.ts`. Ese es el punto del módulo: la traducción cuadrante ↔ cara ya vive en
 * un solo lugar, y estos selectores existen para que el render tampoco tenga que
 * llamarla — si tuviera que hacerlo, tarde o temprano alguien la saltea. Por eso `Cara`
 * no aparece en la firma de nada de este archivo.
 *
 * **Consultar una pieza sin hallazgos es el camino normal, no el borde.** Un odontograma
 * vacío es `{}`, no 52 entradas: la boca sana es el estado más frecuente y el que se
 * dibuja en cada pantalla. Los dos `hallazgoDe*` devuelven `undefined`, `tieneHallazgos`
 * devuelve `false` y `capasVisibles` devuelve un array vacío — siempre la misma
 * referencia, así que ese camino no asigna memoria ni rompe la igualdad referencial de
 * un `useMemo` río abajo.
 *
 * Sin Firebase, sin React y sin `any`.
 */

import { caraSemantica } from './caras'
import {
  piezaDeClave,
  piezaDeCodigo,
  piezasDeFila,
  type ClavePieza,
  type CodigoPieza,
  type Fila,
  type Pieza,
} from './piezas'
import type {
  Capa,
  CodigoHallazgoCara,
  CodigoHallazgoDiente,
  DientesPorClave,
  EstadoDiente,
  FacePosition,
} from './tipos'

/**
 * Modo de vista del arco: cuántas filas se dibujan.
 *
 * **No es `Denticion`.** `Denticion` describe a la pieza —una pieza es permanente o
 * temporaria, nunca mixta— y vive en `piezas.ts`. Esto describe a la pantalla: `MIXTA`
 * muestra las dos denticiones a la vez, que es lo que tiene la ficha en papel. Meter
 * `'MIXTA'` en `Denticion` haría que la tabla FDI acepte un valor que ninguna pieza
 * puede tener.
 */
export type VistaArcada = 'PERMANENTE' | 'MIXTA'

/**
 * Una pieza, nombrada por su código FDI (`16`) o por su clave de persistencia (`'t16'`).
 *
 * Acepta las dos porque las dos aparecen en el render: `filasDelArco()` devuelve claves
 * —son las que indexan el estado— y el resto del componente razona en códigos, que es
 * lo que ve la odontóloga. Obligar a convertir en cada llamada sería ruido en el JSX,
 * justamente lo que este módulo existe para evitar.
 */
export type ReferenciaPieza = CodigoPieza | ClavePieza

function piezaDe(referencia: ReferenciaPieza): Pieza {
  return typeof referencia === 'number' ? piezaDeCodigo(referencia) : piezaDeClave(referencia)
}

const clavesDeFila = (fila: Fila): readonly ClavePieza[] =>
  Object.freeze(piezasDeFila(fila).map((pieza) => pieza.clave))

const FILA_PERMANENTE_SUPERIOR = clavesDeFila(1)
const FILA_PERMANENTE_INFERIOR = clavesDeFila(2)
const FILA_TEMPORARIA_SUPERIOR = clavesDeFila(3)
const FILA_TEMPORARIA_INFERIOR = clavesDeFila(4)

/**
 * El orden de render de cada vista, de arriba hacia abajo en pantalla.
 *
 * **El número de fila de `piezas.ts` no es el orden de render.** Ahí `fila` es un
 * identificador lógico —1 y 2 las permanentes, 3 y 4 las temporarias— y en la ficha en
 * papel las temporarias van *entre* las permanentes: superior permanente, superior
 * temporaria, inferior temporaria, inferior permanente. O sea 1, 3, 4, 2.
 *
 * Tiene que ser así porque el arco se dibuja con las dos arcadas enfrentadas: las
 * temporarias son las que quedan más cerca del plano oclusal, cada una del lado de su
 * propia arcada. Ordenar por número de fila las mandaría a las dos abajo de todo, con
 * la superior temporaria más lejos de la superior permanente que la inferior. Es el
 * mismo error de fondo que ordenar las piezas por código FDI ascendente: confundir un
 * identificador con un orden.
 *
 * Precalculadas y congeladas: son constantes de la tabla FDI, no dependen del estado, y
 * el componente las pide en cada render.
 */
const FILAS_POR_VISTA: Readonly<Record<VistaArcada, readonly (readonly ClavePieza[])[]>> =
  Object.freeze({
    PERMANENTE: Object.freeze([FILA_PERMANENTE_SUPERIOR, FILA_PERMANENTE_INFERIOR]),
    MIXTA: Object.freeze([
      FILA_PERMANENTE_SUPERIOR,
      FILA_TEMPORARIA_SUPERIOR,
      FILA_TEMPORARIA_INFERIOR,
      FILA_PERMANENTE_INFERIOR,
    ]),
  })

/**
 * Las filas del arco en orden de render, cada una de izquierda a derecha.
 *
 * `'PERMANENTE'` da 2 filas de 16 y `'MIXTA'` da 4. Devuelve claves porque son las que
 * indexan el estado: el componente mapea la fila y ya tiene con qué preguntar.
 *
 * Siempre la misma referencia para la misma vista — es una constante, no un cálculo.
 */
export function filasDelArco(vista: VistaArcada): readonly (readonly ClavePieza[])[] {
  return FILAS_POR_VISTA[vista]
}

/**
 * El hallazgo de una cara, buscado por la posición que se clickeó.
 *
 * Recibe `top`, `right`, `bottom`, `left` o `center` —las mismas cinco del cuadrado del
 * prototipo— y resuelve la cara semántica por dentro. El componente no traduce nada y
 * no ve la cara: en el cuadrante 1 `left` lee de `DISTAL` y en el 2 lee de `MESIAL`;
 * en el 1 `top` lee de `VESTIBULAR` y en el 4 lee de `LINGUAL_PALATINO`.
 *
 * `undefined` cuando esa cara no tiene nada en esa capa, que es el caso normal.
 */
export function hallazgoDeCara(
  estado: DientesPorClave,
  pieza: ReferenciaPieza,
  posicion: FacePosition,
  capa: Capa
): CodigoHallazgoCara | undefined {
  const { clave, cuadrante } = piezaDe(pieza)
  return estado[clave]?.caras?.[caraSemantica(posicion, cuadrante)]?.[capa]
}

/**
 * El hallazgo de la pieza entera —corona, ausente, endodoncia, extracción— en una capa.
 *
 * `undefined` cuando no hay ninguno. Es independiente de las caras: una pieza puede
 * tener una corona existente y una caries requerida en la oclusal al mismo tiempo.
 */
export function hallazgoDeDiente(
  estado: DientesPorClave,
  pieza: ReferenciaPieza,
  capa: Capa
): CodigoHallazgoDiente | undefined {
  return estado[piezaDe(pieza).clave]?.diente?.[capa]
}

/**
 * Qué capas tienen algo cargado en una pieza, mirando las caras y el diente.
 *
 * Devuelve los dos booleanos y no un array para que `tieneHallazgos()` y
 * `capasVisibles()` compartan un solo recorrido: preguntan lo mismo y el render las
 * llama una vez por pieza.
 */
function capasConHallazgo(estadoDiente: EstadoDiente | undefined): Record<Capa, boolean> {
  const encontradas: Record<Capa, boolean> = { existente: false, requerida: false }
  if (!estadoDiente) return encontradas

  const { caras, diente } = estadoDiente
  const nodos = caras ? [...Object.values(caras), diente] : [diente]

  for (const hallazgos of nodos) {
    if (!hallazgos) continue
    if (hallazgos.existente !== undefined) encontradas.existente = true
    if (hallazgos.requerida !== undefined) encontradas.requerida = true
  }

  return encontradas
}

/**
 * Si la pieza tiene al menos un hallazgo, en cualquier cara, diente o capa.
 *
 * Es lo que distingue el estado vacío del diente: sin esto el render tendría que
 * recorrer el nodo a mano para decidir si dibuja el cuadrado limpio.
 *
 * Mira solo el nodo de la pieza. Los vínculos multi-pieza son un nodo aparte y no
 * pertenecen a ninguna pieza en particular: una pieza dentro de un puente, sin hallazgos
 * propios, da `false` acá y el tramo lo dibuja el vínculo.
 */
export function tieneHallazgos(estado: DientesPorClave, pieza: ReferenciaPieza): boolean {
  const { existente, requerida } = capasConHallazgo(estado[piezaDe(pieza).clave])
  return existente || requerida
}

/** Qué capas prendió el conmutador. Son independientes: pueden estar las dos o ninguna. */
export type VisibilidadCapas = Readonly<Record<Capa, boolean>>

/** El default del conmutador: la ficha en papel muestra lo existente y lo requerido junto. */
export const AMBAS_CAPAS: VisibilidadCapas = Object.freeze({ existente: true, requerida: true })

/**
 * Los cuatro resultados posibles, congelados y compartidos.
 *
 * Son cuatro y no más —dos capas, cada una presente o no— así que devolver una constante
 * en vez de construir el array evita que una pieza sana asigne memoria en cada render y
 * mantiene la igualdad referencial que necesita un `useMemo` río abajo. Con 52 piezas
 * redibujándose por cada click, el caso vacío es el que más corre.
 */
const NINGUNA: readonly Capa[] = Object.freeze([])
const SOLO_EXISTENTE: readonly Capa[] = Object.freeze(['existente'])
const SOLO_REQUERIDA: readonly Capa[] = Object.freeze(['requerida'])
const LAS_DOS: readonly Capa[] = Object.freeze(['existente', 'requerida'])

/**
 * Las capas que hay que pintar en una pieza: las que el conmutador tiene prendidas **y**
 * además tienen algo cargado ahí.
 *
 * Las dos condiciones juntas son el punto. Solo con la visibilidad, el render dibujaría
 * la capa prendida sobre piezas que no tienen nada; solo con el estado, el conmutador no
 * apagaría nada. Devolver la intersección deja al componente iterando el resultado sin
 * ningún `if`.
 *
 * Orden fijo: `existente` y después `requerida`, para que lo que hay que hacer quede
 * dibujado encima de lo que ya está hecho. Array vacío cuando no hay nada que pintar,
 * que es el caso normal.
 */
export function capasVisibles(
  estado: DientesPorClave,
  pieza: ReferenciaPieza,
  visibilidad: VisibilidadCapas = AMBAS_CAPAS
): readonly Capa[] {
  const hallazgos = capasConHallazgo(estado[piezaDe(pieza).clave])
  const existente = hallazgos.existente && visibilidad.existente
  const requerida = hallazgos.requerida && visibilidad.requerida

  if (existente && requerida) return LAS_DOS
  if (existente) return SOLO_EXISTENTE
  if (requerida) return SOLO_REQUERIDA
  return NINGUNA
}
