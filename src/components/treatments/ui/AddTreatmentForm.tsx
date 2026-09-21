"use client";

import { useState } from "react";
import { FaRegTrashCan } from "react-icons/fa6";
import { useToast } from "@/context/ToastContext";
import { CustomSelect } from "@/components/shared/CustomSelect";
import { formatPriceInput, isValidPriceInput, parsePriceInput, sanitizePriceInput } from "../priceInput";
import type { Treatment } from "@/services/treatments/getTreatments";
import type { Area } from "@/services/treatments/getAreas";
import type { TreatmentFields } from "@/services/treatments/addTreatment";

/** Lo que emite el form: el área es una existente (`areaId`) o una nueva por nombre
 *  (`newAreaName`) — el padre la crea recién al guardar, así cancelar no deja áreas sueltas.
 *  Sin ninguna de las dos, el padre usa "Varios". */
export type TreatmentFormValues = Omit<TreatmentFields, "areaId"> & { areaId?: string; newAreaName?: string };

const NEW_AREA = "__new__";

interface Props {
  editingTreatment: Treatment | null;
  areas: Area[];
  onSave: (values: TreatmentFormValues) => void;
  onDelete: () => void;
}

const INPUT_CLS =
  "w-full h-9 px-3 border-2 border-gray-300 rounded-lg bg-white text-sm text-black placeholder:text-gray-400 focus:outline-teal-700";
const LABEL_CLS = "text-xs font-semibold text-gray-500";
const PRIMARY_BTN = "w-full py-2.5 text-sm font-semibold rounded-lg transition duration-150";

function sanitizeCodigo(value: string): string {
  return value.replace(/,/g, ".").replace(/[^\d.]/g, "");
}

export function AddTreatmentForm({ editingTreatment, areas, onSave, onDelete }: Props) {
  const [areaSel, setAreaSel] = useState(editingTreatment?.areaId ?? "");
  const [newAreaName, setNewAreaName] = useState("");
  const [name, setName] = useState(editingTreatment?.name ?? "");
  const [price, setPrice] = useState(editingTreatment ? String(editingTreatment.price).replace(".", ",") : "");
  const [codigo, setCodigo] = useState(editingTreatment?.codigo ?? "");
  const { showToast } = useToast();

  // El padre remonta este componente (key por id de tratamiento) cada vez que cambia
  // cuál se edita, así que el estado inicial arriba ya alcanza — no hace falta
  // sincronizar con un efecto, `editingTreatment` no cambia en la vida de esta instancia.

  const creatingArea = areaSel === NEW_AREA;
  const areaOptions = [
    ...areas.map((a) => ({ value: a.id, label: a.name })),
    { value: NEW_AREA, label: "+ Crear área nueva" },
  ];

  // "." y "," se interceptan acá (en vez de dejarlos pasar al onChange) para poder
  // estandarizarlos sin ambigüedad: una vez que llegan al onChange ya no se puede
  // distinguir un separador recién tipeado de uno que ya puso el propio formateo — ver
  // priceInput.ts. Precio estandariza a coma, Código estandariza a punto (al revés,
  // porque el código sigue la convención del colegio: "04.01.09").
  function handlePriceKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "." || e.key === ",") {
      e.preventDefault();
      setPrice((prev) => (prev.includes(",") ? prev : `${prev},`));
    }
  }

  const codigoTrimmed = codigo.trim();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const missing: string[] = [];
    if (!name.trim()) missing.push("el nombre");
    if (!isValidPriceInput(price)) missing.push("el precio");
    if (creatingArea && !newAreaName.trim()) missing.push("el nombre del área nueva");
    if (missing.length > 0) {
      showToast("error", `Completá ${missing.join(" y ")}`, "treatment-form-validation");
      return;
    }
    onSave({
      name: name.trim(),
      price: parsePriceInput(price),
      ...(creatingArea ? { newAreaName: newAreaName.trim() } : areaSel ? { areaId: areaSel } : {}),
      codigo: codigoTrimmed || undefined,
    });
  }

  // En edición, "Guardar cambios" solo se habilita si algo realmente difiere del
  // tratamiento original — evita un guardado (y un toast de éxito) por reabrir el panel
  // y tocar "Guardar" sin haber cambiado nada. En alta nueva no aplica, siempre queda
  // habilitado (la validación de campos vacíos corre en el submit).
  const priceChanged = !isValidPriceInput(price) || parsePriceInput(price) !== editingTreatment?.price;
  const areaChanged = creatingArea || areaSel !== (editingTreatment?.areaId ?? "");
  const codigoChanged = codigoTrimmed !== (editingTreatment?.codigo ?? "");
  const hasChanges = !editingTreatment || name.trim() !== editingTreatment.name || priceChanged || areaChanged || codigoChanged;
  const isDisabled = !!editingTreatment && !hasChanges;

  return (
    <form
      onSubmit={handleSubmit}
      className="flex-1 min-h-0 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-move-from-right-form"
    >
      <div className="shrink-0 px-4 pt-3 pb-2.5 border-b border-gray-200 bg-gray-50 select-none">
        <h2 className="text-base font-bold text-black tracking-tight">
          {editingTreatment ? "Editar Tratamiento" : "Agregar Tratamiento"}
        </h2>
        <p className="text-xs text-gray-400">Área, nombre y precio vigente.</p>
      </div>

      <div className="flex-1 min-h-0 p-4 flex flex-col gap-3 overflow-y-auto">
        <div className="flex flex-col gap-1">
          <label className={LABEL_CLS}>Área</label>
          <CustomSelect
            value={areaSel}
            onChange={setAreaSel}
            options={areaOptions}
            placeholder="Varios"
            triggerClassName="bg-white"
          />
          {creatingArea && (
            <input
              value={newAreaName}
              onChange={(e) => setNewAreaName(e.target.value)}
              type="text"
              placeholder="Nombre del área nueva"
              className={`${INPUT_CLS} animate-fade-in`}
            />
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className={LABEL_CLS}>
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
            placeholder="Ej: Consulta de urgencia"
            className={INPUT_CLS}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className={LABEL_CLS}>
            Precio <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 select-none">$</span>
            <input
              value={formatPriceInput(price)}
              onChange={(e) => setPrice(sanitizePriceInput(e.target.value))}
              onKeyDown={handlePriceKeyDown}
              type="text"
              inputMode="decimal"
              placeholder="0"
              className={`${INPUT_CLS} pl-6`}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className={LABEL_CLS}>
            Código <span className="font-normal text-gray-400">(opcional)</span>
          </label>
          <input
            value={codigo}
            onChange={(e) => setCodigo(sanitizeCodigo(e.target.value))}
            type="text"
            placeholder="Ej: 04.01.09"
            className={INPUT_CLS}
          />
        </div>
      </div>

      <div className="shrink-0 p-4 pt-0 flex flex-col gap-2">
        <button
          type="submit"
          disabled={isDisabled}
          className={`${PRIMARY_BTN} ${
            isDisabled
              ? "bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed"
              : "bg-teal-700 text-white hover:bg-teal-600 cursor-pointer"
          }`}
        >
          {editingTreatment ? "Guardar cambios" : "Agregar tratamiento"}
        </button>
        {editingTreatment && (
          <button
            type="button"
            onClick={onDelete}
            className="shrink-0 w-full flex items-center justify-center gap-1.5 py-2 text-sm font-semibold text-red-600 border-2 border-red-200 rounded-lg hover:bg-red-50 transition duration-150"
          >
            <FaRegTrashCan size={14} />
            Eliminar tratamiento
          </button>
        )}
      </div>
    </form>
  );
}
