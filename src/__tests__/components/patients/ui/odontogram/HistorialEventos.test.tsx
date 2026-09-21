import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

vi.mock('@/services/odontograma/getEventos', () => ({ getEventos: vi.fn() }))

import { HistorialEventos } from '@/components/patients/ui/odontogram/HistorialEventos'
import { getEventos } from '@/services/odontograma/getEventos'

const mockGetEventos = vi.mocked(getEventos)

describe('HistorialEventos', () => {
  it('muestra error cuando getEventos devuelve null (falló la lectura)', async () => {
    mockGetEventos.mockResolvedValue(null)
    render(<HistorialEventos pacienteId="p1" clinicId="c1" />)
    await waitFor(() => expect(screen.getByText(/no se pudo cargar/i)).toBeInTheDocument())
  })

  it('muestra vacío cuando getEventos devuelve [] (sin historial)', async () => {
    mockGetEventos.mockResolvedValue([])
    render(<HistorialEventos pacienteId="p1" clinicId="c1" />)
    await waitFor(() => expect(screen.getByText(/sin eventos todavía/i)).toBeInTheDocument())
  })

  it('lista un evento real sin ningún control de edición', async () => {
    mockGetEventos.mockResolvedValue([
      {
        id: 'evt-1',
        ts: 1700000000000,
        uid: 'uid-1',
        alcance: 'CARA',
        capa: 'requerida',
        diente: 't16',
        cara: 'OCLUSAL_INCISAL',
        piezas: null,
        de: null,
        a: 'caries',
      },
    ])
    render(<HistorialEventos pacienteId="p1" clinicId="c1" />)

    await waitFor(() => expect(screen.getByText(/se registró caries/i)).toBeInTheDocument())
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })
})
