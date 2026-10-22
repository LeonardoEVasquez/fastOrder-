"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";

const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100";

export default function GestionCategorias({ onCambio }) {
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [nueva, setNueva] = useState({ nombre: "", icono: "", orden: "" });
  const [editando, setEditando] = useState(null); // { id, nombre, icono, orden }
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    const { data, error } = await supabase.from("categorias").select("*").order("orden", { ascending: true });
    if (error) setError(error.message);
    else {
      setError(null);
      setCategorias(data);
    }
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const mensaje = (err) =>
    err.code === "23505" ? "Ya existe una categoría con ese nombre." : err.message || "Error desconocido";

  const crear = async (e) => {
    e.preventDefault();
    setError(null);
    if (!nueva.nombre.trim()) return setError("El nombre es obligatorio.");
    setGuardando(true);
    const { error } = await supabase.from("categorias").insert([
      {
        nombre: nueva.nombre.trim(),
        icono: nueva.icono.trim() || null,
        orden: parseInt(nueva.orden, 10) || categorias.length + 1,
      },
    ]);
    setGuardando(false);
    if (error) return setError(mensaje(error));
    setNueva({ nombre: "", icono: "", orden: "" });
    await cargar();
    onCambio?.();
  };

  const guardarEdicion = async () => {
    setError(null);
    if (!editando.nombre.trim()) return setError("El nombre es obligatorio.");
    setGuardando(true);
    const { error } = await supabase
      .from("categorias")
      .update({
        nombre: editando.nombre.trim(),
        icono: String(editando.icono || "").trim() || null,
        orden: parseInt(editando.orden, 10) || 0,
      })
      .eq("id", editando.id);
    setGuardando(false);
    if (error) return setError(mensaje(error));
    setEditando(null);
    await cargar();
    onCambio?.();
  };

  const toggleActivo = async (cat) => {
    const { error } = await supabase.from("categorias").update({ activo: !cat.activo }).eq("id", cat.id);
    if (error) return setError(mensaje(error));
    await cargar();
    onCambio?.();
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-xl">🗂️</span>
            <h1 className="text-2xl font-black text-slate-800 md:text-3xl">Categorías</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">Organiza la carta. Las categorías inactivas no aparecen en la venta.</p>
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
            ⚠️ La personalización (hamburguesas, alitas, salchipapas, bebidas) depende del nombre de la categoría. Si la renombras, pierde su ventana de personalización.
          </p>
        </div>

        {/* NUEVA */}
        <form onSubmit={crear} className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-[1fr_100px_100px_auto]">
          <input value={nueva.nombre} onChange={(e) => setNueva({ ...nueva, nombre: e.target.value })} placeholder="Nombre de la categoría" className={inputCls} />
          <input value={nueva.icono} onChange={(e) => setNueva({ ...nueva, icono: e.target.value })} placeholder="Icono 🍕" className={inputCls} />
          <input type="number" value={nueva.orden} onChange={(e) => setNueva({ ...nueva, orden: e.target.value })} placeholder="Orden" className={inputCls} />
          <button type="submit" disabled={guardando} className="rounded-xl bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50">
            ➕ Agregar
          </button>
        </form>

        {error && <div className="rounded-xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-700">⚠️ {error}</div>}

        {/* LISTA */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {cargando ? (
            <p className="p-8 text-center font-semibold text-slate-500">Cargando...</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {categorias.map((c) => {
                const enEdicion = editando?.id === c.id;
                return (
                  <div key={c.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                    {enEdicion ? (
                      <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-[1fr_100px_100px]">
                        <input value={editando.nombre} onChange={(e) => setEditando({ ...editando, nombre: e.target.value })} className={inputCls} />
                        <input value={editando.icono || ""} onChange={(e) => setEditando({ ...editando, icono: e.target.value })} className={inputCls} />
                        <input type="number" value={editando.orden} onChange={(e) => setEditando({ ...editando, orden: e.target.value })} className={inputCls} />
                      </div>
                    ) : (
                      <div className="flex flex-1 items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-xl">{c.icono || "🍽️"}</span>
                        <div>
                          <p className={`font-bold ${c.activo ? "text-slate-800" : "text-slate-400 line-through"}`}>{c.nombre}</p>
                          <p className="text-xs text-slate-400">Orden {c.orden}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {enEdicion ? (
                        <>
                          <button type="button" onClick={guardarEdicion} disabled={guardando} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50">
                            Guardar
                          </button>
                          <button type="button" onClick={() => setEditando(null)} className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => setEditando({ ...c })} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700">
                            ✏️ Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleActivo(c)}
                            className={`rounded-xl border px-4 py-2 text-xs font-bold ${
                              c.activo
                                ? "border-slate-200 bg-slate-50 text-slate-600 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            {c.activo ? "Desactivar" : "Activar"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
