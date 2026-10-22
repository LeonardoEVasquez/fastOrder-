"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import { hoyLima, sumarDias, inicioDia, finDia } from "./fechas";

const METODOS = {
  efectivo: "Efectivo",
  yape: "Yape",
  plin: "Plin",
  tarjeta_debito: "T. Débito",
  tarjeta_credito: "T. Crédito",
};

const inputCls =
  "rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100";

const soles = (n) => `S/ ${Number(n || 0).toFixed(2)}`;

// Gráfico de barras horizontales simple (sin librerías)
function Barras({ titulo, datos, color = "bg-blue-500" }) {
  const max = Math.max(...datos.map((d) => d.valor), 0);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-bold text-slate-800">{titulo}</h3>
      {datos.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">Sin datos</p>
      ) : (
        <div className="space-y-2.5">
          {datos.map((d) => (
            <div key={d.label}>
              <div className="mb-1 flex justify-between text-xs font-semibold">
                <span className="text-slate-600">{d.label}</span>
                <span className="text-slate-800">{soles(d.valor)}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${max ? (d.valor / max) * 100 : 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const agrupar = (filas, clave, valor) => {
  const m = new Map();
  filas.forEach((f) => m.set(clave(f), (m.get(clave(f)) || 0) + Number(valor(f))));
  return [...m.entries()].map(([label, v]) => ({ label, valor: v }));
};

export default function Reportes() {
  const [desde, setDesde] = useState(sumarDias(hoyLima(), -6));
  const [hasta, setHasta] = useState(hoyLima());
  const [categoria, setCategoria] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [detalle, setDetalle] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    supabase
      .from("categorias")
      .select("nombre")
      .order("orden", { ascending: true })
      .then(({ data }) => setCategorias(data || []));
  }, []);

  const cargar = useCallback(async () => {
    if (desde > hasta) {
      setError("La fecha inicial no puede ser mayor a la final.");
      return;
    }
    setCargando(true);
    const [rv, rd, rr] = await Promise.all([
      supabase
        .from("ventas")
        .select("id, total, created_at, venta_pagos(metodo, monto)")
        .gte("created_at", inicioDia(desde))
        .lte("created_at", finDia(hasta)),
      supabase
        .from("v_ventas_detalle_reporte")
        .select("fecha, hora, categoria_nombre, cantidad, subtotal")
        .gte("fecha", desde)
        .lte("fecha", hasta),
      supabase.rpc("ranking_productos", {
        p_desde: desde,
        p_hasta: hasta,
        p_categoria: categoria || null,
        p_cajero: null,
      }),
    ]);
    const err = rv.error || rd.error || rr.error;
    setError(err ? err.message : null);
    setVentas(rv.data || []);
    setDetalle(rd.data || []);
    setRanking(rr.data || []);
    setCargando(false);
  }, [desde, hasta, categoria]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const resumen = useMemo(() => {
    const total = ventas.reduce((a, v) => a + Number(v.total), 0);
    return { total, cantidad: ventas.length, promedio: ventas.length ? total / ventas.length : 0 };
  }, [ventas]);

  const porDia = useMemo(
    () => agrupar(detalle, (d) => d.fecha, (d) => d.subtotal).sort((a, b) => a.label.localeCompare(b.label)),
    [detalle]
  );
  const porHora = useMemo(
    () =>
      agrupar(detalle, (d) => d.hora, (d) => d.subtotal)
        .sort((a, b) => a.label - b.label)
        .map((d) => ({ ...d, label: `${String(d.label).padStart(2, "0")}:00` })),
    [detalle]
  );
  const porCategoria = useMemo(
    () => agrupar(detalle, (d) => d.categoria_nombre, (d) => d.subtotal).sort((a, b) => b.valor - a.valor),
    [detalle]
  );
  const porMetodo = useMemo(() => {
    const pagos = ventas.flatMap((v) => v.venta_pagos || []);
    return agrupar(pagos, (p) => METODOS[p.metodo] || p.metodo, (p) => p.monto).sort((a, b) => b.valor - a.valor);
  }, [ventas]);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        {/* CABECERA + FILTROS */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-xl">📈</span>
            <h1 className="text-2xl font-black text-slate-800 md:text-3xl">Reportes</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">Análisis de ventas por periodo.</p>

          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Desde</label>
              <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Hasta</label>
              <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Categoría (ranking)</label>
              <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={inputCls}>
                <option value="">Todas</option>
                {categorias.map((c) => (
                  <option key={c.nombre} value={c.nombre}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              {[
                ["Hoy", 0],
                ["7 días", 6],
                ["30 días", 29],
              ].map(([t, n]) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setDesde(sumarDias(hoyLima(), -n));
                    setHasta(hoyLima());
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <div className="rounded-xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-700">⚠️ {error}</div>}

        {cargando ? (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
            <p className="font-semibold text-slate-500">Generando reporte...</p>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                ["Total vendido", soles(resumen.total), "text-blue-600"],
                ["N° de ventas", resumen.cantidad, "text-slate-800"],
                ["Ticket promedio", soles(resumen.promedio), "text-emerald-600"],
              ].map(([t, v, c]) => (
                <div key={t} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase text-slate-400">{t}</p>
                  <p className={`mt-1 text-3xl font-black ${c}`}>{v}</p>
                </div>
              ))}
            </div>

            {/* GRÁFICOS */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Barras titulo="Ventas por día" datos={porDia} color="bg-blue-500" />
              <Barras titulo="Ventas por hora" datos={porHora} color="bg-red-500" />
              <Barras titulo="Ventas por categoría" datos={porCategoria} color="bg-emerald-500" />
              <Barras titulo="Ventas por método de pago" datos={porMetodo} color="bg-amber-500" />
            </div>

            {/* RANKING */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5">
                <h3 className="text-lg font-bold text-slate-800">🏆 Top productos más vendidos</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Producto</th>
                      <th className="px-4 py-3">Categoría</th>
                      <th className="px-4 py-3 text-right">Unidades</th>
                      <th className="px-4 py-3 text-right">Ingresos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ranking.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-slate-400">Sin ventas en el periodo</td>
                      </tr>
                    )}
                    {ranking.map((r, i) => (
                      <tr key={`${r.producto}-${r.categoria}`} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-black text-slate-400">{i + 1}</td>
                        <td className="px-4 py-3 font-bold text-slate-800">{r.producto}</td>
                        <td className="px-4 py-3 text-slate-500">{r.categoria}</td>
                        <td className="px-4 py-3 text-right font-bold">{r.unidades}</td>
                        <td className="px-4 py-3 text-right font-bold text-blue-600">{soles(r.ingresos)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
