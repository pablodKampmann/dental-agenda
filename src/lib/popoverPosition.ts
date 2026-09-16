import type { CSSProperties } from "react";

const MARGIN = 8;
const DEFAULT_GAP = 4;

// Por encima de cualquier card/modal del sistema visual, para que un popover anclado
// (hoy: CustomSelect) nunca quede tapado por el contenido de la página.
export const POPOVER_Z_INDEX = 9000;

interface PopoverStyleOptions {
  /** Rect del campo/botón que abre el popover. */
  rect: DOMRect;
  /** Ancho real del popover, en px — necesario para clampear contra el borde derecho. */
  width: number;
  /** Alto real (o máximo) del popover, en px — necesario para clampear contra el borde superior/inferior. */
  height: number;
  /** Si es true, el popover se oculta (visibility) sin desmontar — el campo quedó tapado por scroll. */
  hidden?: boolean;
  gap?: number;
}

/**
 * Calcula la posición `fixed` de un popover anclado a un campo, contra el viewport.
 * Siempre queda pegado al campo (`rect.bottom + gap` o `rect.top - gap`, según el lado
 * elegido) — el único clamp vertical es en la rama "abre hacia arriba": si el popover es
 * más alto que el espacio disponible arriba del campo, sin clampear se corta contra el
 * techo de la pantalla en vez de convivir con el borde. El `left` sigue clampeado en
 * ambos casos. También devuelve `maxHeight`: el espacio real disponible del lado
 * elegido, topeado a `height` — quien lo use debe sumar `overflow-y-auto` para que el
 * clamp además scrollee en vez de solo recortar.
 */
export function computePopoverStyle({
  rect,
  width,
  height,
  hidden = false,
  gap = DEFAULT_GAP,
}: PopoverStyleOptions): { style: CSSProperties & { maxHeight: number }; openUp: boolean } {
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  const openUp = spaceBelow < height + gap && spaceAbove > spaceBelow;

  let top: number | undefined;
  let bottom: number | undefined;
  let maxHeight: number;
  if (openUp) {
    bottom = Math.min(window.innerHeight - rect.top + gap, window.innerHeight - MARGIN - height);
    bottom = Math.max(bottom, MARGIN);
    maxHeight = Math.min(height, Math.max(spaceAbove - gap, MARGIN));
  } else {
    top = rect.bottom + gap;
    maxHeight = Math.min(height, Math.max(spaceBelow - gap, MARGIN));
  }

  let left = rect.left + width + MARGIN > window.innerWidth ? rect.right - width : rect.left;
  left = Math.min(Math.max(MARGIN, left), window.innerWidth - width - MARGIN);

  return {
    style: {
      position: "fixed",
      ...(top !== undefined ? { top } : { bottom }),
      left,
      maxHeight,
      zIndex: POPOVER_Z_INDEX,
      visibility: hidden ? "hidden" : "visible",
      pointerEvents: hidden ? "none" : "auto",
    },
    openUp,
  };
}

/** Un campo queda "tapado" si su propio scroll ancestro lo sacó de su viewport, o si
 * salió del viewport de la ventana entera — en ambos casos el popover se oculta en vez
 * de flotar desanclado de su campo. */
export function isAnchorHidden(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  let node: HTMLElement | null = el.parentElement;
  while (node && node !== document.body) {
    const style = getComputedStyle(node);
    const scrollable =
      (style.overflowY === "auto" || style.overflowY === "scroll") &&
      node.scrollHeight > node.clientHeight;
    if (scrollable) {
      const containerRect = node.getBoundingClientRect();
      if (rect.bottom <= containerRect.top || rect.top >= containerRect.bottom) return true;
    }
    node = node.parentElement;
  }
  return rect.bottom <= 0 || rect.top >= window.innerHeight;
}
