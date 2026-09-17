import * as XLSX from "xlsx";

interface PatientRow {
    name?: string;
    lastName?: string;
    dni?: string | number;
    num?: string;
    email?: string;
    insurance?: string;
}

const COLUMNS: { header: string; get: (p: PatientRow) => string | number }[] = [
    { header: "Nombre", get: (p) => p.name ?? "" },
    { header: "Apellido", get: (p) => p.lastName ?? "" },
    { header: "DNI", get: (p) => p.dni ?? "" },
    { header: "Teléfono", get: (p) => p.num ?? "" },
    { header: "Correo", get: (p) => p.email ?? "" },
    { header: "Obra Social", get: (p) => p.insurance ?? "" },
];

/** Genera y descarga un .xlsx con los pacientes recibidos. Pensado para recibir el set ya
 * filtrado (búsqueda + obra social) en memoria — no vuelve a tocar Firebase. */
export function exportPatientsToExcel(patients: PatientRow[], fileName = "pacientes"): void {
    const rows = patients.map((p) =>
        Object.fromEntries(COLUMNS.map((col) => [col.header, col.get(p)]))
    );

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = COLUMNS.map(() => ({ wch: 20 }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pacientes");

    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `${fileName}-${today}.xlsx`);
}
