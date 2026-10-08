import { supabase } from "@/lib/supabase/client";
import { fechaHoraLima } from "./fechas";

const METODOS = {
  efectivo: "Efectivo",
  yape: "Yape",
  plin: "Plin",
  tarjeta_debito: "T. Débito",
  tarjeta_credito: "T. Crédito",
};

const ENTREGAS = {
  salon: "Salón",
  llevar: "Para llevar / Delivery",
};

const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c]
  );

const money = (n) => `S/ ${Number(n || 0).toFixed(2)}`;

function htmlTicket(v, n) {
  const filas = (v.venta_detalles || [])
    .map(
      (d) => `
      <tr>
        <td colspan="2">
          <b>${esc(d.producto_nombre)}</b>
          ${
            d.personalizacion
              ? `<br><small>${esc(d.personalizacion)}</small>`
              : ""
          }
        </td>
      </tr>
      <tr>
        <td>${d.cantidad} x ${money(d.precio_unitario)}</td>
        <td class="r">${money(d.subtotal)}</td>
      </tr>`
    )
    .join("");

  const pagos = (v.venta_pagos || [])
    .map(
      (p) => `
      <tr>
        <td>${esc(METODOS[p.metodo] || p.metodo)}</td>
        <td class="r">${money(p.monto)}</td>
      </tr>
      ${
        p.metodo === "efectivo"
          ? `<tr>
               <td>Recibido</td>
               <td class="r">${money(p.monto_recibido)}</td>
             </tr>
             <tr>
               <td>Vuelto</td>
               <td class="r">${money(p.vuelto)}</td>
             </tr>`
          : ""
      }`
    )
    .join("");

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Ticket</title>
<style>
  @page {
    size: 80mm auto;
    margin: 4mm;
  }

  body {
    font-family: "Courier New", monospace;
    font-size: 12px;
    width: 72mm;
    margin: 0;
    color: #000;
  }

  h1 {
    font-size: 14px;
    margin: 0;
    text-align: center;
  }

  .c {
    text-align: center;
  }

  .r {
    text-align: right;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  td {
    padding: 1px 0;
    vertical-align: top;
  }

  hr {
    border: 0;
    border-top: 1px dashed #000;
    margin: 6px 0;
  }

  small {
    font-size: 10px;
  }
</style>
</head>

<body>
  <h1>${esc(n?.razon_social || "FastOrder")}</h1>

  <div class="c">
    ${n?.ruc ? `RUC: ${esc(n.ruc)}<br>` : ""}
    ${n?.direccion ? `${esc(n.direccion)}<br>` : ""}
    ${n?.telefono ? `Tel: ${esc(n.telefono)}` : ""}
  </div>

  <hr>

  <div class="c">
    <b>
      NOTA DE VENTA N° ${String(v.ticket_numero).padStart(6, "0")}
    </b>
  </div>

  <div>
    Pedido: #${String(v.numero_pedido).padStart(3, "0")}
  </div>

  <div>
    Fecha: ${esc(fechaHoraLima(v.created_at))}
  </div>

  <div>
    Cliente: ${esc(v.cliente_nombre)}
  </div>

  <div>
    Tipo: ${esc(ENTREGAS[v.tipo_entrega] || v.tipo_entrega)}
  </div>

  <hr>

  <table>
    ${filas}
  </table>

  <hr>

  <table>
    <tr>
      <td><b>TOTAL</b></td>
      <td class="r"><b>${money(v.total)}</b></td>
    </tr>
  </table>

  <hr>

  <table>
    ${pagos}
  </table>

  <hr>

  <div class="c">
    ¡Gracias por su compra!
  </div>
</body>
</html>`;
}

export function imprimirHTML(html) {
  const f = document.createElement("iframe");

  f.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0";

  document.body.appendChild(f);

  const doc = f.contentWindow.document;

  doc.open();
  doc.write(html);
  doc.close();

  f.contentWindow.onafterprint = () => f.remove();

  setTimeout(() => {
    f.contentWindow.focus();
    f.contentWindow.print();
  }, 250);

  setTimeout(() => f.remove(), 60000);
}

export function imprimirVenta(venta, negocio) {
  imprimirHTML(htmlTicket(venta, negocio));
}

export async function imprimirTicketPorVenta(ventaId) {
  const [rv, rn] = await Promise.all([
    supabase
      .from("ventas")
      .select("*, venta_detalles(*), venta_pagos(*)")
      .eq("id", ventaId)
      .single(),

    supabase
      .from("configuracion_negocio")
      .select("*")
      .eq("id", 1)
      .maybeSingle(),
  ]);

  if (rv.error) throw rv.error;

  imprimirVenta(rv.data, rn.data);
}