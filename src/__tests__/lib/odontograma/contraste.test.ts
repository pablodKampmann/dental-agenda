import { describe, it, expect } from 'vitest'

/**
 * Regresión de contraste (F4-3, criterio 4 de la issue de accesibilidad del odontograma).
 * No es un cálculo "a ojo": reproduce la fórmula de luminancia relativa de WCAG con los
 * hex reales que usa Tooth.tsx, para que bajar la opacity o volver el número FDI a
 * teal-600 rompa el build en vez de pasar en silencio. Los hex de acá tienen que reflejar
 * los que usa el componente, no al revés.
 *
 * Vive en esta carpeta (y no junto a Tooth.tsx) porque declara los hex de rojo/azul del
 * catálogo para el cálculo — el guard de `caras.test.ts` prohíbe eso en cualquier archivo
 * que importe el dominio o sea hermano de uno, y esta carpeta es la excepción declarada.
 */
function linear(c: number) {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}
function luminancia(hex: string) {
  const n = parseInt(hex.replace('#', ''), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
}
function contraste(a: string, b: string) {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}
function sobreBlanco(hex: string, opacity: number) {
  const n = parseInt(hex.replace('#', ''), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  const mix = [r, g, b].map((c) => Math.round(c * opacity + 255 * (1 - opacity)))
  return '#' + mix.map((c) => c.toString(16).padStart(2, '0')).join('')
}

const BLANCO = '#FFFFFF'
const TEAL_700 = '#0f766e' // Tooth.tsx: número FDI cuando la pieza tiene un hallazgo
const RED_600 = '#DC2626' // Tailwind fill-red-600 (colorDe('existente').relleno)
const BLUE_600 = '#2563EB' // Tailwind fill-blue-600 (colorDe('requerida').relleno)
const OPACITY_RELLENO = 0.75 // Tooth.tsx: opacity de los <path> de relleno de cara

describe('contraste WCAG del odontograma', () => {
  it('el número FDI en teal-700 llega a AA (4.5:1) para texto chico', () => {
    expect(contraste(TEAL_700, BLANCO)).toBeGreaterThanOrEqual(4.5)
  })

  it('el relleno rojo (existente) llega a 3:1 contra blanco (WCAG 1.4.11, marca gráfica)', () => {
    expect(contraste(sobreBlanco(RED_600, OPACITY_RELLENO), BLANCO)).toBeGreaterThanOrEqual(3)
  })

  it('el relleno azul (requerida) llega a 3:1 contra blanco (WCAG 1.4.11, marca gráfica)', () => {
    expect(contraste(sobreBlanco(BLUE_600, OPACITY_RELLENO), BLANCO)).toBeGreaterThanOrEqual(3)
  })
})
