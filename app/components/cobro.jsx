"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { detalleItems, textoPersonalizacion, round2 } from "./Personalizacion";

const ENTREGAS = [
  ["salon", "Salón"],
  ["llevar", "Para llevar / Delivery"],
];
const METODOS = [
  ["efectivo", "Efectivo"],
  ["yape", "Yape"],
  ["plin", "Plin"],
  ["tarjeta_debito", "T. Débito"],
  ["tarjeta_credito", "T. Crédito"],
];

const btn = (activo) =>
  `rounded-xl border px-4 py-3 font-bold transition-all duration-200 ${
    activo
      ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-200"
      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-blue-50"
  }`;

function Personalizacion({ item }) {
  const filas = detalleItems(item.personalizacion);
  if (filas.length === 0) return null;
  return (
    <div className="mt-3 grid gap-2 border-t border-slate-100 pt-3 sm:grid-cols-2">
      {filas.map(([k, v]) => (
        <div key={k} className={`rounded-lg px-3 py-2 ${k === "Observación" ? "bg-amber-50 sm:col-span-2" : "bg-slate-50"}`}>
          <p className="text-xs font-semibold text-slate-400">{k}</p>
          <p className="break-words text-sm font-bold text-slate-700">{v}</p>
        </div>
      ))}
    </div>
  );
}

function ListaProductos({ pedido }) {
  return (
    <div className="space-y-3">
      {pedido.map((item, i) => (
        <div key={`${item.id}-${i}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="font-bold text-slate-800">{item.nombre}</h3>
              <p className="mt-1 text-sm text-slate-500">
                Cantidad: <span className="font-bold text-slate-700">{item.cantidad}</span> · S/ {item.precio.toFixed(2)} c/u
              </p>
            </div>
            <span className="whitespace-nowrap rounded-lg bg-white px-3 py-2 text-sm font-extrabold text-slate-800 shadow-sm">
              S/ {(item.precio * item.cantidad).toFixed(2)}
            </span>
          </div>
          <Personalizacion item={item} />
        </div>
      ))}
    </div>
  );
}

export default function Cobro({ pedido, total, onPedidoExitoso }) {
  const [tipoEntrega, setTipoEntrega] = useState("llevar");
  const [nombreCliente, setNombreCliente] = useState("");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [efectivoRecibido, setEfectivoRecibido] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const totalR = round2(total);
  const recibido = Number(efectivoRecibido) || 0;
  const esEfectivo = metodoPago === "efectivo";
  const vuelto = esEfectivo ? Math.max(round2(recibido - totalR), 0) : 0;
  const efectivoInsuficiente = esEfectivo && recibido < totalR; // RN-14
  const puedeConfirmar = pedido.length > 0 && totalR > 0 && !efectivoInsuficiente;

  const confirmarPedido = async () => {
    if (!puedeConfirmar) return;
    let pedidoId = null;

    try {
      setGuardando(true);

      // 1. Pedido (el número diario lo asigna la BD)
      const { data: ped, error: e1 } = await supabase
        .from("pedidos")
        .insert({
          tipo_entrega: tipoEntrega,
          cliente_nombre: nombreCliente.trim() || "Cliente General",
          total: totalR,
        })
        .select("id, numero_dia")
        .single();
      if (e1) throw e1;
      pedidoId = ped.id;

      // 2. Detalles
      const filas = pedido.map((item) => ({
        pedido_id: pedidoId,
        producto_id: item.id,
        producto_nombre: item.nombre,
        categoria_nombre: item.categoria_nombre,
        precio_base: Number(item.precio_venta),
        precio_unitario: round2(item.precio),
        cantidad: item.cantidad,
        subtotal: round2(item.precio * item.cantidad),
        personalizacion: item.personalizacion || null,
        descripcion: textoPersonalizacion(item.personalizacion) || null,
      }));
      const { data: dets, error: e2 } = await supabase
        .from("pedido_detalles")
        .insert(filas)
        .select("id");
      if (e2) throw e2;

      // 3. Opciones (salsas, extras, retirables)
      const opciones = pedido.flatMap((item, i) =>
        (item.opciones || []).map((o) => ({ detalle_id: dets[i].id, ...o }))
      );
      if (opciones.length > 0) {
        const { error: e3 } = await supabase.from("pedido_detalle_opciones").insert(opciones);
        if (e3) throw e3;
      }

      // 4. Cobro: crea la venta, pagos, vuelto y descuenta stock (una sola vez)
      const pago = { metodo: metodoPago, monto: totalR };
      if (esEfectivo) pago.monto_recibido = recibido;
      const { error: e4 } = await supabase.rpc("registrar_venta", {
        p_pedido_id: pedidoId,
        p_pagos: [pago],
      });
      if (e4) throw e4;

      setMostrarModal(false);
      window.print();
      onPedidoExitoso?.(ped.numero_dia);
    } catch (err) {
      console.error("Error al registrar pedido:", err);
      // Si falló el cobro, se elimina el pedido huérfano
      if (pedidoId) await supabase.from("pedidos").delete().eq("id", pedidoId);
      const msg = String(err.message || err);
      alert(
        msg.includes("stock_actual")
          ? "Stock insuficiente para uno de los productos."
          : "Error al registrar el pedido: " + msg
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="h-[calc(100vh-2rem)] overflow-y-auto bg-slate-100 px-4 py-6">
      <div className="mx-auto w-full max-w-4xl">
        {/* CABECERA */}
        <div className="mb-5 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">FastOrder</p>
            <h1 className="text-2xl font-extrabold text-slate-800">Generando pedido</h1>
            <p className="mt-1 text-sm text-slate-500">Completa los datos antes de realizar el cobro.</p>
          </div>
          <div className="rounded-xl bg-blue-50 px-4 py-3 text-center">
            <p className="text-xs font-semibold text-blue-600">TOTAL</p>
            <p className="text-2xl font-extrabold text-blue-700">S/ {totalR.toFixed(2)}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          <div className="space-y-7 p-6">
            {/* TIPO */}
            <div>
              <h2 className="text-lg font-bold text-slate-800">Tipo de pedido</h2>
              <p className="mb-3 text-sm text-slate-500">Selecciona cómo se atenderá el pedido.</p>
              <div className="grid grid-cols-2 gap-3">
                {ENTREGAS.map(([valor, texto]) => (
                  <button key={valor} type="button" onClick={() => setTipoEntrega(valor)} className={btn(tipoEntrega === valor)}>
                    {texto}
                  </button>
                ))}
              </div>
            </div>

            {/* CLIENTE */}
            <div>
              <h2 className="text-lg font-bold text-slate-800">Datos del cliente</h2>
              <p className="mb-3 text-sm text-slate-500">Nombre o alias para identificar el pedido.</p>
              <input
                type="text"
                value={nombreCliente}
                onChange={(e) => setNombreCliente(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder="Escribe el nombre del cliente..."
              />
            </div>

            {/* MÉTODO DE PAGO */}
            <div>
              <h2 className="text-lg font-bold text-slate-800">Método de pago</h2>
              <p className="mb-3 text-sm text-slate-500">Selecciona cómo realizará el pago.</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {METODOS.map(([valor, texto]) => (
                  <button key={valor} type="button" onClick={() => setMetodoPago(valor)} className={btn(metodoPago === valor)}>
                    {texto}
                  </button>
                ))}
              </div>
            </div>

            {/* DETALLE */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Detalle del pedido</h2>
                  <p className="text-sm text-slate-500">Productos y personalizaciones.</p>
                </div>
                <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600">
                  {pedido.length} producto{pedido.length !== 1 ? "s" : ""}
                </span>
              </div>
              <ListaProductos pedido={pedido} />
              <div className="mt-5 flex items-center justify-between rounded-2xl bg-slate-900 px-5 py-4 text-white">
                <span className="text-lg font-bold">Total a pagar</span>
                <span className="text-2xl font-extrabold">S/ {totalR.toFixed(2)}</span>
              </div>
            </div>

            {/* EFECTIVO */}
            {esEfectivo && (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                <h2 className="text-lg font-bold text-slate-800">Pago en efectivo</h2>
                <p className="mb-3 text-sm text-slate-500">Ingresa el monto recibido del cliente.</p>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={efectivoRecibido}
                  onChange={(e) => setEfectivoRecibido(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg font-bold text-slate-800 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  placeholder="Ej: 50.00"
                />
                {efectivoInsuficiente && efectivoRecibido !== "" && (
                  <p className="mt-2 text-sm font-semibold text-red-600">
                    El monto recibido es menor al total.
                  </p>
                )}
                <div className="mt-4 flex items-center justify-between rounded-xl bg-white px-4 py-3">
                  <span className="font-bold text-slate-600">Vuelto</span>
                  <span className="text-3xl font-extrabold text-green-600">S/ {vuelto.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 bg-slate-50 p-6">
            <button
              type="button"
              disabled={!puedeConfirmar}
              onClick={() => setMostrarModal(true)}
              className="w-full rounded-xl bg-blue-600 px-6 py-4 text-lg font-extrabold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              Revisar y confirmar pedido
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN */}
      {mostrarModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-widest text-blue-600">FastOrder</p>
                <h2 className="text-xl font-extrabold text-slate-800">Resumen del Pedido</h2>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModal(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-500 hover:bg-slate-200"
              >
                ×
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-slate-100 p-4">
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-white p-4 text-sm sm:grid-cols-4">
                {[
                  ["Cliente", nombreCliente || "Cliente General"],
                  ["Tipo", ENTREGAS.find((e) => e[0] === tipoEntrega)[1]],
                  ["Pago", METODOS.find((m) => m[0] === metodoPago)[1]],
                  ["Total", `S/ ${totalR.toFixed(2)}`],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs font-bold uppercase text-slate-400">{k}</p>
                    <p className="font-bold text-slate-800">{v}</p>
                  </div>
                ))}
                {esEfectivo && (
                  <>
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400">Recibido</p>
                      <p className="font-bold text-slate-800">S/ {recibido.toFixed(2)}</p>
                    </div>
                    <div className="rounded-lg bg-green-50 px-2 py-1">
                      <p className="text-xs font-bold uppercase text-green-600">Vuelto</p>
                      <p className="text-lg font-extrabold text-green-700">S/ {vuelto.toFixed(2)}</p>
                    </div>
                  </>
                )}
              </div>
              <ListaProductos pedido={pedido} />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 bg-white p-4">
              <button
                type="button"
                onClick={() => setMostrarModal(false)}
                className="rounded-xl border border-slate-300 px-6 py-3 font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={guardando}
                onClick={confirmarPedido}
                className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-md shadow-blue-200 hover:bg-blue-700 disabled:opacity-50"
              >
                {guardando ? "Guardando pedido..." : "Confirmar e Imprimir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
