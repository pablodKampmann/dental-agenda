// Parser puro (sin Firebase, sin React) del PDF de aranceles del colegio — determinístico,
// sin IA: el documento es texto real, no un escaneo, y el formato es consistente línea a
// línea. Recibe las líneas ya reconstruidas por `pdfText.ts` y arma los tratamientos.
//
// El área de cada tratamiento sale de pisar una variable "área actual" a medida que se
// recorren las líneas de arriba hacia abajo: arranca en el nombre del capítulo
// ("CAPITULO IV PROTESIS ARANCELES" → "Prótesis") y una subfila de encabezado sin código
// ni precio ("PRÓTESIS REMOVIBLE") la reemplaza hasta el próximo encabezado — capítulo o
// subárea, lo que aparezca primero. No hay jerarquía en el dato final: cada tratamiento
// guarda un solo string de área, el más específico disponible en ese punto del documento.

export interface ParsedTreatmentRow {
  codigo: string | null;
  name: string;
  price: number;
  area: string;
  vigenteDesde: string | null;
}

const CHAPTER_RE = /^CAP[IÍ]TULO\s+[IVXLCDM]+\s+(.+?)\s+ARANCELES\s*$/i;
const CODE_RE = /\d{2}(?:\.\d{2}){1,2}/;
const PRICE_RE = /\d{1,3}(?:\.\d{3})*,\d{2}/;
const DATE_RE = /^(\d{2})\/(\d{2})\/(\d{4})$/;

// Renglones de membrete/pie de página y del resumen final ("VALOR HORA...") que no son
// tratamientos y hay que ignorar — si no, quedan acumulados en el buffer esperando un
// precio que nunca cierra una fila real, o peor, "VALOR HORA" trae su propio precio y se
// colaría como un tratamiento fantasma.
const NOISE_RE = /colegio de odont|consejo superior|secretaria@|www\.|valor hora|honorarios|autorizaci[oó]n conferida|arancel(es)? odontol[oó]gicos m[ií]nimos|la plata|calle \d|\+54 ?\(|costos directos|cifras resultantes|redondeo|y\/o fijos/i;

// Un encabezado de subárea es una línea toda en mayúsculas, sin dígitos ni precio, no
// vacía y no es en sí un encabezado de capítulo (ya lo maneja CHAPTER_RE aparte).
function isSubAreaHeader(line: string): boolean {
  if (CODE_RE.test(line) || PRICE_RE.test(line)) return false;
  if (NOISE_RE.test(line)) return false;
  const letters = line.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ\s]/g, "");
  return letters.length >= 3 && letters === line && line === line.toUpperCase();
}

function toTitleCase(text: string): string {
  return text
    .toLocaleLowerCase("es")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toLocaleUpperCase("es") + word.slice(1))
    .join(" ");
}

const MAX_BUFFER_LINES = 6;

export function parseTreatmentsPdf(lines: string[]): {
  vigenteDesde: string | null;
  rows: ParsedTreatmentRow[];
  skipped: string[];
} {
  let vigenteDesde: string | null = null;
  let area = "Varios";
  let buffer: string[] = [];
  const rows: ParsedTreatmentRow[] = [];
  const skipped: string[] = [];

  function flushBuffer() {
    if (buffer.length > 0) skipped.push(buffer.join(" "));
    buffer = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (!vigenteDesde) {
      const dateMatch = line.match(DATE_RE);
      if (dateMatch) vigenteDesde = line;
    }

    const chapterMatch = line.match(CHAPTER_RE);
    if (chapterMatch) {
      flushBuffer();
      area = toTitleCase(chapterMatch[1]);
      continue;
    }

    if (isSubAreaHeader(line)) {
      flushBuffer();
      area = toTitleCase(line);
      continue;
    }

    if (NOISE_RE.test(line)) continue;

    buffer.push(line);
    const joined = buffer.join(" ");
    const priceMatch = [...joined.matchAll(new RegExp(PRICE_RE, "g"))].pop();

    if (priceMatch) {
      // Un precio como "45.941,00" matchea parcialmente el patrón de código ("45.94") —
      // por eso el código se busca siempre sobre el texto CON EL PRECIO YA SACADO, nunca
      // sobre `joined` crudo. Sin esto, una línea que es solo un precio suelto (pasa con
      // 08.09: la descripción y el precio quedan en renglones separados) se detectaba a
      // sí misma como "código" y dejaba un tratamiento fantasma con el resto de sus
      // propios dígitos como nombre (bug real: "2,00" con precio $90.112).
      const withoutPrice = joined.replace(priceMatch[0], "");
      const codeMatch = withoutPrice.match(CODE_RE);
      const price = Number(priceMatch[0].replace(/\./g, "").replace(",", "."));

      // El código puede caer en cualquier posición del texto combinado — en una
      // descripción envuelta en 2+ líneas a veces queda centrado entre ellas en vez de
      // pegado al principio. Por eso el nombre se arma SACANDO el código de donde esté,
      // nunca cortando "desde después del código hasta el final": cortar por posición
      // pierde todo lo que estaba antes si el código no quedó al principio (bug real:
      // "01.04 Consultas de Urgencias... y/o final de tratamiento" quedaba en solo "y/o
      // final de tratamiento"). No se limpian paréntesis a mano — son parte real de
      // nombres como "(dos conductos)" o "(6 tomas)".
      let name = withoutPrice;
      if (codeMatch) {
        name = name.slice(0, codeMatch.index) + name.slice(codeMatch.index! + codeMatch[0].length);
      }
      name = name.replace(/\s+/g, " ").trim().replace(/[.\s]+$/, "");

      // Más de un código en el texto sin precio es la señal de que dos renglones de la
      // tabla se fusionaron en una sola línea reconstruida (ej. dos filas adyacentes con
      // muy poco espacio entre ellas) — mejor mandarlo a revisar a mano que importar un
      // nombre mezclado de las dos filas.
      const codeCount = (withoutPrice.match(new RegExp(CODE_RE, "g")) ?? []).length;

      if (name && /[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(name) && !Number.isNaN(price) && codeCount <= 1) {
        rows.push({
          codigo: codeMatch ? codeMatch[0] : null,
          name,
          price,
          area,
          vigenteDesde,
        });
      } else {
        skipped.push(joined);
      }
      buffer = [];
    } else if (buffer.length >= MAX_BUFFER_LINES) {
      flushBuffer();
    }
  }
  flushBuffer();

  return { vigenteDesde, rows, skipped };
}
