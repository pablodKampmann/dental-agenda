"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { usePopoverAnchor } from "@/hooks/usePopoverAnchor";
import { usePopoverReveal } from "@/hooks/usePopoverReveal";
import { computePopoverStyle } from "@/lib/popoverPosition";
import { cn } from "@/lib/utils";

type Side = "bottom" | "left" | "right";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  /** `bottom` (default) reusa el mismo clamp + flip que el resto de los popovers anclados
   *  (abre hacia arriba si no hay lugar abajo). `left`/`right` son para triggers angostos
   *  de una sola línea (ej. un ícono del sidebar) — centran verticalmente contra el
   *  trigger, sin flip. */
  side?: Side;
  /** Ancho del tooltip cuando `side='bottom'`. Default `'auto'`: se ajusta al ancho real
   *  del contenido, sin wrap — lo correcto para el caso típico, una frase corta de una
   *  línea. Pasar un número fuerza ese ancho fijo y permite que el texto wrappee — para
   *  una explicación más larga. No aplica a `left`/`right`, que siempre son de una sola
   *  línea. */
  width?: number | "auto";
  disabled?: boolean;
  /** Clases para el wrapper del trigger (ej. layout, no estilo del tooltip en sí). */
  className?: string;
  /** Solo muestra el tooltip si el trigger está realmente recortado (`scrollWidth >
   *  clientWidth`) al momento del hover — para texto con `truncate` que a veces entra
   *  entero y a veces no según el ancho disponible. La clase que trunca tiene que vivir
   *  en este mismo wrapper (vía `className`), porque es ese nodo el que se mide. */
  onlyIfTruncated?: boolean;
  /** El trigger ya es clickeable (botón, link) — no fuerza `cursor-help`, para no pisar
   *  el `cursor-pointer` propio del hijo en el margen de padding del wrapper. */
  clickable?: boolean;
}

const GAP_BOTTOM = 8;
const GAP_SIDE = 10;
// Por encima de POPOVER_Z_INDEX (9000): un tooltip puede necesitar mostrarse sobre un
// CustomSelect/MiniCalendar ya abierto (ej. hover sobre un ícono de ayuda dentro de un panel).
const TOOLTIP_Z_INDEX = 9500;
const OFFSCREEN: CSSProperties = { position: "fixed", top: -9999, left: -9999 };

/**
 * Tooltip anclado al trigger, portaleado a `document.body` — mismo motivo que
 * `CustomSelect`: un ancestro con `overflow-hidden` recortaría un tooltip posicionado
 * `fixed` aunque esté contra el viewport. Reusa los primitivos de popover ya existentes
 * (`usePopoverAnchor`, `computePopoverStyle`, `usePopoverReveal`) para que el
 * comportamiento de clamp/flip/ocultado-por-scroll sea idéntico al resto del sistema.
 */
export default function Tooltip({
  content,
  children,
  side = "bottom",
  width = "auto",
  disabled,
  className,
  onlyIfTruncated,
  clickable,
}: TooltipProps) {
  const [show, setShow] = useState(false);
  const [style, setStyle] = useState<CSSProperties | null>(null);
  const [openUp, setOpenUp] = useState<boolean | null>(null);
  const [truncated, setTruncated] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { rect, hidden, capture } = usePopoverAnchor(triggerRef, show);

  useLayoutEffect(() => {
    if (!onlyIfTruncated) return;
    const el = triggerRef.current;
    if (!el) return;
    const check = () => setTruncated(el.scrollWidth > el.clientWidth);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [onlyIfTruncated]);

  function handleEnter() {
    if (disabled) return;
    if (onlyIfTruncated && !truncated) return;
    capture();
    setShow(true);
  }

  // side='left'/'right': centrado vertical contra el trigger, sin flip — pensado para un
  // ícono angosto (ej. sidebar), no para texto largo.
  const sideStyle: CSSProperties | null =
    show && rect && side !== "bottom"
      ? {
          position: "fixed",
          top: rect.top + rect.height / 2,
          ...(side === "right"
            ? { left: rect.right + GAP_SIDE }
            : { right: window.innerWidth - rect.left + GAP_SIDE }),
          transform: "translateY(-50%)",
          visibility: hidden ? "hidden" : "visible",
        }
      : null;

  // side='bottom': ni el alto ni (con width='auto') el ancho se conocen antes de montar,
  // así que se miden del propio tooltip ya renderizado offscreen (w-fit, ver className
  // abajo) — mismo patrón que CustomSelect, corrido en useLayoutEffect para que el
  // clamp/flip no se vea como un salto visible.
  useLayoutEffect(() => {
    if (!show || !rect || side !== "bottom") return;
    const box = tooltipRef.current?.getBoundingClientRect();
    const height = box?.height ?? 0;
    const widthReal = width === "auto" ? box?.width ?? 0 : width;
    const { style: computed, openUp: computedOpenUp } = computePopoverStyle({
      rect,
      width: widthReal,
      height,
      hidden,
      gap: GAP_BOTTOM,
    });
    setStyle(computed);
    setOpenUp(computedOpenUp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, rect, hidden]);

  const reveal = usePopoverReveal(side === "bottom" ? openUp : false);

  const tooltip = show && !disabled && (
    <div
      ref={tooltipRef}
      role="tooltip"
      className={cn(
        "pointer-events-none rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-lg",
        side !== "bottom" && "whitespace-nowrap animate-fade-in",
        side === "bottom" && (reveal || "animate-fade-in"),
        side === "bottom" && (width === "auto" ? "w-fit whitespace-nowrap" : "break-words")
      )}
      style={{
        ...((side === "bottom" ? style : sideStyle) ?? OFFSCREEN),
        zIndex: TOOLTIP_Z_INDEX,
        width: side === "bottom" && width !== "auto" ? width : undefined,
      }}
    >
      {content}
    </div>
  );

  // Cursor "help" default en cualquier trigger informativo — salvo que no vaya a
  // disparar nada (disabled, o onlyIfTruncated sin truncar) o sea `clickable` (el hijo ya
  // trae su propio cursor-pointer, no lo pisamos).
  const cursor = disabled || clickable ? undefined : onlyIfTruncated ? (truncated ? "help" : undefined) : "help";

  return (
    <div
      ref={triggerRef}
      className={className}
      style={cursor ? { cursor } : undefined}
      onMouseEnter={handleEnter}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {typeof window !== "undefined" && createPortal(tooltip, document.body)}
    </div>
  );
}
