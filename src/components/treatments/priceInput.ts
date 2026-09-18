// Autoformateo puramente visual del input de precio: separador de miles "." y
// separador decimal ",", sin importar si el usuario tipea "." o "," para el decimal —
// se estandariza a coma (convención local). El estado guardado (`raw`) nunca tiene
// puntos de miles, solo dígitos y a lo sumo una coma — los puntos se regeneran en
// cada render a partir de eso, nunca se guardan.

/** A partir del raw ("15000" o "150,5"), arma el string que se muestra en el input. */
export function formatPriceInput(raw: string): string {
  const [intPart, decPart] = raw.split(",");
  const formattedInt = (intPart ?? "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return decPart !== undefined ? `${formattedInt},${decPart}` : formattedInt;
}

/** Limpia lo que vino de un onChange normal (tipeo de dígitos): descarta todo lo que
 *  no sea dígito o coma — los puntos de miles que ya estaban en pantalla se tiran y se
 *  vuelven a generar solos con formatPriceInput. Nunca deja más de una coma. */
export function sanitizePriceInput(value: string): string {
  let stripped = value.replace(/[^\d,]/g, "");
  const firstComma = stripped.indexOf(",");
  if (firstComma !== -1) {
    stripped = stripped.slice(0, firstComma + 1) + stripped.slice(firstComma + 1).replace(/,/g, "");
  }
  return stripped;
}

export function isValidPriceInput(raw: string): boolean {
  return /^\d+(,\d+)?$/.test(raw.trim());
}

export function parsePriceInput(raw: string): number {
  return Number(raw.trim().replace(",", "."));
}
