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

/**
 * `success` y `error` se delegan a los helpers de react-hot-toast con un solo argumento:
 * el estilo y el icono de esas dos variantes son los que trae la libreria. La unica que
 * necesita opciones propias es `warning`, porque react-hot-toast no tiene un helper para
 * ella y hay que armarla a mano (`toast()` + icono + borde ambar).
 *
 * Estos dos tests aseveraban un segundo argumento `expect.any(Object)` en las tres
 * variantes y venian fallando desde b2f787b, el commit que reemplazo el `<Toast variant>`
 * viejo por este contexto: se reescribieron contra la firma que se supuso, no contra la
 * que quedo. Se alinearon a la llamada real en vez de agregarle opciones vacias al
 * contexto — el que decide como se ve un toast es `ToastContext`, no el test.
 */
describe('useToast', () => {
  it('calls toast.success for success type', async () => {
    setup('success', 'Cambio guardado correctamente')
    await act(async () => { screen.getByText('trigger').click() })
    expect(toast.success).toHaveBeenCalledWith('Cambio guardado correctamente')
  })

  it('calls toast.error for error type', async () => {
    setup('error', 'Error al crear el turno')
    await act(async () => { screen.getByText('trigger').click() })
    expect(toast.error).toHaveBeenCalledWith('Error al crear el turno')
  })

  it('calls toast with warning icon for warning type', async () => {
    setup('warning', 'Advertencia')
    await act(async () => { screen.getByText('trigger').click() })
    expect(toast).toHaveBeenCalledWith('Advertencia', expect.objectContaining({ icon: '⚠️' }))
  })
})
