"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { hoyLima, horaLima } from "./fechas";

// [estado, título, color cabecera, siguiente estado, texto del botón]
const COLUMNAS = [
  ["pendiente", "Pendientes", "bg-amber-500", "en_preparacion", "Iniciar preparación"],
  ["en_preparacion", "En preparación", "bg-blue-600", "listo", "Marcar como listo"],
  ["listo", "Listos", "bg-emerald-600", "entregado", "Entregar"],
];
const ENTREGAS = { salon: "Salón", llevar: "Llevar / Delivery" };

export default function Cocina() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    const { data, error } = await supabase
      .from("pedidos")
      .select(
        "id, numero_dia, tipo_entrega, cliente_nombre, estado, created_at, pedido_detalles(id, producto_nombre, cantidad, descripcion)"
      )
      .eq("fecha_operativa", hoyLima())
      .order("created_at", { ascending: true });
    if (error) setError(error.message);
    else {
      setError(null);
      setPedidos(data);
    }
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
    const t = setInterval(cargar, 15000); // refresco automático
    return () => clearInterval(t);
  }, [cargar]);

  const avanzar = async (pedido, nuevoEstado) => {
    const { error } = await supabase.from("pedidos").update({ estado: nuevoEstado }).eq("id", pedido.id);
    if (error) {
      alert("No se pudo actualizar el estado: " + error.message);
      return;
    }
    setPedidos((prev) => prev.map((p) => (p.id === pedido.id ? { ...p, estado: nuevoEstado } : p)));
  };

  const entregados = pedidos.filter((p) => p.estado === "entregado").length;

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-xl">👨‍🍳</span>
              <h1 className="text-2xl font-black text-slate-800 md:text-3xl">Cocina</h1>
            </div>
            <p className="mt-1 text-sm text-slate-500">Pedidos del día. Se actualiza automáticamente cada 15 segundos.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600">
              Entregados hoy: {entregados}
            </span>
            <button
              type="button"
              onClick={cargar}
              className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white hover:bg-slate-900"
            >
              ↻ Actualizar
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-700">⚠️ {error}</div>
        )}

        {cargando ? (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
            <p className="font-semibold text-slate-500">Cargando pedidos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {COLUMNAS.map(([estado, titulo, color, siguiente, textoBtn]) => {
              const lista = pedidos.filter((p) => p.estado === estado);
              return (
                <div key={estado} className="flex min-h-[300px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <div className={`flex items-center justify-between px-4 py-3 text-white ${color}`}>
                    <h2 className="font-extrabold">{titulo}</h2>
                    <span className="rounded-full bg-white/25 px-2.5 py-0.5 text-sm font-black">{lista.length}</span>
                  </div>

                  <div className="flex-1 space-y-3 p-3">
                    {lista.length === 0 && (
                      <p className="py-8 text-center text-sm font-semibold text-slate-400">Sin pedidos</p>
                    )}
                    {lista.map((p) => (
                      <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xl font-black text-slate-800">#{String(p.numero_dia).padStart(3, "0")}</p>
                            <p className="text-sm font-semibold text-slate-600">{p.cliente_nombre}</p>
                          </div>
                          <div className="text-right">
                            <p className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                              {ENTREGAS[p.tipo_entrega] || p.tipo_entrega}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">{horaLima(p.created_at)}</p>
                          </div>
                        </div>

                        <ul className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                          {(p.pedido_detalles || []).map((d) => (
                            <li key={d.id} className="text-sm">
                              <p className="font-bold text-slate-800">
                                {d.cantidad} × {d.producto_nombre}
                              </p>
                              {d.descripcion && <p className="text-xs text-slate-500">{d.descripcion}</p>}
                            </li>
                          ))}
                        </ul>

                        <button
                          type="button"
                          onClick={() => avanzar(p, siguiente)}
                          className="mt-4 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                        >
                          {textoBtn}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}