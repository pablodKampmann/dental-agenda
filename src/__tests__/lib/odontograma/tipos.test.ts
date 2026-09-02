import { describe, it, expect } from 'vitest'
import { ALCANCES, CAPAS, CARAS, esAlcance, esCapa, esCara } from '@/lib/odontograma/tipos'

describe('esCara', () => {
  it('acepta las cinco caras válidas', () => {
    CARAS.forEach((cara) => {
      expect(esCara(cara)).toBe(true)
    })
  })

  it('rechaza basura: otros strings, tipos y valores vacíos', () => {
    expect(esCara('mesial')).toBe(false)
    expect(esCara('DISTALES')).toBe(false)
    expect(esCara('')).toBe(false)
    expect(esCara(null)).toBe(false)
    expect(esCara(undefined)).toBe(false)
    expect(esCara(1)).toBe(false)
    expect(esCara({})).toBe(false)
  })

  it('rechaza "constructor" y "toString" — la trampa de prototipo de esClavePieza', () => {
    expect(esCara('constructor')).toBe(false)
    expect(esCara('toString')).toBe(false)
    expect(esCara('__proto__')).toBe(false)
  })
})

describe('esCapa', () => {
  it('acepta las dos capas válidas', () => {
    CAPAS.forEach((capa) => {
      expect(esCapa(capa)).toBe(true)
    })
  })

  it('rechaza basura: otros strings, tipos y valores vacíos', () => {
    expect(esCapa('planificado')).toBe(false)
    expect(esCapa('Existente')).toBe(false)
    expect(esCapa('')).toBe(false)
    expect(esCapa(null)).toBe(false)
    expect(esCapa(undefined)).toBe(false)
    expect(esCapa(1)).toBe(false)
    expect(esCapa({})).toBe(false)
  })

  it('rechaza "constructor" y "toString" — la trampa de prototipo de esClavePieza', () => {
    expect(esCapa('constructor')).toBe(false)
    expect(esCapa('toString')).toBe(false)
    expect(esCapa('__proto__')).toBe(false)
  })
})

describe('esAlcance', () => {
  it('acepta los tres alcances válidos', () => {
    ALCANCES.forEach((alcance) => {
      expect(esAlcance(alcance)).toBe(true)
    })
  })

  it('rechaza basura: otros strings, tipos y valores vacíos', () => {
    expect(esAlcance('cara')).toBe(false)
    expect(esAlcance('MULTIPLE')).toBe(false)
    expect(esAlcance('')).toBe(false)
    expect(esAlcance(null)).toBe(false)
    expect(esAlcance(undefined)).toBe(false)
    expect(esAlcance(1)).toBe(false)
    expect(esAlcance({})).toBe(false)
  })

  it('rechaza "constructor" y "toString" — la trampa de prototipo de esClavePieza', () => {
    expect(esAlcance('constructor')).toBe(false)
    expect(esAlcance('toString')).toBe(false)
    expect(esAlcance('__proto__')).toBe(false)
  })
})
