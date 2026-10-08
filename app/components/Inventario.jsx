"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { fechaHoraLima } from "./fechas";

const ESTADOS = {
  agotado: ["Agotado", "bg-rose-100 text-rose-700"],
  stock_bajo: ["Stock bajo", "bg-amber-100 text-amber-700"],
  normal: ["Normal", "bg-emerald-100 text-emerald-700"],
};
const TIPOS_AJUSTE = [
  ["ingreso_manual", "Ingreso"],
  ["salida_manual", "Salida"],
  ["merma", "Merma"],
];
const LABEL_MOV = { venta: "Venta", ingreso_manual: "Ingreso", salida_manual: "Salida", merma: "Merma" };
const UNIDADES = ["unidad", "kg", "g", "lt", "ml"];

const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100";
const labelCls = "mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600";

const num = (v) => Number(v).toLocaleString("es-PE", { maximumFractionDigits: 3 });

// ============================================
// MODAL: AJUSTE DE INVENTARIO (RN-19)
// ============================================
function ModalAjuste({ item, onCerrar, onListo }) {
  const [tipo, setTipo] = useState("ingreso_manual");
  const [cantidad, setCantidad] = useState("");
  const [justificacion, setJustificacion] = useState("");
  const [vencimiento, setVencimiento] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  const guardar = async (e) => {
    e.preventDefault();
    setError(null);
    const cant = parseFloat(String(cantidad).replace(",", "."));
    if (isNaN(cant) || cant <= 0) return setError("La cantidad debe ser mayor a 0.");
    if (justificacion.trim().length < 10) return setError("La justificación debe tener al menos 10 caracteres.");

    const esProducto = item.origen === "producto";
    try {
      setGuardando(true);
      const { error: e1 } = await supabase.rpc("ajustar_inventario", {
        p_producto: esProducto ? item.id : null,
        p_insumo: esProducto ? null : item.id,
        p_tipo: tipo,
        p_cant: cant,
        p_justificacion: justificacion.trim(),
      });
      if (e1) throw e1;

      // Ingreso con fecha de vencimiento -> crea el lote
      if (tipo === "ingreso_manual" && vencimiento) {
        const { error: e2 } = await supabase.from("lotes_inventario").insert([
          {
            producto_id: esProducto ? item.id : null,
            insumo_id: esProducto ? null : item.id,
            cantidad_inicial: cant,
            cantidad_actual: cant,
            fecha_vencimiento: vencimiento,
          },
        ]);
        if (e2) throw e2;
      }
      onListo();
    } catch (err) {
      const msg = String(err.message || err);
      setError(msg.includes("stock_actual") ? "No hay stock suficiente para registrar esa salida." : msg);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form onSubmit={guardar} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Ajustar inventario</h2>
          <p className="text-sm text-slate-500">
            {item.nombre} · Stock actual: <b>{num(item.stock_actual)}</b>
          </p>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">⚠️ {error}</div>}

        <div>
          <label className={labelCls}>Tipo de movimiento</label>
          <div className="grid grid-cols-3 gap-2">
            {TIPOS_AJUSTE.map(([v, t]) => (
              <button
                key={v}
                type="button"
                onClick={() => setTipo(v)}
                className={`rounded-xl border px-3 py-2 text-sm font-bold transition ${
                  tipo === v ? "border-red-500 bg-red-500 text-white" : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls}>Cantidad</label>
          <input type="number" step="any" min="0" value={cantidad} onChange={(e) => setCantidad(e.target.value)} className={inputCls} />
        </div>

        {tipo === "ingreso_manual" && (
          <div>
            <label className={labelCls}>Fecha de vencimiento (opcional, crea un lote)</label>
            <input type="date" value={vencimiento} onChange={(e) => setVencimiento(e.target.value)} className={inputCls} />
          </div>
        )}

        <div>
          <label className={labelCls}>Justificación * (mín. 10 caracteres)</label>
          <textarea
            rows={3}
            value={justificacion}
            onChange={(e) => setJustificacion(e.target.value)}
            placeholder="Ej. Compra semanal al proveedor"
            className={`${inputCls} resize-none`}
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button type="button" onClick={onCerrar} disabled={guardando} className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Cancelar
          </button>
          <button type="submit" disabled={guardando} className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50">
            {guardando ? "Guardando..." : "Registrar"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ============================================
// MODAL: NUEVO INSUMO
// ============================================
function ModalInsumo({ onCerrar, onListo }) {
  const [nombre, setNombre] = useState("");
  const [unidad, setUnidad] = useState("unidad");
  const [minimo, setMinimo] = useState("0");
  const [perecible, setPerecible] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  const guardar = async (e) => {
    e.preventDefault();
    setError(null);
    if (!nombre.trim()) return setError("El nombre es obligatorio.");
    const min = parseFloat(String(minimo).replace(",", ".")) || 0;
    if (min < 0) return setError("El stock mínimo no puede ser negativo.");

    setGuardando(true);
    const { error } = await supabase.from("insumos").insert([
      { nombre: nombre.trim(), unidad_medida: unidad, stock_minimo: min, perecible },
    ]);
    setGuardando(false);
    if (error) return setError(error.code === "23505" ? "Ya existe un insumo con ese nombre." : error.message);
    onListo();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form onSubmit={guardar} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Nuevo insumo</h2>
          <p className="text-sm text-slate-500">Se crea con stock 0. Luego registra un ingreso.</p>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">⚠️ {error}</div>}

        <div>
          <label className={labelCls}>Nombre *</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Carne de res" className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Unidad de medida</label>
            <select value={unidad} onChange={(e) => setUnidad(e.target.value)} className={inputCls}>
              {UNIDADES.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Stock mínimo</label>
            <input type="number" min="0" step="any" value={minimo} onChange={(e) => setMinimo(e.target.value)} className={inputCls} />
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={perecible} onChange={(e) => setPerecible(e.target.checked)} className="h-4 w-4 rounded text-red-600" />
          Insumo perecible (maneja vencimiento)
        </label>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button type="button" onClick={onCerrar} disabled={guardando} className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Cancelar
          </button>
          <button type="submit" disabled={guardando} className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50">
            {guardando ? "Guardando..." : "Crear insumo"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ============================================
// PANTALLA PRINCIPAL
// ============================================
export default function Inventario() {
  const [tab, setTab] = useState("stock");
  const [stock, setStock] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroOrigen, setFiltroOrigen] = useState("todos");
  const [ajuste, setAjuste] = useState(null);
  const [nuevoInsumo, setNuevoInsumo] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const [rs, rm, rl] = await Promise.all([
      supabase.from("v_stock").select("*").order("nombre", { ascending: true }),
      supabase
        .from("movimientos_inventario")
        .select("*, productos(nombre), insumos(nombre)")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("v_lotes_por_vencer").select("*").order("fecha_vencimiento", { ascending: true }),
    ]);
    const err = rs.error || rm.error || rl.error;
    if (err) setError(err.message);
    else setError(null);
    setStock(rs.data || []);
    setMovimientos(rm.data || []);
    setLotes(rl.data || []);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const stockFiltrado = stock.filter(
    (s) =>
      (filtroOrigen === "todos" || s.origen === filtroOrigen) &&
      s.nombre.toLowerCase().includes(busqueda.toLowerCase().trim())
  );
  const agotados = stock.filter((s) => s.estado === "agotado").length;
  const bajos = stock.filter((s) => s.estado === "stock_bajo").length;

  const TABS = [
    ["stock", "Stock actual"],
    ["movimientos", "Movimientos"],
    ["vencer", `Por vencer (${lotes.length})`],
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        {/* CABECERA */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-xl">📊</span>
              <h1 className="text-2xl font-black text-slate-800 md:text-3xl">Inventario</h1>
            </div>
            <p className="mt-1 text-sm text-slate-500">Control de stock de productos e insumos, movimientos y vencimientos.</p>
          </div>
          <button
            type="button"
            onClick={() => setNuevoInsumo(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-200 transition hover:bg-red-700"
          >
            ➕ Nuevo insumo
          </button>
        </div>

        {/* RESUMEN */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            ["Agotados", agotados, "text-rose-600"],
            ["Stock bajo", bajos, "text-amber-600"],
            ["Lotes por vencer (7 días)", lotes.length, "text-orange-600"],
          ].map(([t, v, c]) => (
            <div key={t} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-400">{t}</p>
              <p className={`mt-1 text-3xl font-black ${c}`}>{v}</p>
            </div>
          ))}
        </div>

        {error && <div className="rounded-xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-700">⚠️ {error}</div>}

        {/* TABS */}
        <div className="flex flex-wrap gap-2">
          {TABS.map(([id, texto]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                tab === id ? "bg-red-500 text-white shadow-sm shadow-red-200" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              {texto}
            </button>
          ))}
        </div>

        {cargando ? (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
            <p className="font-semibold text-slate-500">Cargando inventario...</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* STOCK */}
            {tab === "stock" && (
              <>
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
                  <input
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="🔍 Buscar por nombre..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-red-500 sm:w-80"
                  />
                  <select
                    value={filtroOrigen}
                    onChange={(e) => setFiltroOrigen(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none"
                  >
                    <option value="todos">Productos e insumos</option>
                    <option value="producto">Solo productos</option>
                    <option value="insumo">Solo insumos</option>
                  </select>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Nombre</th>
                        <th className="px-4 py-3">Tipo</th>
                        <th className="px-4 py-3 text-right">Stock</th>
                        <th className="px-4 py-3 text-right">Mínimo</th>
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stockFiltrado.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-10 text-center text-slate-400">Sin resultados</td>
                        </tr>
                      )}
                      {stockFiltrado.map((s) => {
                        const [txt, cls] = ESTADOS[s.estado] || ESTADOS.normal;
                        return (
                          <tr key={`${s.origen}-${s.id}`} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-bold text-slate-800">{s.nombre}</td>
                            <td className="px-4 py-3 capitalize text-slate-500">{s.origen}</td>
                            <td className="px-4 py-3 text-right font-bold">{num(s.stock_actual)}</td>
                            <td className="px-4 py-3 text-right text-slate-500">{num(s.stock_minimo)}</td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}>{txt}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => setAjuste(s)}
                                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                              >
                                Ajustar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* MOVIMIENTOS */}
            {tab === "movimientos" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Ítem</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3 text-right">Cantidad</th>
                      <th className="px-4 py-3 text-right">Antes → Después</th>
                      <th className="px-4 py-3">Justificación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {movimientos.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-slate-400">Sin movimientos</td>
                      </tr>
                    )}
                    {movimientos.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-4 py-3 text-slate-500">{fechaHoraLima(m.created_at)}</td>
                        <td className="px-4 py-3 font-bold text-slate-800">{m.productos?.nombre || m.insumos?.nombre}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                              m.tipo === "ingreso_manual" ? "bg-emerald-100 text-emerald-700" : m.tipo === "venta" ? "bg-blue-100 text-blue-700" : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {LABEL_MOV[m.tipo]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold">{num(m.cantidad)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-slate-500">
                          {num(m.stock_antes ?? 0)} → {num(m.stock_despues ?? 0)}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{m.justificacion || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* POR VENCER */}
            {tab === "vencer" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Ítem</th>
                      <th className="px-4 py-3 text-right">Cantidad</th>
                      <th className="px-4 py-3">Vence</th>
                      <th className="px-4 py-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lotes.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-slate-400">No hay lotes por vencer en los próximos 7 días</td>
                      </tr>
                    )}
                    {lotes.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-slate-800">{l.item}</td>
                        <td className="px-4 py-3 text-right font-bold">{num(l.cantidad_actual)}</td>
                        <td className="px-4 py-3 text-slate-500">{l.fecha_vencimiento}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                              l.dias_restantes < 0 ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {l.dias_restantes < 0 ? "Vencido" : l.dias_restantes === 0 ? "Vence hoy" : `${l.dias_restantes} día(s)`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {ajuste && (
        <ModalAjuste
          item={ajuste}
          onCerrar={() => setAjuste(null)}
          onListo={() => {
            setAjuste(null);
            cargar();
          }}
        />
      )}
      {nuevoInsumo && (
        <ModalInsumo
          onCerrar={() => setNuevoInsumo(false)}
          onListo={() => {
            setNuevoInsumo(false);
            cargar();
          }}
        />
      )}
    </div>
  );
}
