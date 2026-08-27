import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve, sep } from 'node:path'
import { describe, it, expect } from 'vitest'
import {
  AZUL,
  ROJO,
  caraSemantica,
  colorDe,
  etiquetaCara,
  posicionGeometrica,
} from '@/lib/odontograma/caras'
import { PIEZAS, piezaDeCodigo, type Cuadrante } from '@/lib/odontograma/piezas'
import type { Capa, Cara, FacePosition } from '@/lib/odontograma/tipos'

const CUADRANTES: readonly Cuadrante[] = [1, 2, 3, 4, 5, 6, 7, 8]
const POSICIONES: readonly FacePosition[] = ['top', 'right', 'bottom', 'left', 'center']
const CARAS: readonly Cara[] = [
  'MESIAL',
  'DISTAL',
  'VESTIBULAR',
  'LINGUAL_PALATINO',
  'OCLUSAL_INCISAL',
]

/**
 * El lado del paciente al que pertenece cada cuadrante, escrito a mano y no importado de
 * `piezas.ts`. Si alguien toca la tabla FDI, este test tiene que romper en vez de
 * acompañar el cambio en silencio.
 */
const CUADRANTES_DERECHOS: readonly Cuadrante[] = [1, 4, 5, 8]
const CUADRANTES_IZQUIERDOS: readonly Cuadrante[] = [2, 3, 6, 7]

/** Idem para la arcada, que es el otro eje: decide `top` y `bottom`. */
const CUADRANTES_SUPERIORES: readonly Cuadrante[] = [1, 2, 5, 6]
const CUADRANTES_INFERIORES: readonly Cuadrante[] = [3, 4, 7, 8]

describe('caraSemantica', () => {
  it.each([1, 4] as const)(
    'en el cuadrante %i (hemiarcada derecha) left es DISTAL y right es MESIAL',
    (cuadrante) => {
      expect(caraSemantica('left', cuadrante)).toBe('DISTAL')
      expect(caraSemantica('right', cuadrante)).toBe('MESIAL')
    }
  )

  it.each([2, 3] as const)(
    'en el cuadrante %i (hemiarcada izquierda) left es MESIAL y right es DISTAL',
    (cuadrante) => {
      expect(caraSemantica('left', cuadrante)).toBe('MESIAL')
      expect(caraSemantica('right', cuadrante)).toBe('DISTAL')
    }
  )

  /**
   * La inversion es por hemiarcada, no por el rango 1-4. Los temporarios tienen las
   * mismas caras que los permanentes y la linea media no se mueve: el cuadrante 5 se
   * dibuja del mismo lado que el 1 y se comporta igual.
   */
  it.each([5, 8] as const)('el cuadrante temporario %i se comporta como la derecha', (cuadrante) => {
    expect(caraSemantica('left', cuadrante)).toBe('DISTAL')
    expect(caraSemantica('right', cuadrante)).toBe('MESIAL')
  })

  it.each([6, 7] as const)(
    'el cuadrante temporario %i se comporta como la izquierda',
    (cuadrante) => {
      expect(caraSemantica('left', cuadrante)).toBe('MESIAL')
      expect(caraSemantica('right', cuadrante)).toBe('DISTAL')
    }
  )

  it('no deja ningun cuadrante fuera de la inversion', () => {
    const cubiertos = [...CUADRANTES_DERECHOS, ...CUADRANTES_IZQUIERDOS].sort()
    expect(cubiertos).toEqual([...CUADRANTES])
  })

  /**
   * El vestibular da hacia la cara externa del odontograma, no siempre hacia arriba del
   * cuadrado: el arco se dibuja con las dos arcadas enfrentadas, asi que en la superior
   * "afuera" es arriba y en la inferior es abajo.
   *
   * Las cuatro combinaciones van escritas a mano, sin derivarlas de la funcion: el
   * criterio original del contrato decia "top siempre es VESTIBULAR" y era incorrecto en
   * la arcada inferior, o sea en media ficha.
   */
  it.each([1, 2, 5, 6] as const)(
    'en el cuadrante %i (arcada superior) top es VESTIBULAR y bottom es LINGUAL_PALATINO',
    (cuadrante) => {
      expect(caraSemantica('top', cuadrante)).toBe('VESTIBULAR')
      expect(caraSemantica('bottom', cuadrante)).toBe('LINGUAL_PALATINO')
    }
  )

  it.each([3, 4, 7, 8] as const)(
    'en el cuadrante %i (arcada inferior) top es LINGUAL_PALATINO y bottom es VESTIBULAR',
    (cuadrante) => {
      expect(caraSemantica('top', cuadrante)).toBe('LINGUAL_PALATINO')
      expect(caraSemantica('bottom', cuadrante)).toBe('VESTIBULAR')
    }
  )

  it('no deja ningun cuadrante fuera de la regla de arcada', () => {
    const cubiertos = [...CUADRANTES_SUPERIORES, ...CUADRANTES_INFERIORES].sort()
    expect(cubiertos).toEqual([...CUADRANTES])
  })

  /**
   * Los dos ejes son independientes: la arcada no puede estar resolviendose con la
   * hemiarcada por casualidad. El 2 es superior e izquierdo y el 4 es inferior y derecho,
   * asi que si alguien confundiera una funcion con la otra, estos dos romperian.
   */
  it('resuelve arcada y hemiarcada por separado', () => {
    expect(caraSemantica('top', 2)).toBe('VESTIBULAR')
    expect(caraSemantica('left', 2)).toBe('MESIAL')
    expect(caraSemantica('top', 4)).toBe('LINGUAL_PALATINO')
    expect(caraSemantica('left', 4)).toBe('DISTAL')
  })

  it.each(CUADRANTES)('center es OCLUSAL_INCISAL en el cuadrante %i', (cuadrante) => {
    expect(caraSemantica('center', cuadrante)).toBe('OCLUSAL_INCISAL')
  })

  /**
   * Los dos casos que B1-5 va a usar como referencia, escritos con piezas concretas:
   * clickear la misma mitad del cuadrado guarda caras distintas segun el lado.
   */
  it('la cara izquierda de la 16 es distal y la de la 26 es mesial', () => {
    expect(caraSemantica('left', piezaDeCodigo(16).cuadrante)).toBe('DISTAL')
    expect(caraSemantica('left', piezaDeCodigo(26).cuadrante)).toBe('MESIAL')
  })

  it('coincide con la hemiarcada de las 52 piezas de la tabla FDI', () => {
    for (const pieza of PIEZAS) {
      const haciaLaLineaMedia: FacePosition = pieza.hemiarcada === 'DERECHA' ? 'right' : 'left'
      expect(caraSemantica(haciaLaLineaMedia, pieza.cuadrante)).toBe('MESIAL')
    }
  })

  it('coincide con la arcada de las 52 piezas de la tabla FDI', () => {
    for (const pieza of PIEZAS) {
      const haciaAfuera: FacePosition = pieza.arcada === 'SUPERIOR' ? 'top' : 'bottom'
      const haciaAdentro: FacePosition = pieza.arcada === 'SUPERIOR' ? 'bottom' : 'top'
      expect(caraSemantica(haciaAfuera, pieza.cuadrante)).toBe('VESTIBULAR')
      expect(caraSemantica(haciaAdentro, pieza.cuadrante)).toBe('LINGUAL_PALATINO')
    }
  })
})

describe('posicionGeometrica', () => {
  it.each(CUADRANTES)('es la inversa de caraSemantica en el cuadrante %i', (cuadrante) => {
    for (const posicion of POSICIONES) {
      expect(posicionGeometrica(caraSemantica(posicion, cuadrante), cuadrante)).toBe(posicion)
    }
  })

  it.each(CUADRANTES)('y tambien la vuelta, desde la cara, en el cuadrante %i', (cuadrante) => {
    for (const cara of CARAS) {
      expect(caraSemantica(posicionGeometrica(cara, cuadrante), cuadrante)).toBe(cara)
    }
  })

  it('pinta mesial de lados opuestos segun la hemiarcada', () => {
    expect(posicionGeometrica('MESIAL', 1)).toBe('right')
    expect(posicionGeometrica('MESIAL', 2)).toBe('left')
    expect(posicionGeometrica('DISTAL', 5)).toBe('left')
    expect(posicionGeometrica('DISTAL', 6)).toBe('right')
  })

  it('pinta vestibular arriba o abajo segun la arcada', () => {
    expect(posicionGeometrica('VESTIBULAR', 1)).toBe('top')
    expect(posicionGeometrica('VESTIBULAR', 4)).toBe('bottom')
    expect(posicionGeometrica('LINGUAL_PALATINO', 6)).toBe('bottom')
    expect(posicionGeometrica('LINGUAL_PALATINO', 7)).toBe('top')
  })
})

describe('etiquetaCara', () => {
  it('dice Palatino en la arcada superior y Lingual en la inferior', () => {
    expect(etiquetaCara('LINGUAL_PALATINO', 'SUPERIOR', 'MOLAR')).toBe('Palatino')
    expect(etiquetaCara('LINGUAL_PALATINO', 'INFERIOR', 'MOLAR')).toBe('Lingual')
  })

  it('dice Oclusal en molares y premolares, Incisal en incisivos y caninos', () => {
    expect(etiquetaCara('OCLUSAL_INCISAL', 'SUPERIOR', 'MOLAR')).toBe('Oclusal')
    expect(etiquetaCara('OCLUSAL_INCISAL', 'SUPERIOR', 'PREMOLAR')).toBe('Oclusal')
    expect(etiquetaCara('OCLUSAL_INCISAL', 'SUPERIOR', 'INCISIVO')).toBe('Incisal')
    expect(etiquetaCara('OCLUSAL_INCISAL', 'SUPERIOR', 'CANINO')).toBe('Incisal')
  })

  it('las otras tres caras tienen un solo nombre', () => {
    expect(etiquetaCara('MESIAL', 'SUPERIOR', 'MOLAR')).toBe('Mesial')
    expect(etiquetaCara('MESIAL', 'INFERIOR', 'INCISIVO')).toBe('Mesial')
    expect(etiquetaCara('DISTAL', 'SUPERIOR', 'CANINO')).toBe('Distal')
    expect(etiquetaCara('VESTIBULAR', 'INFERIOR', 'PREMOLAR')).toBe('Vestibular')
  })

  /** Con piezas reales: la etiqueta sale de la tabla FDI, no de datos inventados. */
  it.each([
    [16, 'OCLUSAL_INCISAL', 'Oclusal'],
    [11, 'OCLUSAL_INCISAL', 'Incisal'],
    [13, 'OCLUSAL_INCISAL', 'Incisal'],
    [16, 'LINGUAL_PALATINO', 'Palatino'],
    [46, 'LINGUAL_PALATINO', 'Lingual'],
    [55, 'OCLUSAL_INCISAL', 'Oclusal'],
    [85, 'LINGUAL_PALATINO', 'Lingual'],
  ] as const)('la cara %s de la pieza %i se llama %s', (codigo, cara, esperado) => {
    const pieza = piezaDeCodigo(codigo)
    expect(etiquetaCara(cara, pieza.arcada, pieza.tipo)).toBe(esperado)
  })

  it('la 55 dice Oclusal: los temporarios posteriores son molares, no premolares', () => {
    expect(piezaDeCodigo(55).tipo).toBe('MOLAR')
  })
})

describe('colorDe', () => {
  it('existente es rojo y requerida es azul, la convencion de la ficha', () => {
    expect(colorDe('existente')).toBe(ROJO)
    expect(colorDe('requerida')).toBe(AZUL)
    expect(colorDe('existente').nombre).toBe('rojo')
    expect(colorDe('requerida').nombre).toBe('azul')
  })

  /**
   * El prototipo pinta al reves. Si alguien porta su mapa de colores tal cual, esto rompe.
   */
  it('no es el mapeo del prototipo', () => {
    expect(colorDe('existente').nombre).not.toBe('azul')
    expect(colorDe('requerida').nombre).not.toBe('rojo')
  })

  it('devuelve clases de Tailwind completas, no hex ni fragmentos interpolados', () => {
    for (const capa of ['existente', 'requerida'] as const) {
      const color = colorDe(capa)
      const familia = capa === 'existente' ? 'red' : 'blue'
      expect(color.texto).toBe(`text-${familia}-600`)
      expect(color.fondo).toBe(`bg-${familia}-600`)
      expect(color.borde).toBe(`border-${familia}-600`)
      expect(color.relleno).toBe(`fill-${familia}-600`)
      expect(color.trazo).toBe(`stroke-${familia}-600`)
    }
  })

  it('cubre SVG y HTML: si faltara una variante, el componente inventaria la suya', () => {
    expect(Object.keys(colorDe('existente')).sort()).toEqual([
      'borde',
      'fondo',
      'nombre',
      'relleno',
      'texto',
      'trazo',
    ])
  })

  it('los dos colores son inmutables y distintos entre si', () => {
    expect(Object.isFrozen(ROJO)).toBe(true)
    expect(Object.isFrozen(AZUL)).toBe(true)
    expect(ROJO.relleno).not.toBe(AZUL.relleno)
  })

  it('depende solo de la capa: la misma capa siempre da el mismo objeto', () => {
    const capas: readonly Capa[] = ['existente', 'requerida']
    for (const capa of capas) {
      expect(colorDe(capa)).toBe(colorDe(capa))
    }
  })
})

/**
 * Criterio de aceptacion: "ningun otro archivo del proyecto decide un color de
 * hallazgo". Se verifica sobre los archivos del odontograma -el dominio de aca y,
 * cuando exista, su UI- y no sobre todo `src`, porque el resto de la app usa rojo para
 * errores de formulario y daria falsos positivos sin parar.
 *
 * Esta como test y no como nota de review porque el que va a romperlo es el componente
 * que todavia no se escribio: el prototipo pinta con colores literales adentro del SVG,
 * y portarlo tal cual es exactamente lo que esta issue viene a evitar.
 */
describe('colorDe es el unico lugar que decide un color de hallazgo', () => {
  const RAIZ_SRC = resolve(__dirname, '..', '..', '..')
  const HEX = /#[0-9a-fA-F]{3,8}\b/
  const CLASE_DE_COLOR =
    /\b(?:text|bg|border|fill|stroke|ring|decoration|outline)-(?:red|blue|rose|sky|indigo|violet|orange|amber|green|emerald)-\d{2,3}\b/

  function archivosDelOdontograma(directorio: string): string[] {
    return readdirSync(directorio).flatMap((entrada) => {
      const ruta = join(directorio, entrada)
      if (statSync(ruta).isDirectory()) return archivosDelOdontograma(ruta)
      if (!/\.tsx?$/.test(ruta)) return []
      if (!/odontogram/i.test(ruta)) return []
      // Los dos archivos de esta issue son justamente los que tienen permitido nombrar colores.
      if (/caras\.tsx?$/.test(ruta) || /caras\.test\.tsx?$/.test(ruta)) return []
      return [ruta]
    })
  }

  const archivos = archivosDelOdontograma(RAIZ_SRC)

  it('encuentra los archivos del odontograma que hay hoy', () => {
    expect(archivos.length).toBeGreaterThan(0)
  })

  it.each(archivos)('%s no declara colores por su cuenta', (ruta) => {
    const nombre = ruta.split(sep).pop()
    const contenido = readFileSync(ruta, 'utf8')
    expect(contenido, `hex suelto en ${nombre}`).not.toMatch(HEX)
    expect(contenido, `clase de color suelta en ${nombre}`).not.toMatch(CLASE_DE_COLOR)
  })
})
