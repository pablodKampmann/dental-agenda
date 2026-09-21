import { exportToExcel, type ClinicInfo, type ExcelColumn } from "./exportToExcel";

interface TreatmentRow {
    name: string;
    price: number;
    area: string;
    codigo?: string;
    vigenteDesde?: string;
}

const COLUMNS: ExcelColumn<TreatmentRow>[] = [
    { header: "Código", width: 12, get: (t) => t.codigo ?? "" },
    { header: "Tratamiento", width: 60, get: (t) => t.name },
    { header: "Área", width: 24, get: (t) => t.area },
    { header: "Precio", width: 16, get: (t) => t.price, numFmt: "#,##0.00" },
    { header: "Vigente desde", width: 16, get: (t) => t.vigenteDesde ?? "" },
];

/** Descarga un .xlsx con los tratamientos recibidos (set ya filtrado, en memoria). */
export function exportTreatmentsToExcel(
    treatments: TreatmentRow[],
    clinicInfo: ClinicInfo | null,
    filterDescription: string | null,
    fileName = "tratamientos"
): void {
    exportToExcel(treatments, COLUMNS, clinicInfo, filterDescription, "Tratamientos", fileName);
}
