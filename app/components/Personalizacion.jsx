// Utilidades compartidas para mostrar la personalización de un ítem

export function detalleItems(p) {
  if (!p) return [];
  const out = [];
  if (p.porcion) out.push(["Porción", `${p.porcion} alitas`]);
  if (p.papas) out.push(["Papas", p.papas]);
  if (p.carne) out.push(["Carne", p.carne]);
  if (p.ensalada) out.push(["Ensalada", p.ensalada]);
  if (p.modalidad) out.push(["Modalidad", p.modalidad]);
  if (p.cremas && p.modalidad !== "Salón")
    out.push(["Cremas", p.cremas.length > 0 ? p.cremas.join(", ") : "Ninguna"]);
  if (p.salsas)
    out.push(["Salsas adicionales", p.salsas.length > 0 ? p.salsas.join(", ") : "Ninguna"]);
  if (p.temperatura) out.push(["Temperatura", p.temperatura]);
  if (p.observacion) out.push(["Observación", p.observacion]);
  return out;
}

export function textoPersonalizacion(p) {
  return detalleItems(p)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" | ");
}

export const round2 = (n) => Math.round(Number(n) * 100) / 100;
