"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { ClipLoader } from "react-spinners";
import { MdOutlineFileUpload, MdClose, MdWarningAmber, MdEdit, MdDeleteOutline, MdCheck } from "react-icons/md";
import { extractPdfLines } from "@/lib/pdfText";
import { parseTreatmentsPdf, type ParsedTreatmentRow } from "@/lib/treatmentsPdfParser";
import { importTreatments } from "@/services/treatments/importTreatments";
import { useToast } from "@/context/ToastContext";
import { formatPriceInput, isValidPriceInput, parsePriceInput, sanitizePriceInput } from "../priceInput";
import type { Treatment } from "@/services/treatments/getTreatments";

interface Props {
  open: boolean;
  onClose: () => void;
  clinicId: string | null;
  existingTreatments: Treatment[];
  onImported: () => void;
}

interface SkippedItem {
  id: number;
  raw: string;
}

interface Draft {
  codigo: string;
  area: string;
  name: string;
  priceRaw: string;
}

const CELL_INPUT = "h-8 px-2 border border-amber-200 rounded-md bg-white text-xs text-black placeholder:text-gray-400 focus:outline-teal-700";

const BTN_GHOST = "px-4 py-2 text-sm font-semibold text-gray-600 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:text-black transition duration-150";
const BTN_PRIMARY = "px-4 py-2 text-sm font-semibold bg-teal-700 text-white rounded-lg hover:bg-teal-600 transition duration-150 disabled:opacity-60 disabled:cursor-not-allowed";

export function ImportTreatmentsModal({ open, onClose, clinicId, existingTreatments, onImported }: Props) {
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [vigenteDesde, setVigenteDesde] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedTreatmentRow[] | null>(null);
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [skipped, setSkipped] = useState<SkippedItem[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>({ codigo: "", area: "", name: "", priceRaw: "" });
  const { showToast } = useToast();

  if (!open || typeof window === "undefined") return null;

  function reset() {
    setParsing(false);
    setImporting(false);
    setVigenteDesde(null);
    setRows(null);
    setExcluded(new Set());
    setSkipped([]);
    setEditingId(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleFile(file: File) {
    setParsing(true);
    try {
      const lines = await extractPdfLines(file);
      const result = parseTreatmentsPdf(lines);
      setVigenteDesde(result.vigenteDesde);
      setRows(result.rows);
      setSkipped(result.skipped.map((raw, i) => ({ id: i, raw })));
      if (result.rows.length === 0) {
        showToast("error", "No se reconoció ningún tratamiento en el PDF");
      }
    } catch (error) {
      console.error(error);
      showToast("error", "No se pudo leer el PDF");
    }
    setParsing(false);
  }

  function toggleRow(index: number) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  async function handleConfirm() {
    if (!clinicId || !rows) return;
    const included = rows.filter((_, i) => !excluded.has(i));
    if (included.length === 0) return;
    setImporting(true);
    const result = await importTreatments(clinicId, existingTreatments, included);
    setImporting(false);
    if (!result) {
      showToast("error", "Error al importar el catálogo");
      return;
    }
    showToast("success", `${result.created} creados, ${result.updated} actualizados`);
    onImported();
    handleClose();
  }

  function startEdit(item: SkippedItem) {
    setEditingId(item.id);
    setDraft({ codigo: "", area: "", name: item.raw, priceRaw: "" });
  }

  function discardSkipped(id: number) {
    setSkipped((prev) => prev.filter((s) => s.id !== id));
    if (editingId === id) setEditingId(null);
  }

  // Confirmar la edición de un renglón no reconocido lo convierte en un tratamiento más
  // de la lista (queda seleccionado, como los que el parser reconoció solo).
  function confirmEdit() {
    if (editingId === null) return;
    if (!draft.name.trim() || !isValidPriceInput(draft.priceRaw)) {
      showToast("error", "Completá el nombre y el precio", "import-edit-validation");
      return;
    }
    setRows((prev) => [
      ...(prev ?? []),
      {
        codigo: draft.codigo.trim() || null,
        name: draft.name.trim(),
        price: parsePriceInput(draft.priceRaw),
        area: draft.area.trim() || "Varios",
        vigenteDesde,
      },
    ]);
    discardSkipped(editingId);
  }

  function handlePriceKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "." || e.key === ",") {
      e.preventDefault();
      setDraft((d) => (d.priceRaw.includes(",") ? d : { ...d, priceRaw: `${d.priceRaw},` }));
    }
  }

  const areaOptions = Array.from(
    new Set([...existingTreatments.map((t) => t.area), ...(rows ?? []).map((r) => r.area)]),
  ).sort((a, b) => a.localeCompare(b));

  const includedCount = rows ? rows.length - excluded.size : 0;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[60] bg-black/50" />
      <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
        <div className="w-full max-w-[720px] max-h-full flex flex-col bg-white border border-gray-200 rounded-2xl shadow-xl">
          {/* Header */}
          <div className="shrink-0 flex items-center gap-3 px-6 pt-5 pb-4 border-b border-gray-200">
            <div className="shrink-0 flex items-center justify-center w-10 h-10 bg-teal-50 text-teal-700 border border-teal-200 rounded-xl">
              <MdOutlineFileUpload size={20} />
            </div>
            <div className="flex-1 min-w-0 select-none">
              <h2 className="text-base font-bold text-black tracking-tight">Importar catálogo (PDF)</h2>
              <p className="text-xs text-gray-400">
                {rows ? "Revisá antes de confirmar — se puede excluir cualquier renglón." : "Aranceles del colegio u otro listado con el mismo formato."}
              </p>
            </div>
            <button type="button" onClick={handleClose} className="shrink-0 text-gray-400 hover:text-black transition duration-150">
              <MdClose size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0 overflow-y-auto p-6">
            {!rows ? (
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-teal-300 hover:bg-teal-50/30 transition duration-150">
                {parsing ? (
                  <>
                    <ClipLoader color="#0f766e" size={28} />
                    <p className="text-sm text-gray-500 mt-2">Leyendo el PDF...</p>
                  </>
                ) : (
                  <>
                    <MdOutlineFileUpload size={40} className="text-gray-300" />
                    <p className="text-sm font-medium text-gray-500">Hacé click para elegir un PDF</p>
                    <p className="text-xs text-gray-400">Se procesa acá mismo, no se sube a ningún lado.</p>
                  </>
                )}
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  disabled={parsing}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                    e.target.value = "";
                  }}
                />
              </label>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2 text-xs text-gray-500">
                  <span>
                    {rows.length} tratamientos reconocidos
                    {vigenteDesde && <> · vigentes desde {vigenteDesde}</>}
                  </span>
                  <span className="font-semibold text-teal-700">{includedCount} seleccionados</span>
                </div>

                {skipped.length > 0 && (
                  <div className="flex flex-col gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
                    <div className="flex items-start gap-2">
                      <MdWarningAmber size={16} className="shrink-0 mt-0.5" />
                      <span>{skipped.length} renglón(es) del PDF no se pudieron interpretar y quedaron afuera — se pueden cargar a mano si hace falta.</span>
                    </div>
                    <datalist id="import-areas">
                      {areaOptions.map((a) => (
                        <option key={a} value={a} />
                      ))}
                    </datalist>
                    <ul className="flex flex-col divide-y divide-amber-200">
                      {skipped.map((item) =>
                        editingId === item.id ? (
                          <li key={item.id} className="flex flex-col gap-2 py-2">
                            <div className="flex gap-2">
                              <input
                                value={draft.codigo}
                                onChange={(e) => setDraft({ ...draft, codigo: e.target.value.replace(/,/g, ".").replace(/[^\d.]/g, "") })}
                                placeholder="Código"
                                className={`${CELL_INPUT} w-24`}
                              />
                              <input
                                list="import-areas"
                                value={draft.area}
                                onChange={(e) => setDraft({ ...draft, area: e.target.value })}
                                placeholder="Área (Varios)"
                                className={`${CELL_INPUT} flex-1 min-w-0`}
                              />
                            </div>
                            <div className="flex gap-2">
                              <input
                                value={draft.name}
                                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                                placeholder="Nombre"
                                className={`${CELL_INPUT} flex-1 min-w-0`}
                              />
                              <input
                                value={formatPriceInput(draft.priceRaw)}
                                onChange={(e) => setDraft({ ...draft, priceRaw: sanitizePriceInput(e.target.value) })}
                                onKeyDown={handlePriceKeyDown}
                                inputMode="decimal"
                                placeholder="Precio"
                                className={`${CELL_INPUT} w-28`}
                              />
                              <button type="button" onClick={confirmEdit} className="shrink-0 text-teal-700 hover:text-teal-600 transition duration-150">
                                <MdCheck size={18} />
                              </button>
                              <button type="button" onClick={() => setEditingId(null)} className="shrink-0 text-gray-400 hover:text-black transition duration-150">
                                <MdClose size={18} />
                              </button>
                            </div>
                          </li>
                        ) : (
                          <li key={item.id} className="flex items-center gap-2 py-1.5">
                            <span className="flex-1 min-w-0 text-amber-800">{item.raw}</span>
                            <button type="button" onClick={() => startEdit(item)} className="shrink-0 text-amber-700 hover:text-black transition duration-150">
                              <MdEdit size={16} />
                            </button>
                            <button type="button" onClick={() => discardSkipped(item.id)} className="shrink-0 text-amber-700 hover:text-red-600 transition duration-150">
                              <MdDeleteOutline size={16} />
                            </button>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}

                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  {rows.map((row, i) => (
                    <label
                      key={i}
                      className={`flex items-center gap-3 px-3 py-2 text-sm border-b border-gray-100 last:border-b-0 cursor-pointer transition duration-100 ${
                        excluded.has(i) ? "opacity-40" : "hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!excluded.has(i)}
                        onChange={() => toggleRow(i)}
                        className="shrink-0 accent-teal-700"
                      />
                      <span className="flex-1 min-w-0 truncate text-black">{row.name}</span>
                      <span className="shrink-0 text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200 rounded-full px-2 py-0.5">
                        {row.area}
                      </span>
                      <span className="shrink-0 w-24 text-right text-gray-500">${row.price.toLocaleString("es-AR")}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 flex justify-end gap-2 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
            <button type="button" onClick={handleClose} className={BTN_GHOST}>Cancelar</button>
            {rows && (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={importing || includedCount === 0}
                className={BTN_PRIMARY}
              >
                {importing ? <ClipLoader color="#fff" size={16} /> : `Importar ${includedCount}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
