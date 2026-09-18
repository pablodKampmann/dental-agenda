/**
 * Clase de animación de entrada para cualquier popover anclado (CustomSelect hoy, otros
 * después): si abre hacia abajo entra "cayendo" desde arriba del trigger (`popover-drop`);
 * si abre hacia arriba —no hay lugar abajo— entra "subiendo" desde abajo del trigger
 * (`popover-rise`), para que el desplazamiento siempre vaya en el mismo sentido en que
 * se despliega el panel. `openUp` es el que devuelve `computePopoverStyle` en
 * `@/lib/popoverPosition`. `null` (todavía no se calculó la posición, primer render) no
 * anima nada — evita un flash con la clase por defecto antes de saber el lado real.
 */
export function usePopoverReveal(openUp: boolean | null): string {
  if (openUp === null) return "";
  return openUp ? "animate-popover-rise" : "animate-popover-drop";
}
