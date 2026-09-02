import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
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
 * hallazgo". No se escanea todo `src` porque el resto de la app usa rojo para errores de
 * formulario y verde para exito, y daria falsos positivos sin parar.
 *
 * El alcance ya no es una **lista de carpetas** escrita a mano. Esa lista fue la version
 * anterior de este mismo guard, y envejecio exactamente como se temia: los componentes
 * reales del odontograma se escribieron en `src/components/patients/ui/odontogram/`, un
 * lugar que la lista no preveia, y el PR que los mergeo paso en verde sin que el guard
 * mirara uno solo de esos archivos.
 *
 * El criterio ahora es **por import**: cualquier archivo `.ts`/`.tsx` de `src` que
 * importe de `@/lib/odontograma/`, mas los hermanos de carpeta de esos archivos. Todo
 * componente que dibuje el odontograma tiene que pedirle el color a `colorDe()` o el
 * estado a los selectores, asi que cae adentro del escaneo solo, este donde este. La
 * vuelta por los hermanos de carpeta suma ademas a los archivos de esa misma pantalla que
 * no importan nada del dominio por su cuenta — `FloatingAnchor.tsx` es el caso real hoy,
 * un primitivo de popover generico sin una sola linea de logica de odontograma — sin
 * volver a escribir un nombre de carpeta a mano: si el modulo entero se muda, se sigue
 * encontrando solo porque alguno de sus archivos importa el dominio.
 *
 * Dos excepciones, ninguna por lista de archivos sueltos:
 *
 * - `src/lib/odontograma/` es el dominio mismo (con `caras.ts` exceptuado mas abajo: es
 *   el que define los colores).
 * - `src/__tests__/lib/odontograma/` — los tests del dominio — queda afuera. Un test que
 *   asevera sobre `text-red-600` no *decide* un color, lo verifica; de hecho
 *   `caras.test.ts` ya estaba exceptuado por eso mismo.
 *
 * Esta como test y no como nota de review porque el que va a romperlo es el componente
 * que todavia no se escribio: el prototipo pinta con colores literales adentro del SVG,
 * y portarlo tal cual es exactamente lo que esta issue viene a evitar.
 */
describe('colorDe es el unico lugar que decide un color de hallazgo', () => {
  const RAIZ_SRC = resolve(__dirname, '..', '..', '..')
  const DOMINIO = join(RAIZ_SRC, 'lib', 'odontograma')
  const TESTS_DEL_DOMINIO = join(RAIZ_SRC, '__tests__', 'lib', 'odontograma')

  /**
   * `teal` queda afuera a proposito: es el color primario de la app (`tailwind.config.ts`),
   * no de un hallazgo. El resto de las familias de Tailwind estan todas, incluidas las
   * que antes faltaban (`purple`, `pink`, `cyan`, `yellow`, `lime`, `fuchsia`) — un
   * hallazgo pintado en `text-purple-600` esta igual de mal y el guard tiene que
   * enterarse.
   *
   * El shade no esta escrito a mano: sale de `colorDe()` en vivo, mas abajo. Ponerlo
   * fijo en `600` fue el bug de la version anterior de este guard — si alguien cambiaba
   * `colorDe` a otro shade, el test "cubre SVG y HTML" de arriba (que si compara contra
   * `colorDe()`) hubiese roto y se hubiese arreglado ahi, pero este regex se hubiese
   * quedado en `600` y hubiese dejado de matchear nada, en verde para siempre. Derivarlo
   * ata las dos cosas: si `colorDe` cambia de shade, este patron cambia solo.
   *
   * Tampoco matchea detras de una variante de interaccion (`hover:`, `group-hover:`,
   * ...): `colorDe()` se aplica siempre sin condicionar a una interaccion, porque pinta
   * un dato (la capa del hallazgo), no un estado de hover. Los botones de "eliminar" del
   * picker y del timeline usan rojo — convencion de accion destructiva de toda la app,
   * nada que ver con esta feature — pero en otro shade (`text-red-500`) o detras de
   * `hover:` (`hover:text-red-600 hover:bg-red-50`): ninguno de los dos reproduce lo que
   * `colorDe()` devuelve, asi que no tiene que tocarlos.
   *
   * Punto ciego, a proposito: un hallazgo pintado en un shade distinto al de `colorDe()`
   * — `fill-red-500` en vez de `fill-red-600` — no lo caza este patron. Es el precio de
   * no reventar contra los botones de "eliminar" de arriba, que usan shades distintos
   * para lo mismo. Igual de no-hermetico que el resto de los guards de este archivo.
   */
  const VALORES_DE_COLORDE = (['existente', 'requerida'] as const).flatMap((capa) => {
    const color = colorDe(capa)
    return [color.texto, color.fondo, color.borde, color.relleno, color.trazo]
  })

  function shadeDe(clase: string): string {
    const shade = clase.match(/-(\d+)$/)?.[1]
    if (!shade) throw new Error(`"${clase}" no termina en "-<shade>": no se le puede sacar el shade`)
    return shade
  }

  const SHADE = shadeDe(VALORES_DE_COLORDE[0])

  const CLASE_DE_COLOR = new RegExp(
    `(?<!:)\\b(?:text|bg|border|fill|stroke|ring|decoration|outline)-` +
      `(?:red|blue|rose|sky|indigo|violet|purple|fuchsia|pink|cyan|orange|amber|yellow|lime|green|emerald)-${SHADE}\\b`
  )

  const HEX = /#[0-9a-fA-F]{3,8}\b/g

  /**
   * Un hex es sospechoso si el canal rojo o el azul domina claramente sobre los otros
   * dos: son los dos unicos colores que `colorDe()` puede devolver (existente rojo,
   * requerida azul). Los hexes reales de hoy en `Tooth.tsx` — `#94a3b8`/`#cbd5e1`
   * (contorno slate), `#0d9488` (seleccion, es el teal de la app) y `#6b7280` (numero de
   * pieza en gris) — no tienen un canal dominante por ese margen: son grises o verdosos,
   * no rojizos ni azulados. El umbral (40 sobre 255) deja bien separados los dos grupos:
   * los slate/teal de arriba quedan a 12-21 de diferencia entre canales, un rojo o azul
   * real de Tailwind arranca en 87. No es una lista de hexes permitidos que envejezca —
   * es la misma cuenta para cualquier hex que aparezca.
   */
  const UMBRAL_DOMINANCIA = 40
  function esHexDeHallazgo(hex: string): boolean {
    const digitos = hex.slice(1)
    const seis = digitos.length === 3 ? digitos.split('').map((c) => c + c).join('') : digitos.slice(0, 6)
    if (seis.length < 6 || /[^0-9a-fA-F]/.test(seis)) return true
    const r = parseInt(seis.slice(0, 2), 16)
    const g = parseInt(seis.slice(2, 4), 16)
    const b = parseInt(seis.slice(4, 6), 16)
    return r - Math.max(g, b) > UMBRAL_DOMINANCIA || b - Math.max(r, g) > UMBRAL_DOMINANCIA
  }

  const IMPORT_DOMINIO = /from\s+['"]@\/lib\/odontograma(?:\/|['"])/

  function tsxDeDominio(directorio: string): string[] {
    return readdirSync(directorio).flatMap((entrada) => {
      const ruta = join(directorio, entrada)
      if (statSync(ruta).isDirectory()) return tsxDeDominio(ruta)
      if (!/\.tsx?$/.test(ruta)) return []
      // `caras.ts` es el archivo que tiene permitido nombrar colores: es el que los define.
      if (/caras\.tsx?$/.test(ruta)) return []
      return [ruta]
    })
  }

  function todosLosFuentes(directorio: string): string[] {
    return readdirSync(directorio).flatMap((entrada) => {
      const ruta = join(directorio, entrada)
      if (statSync(ruta).isDirectory()) return todosLosFuentes(ruta)
      return /\.tsx?$/.test(ruta) ? [ruta] : []
    })
  }

  const todos = todosLosFuentes(RAIZ_SRC)
  const importadores = todos.filter(
    (ruta) =>
      !ruta.startsWith(TESTS_DEL_DOMINIO + sep) && IMPORT_DOMINIO.test(readFileSync(ruta, 'utf8'))
  )
  const carpetasDeImportadores = [...new Set(importadores.map((ruta) => join(ruta, '..')))]
  const hermanos = carpetasDeImportadores.flatMap((carpeta) =>
    readdirSync(carpeta)
      .map((entrada) => join(carpeta, entrada))
      .filter((ruta) => /\.tsx?$/.test(ruta) && statSync(ruta).isFile())
  )

  const archivos = [...new Set([...tsxDeDominio(DOMINIO), ...importadores, ...hermanos])]

  it('el dominio existe', () => {
    expect(existsSync(DOMINIO), 'falta src/lib/odontograma').toBe(true)
  })

  it('no se vacia en silencio: hoy hay al menos estos archivos', () => {
    // Piso real al momento de escribir este guard: 4 del dominio (sin `caras.ts`) + 7
    // componentes de `src/components/patients/ui/odontogram/` + 2 servicios + la pantalla
    // real (`clinicHistory/page.tsx`) + 2 tests de servicio. Si el numero baja, alguien
    // dejo de importar el dominio donde antes lo hacia, o el escaneo se rompio.
    expect(archivos.length).toBeGreaterThanOrEqual(16)
  })

  it('cubre los siete componentes reales del odontograma, no solo el dominio', () => {
    const carpetaComponentes = join(RAIZ_SRC, 'components', 'patients', 'ui', 'odontogram')
    const nombres = [
      'Tooth.tsx',
      'OdontogramaGrid.tsx',
      'Legend.tsx',
      'FindingGlyph.tsx',
      'FloatingAnchor.tsx',
      'HallazgoPicker.tsx',
      'HistorialTimeline.tsx',
    ]
    for (const nombre of nombres) {
      expect(archivos, `${nombre} no esta en el escaneo`).toContain(join(carpetaComponentes, nombre))
    }
  })

  it('cubre la pantalla donde se monta el odontograma hoy, no la ruta huerfana', () => {
    // La pantalla real es `clinicHistory/page.tsx` (ver AGENTS.md): el odontograma vive
    // fusionado ahi, no en la vieja `/patients/[id]/odontogram/page.tsx`, que quedo
    // huerfana y ya ni importa el dominio. Es la prueba en carne propia del problema que
    // este guard viene a resolver: una lista a mano hubiese seguido apuntando a la ruta
    // vieja.
    expect(archivos).toContain(
      join(RAIZ_SRC, 'app', 'patients', '[id]', 'clinicHistory', 'page.tsx')
    )
  })

  it('colorDe() devuelve un unico shade para sus diez valores', () => {
    // Si esto deja de ser cierto, `SHADE` (el primer valor, arbitrariamente) deja de
    // representar a los diez, y `CLASE_DE_COLOR` queda mal armado en silencio.
    const shades = new Set(VALORES_DE_COLORDE.map(shadeDe))
    expect([...shades], 'colorDe() ya no devuelve un shade unico: revisar CLASE_DE_COLOR a mano').toEqual([SHADE])
  })

  it('el patron de clase caza lo que colorDe() devuelve hoy, para las dos capas y los cinco roles', () => {
    for (const clase of VALORES_DE_COLORDE) {
      expect(CLASE_DE_COLOR.test(clase), clase).toBe(true)
    }
  })

  it('el patron de clase no caza ni un shade distinto ni una variante de interaccion delante', () => {
    const otroShade = String(Number(SHADE) - 100)
    expect(CLASE_DE_COLOR.test(`text-red-${otroShade}`)).toBe(false)
    expect(CLASE_DE_COLOR.test('bg-red-50')).toBe(false)
    expect(CLASE_DE_COLOR.test(`hover:text-red-${SHADE}`)).toBe(false)
    expect(CLASE_DE_COLOR.test(`hover:bg-red-50`)).toBe(false)
  })

  it('el hex sospechoso caza rojo/azul real y no el slate/teal/gris de hoy', () => {
    expect(esHexDeHallazgo('#dc2626')).toBe(true) // red-600
    expect(esHexDeHallazgo('#2563eb')).toBe(true) // blue-600
    expect(esHexDeHallazgo('#94a3b8')).toBe(false) // slate-400, contorno del diente
    expect(esHexDeHallazgo('#cbd5e1')).toBe(false) // slate-300, grilla interna
    expect(esHexDeHallazgo('#0d9488')).toBe(false) // teal-600, seleccion
    expect(esHexDeHallazgo('#6b7280')).toBe(false) // gray-500, numero de pieza
  })

  it.each(archivos)('%s no declara un color de hallazgo por su cuenta', (ruta) => {
    const nombre = ruta.split(sep).pop()
    const contenido = readFileSync(ruta, 'utf8')
    const hexSospechosos = [...contenido.matchAll(HEX)].map((m) => m[0]).filter(esHexDeHallazgo)
    expect(hexSospechosos, `hex de rojo/azul en ${nombre}: ${hexSospechosos.join(', ')}`).toEqual([])
    expect(contenido, `clase de color de hallazgo suelta en ${nombre}`).not.toMatch(CLASE_DE_COLOR)
  })
})

/**
 * Segundo monopolio de `caras.ts`: la traduccion entre la posicion que se clickea y la
 * cara que se persiste la hace solo `caraSemantica()`. Si alguien la reimplementa inline
 * —un `posicion === 'left' ? 'MESIAL' : 'DISTAL'` adentro de un componente, un mapa de
 * etiquetas portado del prototipo— tiene que escribir esos literales en algun lado. Este
 * guard busca justamente eso.
 *
 * Es el error mas caro de la feature y el que no se ve en pantalla: el dibujo queda
 * coherente y espejado, y el dato clinico queda falso en media boca. El prototipo trae
 * los dos espejados mal (`left: 'Mesial'` para las 32 piezas, y el vestibular arriba en
 * las dos arcadas), asi que portarlo tal cual es el camino por defecto.
 *
 * No pretende ser hermetico: se puede reimplementar la logica sin escribir los literales
 * (interpolando, o usando los tipos). Cubre el caso realista, que es el copy-paste.
 *
 * Alcance y sus excepciones, todas por scope y ninguna por patron:
 *
 * - `src/lib/odontograma/` es el dominio: ahi los literales son la definicion.
 * - `src/__tests__/lib/odontograma/` los asevera, que es lo contrario de reimplementarlos
 *   —este mismo archivo tiene los cinco arriba, en `CARAS`—.
 * - `src/__tests__/services/odontograma/` — los tests de `setHallazgoCara` y compania —
 *   quedan afuera por el mismo motivo que el dominio: son fixtures. `setHallazgoCara`
 *   recibe `cara` como parametro (ya una `Cara`, no una posicion clickeada), y el test
 *   tiene que pasarle una para poder llamar a la funcion. No es una traduccion
 *   `FacePosition -> Cara` reimplementada, es un valor de prueba.
 *
 * `src/services/odontograma/` (el codigo de produccion, no sus tests) sigue **adentro**
 * del escaneo a proposito. El invariante que este guard cuida es que la traduccion
 * `FacePosition -> Cara` pase solo por `caraSemantica()`, y los services estan del otro
 * lado de ese limite: reciben una `Cara` ya traducida (por el componente, via
 * `caraSemantica()`) y nunca ven un `FacePosition` — no tienen con que traducirla mal.
 * El riesgo real esta en los componentes, que si reciben el click crudo. Si algun dia un
 * service arma una `Cara` por su cuenta en vez de recibirla ya resuelta, es exactamente
 * el tipo de regresion que este guard tiene que cazar, asi que la carpeta de produccion
 * no se exceptua.
 *
 * Cubierto hoy, en limpio: todos los componentes del odontograma, la pantalla
 * (`clinicHistory/page.tsx`) y los services de produccion. Afuera: los tests del
 * dominio y los tests de los services — los dos son fixtures o aserciones, nunca
 * decisiones.
 *
 * Se busca en todo el archivo, comentarios incluidos. Un componente que necesita hablar
 * de una cara en prosa ya esta razonando sobre caras adentro del render, que es lo que la
 * arquitectura no quiere: lo que corresponde es nombrar `caraSemantica()`.
 */
describe('nadie escribe una cara a mano fuera del dominio', () => {
  const RAIZ_SRC = resolve(__dirname, '..', '..', '..')

  /**
   * Las cuatro caras que dependen del cuadrante. `OCLUSAL_INCISAL` queda afuera porque
   * `center` es invariante: escribirla a mano es feo, pero no puede guardar el dato en la
   * cara equivocada, que es lo que este guard viene a evitar.
   */
  const LITERAL_DE_CARA = /\b(?:MESIAL|DISTAL|VESTIBULAR|LINGUAL_PALATINO)\b/

  const DOMINIO = join(RAIZ_SRC, 'lib', 'odontograma')
  const TESTS_DEL_DOMINIO = join(RAIZ_SRC, '__tests__', 'lib', 'odontograma')
  const TESTS_DE_SERVICES = join(RAIZ_SRC, '__tests__', 'services', 'odontograma')
  const EXCEPTUADOS: readonly string[] = [DOMINIO, TESTS_DEL_DOMINIO, TESTS_DE_SERVICES]

  function fuentesFueraDelDominio(directorio: string): string[] {
    if (EXCEPTUADOS.includes(directorio)) return []
    return readdirSync(directorio).flatMap((entrada) => {
      const ruta = join(directorio, entrada)
      if (statSync(ruta).isDirectory()) return fuentesFueraDelDominio(ruta)
      if (!/\.tsx?$/.test(ruta)) return []
      return [ruta]
    })
  }

  const archivos = fuentesFueraDelDominio(RAIZ_SRC)

  it('escanea todo src menos el dominio y los tests que son fixtures o aserciones', () => {
    expect(archivos.length).toBeGreaterThan(0)
    for (const exceptuado of EXCEPTUADOS) {
      expect(existsSync(exceptuado), `falta ${exceptuado}`).toBe(true)
      expect(archivos.some((ruta) => ruta.startsWith(exceptuado + sep))).toBe(false)
    }
  })

  /**
   * El guard se verifica a si mismo: si el patron dejara de cazar los literales, este
   * test rompe y no hace falta acordarse de mutar un componente para descubrirlo.
   */
  it('el patron caza los literales de verdad, y el dominio esta exceptuado', () => {
    const caras = join(DOMINIO, 'caras.ts')
    expect(readFileSync(caras, 'utf8')).toMatch(LITERAL_DE_CARA)
    expect(archivos).not.toContain(caras)
  })

  it('la pestana del odontograma de la ficha esta adentro del escaneo', () => {
    expect(archivos).toContain(
      join(RAIZ_SRC, 'components', 'patients', 'ui', 'patientRecord.tsx')
    )
  })

  it('los services de produccion del odontograma siguen adentro del escaneo', () => {
    // A proposito NO exceptuados: reciben una `Cara` ya traducida y nunca ven un
    // `FacePosition`, pero si alguno empieza a construir una a mano en vez de recibirla,
    // es la regresion que este guard tiene que cazar.
    const carpetaServices = join(RAIZ_SRC, 'services', 'odontograma')
    for (const nombre of ['getOdontograma.ts', 'getEventos.ts', 'setHallazgo.ts', 'removeHallazgo.ts']) {
      const ruta = join(carpetaServices, nombre)
      expect(existsSync(ruta), `${nombre} no existe: se movio o se renombro`).toBe(true)
      expect(archivos, `${nombre} no esta en el escaneo`).toContain(ruta)
    }
  })

  it.each(archivos)('%s no escribe una cara a mano', (ruta) => {
    const contenido = readFileSync(ruta, 'utf8')
    expect(
      contenido,
      `${ruta.split(sep).pop()} nombra una cara. La traduccion posicion -> cara la hace ` +
        `caraSemantica() en src/lib/odontograma/caras.ts, y el componente le pregunta al ` +
        `estado por selectores.ts, que nunca devuelve una Cara. Si hace falta el nombre ` +
        `para mostrar, es etiquetaCara().`
    ).not.toMatch(LITERAL_DE_CARA)
  })
})
