'use client'

import { useEffect, useMemo, useRef, type ReactNode } from 'react'

interface FloatingAnchorProps {
  anchor: DOMRect | null
  onClose: () => void
  children: ReactNode
  width?: number
  /**
   * Alto real del panel para este render. Puede cambiar de un render a otro (ej.
   * `HallazgoPicker` recalcula por paso), pero siempre calculado de antemano por el caller
   * a partir de datos ya conocidos — nunca medido del DOM ya pintado. Eso es lo que evita
   * el "teletransporte": la decisión arriba/abajo sale de este número en la misma pasada
   * síncrona, no de un `useLayoutEffect` posterior. Un cambio de valor entre renders anima
   * suave por la transición CSS del panel, no salta.
   */
  height: number
  /**
   * Alto usado solo para decidir arriba/abajo, si es distinto de `height`. Sin esto, un
   * panel que cambia de alto entre renders (como `HallazgoPicker` por paso) puede saltar
   * de lugar: un paso más chico "cabe abajo" cuando el más grande no cabía, y el usuario ve
   * el panel moverse de arriba a abajo entre pasos. Pasando el alto del contenido más
   * grande posible (el primer paso, normalmente), la posición queda fija para toda la
   * apertura y solo el tamaño visual cambia con `height`.
   */
  alturaReferencia?: number
  /**
   * true mientras haya un `ConfirmAlert` (u otro overlay hijo) abierto por encima de este
   * panel. Ese overlay se renderiza fuera del `ref` de acá (es hermano en el DOM, no
   * descendiente), así que sin esto el `mousedown` de "Eliminar"/"Cancelar" se interpreta
   * como click-afuera y cierra el picker completo antes de que el click llegue a disparar
   * la acción — React desmonta el botón entre el mousedown y el click. `stopPropagation`
   * del lado del hijo no alcanza: `handlePointer` está en un listener nativo puesto a mano
   * en `document`, fuera del árbol sintético de React.
   */
  pausado?: boolean
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
export function FloatingAnchor({ anchor, onClose, children, width = 300, height, alturaReferencia, pausado = false }: FloatingAnchorProps) {
  const ref = useRef<HTMLDivElement>(null)

  /**
   * El scroll real de estas páginas no vive en el `body` — vive en un `<div
   * overflow-y-auto>` interno (ver "Anatomía de página" en AGENTS.md), así que fijar
   * `document.body.style.overflow = 'hidden'` no frena nada ahí, el div interno sigue
   * scrolleando igual. La única forma de bloquearlo sin saber cuál es ese contenedor
   * (puede ser cualquiera según la página) es interceptar el gesto en sí — `wheel` y
   * `touchmove` en `document`, en fase de captura y sin pasivo (para poder `preventDefault`)
   * — dejando pasar el evento solo si el target está dentro del propio picker, que sí
   * debe poder scrollear internamente cuando `necesitaScroll` lo pide.
   */
  useEffect(() => {
    function bloquear(e: Event) {
      if (ref.current && ref.current.contains(e.target as Node)) return
      e.preventDefault()
    }
    document.addEventListener('wheel', bloquear, { passive: false })
    document.addEventListener('touchmove', bloquear, { passive: false })
    return () => {
      document.removeEventListener('wheel', bloquear)
      document.removeEventListener('touchmove', bloquear)
    }
  }, [])

  useEffect(() => {
    if (pausado) return
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
  }, [onClose, pausado])

  const posicion = useMemo(() => {
    if (!anchor || typeof window === 'undefined') return null

    const centro = anchor.left + anchor.width / 2
    const left = Math.min(Math.max(MARGEN, centro - width / 2), window.innerWidth - width - MARGEN)

    const altoParaDecidir = alturaReferencia ?? height
    const espacioAbajo = window.innerHeight - anchor.bottom - MARGEN
    const espacioArriba = anchor.top - MARGEN
    const cabeAbajo = espacioAbajo >= altoParaDecidir
    const arriba = !cabeAbajo && (espacioArriba >= altoParaDecidir || espacioArriba > espacioAbajo)

    if (arriba) {
      return { left, bottom: window.innerHeight - anchor.top + MARGEN, top: undefined, maxHeight: Math.min(height, espacioArriba) }
    }
    return { left, top: anchor.bottom + MARGEN, bottom: undefined, maxHeight: Math.min(height, espacioAbajo) }
  }, [anchor, width, height, alturaReferencia])

  if (!anchor || !posicion) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/15 animate-in fade-in duration-150" />
      <div
        ref={ref}
        role="dialog"
        className="fixed z-50 animate-in fade-in zoom-in-95 duration-150 transition-[height,max-height,top,bottom] ease-out"
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
