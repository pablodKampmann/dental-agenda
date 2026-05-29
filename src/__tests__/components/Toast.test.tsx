import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Toast } from '@/components/shared/Toast'

describe('Toast', () => {
  it('renders nothing when variant is null', () => {
    const { container } = render(<Toast variant={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the correct message for "saved"', () => {
    render(<Toast variant="saved" />)
    expect(screen.getByText('Cambio guardado correctamente')).toBeInTheDocument()
  })

  it('renders the correct message for "good-patient"', () => {
    render(<Toast variant="good-patient" />)
    expect(screen.getByText('Paciente creado correctamente')).toBeInTheDocument()
  })

  it('renders the correct message for "error"', () => {
    render(<Toast variant="error" />)
    expect(screen.getByText('Error al crear el turno')).toBeInTheDocument()
  })

  it('renders error background color for "error" variant', () => {
    const { container } = render(<Toast variant="error" />)
    expect(container.firstChild).toHaveClass('bg-red-500')
  })

  it('renders success background color for "good" variant', () => {
    const { container } = render(<Toast variant="good" />)
    expect(container.firstChild).toHaveClass('bg-emerald-400')
  })

  it('renders the correct message for "good-professional-added"', () => {
    render(<Toast variant="good-professional-added" />)
    expect(screen.getByText('Profesional agregado exitosamente')).toBeInTheDocument()
  })
})
