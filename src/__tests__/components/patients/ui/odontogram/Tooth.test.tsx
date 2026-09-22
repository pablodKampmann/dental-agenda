import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Tooth } from '@/components/patients/ui/odontogram/Tooth'
import { piezaDeCodigo } from '@/lib/odontograma/piezas'
import type { DientesPorClave } from '@/lib/odontograma/tipos'
import { AMBAS_CAPAS } from '@/lib/odontograma/selectores'
import { caraSemantica, etiquetaCara } from '@/lib/odontograma/caras'

const PIEZA_16 = piezaDeCodigo(16)
// Nunca se hardcodea el nombre de la cara acá (guard de caras.test.ts): sale de la misma
// traducción que usa el componente, `caraSemantica()` + `etiquetaCara()`.
const CARA_TOP = caraSemantica('top', PIEZA_16.cuadrante)
const ETIQUETA_TOP = etiquetaCara(CARA_TOP, PIEZA_16.arcada, PIEZA_16.tipo)
const NOMBRE_CARA_VACIA = new RegExp(`^pieza 16, ${ETIQUETA_TOP}$`, 'i')

function renderTooth(estado: DientesPorClave, extra: Partial<Parameters<typeof Tooth>[0]> = {}) {
  const onSelectCara = vi.fn()
  const onSelectDiente = vi.fn()
  const onToggleEnTramo = vi.fn()
  render(
    <Tooth
      pieza={PIEZA_16}
      estado={estado}
      visibilidad={AMBAS_CAPAS}
      seleccionado={false}
      enModoTramo={false}
      activo={false}
      onSelectCara={onSelectCara}
      onSelectDiente={onSelectDiente}
      onToggleEnTramo={onToggleEnTramo}
      {...extra}
    />
  )
  return { onSelectCara, onSelectDiente, onToggleEnTramo }
}

describe('Tooth — teclado', () => {
  it('Enter en una cara dispara el mismo callback que el click', () => {
    const { onSelectCara } = renderTooth({})
    const cara = screen.getByRole('button', { name: NOMBRE_CARA_VACIA })
    fireEvent.keyDown(cara, { key: 'Enter' })
    expect(onSelectCara).toHaveBeenCalledWith(PIEZA_16, 'top', expect.anything())
  })

  it('Espacio en una cara dispara el mismo callback y no scrollea (preventDefault)', () => {
    const { onSelectCara } = renderTooth({})
    const cara = screen.getByRole('button', { name: NOMBRE_CARA_VACIA })
    const evento = fireEvent.keyDown(cara, { key: ' ' })
    expect(onSelectCara).toHaveBeenCalledWith(PIEZA_16, 'top', expect.anything())
    expect(evento).toBe(false) // false = se llamó preventDefault()
  })

  it('Enter en la pieza completa dispara onSelectDiente', () => {
    const estado: DientesPorClave = { t16: { diente: { existente: 'corona' } } }
    const { onSelectDiente } = renderTooth(estado)
    const pieza = screen.getByRole('button', { name: /pieza completa/i })
    fireEvent.keyDown(pieza, { key: 'Enter' })
    expect(onSelectDiente).toHaveBeenCalledWith(PIEZA_16, expect.anything())
  })

  it('Enter en el rect de tramo dispara onToggleEnTramo y expone aria-pressed', () => {
    const { onToggleEnTramo } = renderTooth({}, { enModoTramo: true, seleccionado: true })
    const tramo = screen.getByRole('button', { name: /pieza 16, tramo/i })
    expect(tramo).toHaveAttribute('aria-pressed', 'true')
    fireEvent.keyDown(tramo, { key: ' ' })
    expect(onToggleEnTramo).toHaveBeenCalledWith(PIEZA_16)
  })
})

describe('Tooth — nombre accesible de una cara', () => {
  it('cara vacía no menciona ningún hallazgo', () => {
    renderTooth({})
    expect(screen.getByRole('button', { name: NOMBRE_CARA_VACIA })).toBeInTheDocument()
  })

  it('cara con un hallazgo existente lo menciona por su nombre clínico y su capa', () => {
    const estado: DientesPorClave = { t16: { caras: { [CARA_TOP]: { existente: 'caries' } } } }
    renderTooth(estado)
    const nombre = new RegExp(`pieza 16, ${ETIQUETA_TOP}: caries existente`, 'i')
    expect(screen.getByRole('button', { name: nombre })).toBeInTheDocument()
  })

  it('cara con existente y requerida a la vez menciona las dos', () => {
    const estado: DientesPorClave = {
      t16: { caras: { [CARA_TOP]: { existente: 'obturacion', requerida: 'fractura' } } },
    }
    renderTooth(estado)
    const nombre = new RegExp(`pieza 16, ${ETIQUETA_TOP}: obturación existente y fractura requerida`, 'i')
    expect(screen.getByRole('button', { name: nombre })).toBeInTheDocument()
  })
})
