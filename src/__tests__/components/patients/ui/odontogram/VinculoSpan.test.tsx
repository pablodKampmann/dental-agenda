import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VinculoSpan } from '@/components/patients/ui/odontogram/VinculoSpan'
import { piezaDeCodigo } from '@/lib/odontograma/piezas'

describe('VinculoSpan — nombre accesible', () => {
  it('menciona la capa (existente/requerida), no solo el nombre de la prótesis', () => {
    render(
      <VinculoSpan
        piezas={[piezaDeCodigo(14), piezaDeCodigo(15), piezaDeCodigo(16)]}
        tipo="protesis_fija"
        capa="existente"
        onClick={vi.fn()}
      />
    )
    expect(
      screen.getByRole('button', { name: /prótesis fija existente de las piezas 14 a 16/i })
    ).toBeInTheDocument()
  })
})
