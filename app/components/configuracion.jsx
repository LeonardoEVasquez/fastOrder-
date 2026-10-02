"use client";

import { useState } from "react";

export default function Configuracion() {
  const [empresa, setEmpresa] = useState({
    nombre: "FastOrder",
    ruc: "",
    direccion: "",
    telefono: "",
    comprobante: "",
  });

  const [guardado, setGuardado] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setEmpresa((actual) => ({
      ...actual,
      [name]: value,
    }));

    setGuardado(false);
  };

  const guardarConfiguracion = () => {
    // Aquí posteriormente puedes guardar los datos
    // en una base de datos.
    localStorage.setItem(
      "fastorder_configuracion",
      JSON.stringify(empresa)
    );

    setGuardado(true);

    setTimeout(() => {
      setGuardado(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">

      {/* ENCABEZADO */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">
          Configuración
        </h1>

        <p className="mt-1 text-slate-500">
          Administra la información y preferencias de tu negocio.
        </p>
      </div>

      <div className="mx-auto max-w-5xl space-y-6">

        {/* INFORMACIÓN DEL NEGOCIO */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

          <div className="border-b border-slate-200 p-6">
            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-2xl">
                🏢
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Información del negocio
                </h2>

                <p className="text-sm text-slate-500">
                  Datos principales de tu establecimiento.
                </p>
              </div>

            </div>
          </div>

          <div className="grid gap-5 p-6 md:grid-cols-2">

            {/* NOMBRE */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Nombre del negocio
              </label>

              <input
                type="text"
                name="nombre"
                value={empresa.nombre}
                onChange={handleChange}
                placeholder="Ej. Restaurante FastOrder"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* RUC */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                RUC
              </label>

              <input
                type="text"
                name="ruc"
                value={empresa.ruc}
                onChange={handleChange}
                placeholder="Ej. 20123456789"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* DIRECCIÓN */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Dirección
              </label>

              <input
                type="text"
                name="direccion"
                value={empresa.direccion}
                onChange={handleChange}
                placeholder="Ej. Av. Principal 123"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* TELÉFONO */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Teléfono
              </label>

              <input
                type="text"
                name="telefono"
                value={empresa.telefono}
                onChange={handleChange}
                placeholder="Ej. 999 999 999"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

          </div>
        </div>

        {/* PREFERENCIAS */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

          <div className="border-b border-slate-200 p-6">

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-2xl">
                ⚙️
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Preferencias del sistema
                </h2>

                <p className="text-sm text-slate-500">
                  Configuración general de FastOrder.
                </p>
              </div>

            </div>

          </div>

          <div className="grid gap-4 p-6 md:grid-cols-2">

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">

                <div>
                  <p className="font-semibold text-slate-800">
                    Moneda
                  </p>

                  <p className="text-sm text-slate-500">
                    Moneda utilizada en los precios.
                  </p>
                </div>

                <span className="rounded-lg bg-white px-4 py-2 font-bold text-slate-700 shadow-sm">
                  S/
                </span>

              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">

                <div>
                  <p className="font-semibold text-slate-800">
                    Sistema
                  </p>

                  <p className="text-sm text-slate-500">
                    Plataforma de gestión de pedidos.
                  </p>
                </div>

                <span className="rounded-lg bg-blue-100 px-3 py-2 text-sm font-bold text-blue-700">
                  FastOrder
                </span>

              </div>
            </div>

          </div>

        </div>

        {/* INFORMACIÓN DEL SISTEMA */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

          <div className="p-6">

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl">
                ℹ️
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Información del sistema
                </h2>

                <p className="text-sm text-slate-500">
                  Información de la instalación actual.
                </p>
              </div>

            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Aplicación
                </p>

                <p className="mt-1 font-bold text-slate-700">
                  FastOrder
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Versión
                </p>

                <p className="mt-1 font-bold text-slate-700">
                  1.0.0
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Estado
                </p>

                <p className="mt-1 font-bold text-emerald-600">
                  ● Sistema activo
                </p>
              </div>

            </div>

          </div>

        </div>

        {/* BOTÓN GUARDAR */}
        <div className="flex flex-col items-end gap-3">

          {guardado && (
            <div className="rounded-xl bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-700">
              ✓ Configuración guardada correctamente
            </div>
          )}

          <button
            type="button"
            onClick={guardarConfiguracion}
            className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
          >
            Guardar configuración
          </button>

        </div>

      </div>
    </div>
  );
}