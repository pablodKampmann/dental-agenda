import XLSX from "xlsx-js-style";

export interface ClinicInfo {
    name?: string;
    address?: string;
    telContact?: string;
    secondTelContact?: string;
    email?: string;
}

export interface ExcelColumn<T> {
    header: string;
    width: number;
    get: (row: T) => string | number;
    /** Formato numérico de Excel (ej. "#,##0.00") para columnas con números. */
    numFmt?: string;
}

const TEAL = "0D9488";
const TEAL_DARK = "0F766E";
const GRAY_TEXT = "6B7280";
const GRAY_FILL = "F3F4F6";
const BORDER_GRAY = { style: "thin" as const, color: { rgb: "E5E7EB" } };

const bannerStyle = (bold = false, size = 11) => ({
    fill: { fgColor: { rgb: TEAL } },
    font: { color: { rgb: "FFFFFF" }, bold, sz: size },
    alignment: { vertical: "center", horizontal: "left" },
});

const subBannerStyle = {
    fill: { fgColor: { rgb: TEAL_DARK } },
    font: { color: { rgb: "FFFFFF" }, sz: 9 },
    alignment: { vertical: "center", horizontal: "left" },
};

const headerCellStyle = {
    fill: { fgColor: { rgb: TEAL } },
    font: { color: { rgb: "FFFFFF" }, bold: true, sz: 10 },
    alignment: { vertical: "center", horizontal: "left" },
    border: { top: BORDER_GRAY, bottom: BORDER_GRAY, left: BORDER_GRAY, right: BORDER_GRAY },
};

const dataCellStyle = (striped: boolean, numFmt?: string) => ({
    ...(numFmt ? { numFmt } : {}),
    fill: { fgColor: { rgb: striped ? GRAY_FILL : "FFFFFF" } },
    font: { color: { rgb: "111827" }, sz: 10 },
    border: { top: BORDER_GRAY, bottom: BORDER_GRAY, left: BORDER_GRAY, right: BORDER_GRAY },
});

/** Genera y descarga un .xlsx con las filas recibidas, con un header de marca del
 * consultorio (nombre, contacto, fecha de export y filtros activos). Pensado para recibir el
 * set ya filtrado en memoria — no toca Firebase. Lo usan los exports de pacientes y
 * tratamientos. */
export function exportToExcel<T>(
    rows: T[],
    columns: ExcelColumn<T>[],
    clinicInfo: ClinicInfo | null,
    filterDescription: string | null,
    sheetName: string,
    fileName: string
): void {
    const COLUMNS = columns;
    const colCount = COLUMNS.length;
    const lastColLetter = XLSX.utils.encode_col(colCount - 1);
    const now = new Date();
    const exportedAt = now.toLocaleDateString("es-AR") + " " + now.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

    const contactParts = [clinicInfo?.address, clinicInfo?.telContact, clinicInfo?.secondTelContact, clinicInfo?.email].filter(Boolean);

    const headerRows: (string | number)[][] = [
        [clinicInfo?.name || "Consultorio odontológico"],
        [contactParts.join("   •   ") || ""],
        [`Exportado el ${exportedAt}${filterDescription ? "   •   " + filterDescription : "   •   Sin filtros activos"}`],
        [],
        COLUMNS.map((c) => c.header),
    ];

    const dataRows = rows.map((row) => COLUMNS.map((col) => col.get(row)));

    const worksheet = XLSX.utils.aoa_to_sheet([...headerRows, ...dataRows]);
    worksheet["!cols"] = COLUMNS.map((c) => ({ wch: c.width }));
    worksheet["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: colCount - 1 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: colCount - 1 } },
    ];
    worksheet["!rows"] = [{ hpt: 26 }, { hpt: 16 }, { hpt: 16 }, { hpt: 6 }, { hpt: 20 }];

    for (let c = 0; c < colCount; c++) {
        const bannerCell = XLSX.utils.encode_cell({ r: 0, c });
        if (!worksheet[bannerCell]) worksheet[bannerCell] = { t: "s", v: "" };
        worksheet[bannerCell].s = bannerStyle(true, 14);

        const subCell = XLSX.utils.encode_cell({ r: 1, c });
        if (!worksheet[subCell]) worksheet[subCell] = { t: "s", v: "" };
        worksheet[subCell].s = subBannerStyle;

        const metaCell = XLSX.utils.encode_cell({ r: 2, c });
        if (!worksheet[metaCell]) worksheet[metaCell] = { t: "s", v: "" };
        worksheet[metaCell].s = subBannerStyle;

        const headCell = XLSX.utils.encode_cell({ r: 4, c });
        if (worksheet[headCell]) worksheet[headCell].s = headerCellStyle;
    }

    dataRows.forEach((_, rowIndex) => {
        const r = 5 + rowIndex;
        for (let c = 0; c < colCount; c++) {
            const cellRef = XLSX.utils.encode_cell({ r, c });
            if (!worksheet[cellRef]) worksheet[cellRef] = { t: "s", v: "" };
            worksheet[cellRef].s = dataCellStyle(rowIndex % 2 === 1, COLUMNS[c].numFmt);
        }
    });

    worksheet["!ref"] = `A1:${lastColLetter}${5 + dataRows.length}`;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const today = now.toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `${fileName}-${today}.xlsx`);
}
