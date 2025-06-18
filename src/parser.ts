function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  // Formato esperado: MM/DD/YYYY
  const parts = dateStr.split("/");
  if (parts.length !== 3) return null;

  const [monthStr, dayStr, yearStr] = parts;
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  const year = parseInt(yearStr, 10);

  // Validación básica
  if (isNaN(month) || isNaN(day) || isNaN(year)) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  if (year < 1900 || year > 2100) return null;

  // Validación de días por mes
  const lastDay = new Date(year, month, 0).getDate();
  if (day > lastDay) return null;

  return new Date(year, month - 1, day);
}

export function parseLine(line: string) {
  if (!line || !line.includes("|")) {
    return { error: "Formato inválido: no contiene separadores" };
  }

  const parts = line.split("|");
  if (parts.length < 7) {
    return {
      error: `Formato inválido: se esperaban 7 campos, se encontraron ${parts.length}`,
    };
  }

  try {
    const [nombre, apellido, dniStr, estado, fechaStr, pepStr, sujetoStr] =
      parts;

    const dni = parseInt(dniStr);
    if (isNaN(dni) || dniStr.length < 7) {
      return { error: `DNI inválido: ${dniStr}` };
    }

    const fechaIngreso = parseDate(fechaStr);
    if (!fechaIngreso) {
      return {
        error: `Fecha inválida: ${fechaStr}`,
        cliente: null,
      };
    }

    const esPep = pepStr === "true";
    const esSujetoObligado =
      sujetoStr === "true" ? true : sujetoStr === "false" ? false : null;

    return {
      cliente: {
        nombreCompleto: `${nombre} ${apellido}`.trim().slice(0, 100),
        dni,
        estado: estado || "PENDIENTE",
        fechaIngreso,
        esPep,
        esSujetoObligado,
        fechaCreacion: new Date(),
      },
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Error desconocido al parsear",
    };
  }
}
