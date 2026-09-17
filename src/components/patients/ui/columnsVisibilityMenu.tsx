"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Columns3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePopoverAnchor } from "@/hooks/usePopoverAnchor";
import { usePopoverReveal } from "@/hooks/usePopoverReveal";
import { computePopoverStyle } from "@/lib/popoverPosition";

export interface ToggleableColumn {
    key: string;
    label: string;
}

interface Props {
    columns: ToggleableColumn[];
    visible: Record<string, boolean>;
    onToggle: (key: string) => void;
    /** Mergea por encima de las clases default del trigger (mismo criterio que
     * `CustomSelect.triggerClassName`) — para embeberlo en un header con fondo distinto. */
    triggerClassName?: string;
}

// Mismo mecanismo de portal/anclaje/reveal que CustomSelect (usePopoverAnchor +
// computePopoverStyle + usePopoverReveal) — acá el panel es de checks multi-toggle en vez
// de una lista de opciones de valor único, así que no reusa el componente en sí.
const PORTAL_MARK = "columns-menu-portal";
const PANEL_WIDTH = 200;

export function ColumnsVisibilityMenu({ columns, visible, onToggle, triggerClassName }: Props) {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
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

    function handleToggleOpen() {
        if (open) {
            setOpen(false);
        } else {
            capture();
            setOpen(true);
        }
    }

    const { style: popoverStyle, openUp } = rect
        ? computePopoverStyle({ rect, width: PANEL_WIDTH, height: 40 * columns.length + 16, hidden })
        : { style: null, openUp: null };
    const reveal = usePopoverReveal(openUp);

    const panel =
        open && rect && popoverStyle
            ? createPortal(
                  <div
                      className={cn(
                          PORTAL_MARK,
                          "bg-white border border-gray-200 rounded-xl shadow-xl overflow-y-auto py-1.5",
                          reveal
                      )}
                      style={{ ...popoverStyle, width: PANEL_WIDTH }}
                  >
                      <p className="px-3 pb-1.5 text-[11px] font-bold tracking-widest text-gray-400 uppercase">
                          Columnas
                      </p>
                      {columns.map((col) => {
                          const isChecked = visible[col.key] !== false;
                          return (
                              <button
                                  key={col.key}
                                  type="button"
                                  onClick={() => onToggle(col.key)}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-black transition-colors duration-100"
                              >
                                  <span
                                      className={cn(
                                          "flex items-center justify-center w-4 h-4 rounded border-2 shrink-0 transition-colors duration-100",
                                          isChecked
                                              ? "bg-teal-700 border-teal-700"
                                              : "border-gray-300 bg-white"
                                      )}
                                  >
                                      {isChecked && <Check size={11} strokeWidth={3} className="text-white" />}
                                  </span>
                                  <span className="truncate">{col.label}</span>
                              </button>
                          );
                      })}
                  </div>,
                  document.body
              )
            : null;

    return (
        <div ref={containerRef} className="relative">
            <button
                ref={triggerRef}
                type="button"
                onClick={handleToggleOpen}
                className={cn(
                    "flex items-center gap-1.5 h-8 px-3 rounded-lg border-2 bg-gray-100 text-xs text-gray-600 transition duration-150",
                    open ? "border-teal-700" : "border-gray-300 hover:border-teal-300",
                    triggerClassName
                )}
            >
                <Columns3 size={15} />
                <span className="hidden sm:inline">Columnas</span>
            </button>
            {panel}
        </div>
    );
}
