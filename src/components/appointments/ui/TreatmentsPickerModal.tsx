"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { MdClose, MdMedicalServices } from "react-icons/md";
import { FaRegTrashCan } from "react-icons/fa6";
import { TbSearch } from "react-icons/tb";
import { CustomSelect } from "@/components/shared/CustomSelect";
import { normalizeForSearch } from "@/lib/utils";
import type { Treatment } from "@/services/treatments/getTreatments";
import type { AppointmentTreatment } from "../appointmentUtils";

interface Props {
  open: boolean;
  onClose: () => void;
  catalog: Treatment[];
  /** Tratamientos ya asignados al turno — el modal trabaja sobre una copia y solo la aplica al confirmar. */
  value: AppointmentTreatment[];
  onConfirm: (treatments: AppointmentTreatment[]) => void;
}

const BTN_GHOST = "px-4 py-2 text-sm font-semibold text-gray-600 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:text-black transition duration-150";
const BTN_PRIMARY = "px-4 py-2 text-sm font-semibold bg-teal-700 text-white rounded-lg hover:bg-teal-600 transition duration-150";
const COLUMN_LABEL = "text-xs font-bold tracking-widest text-gray-400 uppercase select-none";

export function TreatmentsPickerModal({ open, onClose, catalog, value, onConfirm }: Props) {
  const [mounted, setMounted] = useState(false);
  const [draft, setDraft] = useState<AppointmentTreatment[]>(value);
  const [area, setArea] = useState("");
  const [search, setSearch] = useState("");

  // Entrada: mismo patrón que el resto de los modales (un frame apagado y después se prende).
  // Al abrir, además, se parte de una copia limpia de lo que ya tiene el turno.
  useEffect(() => {
    if (!open) {
      setMounted(false);
      return;
    }
    setDraft(value);
    setArea("");
    setSearch("");
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
    // `value` se lee solo al abrir a propósito: seguirlo pisaría lo que se está eligiendo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const areaOptions = useMemo(() => {
    const names = Array.from(new Set(catalog.map((t) => t.area))).sort((a, b) => a.localeCompare(b));
    return [{ value: "", label: "Todas las áreas" }, ...names.map((n) => ({ value: n, label: n }))];
  }, [catalog]);

  const pickable = useMemo(() => {
    const taken = new Set(draft.map((t) => t.id));
    const term = normalizeForSearch(search.trim());
    return catalog.filter(
      (t) =>
        !taken.has(t.id) &&
        (area === "" || t.area === area) &&
        (term === "" || normalizeForSearch(t.name).includes(term) || (t.codigo ?? "").includes(term)),
    );
  }, [catalog, draft, area, search]);

  const total = draft.reduce((sum, t) => sum + t.price, 0);

  function add(t: Treatment) {
    setDraft((prev) => [...prev, { id: t.id, name: t.name, price: t.price, ...(t.codigo ? { codigo: t.codigo } : {}) }]);
  }

  if (!open || typeof window === "undefined") return null;

  return createPortal(
    <>
      <div className={`fixed inset-0 z-[60] bg-black/50 transition-opacity duration-200 ${mounted ? "opacity-100" : "opacity-0"}`} />
      <div
        className="fixed inset-0 z-[65] flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className={`w-full max-w-[720px] max-h-full flex flex-col bg-white border border-gray-200 rounded-2xl shadow-xl transition-all duration-200 ease-out ${
            mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          {/* Header */}
          <div className="shrink-0 flex items-center gap-3 px-6 pt-5 pb-4 border-b border-gray-200">
            <div className="shrink-0 flex items-center justify-center w-10 h-10 bg-teal-50 text-teal-700 border border-teal-200 rounded-xl">
              <MdMedicalServices size={20} />
            </div>
            <div className="flex-1 min-w-0 select-none">
              <h2 className="text-base font-bold text-black tracking-tight">Tratamientos del turno</h2>
              <p className="text-xs text-gray-400">Elegí uno o más del catálogo.</p>
            </div>
            <button type="button" onClick={onClose} className="shrink-0 text-gray-400 hover:text-black transition duration-150">
              <MdClose size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Catálogo */}
            <div className="flex flex-col gap-2 min-w-0">
              <span className={COLUMN_LABEL}>Catálogo</span>
              <CustomSelect
                value={area}
                onChange={setArea}
                placeholder="Todas las áreas"
                options={areaOptions}
                size="sm"
                triggerClassName="bg-white"
              />
              <div className="relative flex items-stretch h-8 border-2 border-gray-300 rounded-lg bg-white transition-colors focus-within:border-teal-700">
                <TbSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-teal-700 pointer-events-none" size={15} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  type="text"
                  autoComplete="off"
                  placeholder="Buscar por nombre o código..."
                  className="flex-1 min-w-0 pl-8 pr-3 bg-transparent text-xs text-black placeholder:text-gray-400 outline-none rounded-lg"
                />
              </div>
              <div className="h-64 border border-gray-200 rounded-lg overflow-y-auto bg-white">
                {pickable.length > 0 ? (
                  pickable.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => add(t)}
                      className="flex justify-between items-center gap-2 px-3 py-1.5 text-xs text-black border-b border-gray-100 last:border-none hover:bg-gray-50 cursor-pointer transition duration-100"
                    >
                      <span className="min-w-0">
                        <span className="block truncate">{t.name}</span>
                        {t.codigo && <span className="block text-[11px] text-gray-400">{t.codigo}</span>}
                      </span>
                      <span className="font-semibold text-gray-500 shrink-0">${t.price.toLocaleString("es-AR")}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 p-4 text-center">
                    {catalog.length === 0 ? "Todavía no hay tratamientos en el catálogo" : "Sin resultados"}
                  </p>
                )}
              </div>
            </div>

            {/* Seleccionados */}
            <div className="flex flex-col gap-2 min-w-0">
              <div className="flex items-center justify-between">
                <span className={COLUMN_LABEL}>Seleccionados ({draft.length})</span>
                {draft.length > 0 && (
                  <span className="text-xs font-semibold text-gray-500">Total ${total.toLocaleString("es-AR")}</span>
                )}
              </div>
              <div className="flex-1 min-h-[16rem] border border-gray-200 rounded-lg overflow-y-auto bg-gray-50">
                {draft.length > 0 ? (
                  draft.map((t) => (
                    <div key={t.id} className="flex items-center gap-2 px-3 py-2 bg-white border-b border-gray-100 last:border-none">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-black truncate">{t.name}</p>
                        {t.codigo && <p className="text-xs text-gray-400">{t.codigo}</p>}
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-gray-500">${t.price.toLocaleString("es-AR")}</span>
                      <button
                        type="button"
                        onClick={() => setDraft((prev) => prev.filter((x) => x.id !== t.id))}
                        className="shrink-0"
                      >
                        <FaRegTrashCan size={13} className="text-gray-400 hover:text-red-600 transition duration-150" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-1 text-center p-4 select-none">
                    <MdMedicalServices size={28} className="text-gray-300" />
                    <p className="text-sm font-semibold text-gray-500">Sin tratamientos</p>
                    <p className="text-xs text-gray-400">Tocá uno del catálogo para agregarlo.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 flex justify-end gap-2 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
            <button type="button" onClick={onClose} className={BTN_GHOST}>Cancelar</button>
            <button
              type="button"
              onClick={() => {
                onConfirm(draft);
                onClose();
              }}
              className={BTN_PRIMARY}
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
