import { useEffect, useRef, useState } from "react";
import { LuSearchX } from "react-icons/lu";
import { MdMedicalServices } from "react-icons/md";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { Treatment } from "@/services/treatments/getTreatments";

interface Props {
  treatments: Treatment[] | null;
  isFiltering: boolean;
  selectedId: string | null;
  /** Fila a parpadear (recién editada); la página lo limpia cuando termina la animación. */
  flashId: string | null;
  onSelect: (treatment: Treatment) => void;
  /** Orden por precio: null = orden original del catálogo. Click en el header lo cicla. */
  priceSort: "asc" | "desc" | null;
  onTogglePriceSort: () => void;
}

const TH = "px-4 py-2.5 bg-gray-100 border-b border-gray-200 font-bold";
const TD = "px-4";

export function TreatmentsTable({ treatments, isFiltering, selectedId, flashId, onSelect, priceSort, onTogglePriceSort }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);

  // Mismo bug que Table de /patients: header en su propia tabla (fuera del div con
  // scroll) para que la scrollbar nativa no lo pise, y colgroup compartido + medición
  // del ancho real de la scrollbar para que las columnas no se desalineen.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => setScrollbarWidth(el.offsetWidth - el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [treatments]);

  // Pulso de la fila recién editada: dos respiros lentos con el fondo de fila seleccionada
  // (bg-teal-50), hechos con transiciones de color (300ms c/u) y no con keyframes — prender,
  // apagar, prender, apagar.
  const [flashOn, setFlashOn] = useState(false);
  useEffect(() => {
    if (!flashId) {
      setFlashOn(false);
      return;
    }
    const timers = [0, 300, 600, 900].map((delay, i) => setTimeout(() => setFlashOn(i % 2 === 0), delay));
    return () => timers.forEach(clearTimeout);
  }, [flashId]);

  const isEmpty = treatments !== null && treatments.length === 0;

  function ColGroup() {
    return (
      <colgroup>
        <col style={{ width: "60%" }} />
        <col style={{ width: "25%" }} />
        <col style={{ width: "15%" }} />
      </colgroup>
    );
  }

  return (
    <>
      <div className="bg-gray-100" style={{ paddingRight: scrollbarWidth }}>
        <table className="w-full table-fixed select-none">
          <ColGroup />
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-widest text-gray-400">
              <th className={TH}>Tratamiento</th>
              <th className={TH}>Área</th>
              <th className={`${TH} text-right`}>
                <button
                  type="button"
                  onClick={onTogglePriceSort}
                  className={`inline-flex items-center gap-1 uppercase tracking-widest font-bold transition duration-150 ${
                    priceSort ? "text-teal-700" : "text-gray-400 hover:text-black"
                  }`}
                >
                  Precio
                  {priceSort === "asc" ? <ArrowUp size={12} /> : priceSort === "desc" ? <ArrowDown size={12} /> : <ArrowUpDown size={12} />}
                </button>
              </th>
            </tr>
          </thead>
        </table>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <table className="w-full table-fixed select-none">
          <ColGroup />
          {treatments && (
            <tbody>
              {treatments.map((treatment, index) => (
                <tr
                  key={treatment.id}
                  ref={(el) => {
                    if (el && flashId === treatment.id) el.scrollIntoView({ block: "nearest" });
                  }}
                  onClick={() => onSelect(treatment)}
                  className={`
                    ${index !== treatments.length - 1 ? "border-b border-gray-100" : ""}
                    ${selectedId === treatment.id ? "bg-teal-50" : "hover:bg-gray-50"}
                    ${flashId === treatment.id ? `duration-300 ${flashOn ? "bg-teal-50" : "bg-transparent"}` : "duration-150"}
                    text-sm h-12 cursor-pointer transition
                  `}
                >
                  <td className={TD}>
                    <p className="font-semibold text-black truncate">{treatment.name}</p>
                    {treatment.codigo && (
                      <p className="text-xs text-gray-400">{treatment.codigo}</p>
                    )}
                  </td>
                  <td className={TD}>
                    <span className="inline-block max-w-full truncate align-middle whitespace-nowrap text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200 rounded-full px-2 py-0.5">
                      {treatment.area}
                    </span>
                  </td>
                  <td className={`${TD} text-right`}>
                    <p className="text-gray-600">${treatment.price.toLocaleString("es-AR")}</p>
                    {treatment.vigenteDesde && (
                      // Vigencia bajo el precio (al que pertenece) en formato corto dd/mm/aa: usa la
                      // segunda línea que la fila ya tiene, sin columna nueva.
                      <p className="text-xs text-gray-400 whitespace-nowrap">
                        desde {treatment.vigenteDesde.replace(/(\d{2}\/\d{2}\/)\d{2}(\d{2})/, "$1$2")}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </table>

        {isEmpty && (
          <div className="flex flex-col items-center justify-center gap-2 py-12 select-none">
            {!isFiltering ? (
              <>
                <MdMedicalServices size={28} className="text-gray-300" />
                <p className="text-sm font-semibold text-gray-500">Todavía no hay tratamientos</p>
                <p className="text-xs text-gray-400">Agregá el primero desde el botón de arriba.</p>
              </>
            ) : (
              <>
                <LuSearchX size={28} className="text-gray-300" />
                <p className="text-sm font-semibold text-gray-500">Sin resultados</p>
                <p className="text-xs text-gray-400">Probá con otro nombre o código.</p>
              </>
            )}
          </div>
        )}
      </div>

      {treatments && treatments.length > 0 && (
        <div className="shrink-0 px-4 py-2.5 border-t border-gray-200 bg-gray-50 select-none">
          <span className="text-xs text-gray-400 font-medium">
            {treatments.length} {treatments.length === 1 ? "tratamiento" : "tratamientos"}
          </span>
        </div>
      )}
    </>
  );
}
