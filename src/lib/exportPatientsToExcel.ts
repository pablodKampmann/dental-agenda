import { exportToExcel, type ClinicInfo, type ExcelColumn } from "./exportToExcel";

interface PatientRow {
    name?: string;
    lastName?: string;
    gender?: string;
    birthDate?: string;
    dni?: string | number;
    num?: string;
    address?: string;
    email?: string;
    insurance?: string;
    plan?: string;
    affiliateNum?: string;
}

const GENDER_LABEL: Record<string, string> = { male: "Masculino", female: "Femenino" };

// Todos los campos de paciente que no son historia clínica/odontograma — ver AGENTS.md
// "Modelo de datos" y setPatients.ts para la forma exacta del nodo.
const COLUMNS: ExcelColumn<PatientRow>[] = [
    { header: "Nombre", width: 18, get: (p) => p.name ?? "" },
    { header: "Apellido", width: 18, get: (p) => p.lastName ?? "" },
    { header: "Género", width: 12, get: (p) => (p.gender ? GENDER_LABEL[p.gender] ?? p.gender : "") },
    { header: "Fecha de nacimiento", width: 18, get: (p) => p.birthDate ?? "" },
    { header: "DNI", width: 14, get: (p) => p.dni ?? "" },
    { header: "Teléfono", width: 18, get: (p) => p.num ?? "" },
    { header: "Domicilio", width: 24, get: (p) => p.address ?? "" },
    { header: "Correo", width: 24, get: (p) => p.email ?? "" },
    { header: "Obra Social", width: 20, get: (p) => p.insurance ?? "" },
    { header: "Plan", width: 18, get: (p) => p.plan ?? "" },
    { header: "N° Afiliado", width: 16, get: (p) => p.affiliateNum ?? "" },
];

/** Descarga un .xlsx con los pacientes recibidos (set ya filtrado, en memoria). */
export function exportPatientsToExcel(
    patients: PatientRow[],
    clinicInfo: ClinicInfo | null,
    filterDescription: string | null,
    fileName = "pacientes"
): void {
    exportToExcel(patients, COLUMNS, clinicInfo, filterDescription, "Pacientes", fileName);
}
