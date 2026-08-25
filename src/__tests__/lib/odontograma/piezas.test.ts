import { describe, it, expect } from 'vitest'
import {
  PIEZAS,
  PIEZAS_POR_CLAVE,
  clavePieza,
  esClavePieza,
  esCodigoPieza,
  piezaDeClave,
  piezaDeCodigo,
  piezasDeDenticion,
  piezasDeFila,
  type ClavePieza,
  type Fila,
  type Pieza,
} from '@/lib/odontograma/piezas'

/**
 * Replica la regla con la que Realtime Database convierte un nodo en array: todas las
 * claves enteras, y la mayor menor al doble de la cantidad (o sea, más de la mitad de
 * las posiciones entre 0 y la máxima están ocupadas).
 */
function firebaseDegradaAArray(claves: readonly string[]): boolean {
  if (claves.length === 0) return false
  if (!claves.every((clave) => /^(0|[1-9]\d*)$/.test(clave))) return false

  const mayor = Math.max(...claves.map(Number))
  return mayor < claves.length * 2
}

/** Reproduce lo que hace la UI: ordenar por fila y orden visual, y leer los códigos. */
function codigosOrdenados(fila: Fila): number[] {
  return [...PIEZAS]
    .sort((a, b) => a.fila - b.fila || a.ordenVisual - b.ordenVisual)
    .filter((pieza) => pieza.fila === fila)
    .map((pieza) => pieza.codigo)
}

describe('PIEZAS — orden visual de las filas', () => {
  it('la fila 1 es el arco superior permanente de izquierda a derecha', () => {
    expect(codigosOrdenados(1)).toEqual([
      18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
    ])
  })

  it('la fila 2 es el arco inferior permanente de izquierda a derecha', () => {
    expect(codigosOrdenados(2)).toEqual([
      48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
    ])
  })

  it('las filas 3 y 4 son los arcos temporarios de izquierda a derecha', () => {
    expect(codigosOrdenados(3)).toEqual([55, 54, 53, 52, 51, 61, 62, 63, 64, 65])
    expect(codigosOrdenados(4)).toEqual([85, 84, 83, 82, 81, 71, 72, 73, 74, 75])
  })

  it('ordenar por código FDI ascendente NO da el orden visual (el bug que ordenVisual previene)', () => {
    const porCodigo = piezasDeFila(1)
      .map((pieza) => pieza.codigo)
      .sort((a, b) => a - b)

    expect(porCodigo).not.toEqual(codigosOrdenados(1))
  })

  it('el ordenVisual es consecutivo desde 1 dentro de cada fila', () => {
    const filas: Fila[] = [1, 2, 3, 4]

    filas.forEach((fila) => {
      const piezas = piezasDeFila(fila)
      expect(piezas.map((pieza) => pieza.ordenVisual)).toEqual(
        piezas.map((_, indice) => indice + 1)
      )
    })
  })

  it('PIEZAS ya viene ordenado por fila y ordenVisual', () => {
    const ordenado = [...PIEZAS].sort((a, b) => a.fila - b.fila || a.ordenVisual - b.ordenVisual)
    expect(PIEZAS.map((pieza) => pieza.codigo)).toEqual(ordenado.map((pieza) => pieza.codigo))
  })
})

describe('PIEZAS — cantidad y unicidad', () => {
  it('hay 32 piezas permanentes y 20 temporarias', () => {
    expect(piezasDeDenticion('PERMANENTE')).toHaveLength(32)
    expect(piezasDeDenticion('TEMPORARIA')).toHaveLength(20)
    expect(PIEZAS).toHaveLength(52)
  })

  it('no hay códigos ni claves repetidas', () => {
    expect(new Set(PIEZAS.map((pieza) => pieza.codigo)).size).toBe(52)
    expect(new Set(PIEZAS.map((pieza) => pieza.clave)).size).toBe(52)
  })

  it('las posiciones son 1–8 en permanentes y 1–5 en temporarias', () => {
    PIEZAS.forEach((pieza) => {
      expect(pieza.posicion).toBeGreaterThanOrEqual(1)
      expect(pieza.posicion).toBeLessThanOrEqual(pieza.denticion === 'PERMANENTE' ? 8 : 5)
      expect(pieza.cuadrante).toBeGreaterThanOrEqual(1)
      expect(pieza.cuadrante).toBeLessThanOrEqual(8)
    })
  })
})

describe('PIEZAS — clave de persistencia', () => {
  it('la clave nunca es un entero puro', () => {
    PIEZAS.forEach((pieza) => {
      expect(pieza.clave).toBe(`t${pieza.codigo}`)
      expect(pieza.clave).toMatch(/^t\d{2}$/)
      expect(Number.isNaN(Number(pieza.clave))).toBe(true)
      expect(String(parseInt(pieza.clave, 10))).not.toBe(pieza.clave)
    })
  })

  it('las claves prefijadas quedan fuera de la regla de array de Realtime Database', () => {
    const permanentes = piezasDeDenticion('PERMANENTE')

    // Con los códigos crudos el SDK devolvería un array con huecos, no un objeto.
    expect(firebaseDegradaAArray(PIEZAS.map((pieza) => String(pieza.codigo)))).toBe(true)
    expect(firebaseDegradaAArray(permanentes.map((pieza) => String(pieza.codigo)))).toBe(true)

    // Con el prefijo `t` las claves ya no son enteras y la regla no se dispara.
    expect(firebaseDegradaAArray(PIEZAS.map((pieza) => pieza.clave))).toBe(false)
    expect(firebaseDegradaAArray(permanentes.map((pieza) => pieza.clave))).toBe(false)
  })

  it('con códigos crudos la forma del dato depende de cuántos dientes haya cargados', () => {
    const pocos = [16, 26, 36] as const
    const todos = piezasDeDenticion('PERMANENTE').map((pieza) => pieza.codigo)

    // El mismo nodo, leído dos veces con distinta cantidad de dientes: objeto y después array.
    expect(firebaseDegradaAArray(pocos.map(String))).toBe(false)
    expect(firebaseDegradaAArray(todos.map(String))).toBe(true)

    // Con el prefijo la forma es estable en los dos casos.
    expect(firebaseDegradaAArray(pocos.map((codigo) => clavePieza(codigo)))).toBe(false)
    expect(firebaseDegradaAArray(todos.map((codigo) => clavePieza(codigo)))).toBe(false)
  })

  it('clavePieza() coincide con la clave de la tabla', () => {
    expect(clavePieza(16)).toBe('t16')
    expect(clavePieza(85)).toBe('t85')
    expect(piezaDeCodigo(16).clave).toBe(clavePieza(16))
  })
})

describe('PIEZAS — tipo de pieza', () => {
  it('las temporarias 54, 55, 64, 65, 74, 75, 84 y 85 son molares, no premolares', () => {
    const codigos = [54, 55, 64, 65, 74, 75, 84, 85] as const

    codigos.forEach((codigo) => {
      expect(piezaDeCodigo(codigo).tipo).toBe('MOLAR')
    })
  })

  it('no existe ningún premolar temporario', () => {
    const premolaresTemporarios = piezasDeDenticion('TEMPORARIA').filter(
      (pieza) => pieza.tipo === 'PREMOLAR'
    )

    expect(premolaresTemporarios).toEqual([])
  })

  it('clasifica las permanentes por posición', () => {
    expect(piezaDeCodigo(11).tipo).toBe('INCISIVO')
    expect(piezaDeCodigo(12).tipo).toBe('INCISIVO')
    expect(piezaDeCodigo(23).tipo).toBe('CANINO')
    expect(piezaDeCodigo(34).tipo).toBe('PREMOLAR')
    expect(piezaDeCodigo(45).tipo).toBe('PREMOLAR')
    expect(piezaDeCodigo(46).tipo).toBe('MOLAR')
    expect(piezaDeCodigo(28).tipo).toBe('MOLAR')
  })

  it('cada arcada permanente tiene 4 incisivos, 2 caninos, 4 premolares y 6 molares', () => {
    const contar = (piezas: readonly Pieza[], tipo: Pieza['tipo']) =>
      piezas.filter((pieza) => pieza.tipo === tipo).length
    const superiores = piezasDeDenticion('PERMANENTE').filter((p) => p.arcada === 'SUPERIOR')

    expect(superiores).toHaveLength(16)
    expect(contar(superiores, 'INCISIVO')).toBe(4)
    expect(contar(superiores, 'CANINO')).toBe(2)
    expect(contar(superiores, 'PREMOLAR')).toBe(4)
    expect(contar(superiores, 'MOLAR')).toBe(6)
  })
})

describe('PIEZAS — arcada, hemiarcada y dentición', () => {
  it('asigna la arcada por cuadrante', () => {
    PIEZAS.forEach((pieza) => {
      const esperada = [1, 2, 5, 6].includes(pieza.cuadrante) ? 'SUPERIOR' : 'INFERIOR'
      expect(pieza.arcada).toBe(esperada)
    })
  })

  it('asigna la hemiarcada por cuadrante (1, 4, 5 y 8 a la derecha del paciente)', () => {
    PIEZAS.forEach((pieza) => {
      const esperada = [1, 4, 5, 8].includes(pieza.cuadrante) ? 'DERECHA' : 'IZQUIERDA'
      expect(pieza.hemiarcada).toBe(esperada)
    })
  })

  it('los cuadrantes 1–4 son permanentes y 5–8 temporarios', () => {
    PIEZAS.forEach((pieza) => {
      expect(pieza.denticion).toBe(pieza.cuadrante <= 4 ? 'PERMANENTE' : 'TEMPORARIA')
    })
  })

  it('cada fila corresponde a una dentición y una arcada', () => {
    const resumen = ([1, 2, 3, 4] as Fila[]).map((fila) => {
      const piezas = piezasDeFila(fila)
      return {
        fila,
        cantidad: piezas.length,
        denticion: [...new Set(piezas.map((p) => p.denticion))],
        arcada: [...new Set(piezas.map((p) => p.arcada))],
      }
    })

    expect(resumen).toEqual([
      { fila: 1, cantidad: 16, denticion: ['PERMANENTE'], arcada: ['SUPERIOR'] },
      { fila: 2, cantidad: 16, denticion: ['PERMANENTE'], arcada: ['INFERIOR'] },
      { fila: 3, cantidad: 10, denticion: ['TEMPORARIA'], arcada: ['SUPERIOR'] },
      { fila: 4, cantidad: 10, denticion: ['TEMPORARIA'], arcada: ['INFERIOR'] },
    ])
  })
})

describe('PIEZAS — acceso por índice', () => {
  it('PIEZAS_POR_CLAVE tiene las 52 entradas y resuelve la misma pieza que la tabla', () => {
    expect(Object.keys(PIEZAS_POR_CLAVE)).toHaveLength(52)
    PIEZAS.forEach((pieza) => {
      expect(piezaDeClave(pieza.clave)).toBe(pieza)
    })
  })

  it('los guards reconocen claves y códigos válidos y rechazan el resto', () => {
    expect(esClavePieza('t16')).toBe(true)
    expect(esClavePieza('16')).toBe(false)
    expect(esClavePieza('t19')).toBe(false)
    expect(esClavePieza('t56')).toBe(false)
    expect(esClavePieza(16)).toBe(false)

    expect(esCodigoPieza(16)).toBe(true)
    expect(esCodigoPieza(19)).toBe(false)
    expect(esCodigoPieza(56)).toBe(false)
    expect(esCodigoPieza('16')).toBe(false)
  })

  it('el índice no hereda del prototipo: las propiedades de Object no son claves válidas', () => {
    const heredadas = [
      'constructor',
      'toString',
      'valueOf',
      'hasOwnProperty',
      '__proto__',
      '__defineGetter__',
      'isPrototypeOf',
      'propertyIsEnumerable',
    ]

    expect(Object.getPrototypeOf(PIEZAS_POR_CLAVE)).toBeNull()

    heredadas.forEach((nombre) => {
      expect(esClavePieza(nombre)).toBe(false)
      expect(PIEZAS_POR_CLAVE[nombre as ClavePieza]).toBeUndefined()
      expect(piezaDeClave(nombre as ClavePieza)).toBeUndefined()
    })
  })
})

describe('PIEZAS — columna en la grilla', () => {
  it('las permanentes ocupan las 16 columnas y la columna coincide con el orden visual', () => {
    piezasDeDenticion('PERMANENTE').forEach((pieza) => {
      expect(pieza.columna).toBe(pieza.ordenVisual)
    })
    expect(piezasDeFila(1).map((pieza) => pieza.columna)).toEqual(
      Array.from({ length: 16 }, (_, indice) => indice + 1)
    )
  })

  it('las temporarias van indentadas: arrancan en la columna 4 y terminan en la 13', () => {
    const filas: Fila[] = [3, 4]

    filas.forEach((fila) => {
      const columnas = piezasDeFila(fila).map((pieza) => pieza.columna)
      expect(columnas).toEqual([4, 5, 6, 7, 8, 9, 10, 11, 12, 13])
    })
  })

  it('cada temporaria comparte columna con su sucesora permanente', () => {
    // La ficha las dibuja alineadas: la 55 debajo de la 15, no de la 18.
    expect(piezaDeCodigo(55).columna).toBe(piezaDeCodigo(15).columna)
    expect(piezaDeCodigo(51).columna).toBe(piezaDeCodigo(11).columna)
    expect(piezaDeCodigo(65).columna).toBe(piezaDeCodigo(25).columna)
    expect(piezaDeCodigo(85).columna).toBe(piezaDeCodigo(45).columna)
    expect(piezaDeCodigo(71).columna).toBe(piezaDeCodigo(31).columna)

    // Y vale para las 20, no solo para las cinco de arriba.
    piezasDeDenticion('TEMPORARIA').forEach((temporaria) => {
      const sucesora = PIEZAS.find(
        (pieza) =>
          pieza.cuadrante === temporaria.cuadrante - 4 && pieza.posicion === temporaria.posicion
      )

      expect(sucesora).toBeDefined()
      expect(temporaria.columna).toBe(sucesora?.columna)
      expect(temporaria.arcada).toBe(sucesora?.arcada)
      expect(temporaria.hemiarcada).toBe(sucesora?.hemiarcada)
    })
  })

  it('la columna es única dentro de cada fila y nunca sale de la grilla de 16', () => {
    const filas: Fila[] = [1, 2, 3, 4]

    filas.forEach((fila) => {
      const columnas = piezasDeFila(fila).map((pieza) => pieza.columna)
      expect(new Set(columnas).size).toBe(columnas.length)
    })

    PIEZAS.forEach((pieza) => {
      expect(pieza.columna).toBeGreaterThanOrEqual(1)
      expect(pieza.columna).toBeLessThanOrEqual(16)
    })
  })
})
