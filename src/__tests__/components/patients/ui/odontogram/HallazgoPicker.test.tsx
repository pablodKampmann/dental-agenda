import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HallazgoPicker, type PickerContexto } from '@/components/patients/ui/odontogram/HallazgoPicker'
import { piezaDeCodigo } from '@/lib/odontograma/piezas'

/** jsdom no necesita medidas reales: el picker solo usa el rect para posicionarse. */
const ANCHOR = {
  x: 0,
  y: 0,
  top: 0,
  left: 0,
  right: 40,
  bottom: 40,
  width: 40,
  height: 40,
  toJSON: () => ({}),
} as DOMRect

function montar(contexto: PickerContexto) {
  return render(
    <HallazgoPicker
      contexto={contexto}
      hallazgoActual={{}}
      onGuardar={vi.fn()}
      onQuitar={vi.fn()}
      onEjecutar={vi.fn()}
      guardando={false}
      onClose={vi.fn()}
      onVerPiezaCompleta={vi.fn()}
    />
  )
}

/**
 * Pendientes §3.7: el picker ofrecía todo el catálogo del alcance, sin cruzarlo contra la
 * dentición de la pieza. Con la UI conectada a Firebase (F4-1) eso se traduce en ofrecer
 * "Implante" sobre un diente de leche, dibujarlo optimista y que el service lo rechace.
 */
describe('HallazgoPicker — filtro por dentición', () => {
  it('no ofrece implante sobre una pieza temporaria, y sí los que aplican', () => {
    montar({ alcance: 'DIENTE', pieza: piezaDeCodigo(55), anchor: ANCHOR })

    expect(screen.queryByText('Implante')).not.toBeInTheDocument()
    expect(screen.getByText('Corona')).toBeInTheDocument()
    expect(screen.getByText('Pieza ausente')).toBeInTheDocument()
  })

  it('sí ofrece implante sobre una pieza permanente', () => {
    montar({ alcance: 'DIENTE', pieza: piezaDeCodigo(16), anchor: ANCHOR })

    expect(screen.getByText('Implante')).toBeInTheDocument()
  })

  it('no ofrece prótesis fija en un tramo de piezas temporarias', () => {
    montar({
      alcance: 'MULTI',
      piezas: [piezaDeCodigo(54), piezaDeCodigo(55)],
      anchor: ANCHOR,
    })

    expect(screen.queryByText('Prótesis fija')).not.toBeInTheDocument()
    expect(screen.getByText('Prótesis removible')).toBeInTheDocument()
  })

  it('ofrece las dos prótesis en un tramo permanente', () => {
    montar({
      alcance: 'MULTI',
      piezas: [piezaDeCodigo(14), piezaDeCodigo(15)],
      anchor: ANCHOR,
    })

    expect(screen.getByText('Prótesis fija')).toBeInTheDocument()
    expect(screen.getByText('Prótesis removible')).toBeInTheDocument()
  })

  it('los cuatro hallazgos de cara aplican a las dos denticiones', () => {
    montar({ alcance: 'CARA', pieza: piezaDeCodigo(55), posicion: 'center', anchor: ANCHOR })

    for (const nombre of ['Caries', 'Obturación', 'Sellante', 'Fractura']) {
      expect(screen.getByText(nombre)).toBeInTheDocument()
    }
  })
})
