// Utilidades de fecha en zona horaria America/Lima (UTC-5, sin horario de verano)

export const hoyLima = () =>
  new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Lima",
  });

export function sumarDias(fecha, n) {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export const inicioDia = (f) => `${f}T00:00:00-05:00`;

export const finDia = (f) => `${f}T23:59:59.999-05:00`;

export const horaLima = (iso) =>
  new Date(iso).toLocaleTimeString("es-PE", {
    timeZone: "America/Lima",
    hour: "2-digit",
    minute: "2-digit",
  });

export const fechaHoraLima = (iso) =>
  new Date(iso).toLocaleString("es-PE", {
    timeZone: "America/Lima",
    dateStyle: "short",
    timeStyle: "short",
  });