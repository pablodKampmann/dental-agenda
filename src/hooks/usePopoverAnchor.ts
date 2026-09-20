"use client";

import { useEffect, useState, type RefObject } from "react";
import { isAnchorHidden } from "@/lib/popoverPosition";

/**
 * Estado de posición para un popover anclado (hoy: CustomSelect) — rect del campo que
 * lo abre y si quedó tapado por el scroll de algún contenedor ancestro.
 *
 * `capture()` se llama al abrir (sincrónico, antes de setear el estado de apertura, para
 * que el popover ya nazca bien posicionado en el mismo frame). Mientras `open` es true,
 * reposiciona en cada scroll/resize — captura en fase de captura porque el scroll de un
 * contenedor interno (ej. el body con scroll de un modal) no burbujea hasta `window`.
 */
export function usePopoverAnchor(anchorRef: RefObject<HTMLElement | null>, open: boolean) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [hidden, setHidden] = useState(false);

  function capture() {
    if (!anchorRef.current) return;
    setRect(anchorRef.current.getBoundingClientRect());
    setHidden(false);
  }

  useEffect(() => {
    if (!open) return;
    function reposition() {
      if (!anchorRef.current) return;
      setRect(anchorRef.current.getBoundingClientRect());
      setHidden(isAnchorHidden(anchorRef.current));
    }
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return { rect, hidden, capture };
}
