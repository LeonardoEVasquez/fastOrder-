"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { hoyLima, inicioDia, finDia, fechaHoraLima } from "./fechas";
import { imprimirTicketPorVenta } from "./imprimir-ticket";

const METODOS = {
  efectivo: "Efectivo",
  yape: "Yape",
  plin: "Plin",
  tarjeta_debito: "T. Débito",
  tarjeta_credito: "T. Crédito",
};
const ENTREGAS = { salon: "Salón", llevar: "Llevar / Delivery" };

const inputCls =
  "rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100";

export default function HistorialVentas() {
  const [desde, setDesde] = useState(hoyLima());
  const [hasta, setHasta] = useState(hoyLima());
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [abierta, setAbierta] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  const cargar = useCallback(async () => {
    if (desde > hasta) {
      setError("La fecha inicial no puede ser mayor a la final.");
      return;
    }
    setCargando(true);
    const { data, error } = await supabase
      .from("ventas")
      .select("*, venta_detalles(*), venta_pagos(*)")
      .gte("created_at", inicioDia(desde))
      .lte("created_at", finDia(hasta))
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else {
      setError(null);
      setVentas(data);
    }
    setCargando(false);
  }, [desde, hasta]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const reimprimir = async (id) => {
    try {
      await imprimirTicketPorVenta(id);
    } catch (err) {
      alert("No se pudo imprimir: " + (err.message || err));
    }
  };

  const filtradas = ventas.filter((v) => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;
    return (
      v.cliente_nombre.toLowerCase().includes(q) ||
      String(v.ticket_numero).includes(q) ||
      String(v.numero_pedido).includes(q)
    );
  });
  const totalVendido = filtradas.reduce((a, v) => a + Number(v.total), 0);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        {/* CABECERA */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-xl">🧾</span>
            <h1 className="text-2xl font-black text-slate-800 md:text-3xl">Historial de ventas</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">Las ventas registradas son inmutables: solo se pueden consultar y reimprimir.</p>

          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Desde</label>
              <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Hasta</label>
              <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className={inputCls} />
            </div>
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="🔍 Cliente, ticket o pedido..."
              className={`${inputCls} md:w-72`}
            />
          </div>
        </div>

        {/* RESUMEN */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-400">Ventas</p>
            <p className="mt-1 text-3xl font-black text-slate-800">{filtradas.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-400">Total vendido</p>
            <p className="mt-1 text-3xl font-black text-blue-600">S/ {totalVendido.toFixed(2)}</p>
          </div>
        </div>

        {error && <div className="rounded-xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-700">⚠️ {error}</div>}

        {/* LISTA */}
        {cargando ? (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
            <p className="font-semibold text-slate-500">Cargando ventas...</p>
          </div>
        ) : filtradas.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <span className="text-5xl">🧾</span>
            <p className="mt-3 text-lg font-bold text-slate-700">No hay ventas en este rango</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtradas.map((v) => {
              const expandida = abierta === v.id;
              return (
                <div key={v.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => setAbierta(expandida ? null : v.id)}
                    className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50"
                  >
                    <div>
                      <p className="font-black text-slate-800">
                        Ticket {String(v.ticket_numero).padStart(6, "0")}
                        <span className="ml-2 font-semibold text-slate-400">· Pedido #{String(v.numero_pedido).padStart(3, "0")}</span>
                      </p>
                      <p className="text-sm text-slate-500">
                        {v.cliente_nombre} · {ENTREGAS[v.tipo_entrega]} · {fechaHoraLima(v.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400">
                        {(v.venta_pagos || []).map((p) => METODOS[p.metodo]).join(" + ")}
                      </span>
                      <span className="text-xl font-black text-blue-600">S/ {Number(v.total).toFixed(2)}</span>
                      <span className="text-slate-400">{expandida ? "▲" : "▼"}</span>
                    </div>
                  </button>

                  {expandida && (
                    <div className="space-y-4 border-t border-slate-100 bg-slate-50 p-5">
                      <div className="space-y-2">
                        {(v.venta_detalles || []).map((d) => (
                          <div key={d.id} className="flex items-start justify-between gap-3 rounded-xl bg-white p-3">
                            <div>
                              <p className="font-bold text-slate-800">
                                {d.cantidad} × {d.producto_nombre}
                              </p>
                              {d.personalizacion && <p className="text-xs text-slate-500">{d.personalizacion}</p>}
                              <p className="text-xs text-slate-400">S/ {Number(d.precio_unitario).toFixed(2)} c/u</p>
                            </div>
                            <p className="font-black text-slate-800">S/ {Number(d.subtotal).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                          {(v.venta_pagos || []).map((p) => (
                            <span key={p.id} className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-600">
                              {METODOS[p.metodo]}: S/ {Number(p.monto).toFixed(2)}
                              {p.metodo === "efectivo" && ` · Vuelto S/ ${Number(p.vuelto).toFixed(2)}`}
                            </span>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => reimprimir(v.id)}
                          className="rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-900"
                        >
                          🖨️ Reimprimir ticket
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
