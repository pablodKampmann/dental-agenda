// Extracción de texto de un PDF ya existente, 100% cliente (sin server propio, como el
// resto del proyecto). pdf.js entrega items de texto sueltos con posición (x, y), no
// líneas ya armadas — hay que agruparlos por renglón visual (misma altura, tolerancia de
// unos pocos puntos por diferencias de baseline entre fuentes normal/negrita) y ordenar
// cada grupo de izquierda a derecha para reconstruir la línea tal como se lee.

const Y_TOLERANCE = 2;

export async function extractPdfLines(file: File): Promise<string[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const lines: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    const items = (content.items as { str?: string; transform?: number[] }[])
      .filter((it) => typeof it.str === "string" && it.str.trim() !== "" && it.transform)
      .map((it) => ({ x: it.transform![4], y: it.transform![5], str: it.str! }))
      .sort((a, b) => b.y - a.y || a.x - b.x);

    const rows: { y: number; parts: { x: number; str: string }[] }[] = [];
    for (const item of items) {
      let row = rows.find((r) => Math.abs(r.y - item.y) <= Y_TOLERANCE);
      if (!row) {
        row = { y: item.y, parts: [] };
        rows.push(row);
      }
      row.parts.push({ x: item.x, str: item.str });
    }

    for (const row of rows) {
      row.parts.sort((a, b) => a.x - b.x);
      const line = row.parts.map((p) => p.str).join(" ").replace(/\s+/g, " ").trim();
      if (line) lines.push(line);
    }
  }

  return lines;
}
