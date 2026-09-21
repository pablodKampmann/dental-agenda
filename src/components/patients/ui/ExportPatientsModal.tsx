"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, FileSpreadsheet } from "lucide-react";
import { ClipLoader } from "react-spinners";

interface Props {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    totalCount: number;
    filterDescription: string | null;
    /** Qué se exporta — por default pacientes; /treatments lo reusa con su propio nombre. */
    noun?: { singular: string; plural: string };
}

export function ExportPatientsModal({ open, onClose, onConfirm, totalCount, filterDescription, noun = { singular: "paciente", plural: "pacientes" } }: Props) {
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (open) {
            const frame = requestAnimationFrame(() => setMounted(true));
            return () => cancelAnimationFrame(frame);
        }
        setMounted(false);
    }, [open]);

    if (!open) return null;

    async function handleConfirm() {
        setLoading(true);
        try {
            await onConfirm();
            onClose();
        } finally {
            setLoading(false);
        }
    }

    return createPortal(
        <>
            <div
                className={`fixed inset-0 z-[60] bg-black/50 transition-opacity duration-200 ${mounted ? 'opacity-100' : 'opacity-0'}`}
            />
            <div
                className="fixed inset-0 z-[65] flex items-center justify-center p-4"
                onClick={() => { if (!loading) onClose(); }}
            >
                <div
                    onClick={(e) => e.stopPropagation()}
                    className={`w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden transition-all duration-200 ease-out ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                >
                    <div className="flex items-start gap-3 px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
                            <FileSpreadsheet size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-base font-bold text-black tracking-tight">Exportar {noun.plural}</h2>
                            <p className="text-xs text-gray-400">Formato Excel (.xlsx)</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => { if (!loading) onClose(); }}
                            className="text-gray-400 hover:text-black transition duration-150 shrink-0"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="px-4 py-4 text-sm text-gray-600 space-y-2">
                        <p>
                            Se van a exportar <span className="font-semibold text-black">{totalCount}</span>{" "}
                            {totalCount === 1 ? noun.singular : noun.plural}.
                        </p>
                        {filterDescription ? (
                            <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                                {filterDescription}
                            </p>
                        ) : (
                            <p className="text-xs text-gray-400">
                                No hay filtros activos: se exporta el total de {noun.plural} de la clínica.
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-3 py-1.5 text-sm font-semibold border-2 border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 hover:text-black transition duration-150 disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={loading}
                            className="min-w-[110px] flex items-center justify-center px-3 py-1.5 text-sm font-semibold bg-teal-700 text-white rounded-lg hover:bg-teal-600 transition duration-150 disabled:opacity-50"
                        >
                            {loading ? <ClipLoader color="white" size={16} /> : "Exportar"}
                        </button>
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
}
