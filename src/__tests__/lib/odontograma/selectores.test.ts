import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'
import { caraSemantica } from '@/lib/odontograma/caras'
import { PIEZAS, piezaDeCodigo, type Cuadrante } from '@/lib/odontograma/piezas'
import {
  AMBAS_CAPAS,
  capasVisibles,
  filasDelArco,
  hallazgoDeCara,
  hallazgoDeDiente,
  tieneHallazgos,
  type VisibilidadCapas,
} from '@/lib/odontograma/selectores'
import type {
  Capa,
  Cara,
  ClavePieza,
  CodigoHallazgoCara,
  CodigoHallazgoDiente,
  CodigoPieza,
  DientesPorClave,
  FacePosition,
} from '@/lib/odontograma/tipos'

const CUADRANTES: readonly Cuadrante[] = [1, 2, 3, 4, 5, 6, 7, 8]
const POSICIONES: readonly FacePosition[] = ['top', 'right', 'bottom', 'left', 'center']
const CAPAS: readonly Capa[] = ['existente', 'requerida']

/** Un estado con un solo hallazgo de cara, escrito directo en la cara semantica. */
function conCara(
  clave: ClavePieza,
  cara: Cara,
  capa: Capa,
  codigo: CodigoHallazgoCara
): DientesPorClave {
  return { [clave]: { caras: { [cara]: { [capa]: codigo } } } }
}

/** Un estado con un solo hallazgo de pieza entera. */
function conDiente(clave: ClavePieza, capa: Capa, codigo: CodigoHallazgoDiente): DientesPorClave {
  return { [clave]: { diente: { [capa]: codigo } } }
}

describe('filasDelArco', () => {
  /**
   * Los dos ordenes van escritos a mano y no derivados de `piezas.ts`. Si alguien toca
   * la tabla FDI, esto tiene que romper en vez de acompanar el cambio en silencio.
   */
  const FILA_SUPERIOR_PERMANENTE = [
    18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
  ].map((codigo) => `t${codigo}`)
  const FILA_INFERIOR_PERMANENTE = [
    48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
  ].map((codigo) => `t${codigo}`)
  const FILA_SUPERIOR_TEMPORARIA = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65].map(
    (codigo) => `t${codigo}`
  )
  const FILA_INFERIOR_TEMPORARIA = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75].map(
    (codigo) => `t${codigo}`
  )

  it('la vista PERMANENTE da 2 filas de 16 en el orden del papel', () => {
    expect(filasDelArco('PERMANENTE')).toEqual([
      FILA_SUPERIOR_PERMANENTE,
      FILA_INFERIOR_PERMANENTE,
    ])
  })

  /**
   * El orden de render es 1, 3, 4, 2 y va escrito a mano por la misma razon: el numero
   * de fila de `piezas.ts` es un identificador logico -primero las permanentes, despues
   * las temporarias- y no el orden de arriba hacia abajo. En la ficha en papel las
   * temporarias van *entre* las permanentes, cada una del lado de su propia arcada.
   *
   * Un `filasDelArco` que ordene por numero de fila devuelve 1, 2, 3, 4 y deja las dos
   * temporarias abajo de todo: dibuja una boca que no existe.
   */
  it('la vista MIXTA da 4 filas en el orden 1, 3, 4, 2', () => {
    expect(filasDelArco('MIXTA')).toEqual([
      FILA_SUPERIOR_PERMANENTE,
      FILA_SUPERIOR_TEMPORARIA,
      FILA_INFERIOR_TEMPORARIA,
      FILA_INFERIOR_PERMANENTE,
    ])
  })

  it('en MIXTA las temporarias van entre las permanentes, no al final', () => {
    const denticiones = filasDelArco('MIXTA').map(
      (fila) => piezaDeCodigo(Number(fila[0].slice(1)) as CodigoPieza).denticion
    )
    expect(denticiones).toEqual(['PERMANENTE', 'TEMPORARIA', 'TEMPORARIA', 'PERMANENTE'])
  })

  it('MIXTA contiene las 52 piezas y PERMANENTE solo las 32', () => {
    expect(filasDelArco('MIXTA').flat()).toHaveLength(52)
    expect(filasDelArco('PERMANENTE').flat()).toHaveLength(32)
    expect(new Set(filasDelArco('MIXTA').flat()).size).toBe(PIEZAS.length)
  })

  it('devuelve claves con prefijo, nunca codigos crudos', () => {
    for (const clave of filasDelArco('MIXTA').flat()) {
      expect(clave).toMatch(/^t\d\d$/)
    }
  })

  /** Es una constante de la tabla FDI, no un calculo: el componente la pide por render. */
  it('devuelve siempre la misma referencia para la misma vista', () => {
    expect(filasDelArco('MIXTA')).toBe(filasDelArco('MIXTA'))
    expect(filasDelArco('PERMANENTE')).toBe(filasDelArco('PERMANENTE'))
  })
})

describe('hallazgoDeCara', () => {
  /**
   * El eje horizontal: `left` es distal en la hemiarcada derecha del paciente -que se
   * dibuja a la izquierda- y mesial en la izquierda.
   */
  it('la cara left de la 16 lee de DISTAL y la de la 26 lee de MESIAL', () => {
    expect(hallazgoDeCara(conCara('t16', 'DISTAL', 'existente', 'obturacion'), 16, 'left', 'existente')).toBe('obturacion')
    expect(hallazgoDeCara(conCara('t16', 'MESIAL', 'existente', 'obturacion'), 16, 'left', 'existente')).toBeUndefined()

    expect(hallazgoDeCara(conCara('t26', 'MESIAL', 'existente', 'obturacion'), 26, 'left', 'existente')).toBe('obturacion')
    expect(hallazgoDeCara(conCara('t26', 'DISTAL', 'existente', 'obturacion'), 26, 'left', 'existente')).toBeUndefined()
  })

  /**
   * El eje vertical, que es el otro y es independiente: `top` es vestibular en la arcada
   * superior y lingual/palatino en la inferior, porque el vestibular da hacia la cara
   * externa del odontograma y las dos arcadas se dibujan enfrentadas.
   *
   * Esta separado del caso de arriba a proposito. Un selector que hardcodee
   * `top -> VESTIBULAR` -que es lo que hace el prototipo para las 32 piezas- pasa el
   * criterio horizontal completo y guarda mal media boca sin ningun error visible.
   */
  it('la cara top de la 16 lee de VESTIBULAR y la de la 46 lee de LINGUAL_PALATINO', () => {
    expect(hallazgoDeCara(conCara('t16', 'VESTIBULAR', 'existente', 'caries'), 16, 'top', 'existente')).toBe('caries')
    expect(hallazgoDeCara(conCara('t16', 'LINGUAL_PALATINO', 'existente', 'caries'), 16, 'top', 'existente')).toBeUndefined()

    expect(hallazgoDeCara(conCara('t46', 'LINGUAL_PALATINO', 'existente', 'caries'), 46, 'top', 'existente')).toBe('caries')
    expect(hallazgoDeCara(conCara('t46', 'VESTIBULAR', 'existente', 'caries'), 46, 'top', 'existente')).toBeUndefined()
  })

  it('la misma posicion top resuelve caras distintas segun la arcada', () => {
    const soloVestibularArriba: DientesPorClave = {
      ...conCara('t16', 'VESTIBULAR', 'requerida', 'caries'),
      ...conCara('t46', 'VESTIBULAR', 'requerida', 'caries'),
    }
    expect(hallazgoDeCara(soloVestibularArriba, 16, 'top', 'requerida')).toBe('caries')
    expect(hallazgoDeCara(soloVestibularArriba, 46, 'top', 'requerida')).toBeUndefined()
    expect(hallazgoDeCara(soloVestibularArriba, 46, 'bottom', 'requerida')).toBe('caries')
  })

  it('center es oclusal en cualquier cuadrante', () => {
    for (const cuadrante of CUADRANTES) {
      const pieza = PIEZAS.find((p) => p.cuadrante === cuadrante)!
      const estado = conCara(pieza.clave, 'OCLUSAL_INCISAL', 'requerida', 'sellante')
      expect(hallazgoDeCara(estado, pieza.codigo, 'center', 'requerida')).toBe('sellante')
    }
  })

  /**
   * La vuelta completa: lo que se escribe en la cara que resuelve `caraSemantica()` es
   * lo que se lee pasando esa misma posicion, para las 5 posiciones por los 8 cuadrantes
   * -temporarios incluidos-. Cubre tambien que no lea de una cara vecina.
   */
  it.each(CUADRANTES)('lee de la cara que escribio caraSemantica en el cuadrante %i', (cuadrante) => {
    const pieza = PIEZAS.find((p) => p.cuadrante === cuadrante)!

    for (const posicion of POSICIONES) {
      const cara = caraSemantica(posicion, cuadrante)
      const estado = conCara(pieza.clave, cara, 'existente', 'fractura')

      expect(hallazgoDeCara(estado, pieza.codigo, posicion, 'existente')).toBe('fractura')

      const otras = POSICIONES.filter((otra) => caraSemantica(otra, cuadrante) !== cara)
      for (const otra of otras) {
        expect(hallazgoDeCara(estado, pieza.codigo, otra, 'existente')).toBeUndefined()
      }
    }
  })

  it('las dos capas conviven sobre la misma cara y se leen por separado', () => {
    const estado: DientesPorClave = {
      t16: { caras: { VESTIBULAR: { existente: 'obturacion', requerida: 'caries' } } },
    }
    expect(hallazgoDeCara(estado, 16, 'top', 'existente')).toBe('obturacion')
    expect(hallazgoDeCara(estado, 16, 'top', 'requerida')).toBe('caries')
  })

  it('acepta el codigo FDI o la clave de persistencia, y dan lo mismo', () => {
    const estado = conCara('t46', 'LINGUAL_PALATINO', 'existente', 'caries')
    expect(hallazgoDeCara(estado, 46, 'top', 'existente')).toBe('caries')
    expect(hallazgoDeCara(estado, 't46', 'top', 'existente')).toBe('caries')
  })

  it('las claves que devuelve filasDelArco sirven directo como argumento', () => {
    const estado = conCara('t38', 'OCLUSAL_INCISAL', 'requerida', 'caries')
    for (const fila of filasDelArco('MIXTA')) {
      for (const clave of fila) {
        expect(hallazgoDeCara(estado, clave, 'center', 'requerida')).toBe(
          clave === 't38' ? 'caries' : undefined
        )
      }
    }
  })
})

describe('hallazgoDeDiente', () => {
  it('lee la hoja de la capa pedida', () => {
    const estado: DientesPorClave = { t25: { diente: { existente: 'corona', requerida: 'endodoncia' } } }
    expect(hallazgoDeDiente(estado, 25, 'existente')).toBe('corona')
    expect(hallazgoDeDiente(estado, 25, 'requerida')).toBe('endodoncia')
  })

  it('es independiente de las caras: una corona no tapa una caries de la oclusal', () => {
    const estado: DientesPorClave = {
      t25: { diente: { existente: 'corona' }, caras: { OCLUSAL_INCISAL: { requerida: 'caries' } } },
    }
    expect(hallazgoDeDiente(estado, 25, 'existente')).toBe('corona')
    expect(hallazgoDeDiente(estado, 25, 'requerida')).toBeUndefined()
    expect(hallazgoDeCara(estado, 25, 'center', 'requerida')).toBe('caries')
  })

  it('una pieza con hallazgos de cara no tiene hallazgo de diente', () => {
    const estado = conCara('t16', 'MESIAL', 'requerida', 'caries')
    expect(hallazgoDeDiente(estado, 16, 'requerida')).toBeUndefined()
  })
})

describe('tieneHallazgos', () => {
  it('es false en una pieza sin nada', () => {
    expect(tieneHallazgos({}, 16)).toBe(false)
  })

  it('es true con un hallazgo de cara, de diente, o de cualquier capa', () => {
    expect(tieneHallazgos(conCara('t16', 'DISTAL', 'requerida', 'caries'), 16)).toBe(true)
    expect(tieneHallazgos(conDiente('t16', 'existente', 'corona'), 16)).toBe(true)
    expect(tieneHallazgos(conDiente('t16', 'requerida', 'extraccion'), 16)).toBe(true)
  })

  it('no confunde a los vecinos: el hallazgo es de la pieza que se pregunta', () => {
    const estado = conCara('t16', 'DISTAL', 'requerida', 'caries')
    expect(tieneHallazgos(estado, 16)).toBe(true)
    expect(tieneHallazgos(estado, 17)).toBe(false)
    expect(tieneHallazgos(estado, 15)).toBe(false)
  })

  /**
   * Los vinculos multi-pieza son un nodo aparte y no cuelgan de ninguna pieza: una pieza
   * dentro de un puente, sin hallazgos propios, esta vacia para este selector. El tramo
   * lo dibuja el vinculo, que es B2-4.
   */
  it('mira solo el nodo de la pieza', () => {
    expect(tieneHallazgos({ t45: {}, t46: {}, t47: {} }, 46)).toBe(false)
  })
})

describe('capasVisibles', () => {
  const SOLO_EXISTENTE: VisibilidadCapas = { existente: true, requerida: false }
  const SOLO_REQUERIDA: VisibilidadCapas = { existente: false, requerida: true }
  const APAGADAS: VisibilidadCapas = { existente: false, requerida: false }

  const conLasDos: DientesPorClave = {
    t16: { caras: { VESTIBULAR: { existente: 'obturacion', requerida: 'caries' } } },
  }

  it('devuelve las capas que estan prendidas y ademas tienen algo cargado', () => {
    expect(capasVisibles(conLasDos, 16, AMBAS_CAPAS)).toEqual(['existente', 'requerida'])
    expect(capasVisibles(conLasDos, 16, SOLO_EXISTENTE)).toEqual(['existente'])
    expect(capasVisibles(conLasDos, 16, SOLO_REQUERIDA)).toEqual(['requerida'])
    expect(capasVisibles(conLasDos, 16, APAGADAS)).toEqual([])
  })

  it('no devuelve una capa prendida que no tiene nada cargado en esa pieza', () => {
    const soloRequerida = conCara('t16', 'DISTAL', 'requerida', 'caries')
    expect(capasVisibles(soloRequerida, 16, AMBAS_CAPAS)).toEqual(['requerida'])
  })

  it('junta lo de las caras con lo del diente', () => {
    const estado: DientesPorClave = {
      t25: { diente: { existente: 'corona' }, caras: { OCLUSAL_INCISAL: { requerida: 'caries' } } },
    }
    expect(capasVisibles(estado, 25)).toEqual(['existente', 'requerida'])
  })

  /** Lo requerido se dibuja encima de lo existente, asi que el orden no puede variar. */
  it('el orden es siempre existente y despues requerida', () => {
    const alReves: DientesPorClave = {
      t16: { caras: { MESIAL: { requerida: 'caries' }, DISTAL: { existente: 'obturacion' } } },
    }
    expect(capasVisibles(alReves, 16)).toEqual(['existente', 'requerida'])
  })

  it('por defecto muestra las dos capas, como la ficha en papel', () => {
    expect(capasVisibles(conLasDos, 16)).toEqual(capasVisibles(conLasDos, 16, AMBAS_CAPAS))
    expect(AMBAS_CAPAS).toEqual({ existente: true, requerida: true })
  })
})

/**
 * Criterio de aceptacion: "consultar una pieza sin hallazgos no rompe ni obliga a
 * chequear `undefined` en el render".
 *
 * No es un borde: un odontograma vacio es `{}` y no 52 entradas, asi que la boca sana es
 * el caso mas frecuente y el que corre en cada pantalla. El contrato que sostienen estos
 * tests es uno solo para los cuatro selectores: los dos `hallazgoDe*` devuelven
 * `undefined`, `tieneHallazgos` devuelve `false` y `capasVisibles` devuelve un array
 * vacio -y siempre la misma referencia, para no romper un `useMemo` rio abajo-.
 */
describe('una pieza sin hallazgos', () => {
  /**
   * Las cuatro formas en las que llega una pieza vacia. Firebase nunca guarda un objeto
   * vacio, pero un borrado deja el nodo asi en memoria hasta que se relee.
   */
  const VACIOS: readonly [string, DientesPorClave][] = [
    ['odontograma vacio', {}],
    ['otra pieza cargada', conCara('t26', 'MESIAL', 'requerida', 'caries')],
    ['nodo de pieza sin ramas', { t16: {} }],
    ['ramas presentes pero vacias', { t16: { caras: {}, diente: {} } }],
    ['cara presente sin capas', { t16: { caras: { VESTIBULAR: {} } } }],
  ]

  it.each(VACIOS)('con %s, hallazgoDeCara devuelve undefined en las 5 posiciones', (_, estado) => {
    for (const posicion of POSICIONES) {
      for (const capa of CAPAS) {
        expect(hallazgoDeCara(estado, 16, posicion, capa)).toBeUndefined()
      }
    }
  })

  it.each(VACIOS)('con %s, hallazgoDeDiente devuelve undefined en las dos capas', (_, estado) => {
    for (const capa of CAPAS) {
      expect(hallazgoDeDiente(estado, 16, capa)).toBeUndefined()
    }
  })

  it.each(VACIOS)('con %s, tieneHallazgos devuelve false', (_, estado) => {
    expect(tieneHallazgos(estado, 16)).toBe(false)
  })

  it.each(VACIOS)('con %s, capasVisibles devuelve un array vacio', (_, estado) => {
    expect(capasVisibles(estado, 16)).toEqual([])
  })

  /** Es el camino normal, no el borde: no puede asignar un array nuevo por pieza y render. */
  it('capasVisibles devuelve siempre la misma referencia vacia', () => {
    expect(capasVisibles({}, 16)).toBe(capasVisibles({}, 48))
    expect(capasVisibles({}, 16)).toBe(capasVisibles({ t16: {} }, 16))
    expect(Object.isFrozen(capasVisibles({}, 16))).toBe(true)
  })

  /** Y las 52 piezas de la vista mixta se pueden recorrer contra un estado vacio. */
  it('las 52 piezas se consultan contra un odontograma vacio sin romper', () => {
    for (const clave of filasDelArco('MIXTA').flat()) {
      expect(tieneHallazgos({}, clave)).toBe(false)
      expect(capasVisibles({}, clave)).toEqual([])
      expect(hallazgoDeCara({}, clave, 'center', 'existente')).toBeUndefined()
      expect(hallazgoDeDiente({}, clave, 'existente')).toBeUndefined()
    }
  })
})

/**
 * Criterio de aceptacion: "el componente pasa posiciones y nunca ve la cara semantica".
 *
 * Se verifica sobre el codigo y no sobre el comportamiento porque es una regla de
 * superficie: el dia que alguien agregue un `hallazgoDeCaraSemantica(estado, pieza,
 * cara, capa)` "para un caso puntual", los tests de comportamiento siguen en verde y la
 * traduccion cuadrante <-> cara se filtra al render igual.
 */
describe('Cara no sale de este modulo', () => {
  const FUENTE = readFileSync(
    resolve(__dirname, '..', '..', '..', 'lib', 'odontograma', 'selectores.ts'),
    'utf8'
  )
  const SIN_COMENTARIOS = FUENTE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')

  it('no nombra el tipo Cara en ninguna firma', () => {
    expect(SIN_COMENTARIOS).not.toMatch(/\bCara\b/)
  })

  it('lo unico que importa de caras.ts es caraSemantica', () => {
    const imports = SIN_COMENTARIOS.match(/import[\s\S]*?from '\.\/caras'/g) ?? []
    expect(imports).toHaveLength(1)
    expect(imports[0]).toContain('caraSemantica')
    expect(imports[0]).not.toContain('posicionGeometrica')
  })

  it('la firma publica habla de FacePosition', () => {
    expect(SIN_COMENTARIOS).toMatch(/posicion: FacePosition/)
  })
})

/**
 * Estas funciones son dominio puro: las consume el render, pero no saben que existe ni
 * React ni Firebase. Es lo que las deja testear sin un solo mock.
 */
describe('selectores.ts es dominio puro', () => {
  const FUENTE = readFileSync(
    resolve(__dirname, '..', '..', '..', 'lib', 'odontograma', 'selectores.ts'),
    'utf8'
  )

  it('no importa Firebase ni React', () => {
    expect(FUENTE).not.toMatch(/from ['"](firebase|react)/)
    expect(FUENTE).not.toMatch(/@\/lib\/firebase/)
    expect(FUENTE).not.toMatch(/@\/services\//)
  })

  it('no usa any', () => {
    expect(FUENTE.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/\bany\b/)
  })

  it('no muta el estado que recibe', () => {
    const estado: DientesPorClave = Object.freeze(
      conCara('t16', 'VESTIBULAR', 'existente', 'obturacion')
    )
    expect(() => {
      hallazgoDeCara(estado, 16, 'top', 'existente')
      hallazgoDeDiente(estado, 16, 'existente')
      tieneHallazgos(estado, 16)
      capasVisibles(estado, 16)
    }).not.toThrow()
    expect(estado).toEqual(conCara('t16', 'VESTIBULAR', 'existente', 'obturacion'))
  })
})
