'use client'

import { useEffect, useMemo, useRef, type ReactNode } from 'react'

interface FloatingAnchorProps {
  anchor: DOMRect | null
  onClose: () => void
  children: ReactNode
  width?: number
  /** Alto real del panel. Al ser fijo y conocido de antemano, la decisión arriba/abajo es exacta, sin medir después de pintar. */
  height: number
}

const MARGEN = 10

/**
 * Posiciona un panel flotante pegado a `anchor` (nunca encima), clampeado al
 * viewport, con cierre por click afuera o Escape.
 *
 * Elige abajo si entra completo; si no, arriba; si no entra en ninguno de los dos
 * (viewport muy chico), se queda del lado con más espacio y el contenido scrollea
 * adentro. Todo el cálculo sale de `anchor`, `height` y `window` en una sola pasada
 * síncrona — nada de medir el panel ya pintado y reposicionar después, que es lo que
 * causaba el "teletransporte" de un frame visible en el lugar incorrecto.
 */
export function FloatingAnchor({ anchor, onClose, children, width = 300, height }: FloatingAnchorProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handlePointer(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [onClose])

  const posicion = useMemo(() => {
    if (!anchor || typeof window === 'undefined') return null

    const centro = anchor.left + anchor.width / 2
    const left = Math.min(Math.max(MARGEN, centro - width / 2), window.innerWidth - width - MARGEN)

    const espacioAbajo = window.innerHeight - anchor.bottom - MARGEN
    const espacioArriba = anchor.top - MARGEN
    const cabeAbajo = espacioAbajo >= height
    const arriba = !cabeAbajo && (espacioArriba >= height || espacioArriba > espacioAbajo)

    if (arriba) {
      return { left, bottom: window.innerHeight - anchor.top + MARGEN, top: undefined, maxHeight: Math.min(height, espacioArriba) }
    }
    return { left, top: anchor.bottom + MARGEN, bottom: undefined, maxHeight: Math.min(height, espacioAbajo) }
  }, [anchor, width, height])

  if (!anchor || !posicion) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/15 animate-in fade-in duration-150" />
      <div
        ref={ref}
        role="dialog"
        className="fixed z-50 animate-in fade-in zoom-in-95 duration-150"
        style={{
          top: posicion.top,
          bottom: posicion.bottom,
          left: posicion.left,
          width,
          height,
          maxHeight: posicion.maxHeight,
        }}
      >
        {children}
      </div>
    </>
  )
}
