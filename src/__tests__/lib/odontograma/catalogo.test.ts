import { describe, it, expect } from 'vitest'
import {
  HALLAZGOS,
  HALLAZGOS_POR_CODIGO,
  esCodigoHallazgo,
  hallazgoDe,
  hallazgosPorAlcance,
  type EntradaDelCatalogo,
} from '@/lib/odontograma/catalogo'
import type {
  Alcance,
  CodigoHallazgo,
  EstadoDiente,
  EventoOdontograma,
  Vinculo,
} from '@/lib/odontograma/tipos'

/**
 * Copia independiente de la tabla del contrato de datos
 * (`docs/odontograma-backend.md`, sección «Catálogo v1»). Está acá a propósito y
 * duplicada a mano: si alguien edita el catálogo, este test tiene que romper hasta que
 * el documento y el código digan lo mismo.
 */
const TABLA_DEL_CONTRATO = [
  ['caries', 'Caries', 'C', 'CARA', 'fill', 'requerida'],
  ['obturacion', 'Obturación', 'O', 'CARA', 'fill', 'existente'],
  ['sellante', 'Sellante', 'S', 'CARA', 'fill', 'existente'],
  ['fractura', 'Fractura', 'F', 'CARA', 'fill', 'existente'],
  ['ausente', 'Pieza ausente', 'X', 'DIENTE', 'cross', 'existente'],
  ['corona', 'Corona', 'Co', 'DIENTE', 'box', 'existente'],
  ['endodoncia', 'Endodoncia', 'E', 'DIENTE', 'letter', 'existente'],
  ['implante', 'Implante', 'I', 'DIENTE', 'screw', 'existente'],
  ['remanente', 'Remanente radicular', 'RR', 'DIENTE', 'stump', 'existente'],
  ['extraccion', 'Extracción', 'Ex', 'DIENTE', 'equals', 'requerida'],
  ['no_erupcionada', 'Pieza no erupcionada', 'NE', 'DIENTE', 'cross', 'requerida'],
  ['protesis_fija', 'Prótesis fija', 'PF', 'MULTI', 'span', 'existente'],
  ['protesis_removible', 'Prótesis removible', 'PR', 'MULTI', 'span', 'existente'],
] as const

/**
 * Los nueve que ya venían del prototipo (`data/findings.ts`). Adoptamos su catálogo, así
 * que el código y la abreviatura se copian tal cual: si acá se renombra alguno, el
 * componente portado deja de encontrar su grafismo y el dato viejo deja de resolver.
 */
const DEL_PROTOTIPO: ReadonlyArray<readonly [CodigoHallazgo, string]> = [
  ['caries', 'C'],
  ['obturacion', 'O'],
  ['sellante', 'S'],
  ['fractura', 'F'],
  ['ausente', 'X'],
  ['corona', 'Co'],
  ['endodoncia', 'E'],
  ['implante', 'I'],
  ['remanente', 'RR'],
]

const TODOS_LOS_ALCANCES: readonly Alcance[] = ['CARA', 'DIENTE', 'MULTI']

const aFila = (entrada: EntradaDelCatalogo) =>
  [entrada.codigo, entrada.nombre, entrada.abrev, entrada.alcance, entrada.grafismo, entrada.capaPorDefecto]

describe('HALLAZGOS — el catálogo v1 contra la tabla del contrato', () => {
  it('tiene las 13 entradas del contrato, con nombre, abreviatura, alcance, grafismo y capa por defecto', () => {
    expect(HALLAZGOS.map(aFila)).toEqual(TABLA_DEL_CONTRATO.map((fila) => [...fila]))
  })

  it('los códigos son únicos', () => {
    const codigos = HALLAZGOS.map((hallazgo) => hallazgo.codigo)
    expect(new Set(codigos).size).toBe(codigos.length)
  })

  it('los nueve que vienen del prototipo conservan su código y su abreviatura', () => {
    for (const [codigo, abrev] of DEL_PROTOTIPO) {
      expect(hallazgoDe(codigo).abrev).toBe(abrev)
    }
  })

  it('exactamente dos entradas tienen alcance MULTI, y son las dos prótesis', () => {
    const multi = HALLAZGOS.filter((hallazgo) => hallazgo.alcance === 'MULTI')
    expect(multi.map((hallazgo) => hallazgo.codigo)).toEqual(['protesis_fija', 'protesis_removible'])
  })

  it('ausente y no_erupcionada comparten el grafismo cross y se distinguen por la capa', () => {
    expect(hallazgoDe('ausente').grafismo).toBe('cross')
    expect(hallazgoDe('no_erupcionada').grafismo).toBe('cross')
    expect(hallazgoDe('ausente').capaPorDefecto).not.toBe(hallazgoDe('no_erupcionada').capaPorDefecto)
  })

  it('ninguna entrada declara capas permitidas: las 13 aceptan las dos', () => {
    for (const hallazgo of HALLAZGOS) {
      expect(hallazgo).not.toHaveProperty('capasPermitidas')
    }
  })
})

describe('hallazgosPorAlcance — el filtro con el que se arma el picker', () => {
  it('CARA devuelve caries, obturación, sellante y fractura', () => {
    expect(hallazgosPorAlcance('CARA').map((hallazgo) => hallazgo.codigo)).toEqual([
      'caries',
      'obturacion',
      'sellante',
      'fractura',
    ])
  })

  it('DIENTE devuelve los siete de pieza entera y ninguno de cara', () => {
    expect(hallazgosPorAlcance('DIENTE').map((hallazgo) => hallazgo.codigo)).toEqual([
      'ausente',
      'corona',
      'endodoncia',
      'implante',
      'remanente',
      'extraccion',
      'no_erupcionada',
    ])
  })

  it('MULTI devuelve solo las prótesis', () => {
    expect(hallazgosPorAlcance('MULTI').map((hallazgo) => hallazgo.codigo)).toEqual([
      'protesis_fija',
      'protesis_removible',
    ])
  })

  it('los tres alcances parten el catálogo entero: ninguna entrada queda fuera del picker', () => {
    const repartidos = TODOS_LOS_ALCANCES.flatMap((alcance) => [...hallazgosPorAlcance(alcance)])
    expect(new Set(repartidos)).toEqual(new Set(HALLAZGOS))
  })

  it('devuelve la misma referencia en cada llamada: la partición se arma una vez', () => {
    expect(hallazgosPorAlcance('CARA')).toBe(hallazgosPorAlcance('CARA'))
  })
})

/**
 * El criterio es «agregar una entrada no requiere cambios fuera de este archivo y su
 * grafismo». Estos tests son los que lo sostienen: nada acá enumera los 13 códigos a
 * mano, todo se deriva de `HALLAZGOS`. Si mañana entra un hallazgo nuevo, el índice, la
 * partición y el guard lo levantan solos.
 */
describe('el catálogo es la única fuente: índice y guard se derivan de HALLAZGOS', () => {
  it('el índice por código cubre exactamente el catálogo', () => {
    expect(Object.keys(HALLAZGOS_POR_CODIGO).sort()).toEqual(
      HALLAZGOS.map((hallazgo) => hallazgo.codigo)
        .slice()
        .sort()
    )
  })

  it('hallazgoDe devuelve la entrada del catálogo, no una copia', () => {
    for (const hallazgo of HALLAZGOS) {
      expect(hallazgoDe(hallazgo.codigo)).toBe(hallazgo)
    }
  })

  it('el guard acepta todos los códigos del catálogo', () => {
    for (const hallazgo of HALLAZGOS) {
      expect(esCodigoHallazgo(hallazgo.codigo)).toBe(true)
    }
  })

  it('el guard rechaza lo que hereda de Object.prototype', () => {
    // Preguntar con `in` sobre un objeto literal daría `true` en los tres: el índice se
    // arma con `Object.create(null)` justamente para que la basura de Firebase no pase.
    expect(esCodigoHallazgo('toString')).toBe(false)
    expect(esCodigoHallazgo('constructor')).toBe(false)
    expect(esCodigoHallazgo('__proto__')).toBe(false)
  })

  it('el guard rechaza códigos inexistentes y valores que no son string', () => {
    expect(esCodigoHallazgo('caries_profunda')).toBe(false)
    expect(esCodigoHallazgo('')).toBe(false)
    expect(esCodigoHallazgo(undefined)).toBe(false)
    expect(esCodigoHallazgo(16)).toBe(false)
  })
})

/**
 * Aserciones de tipo: el árbol de ejemplo del contrato, tipado contra `EstadoDiente`,
 * `Vinculo` y `EventoOdontograma`.
 *
 * El chequeo real lo hace `npm run build` —`satisfies` y `@ts-expect-error` no dejan
 * rastro en runtime—, pero los `expect` de abajo evitan que el bloque quede como código
 * muerto que alguien borra sin darse cuenta de lo que estaba sosteniendo.
 *
 * Hasta acá nada verificaba que los tipos de B1-2 encajaran con el árbol documentado: el
 * build solo comprueba que las declaraciones sean válidas, no que sirvan para el dato.
 */
describe('aserciones de tipo — el árbol del contrato encaja con los tipos del dominio', () => {
  it('la pieza t16 del ejemplo: dos capas sobre la misma cara y sobre el mismo diente', () => {
    const t16 = {
      caras: {
        OCLUSAL_INCISAL: { existente: 'obturacion', requerida: 'caries' },
        MESIAL: { requerida: 'caries' },
      },
      diente: { existente: 'corona', requerida: 'endodoncia' },
    } satisfies EstadoDiente

    expect(t16.caras.OCLUSAL_INCISAL.existente).toBe('obturacion')
    expect(t16.diente.requerida).toBe('endodoncia')
  })

  it('un diente sano y uno con hallazgos solo de cara también son EstadoDiente válidos', () => {
    const sano = {} satisfies EstadoDiente
    const soloCaras = { caras: { VESTIBULAR: { requerida: 'caries' } } } satisfies EstadoDiente

    expect(sano).toEqual({})
    expect(soloCaras.caras.VESTIBULAR.requerida).toBe('caries')
  })

  it('el vínculo del ejemplo: una prótesis fija sobre t45–t47', () => {
    const vinculo = {
      tipo: 'protesis_fija',
      capa: 'existente',
      piezas: { t45: true, t46: true, t47: true },
    } satisfies Vinculo

    expect(Object.keys(vinculo.piezas)).toEqual(['t45', 't46', 't47'])
  })

  it('los tres alcances de evento del contrato tipan, cada uno con su forma', () => {
    const deCara = {
      ts: 1_756_000_000_000,
      uid: 'uid-1',
      alcance: 'CARA',
      capa: 'requerida',
      diente: 't16',
      cara: 'MESIAL',
      piezas: null,
      de: null,
      a: 'caries',
    } satisfies EventoOdontograma

    const deDiente = {
      ts: 1_756_000_000_000,
      uid: 'uid-1',
      alcance: 'DIENTE',
      capa: 'existente',
      diente: 't16',
      cara: null,
      piezas: null,
      de: 'corona',
      a: null,
    } satisfies EventoOdontograma

    // El MULTI guarda el tramo entero en `piezas` y deja `diente` en null.
    const multi = {
      ts: 1_756_000_000_000,
      uid: 'uid-1',
      alcance: 'MULTI',
      capa: 'existente',
      diente: null,
      cara: null,
      piezas: { t45: true, t46: true, t47: true },
      de: null,
      a: 'protesis_fija',
    } satisfies EventoOdontograma

    expect([deCara.alcance, deDiente.alcance, multi.alcance]).toEqual(['CARA', 'DIENTE', 'MULTI'])
    expect(multi.diente).toBeNull()
    expect(Object.keys(multi.piezas)).toHaveLength(3)
  })

  it('los tipos rechazan las combinaciones que el catálogo no permite', () => {
    const asientoDeCara = {
      ts: 1_756_000_000_000,
      uid: 'uid-1',
      alcance: 'CARA',
      capa: 'requerida',
      diente: 't16',
      cara: 'MESIAL',
      piezas: null,
      de: null,
    } as const

    // @ts-expect-error una corona es de alcance DIENTE: no puede asentarse en una cara
    const evento = { ...asientoDeCara, a: 'corona' } satisfies EventoOdontograma

    // @ts-expect-error `caras` solo admite hallazgos de cara
    const cara = { caras: { MESIAL: { existente: 'corona' } } } satisfies EstadoDiente

    // @ts-expect-error las claves de pieza llevan el prefijo `t`, nunca el entero pelado
    const vinculo = { tipo: 'protesis_fija', capa: 'existente', piezas: { 45: true } } satisfies Vinculo

    expect([evento.alcance, Object.keys(cara.caras)[0], vinculo.tipo]).toEqual([
      'CARA',
      'MESIAL',
      'protesis_fija',
    ])
  })
})
