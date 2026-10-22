"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

const CAMPOS = [
  ["razon_social", "Razón social", "Ej. ALVARADO GOMEZ ADELA DIANA"],
  ["ruc", "RUC", "Ej. 10730264823"],
  ["direccion", "Dirección", "Ej. Av. Principal 123"],
  ["telefono", "Teléfono", "Ej. 999 999 999"],
];

export default function Configuracion() {
  const [empresa, setEmpresa] = useState({
    razon_social: "",
    ruc: "",
    direccion: "",
    telefono: "",
  });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("configuracion_negocio")
        .select("razon_social, ruc, direccion, telefono")
        .eq("id", 1)
        .maybeSingle();
      if (error) setError(error.message);
      if (data)
        setEmpresa({
          razon_social: data.razon_social || "",
          ruc: data.ruc || "",
          direccion: data.direccion || "",
          telefono: data.telefono || "",
        });
      setCargando(false);
    })();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmpresa((a) => ({ ...a, [name]: value }));
    setGuardado(false);
  };

  const guardarConfiguracion = async () => {
    setError(null);
    if (!empresa.razon_social.trim() || !empresa.ruc.trim()) {
      setError("Razón social y RUC son obligatorios.");
      return;
    }
    setGuardando(true);
    const { error } = await supabase
      .from("configuracion_negocio")
      .update({
        razon_social: empresa.razon_social.trim(),
        ruc: empresa.ruc.trim(),
        direccion: empresa.direccion.trim() || null,
        telefono: empresa.telefono.trim() || null,
      })
      .eq("id", 1);
    setGuardando(false);
    if (error) {
      setError(error.message);
      return;
    }
    setGuardado(true);
    setTimeout(() => setGuardado(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Configuración</h1>
        <p className="mt-1 text-slate-500">
          Administra la información de tu negocio (se imprime en la nota de venta).
        </p>
      </div>

      <div className="mx-auto max-w-5xl space-y-6">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-2xl">
                🏢
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Información del negocio</h2>
                <p className="text-sm text-slate-500">Datos principales de tu establecimiento.</p>
              </div>
            </div>
          </div>

          {cargando ? (
            <p className="p-6 text-slate-500">Cargando...</p>
          ) : (
            <div className="grid gap-5 p-6 md:grid-cols-2">
              {CAMPOS.map(([name, label, placeholder]) => (
                <div key={name}>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
                  <input
                    type="text"
                    name={name}
                    value={empresa[name]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Aplicación", "FastOrder", "text-slate-700"],
            ["Versión", "1.0.0", "text-slate-700"],
            ["Estado", "● Sistema activo", "text-emerald-600"],
          ].map(([t, v, c]) => (
            <div key={t} className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-400">{t}</p>
              <p className={`mt-1 font-bold ${c}`}>{v}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-end gap-3">
          {error && (
            <div className="rounded-xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-700">
              ⚠️ {error}
            </div>
          )}
          {guardado && (
            <div className="rounded-xl bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-700">
              ✓ Configuración guardada correctamente
            </div>
          )}
          <button
            type="button"
            onClick={guardarConfiguracion}
            disabled={guardando || cargando}
            className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Guardar configuración"}
          </button>
        </div>
      </div>
    </div>
  );
}