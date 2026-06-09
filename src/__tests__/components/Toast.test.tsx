import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { ToastProvider, useToast } from '@/context/ToastContext'

vi.mock('react-hot-toast', () => ({
  default: Object.assign(
    vi.fn(),
    {
      success: vi.fn(),
      error: vi.fn(),
    }
  ),
}))

import toast from 'react-hot-toast'

function ToastTrigger({ type, message }: { type: 'success' | 'error' | 'warning'; message: string }) {
  const { showToast } = useToast()
  return <button onClick={() => showToast(type, message)}>trigger</button>
}

function setup(type: 'success' | 'error' | 'warning', message: string) {
  return render(
    <ToastProvider>
      <ToastTrigger type={type} message={message} />
    </ToastProvider>,
  )
}

describe('useToast', () => {
  it('calls toast.success for success type', async () => {
    setup('success', 'Cambio guardado correctamente')
    await act(async () => { screen.getByText('trigger').click() })
    expect(toast.success).toHaveBeenCalledWith('Cambio guardado correctamente', expect.any(Object))
  })

  it('calls toast.error for error type', async () => {
    setup('error', 'Error al crear el turno')
    await act(async () => { screen.getByText('trigger').click() })
    expect(toast.error).toHaveBeenCalledWith('Error al crear el turno', expect.any(Object))
  })

  it('calls toast with warning icon for warning type', async () => {
    setup('warning', 'Advertencia')
    await act(async () => { screen.getByText('trigger').click() })
    expect(toast).toHaveBeenCalledWith('Advertencia', expect.objectContaining({ icon: '⚠️' }))
  })
})
