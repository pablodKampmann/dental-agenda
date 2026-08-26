/**
 * Geometría de caras y derivación de color.
 *
 * Traduce entre lo que el usuario clickea —una posición dentro del cuadrado del diente,
 * con los mismos nombres que usa el prototipo (`top`, `right`, `bottom`, `left`,
 * `center`)— y lo que se persiste: una cara clínica. Y resuelve el color de un hallazgo
 * a partir de su capa.
 *
 * **Este es el único lugar del proyecto donde se hacen esas dos traducciones.** La del
 * lado, porque `left` no significa lo mismo en las dos hemiarcadas y hacerlo inline en
 * el render garantiza que se rompa; la del color, porque la convención de la ficha en
 * papel está invertida respecto del prototipo y no puede quedar duplicada en cada SVG.
 *
 * Sin Firebase, sin React y sin `any`.
 */

import { hemiarcadaDe, type Arcada, type Cuadrante, type TipoPieza } from './piezas'
import type { Capa, Cara, FacePosition } from './tipos'

/**
 * De la posición clickeada a la cara que se guarda.
 *
 * `top`, `bottom` y `center` son invariantes: el arco se dibuja siempre con el
 * vestibular arriba y el lingual/palatino abajo, en los ocho cuadrantes.
 *
 * `left` y `right` **no lo son**, y ese es el punto de esta función. Mesial es «hacia la
 * línea media» y distal «alejándose de ella»; la línea media cae en el centro de la
 * pantalla, así que en la hemiarcada derecha del paciente —que se dibuja a la
 * izquierda— la cara mesial queda a la derecha del cuadrado, y al revés en la
 * izquierda. Si esto no se aplica, el sistema guarda «caries en mesial» cuando la caries
 * está en distal, en media boca, sin ningún error visible.
 *
 * El criterio es la hemiarcada, no el rango 1–4: los cuadrantes temporarios 5 y 8 son
 * del lado derecho y se comportan como el 1 y el 4.
 */
export function caraSemantica(posicion: FacePosition, cuadrante: Cuadrante): Cara {
  switch (posicion) {
    case 'top':
      return 'VESTIBULAR'
    case 'bottom':
      return 'LINGUAL_PALATINO'
    case 'center':
      return 'OCLUSAL_INCISAL'
    case 'left':
      return hemiarcadaDe(cuadrante) === 'DERECHA' ? 'DISTAL' : 'MESIAL'
    case 'right':
      return hemiarcadaDe(cuadrante) === 'DERECHA' ? 'MESIAL' : 'DISTAL'
  }
}

/**
 * La inversa de `caraSemantica()`: dónde pintar una cara que ya está guardada.
 *
 * Es una biyección exacta para cada cuadrante — `posicionGeometrica(caraSemantica(p, q), q)`
 * devuelve `p`—, y tiene que seguir siéndolo: leer y escribir la misma cara por caminos
 * distintos es la forma silenciosa de que el dibujo deje de representar el dato.
 */
export function posicionGeometrica(cara: Cara, cuadrante: Cuadrante): FacePosition {
  switch (cara) {
    case 'VESTIBULAR':
      return 'top'
    case 'LINGUAL_PALATINO':
      return 'bottom'
    case 'OCLUSAL_INCISAL':
      return 'center'
    case 'MESIAL':
      return hemiarcadaDe(cuadrante) === 'DERECHA' ? 'right' : 'left'
    case 'DISTAL':
      return hemiarcadaDe(cuadrante) === 'DERECHA' ? 'left' : 'right'
  }
}

/**
 * Cómo se le dice a la cara en la clínica. Dos de las cinco no tienen un nombre único:
 *
 * - `LINGUAL_PALATINO` es **Palatino** en la arcada superior (da contra el paladar) y
 *   **Lingual** en la inferior (da contra la lengua). Se persiste una sola cara porque
 *   es la misma cara anatómica; cambia el nombre, no el dato.
 * - `OCLUSAL_INCISAL` es **Oclusal** en molares y premolares, que ocluyen con una
 *   superficie masticatoria, e **Incisal** en incisivos y caninos, que tienen un borde.
 *
 * Es presentación pura: etiqueta el popover y la historia clínica, no se guarda.
 */
export function etiquetaCara(cara: Cara, arcada: Arcada, tipo: TipoPieza): string {
  switch (cara) {
    case 'MESIAL':
      return 'Mesial'
    case 'DISTAL':
      return 'Distal'
    case 'VESTIBULAR':
      return 'Vestibular'
    case 'LINGUAL_PALATINO':
      return arcada === 'SUPERIOR' ? 'Palatino' : 'Lingual'
    case 'OCLUSAL_INCISAL':
      return tipo === 'MOLAR' || tipo === 'PREMOLAR' ? 'Oclusal' : 'Incisal'
  }
}

/**
 * El color de una capa, en las cuatro formas en las que el front lo va a necesitar.
 *
 * Son clases de Tailwind y no hex porque es el estándar del proyecto: el color se
 * declara con la paleta (`text-teal-700`, `bg-red-50`) y el hex queda reservado para
 * props de librerías externas que piden un string de color. Las cuatro variantes están
 * porque el mismo hallazgo se pinta como SVG (`relleno` para las formas y el texto del
 * grafismo `letter`, `trazo` para los contornos) y como HTML (`texto` y `fondo` en el
 * picker, la leyenda y la historia clínica). Si faltara alguna, el que la necesite la
 * escribe a mano en su componente y se acabó el «un solo lugar decide el color».
 *
 * Los literales están completos y sin interpolar a propósito: `tailwind.config.ts`
 * escanea `./src/**\/*.{ts,tsx}`, así que las clases se generan desde este archivo.
 */
export interface ColorHallazgo {
  /** El color de la ficha, para tests y etiquetas accesibles. No es una clase CSS. */
  readonly nombre: 'rojo' | 'azul'
  /** Color de texto en HTML. */
  readonly texto: string
  /** Fondo en HTML: chips de la leyenda, badges del picker. */
  readonly fondo: string
  /** Borde en HTML. */
  readonly borde: string
  /** `fill` en SVG: relleno de las formas y color del texto del grafismo `letter`. */
  readonly relleno: string
  /** `stroke` en SVG: contornos, aspas, el `=` de la extracción. */
  readonly trazo: string
}

/** Lo que el paciente ya tiene. Rojo, por la ficha en papel de la clínica. */
export const ROJO: ColorHallazgo = Object.freeze({
  nombre: 'rojo',
  texto: 'text-red-600',
  fondo: 'bg-red-600',
  borde: 'border-red-600',
  relleno: 'fill-red-600',
  trazo: 'stroke-red-600',
})

/** Lo que hay que hacerle. Azul, por la ficha en papel de la clínica. */
export const AZUL: ColorHallazgo = Object.freeze({
  nombre: 'azul',
  texto: 'text-blue-600',
  fondo: 'bg-blue-600',
  borde: 'border-blue-600',
  relleno: 'fill-blue-600',
  trazo: 'stroke-blue-600',
})

const COLOR_POR_CAPA: Readonly<Record<Capa, ColorHallazgo>> = Object.freeze({
  existente: ROJO,
  requerida: AZUL,
})

/**
 * El color de un hallazgo sale de su capa y de nada más. No del tipo de hallazgo, no de
 * la cara, no de si el diente está ausente: `existente` es rojo y `requerida` es azul.
 *
 * Que sea así es lo que deja que `ausente` y `no_erupcionada` compartan el grafismo
 * `cross` sin ambigüedad — en la ficha las dos son un aspa y se distinguen por el color.
 *
 * **Ojo con el prototipo: lo tiene al revés.** La convención que manda es la de la ficha
 * en papel de la odontóloga, no la del código que estamos portando.
 */
export function colorDe(capa: Capa): ColorHallazgo {
  return COLOR_POR_CAPA[capa]
}
