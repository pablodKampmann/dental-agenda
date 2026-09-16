"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePopoverAnchor } from "@/hooks/usePopoverAnchor";
import { usePopoverReveal } from "@/hooks/usePopoverReveal";
import { computePopoverStyle } from "@/lib/popoverPosition";

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  disabledValues?: string[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  size?: "sm" | "md";
  className?: string;
  /** Reemplaza el trigger (borde, fondo, padding) para embeberlo dentro de otro input
   * compuesto (ej. el selector de país de PhoneInput, que vive dentro del mismo box con
   * borde que el número) — las clases se mergean por encima de las del trigger default,
   * así que solo hace falta pasar lo que cambia. */
  triggerClassName?: string;
  /** Contenido extra al inicio del trigger, antes del label (ej. la bandera del país). */
  leadingContent?: ReactNode;
  /** El trigger muestra solo `leadingContent` + flecha, sin el texto de la opción elegida
   * (ej. el selector de país: el código +54 lo muestra el input de al lado, repetirlo acá
   * sería redundante). El valor elegido se sigue viendo resaltado en el panel. */
  hideSelectedLabel?: boolean;
  /** Pasa directo al trigger (ej. `-1` para sacarlo del orden de tabulación, como el
   * selector de país de PhoneInput — el Tab pasa de largo hasta el campo del número). */
  tabIndex?: number;
}

// Portal fuera del árbol del trigger: sin esta marca, un click en una opción cae afuera
// del contenedor con ref y useOutsideClick-style cerraría el panel antes de disparar el
// onClick de la opción.
const PORTAL_MARK = "custom-select-portal";
const POPOVER_MAX_H = 240;

export function CustomSelect({
  label,
  value,
  onChange,
  options,
  disabledValues = [],
  placeholder = "Seleccioná...",
  disabled = false,
  required = false,
  size = "md",
  className,
  triggerClassName,
  leadingContent,
  hideSelectedLabel = false,
  tabIndex,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  // Índice resaltado por teclado — independiente de `value`: mientras se navega con las
  // flechas todavía no se confirmó nada, recién se aplica en Enter/Espacio (igual que un
  // <select> nativo, que no dispara onChange hasta soltar/confirmar la opción).
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const { rect, hidden, capture } = usePopoverAnchor(triggerRef, open);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      const target = e.target as Element;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        !target.closest(`.${PORTAL_MARK}`)
      ) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    if (open) optionRefs.current[highlightedIndex]?.scrollIntoView({ block: "nearest" });
  }, [open, highlightedIndex]);

  function firstEnabledIndex(): number {
    return options.findIndex((o) => !disabledValues.includes(o.value));
  }

  function nextEnabledIndex(from: number, dir: 1 | -1): number {
    if (options.length === 0) return -1;
    for (let step = 1; step <= options.length; step++) {
      const i = (from + dir * step + options.length) % options.length;
      if (!disabledValues.includes(options[i].value)) return i;
    }
    return from;
  }

  function openDropdown() {
    if (disabled) return;
    capture();
    const selectedIndex = options.findIndex((o) => o.value === value);
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : firstEnabledIndex());
    setOpen(true);
  }

  function handleToggle() {
    if (disabled) return;
    if (open) {
      setOpen(false);
    } else {
      openDropdown();
    }
  }

  function handleSelect(val: string) {
    onChange(val);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleTriggerKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openDropdown();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((i) => nextEnabledIndex(i, 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((i) => nextEnabledIndex(i, -1));
        break;
      case "Home":
        e.preventDefault();
        setHighlightedIndex(firstEnabledIndex());
        break;
      case "End":
        e.preventDefault();
        setHighlightedIndex(nextEnabledIndex(0, -1));
        break;
      case "Enter":
      case " ": {
        e.preventDefault();
        const opt = options[highlightedIndex];
        if (opt && !disabledValues.includes(opt.value)) handleSelect(opt.value);
        break;
      }
      case "Tab":
        setOpen(false);
        break;
    }
  }

  const selectedLabel = options.find((o) => o.value === value)?.label;
  const popoverWidth = rect ? Math.max(rect.width, 176) : 176;
  const { style: popoverStyle, openUp } = rect
    ? computePopoverStyle({ rect, width: popoverWidth, height: POPOVER_MAX_H, hidden })
    : { style: null, openUp: null };
  const reveal = usePopoverReveal(openUp);

  const popover =
    open && rect && popoverStyle
      ? createPortal(
          <div
            className={cn(
              PORTAL_MARK,
              "bg-white border border-gray-200 rounded-xl shadow-xl overflow-y-auto py-1.5",
              reveal
            )}
            style={{
              ...popoverStyle,
              width: popoverWidth,
              maxHeight: POPOVER_MAX_H,
            }}
          >
            {options.length === 0 ? (
              <p className="px-3 py-2 text-xs text-gray-400 text-center">Sin opciones</p>
            ) : (
              options.map((opt, i) => {
                const isOptDisabled = disabledValues.includes(opt.value);
                const isSelected = opt.value === value;
                const isHighlighted = i === highlightedIndex;
                return (
                  <button
                    key={opt.value}
                    ref={(el) => { optionRefs.current[i] = el; }}
                    type="button"
                    disabled={isOptDisabled}
                    onClick={() => !isOptDisabled && handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(i)}
                    className={cn(
                      "w-full text-left px-3 py-1.5 text-sm truncate transition-colors duration-100",
                      isOptDisabled
                        ? "opacity-40 cursor-not-allowed text-gray-400"
                        : isSelected
                        ? "bg-teal-50 text-teal-700 font-semibold"
                        : isHighlighted
                        ? "bg-gray-50 text-black"
                        : "text-gray-700 hover:bg-gray-50 hover:text-black"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })
            )}
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={containerRef} className={cn("flex flex-col gap-1", className)}>
      {label && (
        <label className="text-xs font-semibold text-gray-500">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        onKeyDown={handleTriggerKeyDown}
        disabled={disabled}
        tabIndex={tabIndex}
        className={cn(
          "flex items-center justify-between gap-2 rounded-lg border-2 bg-gray-100 text-left transition duration-150",
          size === "sm" ? "h-8 px-2.5 text-xs" : "h-9 px-3 text-sm",
          disabled
            ? "opacity-40 cursor-not-allowed border-gray-300"
            : open
            ? "border-teal-700"
            : "border-gray-300 hover:border-teal-300",
          triggerClassName
        )}
      >
        {leadingContent}
        {!hideSelectedLabel && (
          <span className={cn("min-w-0 truncate", selectedLabel ? "text-black" : "text-gray-400")}>
            {selectedLabel || placeholder}
          </span>
        )}
        <ChevronDown
          size={size === "sm" ? 14 : 16}
          className={cn(
            "shrink-0 text-gray-500 transition-transform duration-150",
            open && "rotate-180"
          )}
        />
      </button>
      {popover}
    </div>
  );
}
