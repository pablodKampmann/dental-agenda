/**
 * Tabla de las 52 posiciones dentarias de la nomenclatura FDI: las 32 permanentes
 * (cuadrantes 1–4) y las 20 temporarias (cuadrantes 5–8).
 *
 * Es la única fuente de verdad sobre qué piezas existen, cómo se llaman y en qué
 * orden se dibujan. Todo lo demás del odontograma (tipos, servicios, UI) se apoya acá.
 *
 * La temporaria se genera desde el día uno aunque la v1 renderice solo la permanente:
 * encenderla es un cambio de render, no de datos.
 */

export type Denticion = 'PERMANENTE' | 'TEMPORARIA'
export type Arcada = 'SUPERIOR' | 'INFERIOR'
export type Hemiarcada = 'DERECHA' | 'IZQUIERDA'
export type TipoPieza = 'INCISIVO' | 'CANINO' | 'PREMOLAR' | 'MOLAR'
export type Cuadrante = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
export type Fila = 1 | 2 | 3 | 4

/**
 * Las cuatro filas de la ficha en papel, cada una de izquierda a derecha en pantalla.
 * El orden es dato explícito y no se deriva del código FDI: en los cuadrantes 1, 4, 5
 * y 8 la numeración decrece de izquierda a derecha, así que ordenar por código
 * ascendente da el arco espejado.
 *
 * Ojo con el número de fila: es un identificador lógico (primero las permanentes,
 * después las temporarias), no el orden de arriba hacia abajo del papel — en la ficha
 * las dos filas temporarias van *entre* las permanentes.
 */
const FILAS_CODIGOS = [
  [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
  [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
  [55, 54, 53, 52, 51, 61, 62, 63, 64, 65],
  [85, 84, 83, 82, 81, 71, 72, 73, 74, 75],
] as const

/**
 * Columna de la grilla en la que arranca cada fila. Las filas temporarias van
 * indentadas, como en la ficha: la 55 cae debajo de la 15 —su sucesora—, no de la 18.
 */
const COLUMNA_INICIAL: Readonly<Record<Fila, number>> = { 1: 1, 2: 1, 3: 4, 4: 4 }

/** 11–48 y 51–85: los 52 códigos FDI válidos, como unión de literales. */
export type CodigoPieza = (typeof FILAS_CODIGOS)[number][number]

/**
 * Clave de la pieza en Firebase. El prefijo `t` no es cosmético: con claves enteras
 * ("16", "46") el SDK de Realtime Database devuelve un array de JavaScript en lugar de
 * un objeto, y la forma del dato cambia según cuántos dientes haya cargados.
 */
export type ClavePieza = `t${CodigoPieza}`

export interface Pieza {
  /** Código FDI: 11–48 (permanentes) y 51–85 (temporarias). */
  readonly codigo: CodigoPieza
  /** Clave de persistencia: `t` + código. Nunca un entero puro. */
  readonly clave: ClavePieza
  readonly cuadrante: Cuadrante
  /** 1–8 en permanentes, 1–5 en temporarias. Cuenta desde la línea media. */
  readonly posicion: number
  readonly denticion: Denticion
  readonly arcada: Arcada
  /** Lado del paciente, no de quien mira la pantalla. */
  readonly hemiarcada: Hemiarcada
  readonly tipo: TipoPieza
  /** 1–2 permanentes (superior, inferior), 3–4 temporarias (superior, inferior). */
  readonly fila: Fila
  /** Posición de izquierda a derecha dentro de su fila: 1–16 en las permanentes, 1–10 en las temporarias. */
  readonly ordenVisual: number
  /**
   * Columna 1–16 en la grilla común a las cuatro filas. Las temporarias arrancan en la
   * 4, así que cada una queda alineada con su sucesora permanente (55 con 15, 61 con 21).
   */
  readonly columna: number
}

const ARCADAS_SUPERIORES: readonly Cuadrante[] = [1, 2, 5, 6]
const HEMIARCADAS_DERECHAS: readonly Cuadrante[] = [1, 4, 5, 8]

/**
 * Arcada a la que pertenece un cuadrante.
 *
 * Vive acá por la misma razón que `hemiarcadaDe()`: es una propiedad de la pieza que
 * `crearPieza()` usa para poblar `pieza.arcada`, y `caras.ts` la necesita para resolver
 * la geometría. Con una sola definición, la tabla FDI y la geometría no pueden discrepar.
 *
 * En la geometría de caras decide `top` y `bottom`: el vestibular da hacia la cara
 * externa del odontograma, que es arriba en la arcada superior y abajo en la inferior.
 */
export function arcadaDe(cuadrante: Cuadrante): Arcada {
  return ARCADAS_SUPERIORES.includes(cuadrante) ? 'SUPERIOR' : 'INFERIOR'
}

/**
 * Lado del paciente al que pertenece un cuadrante. Es del paciente, no de quien mira la
 * pantalla: el cuadrante 1 se dibuja a la izquierda y es el lado DERECHO.
 *
 * Vive acá y no en `caras.ts` porque es una propiedad de la pieza, y `crearPieza()` la
 * usa para poblar `pieza.hemiarcada`: con una sola definición, la tabla FDI y la
 * geometría de caras no pueden discrepar.
 *
 * Aplica igual a las temporarias — 5 y 8 son derechas, 6 y 7 izquierdas—, que es
 * justamente lo que se pierde si alguien razona en términos de «cuadrantes 1 a 4».
 */
export function hemiarcadaDe(cuadrante: Cuadrante): Hemiarcada {
  return HEMIARCADAS_DERECHAS.includes(cuadrante) ? 'DERECHA' : 'IZQUIERDA'
}

function tipoDe(posicion: number, denticion: Denticion): TipoPieza {
  if (posicion <= 2) return 'INCISIVO'
  if (posicion === 3) return 'CANINO'
  // Las temporarias no tienen premolares: 54, 55, 64, 65, 74, 75, 84 y 85 son molares.
  if (posicion <= 5 && denticion === 'PERMANENTE') return 'PREMOLAR'
  return 'MOLAR'
}

function crearPieza(codigo: CodigoPieza, fila: Fila, ordenVisual: number): Pieza {
  const cuadrante = Math.floor(codigo / 10) as Cuadrante
  const posicion = codigo % 10
  const denticion: Denticion = cuadrante <= 4 ? 'PERMANENTE' : 'TEMPORARIA'

  return {
    codigo,
    clave: `t${codigo}`,
    cuadrante,
    posicion,
    denticion,
    arcada: arcadaDe(cuadrante),
    hemiarcada: hemiarcadaDe(cuadrante),
    tipo: tipoDe(posicion, denticion),
    fila,
    ordenVisual,
    columna: COLUMNA_INICIAL[fila] + ordenVisual - 1,
  }
}

/** Las 52 piezas, ya ordenadas por `fila` y `ordenVisual`. */
export const PIEZAS: readonly Pieza[] = FILAS_CODIGOS.flatMap((codigos, indiceFila) =>
  codigos.map((codigo, indiceEnFila) => crearPieza(codigo, (indiceFila + 1) as Fila, indiceEnFila + 1))
)

/**
 * Índice por clave de persistencia, para resolver `t16` sin recorrer la tabla.
 *
 * Sin prototipo a propósito: los guards de abajo preguntan con `in`, y un objeto
 * literal heredaría `constructor`, `toString` y compañía. Con `{}` como base,
 * `esClavePieza('toString')` daría `true` y el guard dejaría pasar basura de Firebase.
 */
const indicePorClave = Object.create(null) as Record<ClavePieza, Pieza>
for (const pieza of PIEZAS) {
  indicePorClave[pieza.clave] = pieza
}

export const PIEZAS_POR_CLAVE: Readonly<Record<ClavePieza, Pieza>> = indicePorClave

/** Clave de persistencia de un código FDI, con el literal exacto en el tipo. */
export function clavePieza<C extends CodigoPieza>(codigo: C): `t${C}` {
  return `t${codigo}`
}

export function esCodigoPieza(valor: unknown): valor is CodigoPieza {
  return typeof valor === 'number' && `t${valor}` in PIEZAS_POR_CLAVE
}

export function esClavePieza(valor: unknown): valor is ClavePieza {
  return typeof valor === 'string' && valor in PIEZAS_POR_CLAVE
}

export function piezaDeClave(clave: ClavePieza): Pieza {
  return PIEZAS_POR_CLAVE[clave]
}

export function piezaDeCodigo(codigo: CodigoPieza): Pieza {
  return PIEZAS_POR_CLAVE[clavePieza(codigo)]
}

/** Las piezas de una fila, de izquierda a derecha. */
export function piezasDeFila(fila: Fila): readonly Pieza[] {
  return PIEZAS.filter((pieza) => pieza.fila === fila)
}

export function piezasDeDenticion(denticion: Denticion): readonly Pieza[] {
  return PIEZAS.filter((pieza) => pieza.denticion === denticion)
}
