"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function RecetaProducto({ producto, onVolver }) {
  const [insumos, setInsumos] = useState([]);
  const [ingredientes, setIngredientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [nuevoInsumo, setNuevoInsumo] = useState("");
  const [nuevaCantidad, setNuevaCantidad] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);

    const [{ data: insumosData, error: insumosError }, { data: recetaData, error: recetaError }] =
      await Promise.all([
        supabase
          .from("insumos")
          .select("*")
          .eq("activo", true)
          .order("nombre", { ascending: true }),

        supabase
          .from("producto_insumos")
          .select("*")
          .eq("producto_id", producto.id),
      ]);

    if (insumosError) {
      alert("Error al cargar los insumos: " + insumosError.message);
      setCargando(false);
      return;
    }

    if (recetaError) {
      alert("Error al cargar la receta: " + recetaError.message);
      setCargando(false);
      return;
    }

    setInsumos(insumosData || []);

    const recetaConDatos = (recetaData || []).map((item) => {
      const insumo = (insumosData || []).find(
        (i) => i.id === item.insumo_id
      );

      return {
        insumoId: item.insumo_id,
        cantidad: Number(item.cantidad),
        insumo,
      };
    });

    setIngredientes(recetaConDatos);
    setCargando(false);
  };

  const agregarInsumo = () => {
    const insumoId = Number(nuevoInsumo);
    const cantidad = Number(nuevaCantidad);

    if (!insumoId) {
      alert("Selecciona un insumo.");
      return;
    }

    if (!cantidad || cantidad <= 0) {
      alert("Ingresa una cantidad mayor a 0.");
      return;
    }

    if (ingredientes.some((item) => item.insumoId === insumoId)) {
      alert("Ese insumo ya está agregado a la receta.");
      return;
    }

    const insumo = insumos.find((i) => i.id === insumoId);

    setIngredientes([
      ...ingredientes,
      {
        insumoId,
        cantidad,
        insumo,
      },
    ]);

    setNuevoInsumo("");
    setNuevaCantidad("");
  };

  const eliminarInsumo = (insumoId) => {
    setIngredientes(
      ingredientes.filter((item) => item.insumoId !== insumoId)
    );
  };

  const cambiarCantidad = (insumoId, valor) => {
    setIngredientes(
      ingredientes.map((item) =>
        item.insumoId === insumoId
          ? {
              ...item,
              cantidad: valor,
            }
          : item
      )
    );
  };

  const guardarReceta = async () => {
    for (const item of ingredientes) {
      if (!item.cantidad || Number(item.cantidad) <= 0) {
        alert("Todas las cantidades deben ser mayores a 0.");
        return;
      }
    }

    setGuardando(true);

    const { error: eliminarError } = await supabase
      .from("producto_insumos")
      .delete()
      .eq("producto_id", producto.id);

    if (eliminarError) {
      alert("Error al actualizar la receta: " + eliminarError.message);
      setGuardando(false);
      return;
    }

    if (ingredientes.length > 0) {
      const filas = ingredientes.map((item) => ({
        producto_id: producto.id,
        insumo_id: item.insumoId,
        cantidad: Number(item.cantidad),
      }));

      const { error: insertarError } = await supabase
        .from("producto_insumos")
        .insert(filas);

      if (insertarError) {
        alert("Error al guardar los ingredientes: " + insertarError.message);
        setGuardando(false);
        return;
      }
    }

    alert("Receta guardada correctamente.");
    setGuardando(false);
  };

  const mostrarUnidad = (unidad) => {
    const unidades = {
      unidad: "unidad",
      kg: "kg",
      g: "g",
      l: "L",
      ml: "ml",
    };

    return unidades[unidad] || unidad;
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* CABECERA */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={onVolver}
              className="mb-3 text-sm font-bold text-slate-500 transition hover:text-red-600"
            >
              ← Volver a productos
            </button>

            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-xl">
                🍔
              </span>

              <div>
                <h1 className="text-2xl font-black text-slate-800 md:text-3xl">
                  Receta del producto
                </h1>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {producto.nombre}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={guardarReceta}
            disabled={guardando}
            className="rounded-xl bg-red-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-200 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {guardando ? "Guardando..." : "💾 Guardar receta"}
          </button>
        </div>

        {/* AGREGAR INSUMO */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <h2 className="text-lg font-black text-slate-800">
            Agregar insumo
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Define cuánto de cada insumo necesita una unidad de este producto.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_auto]">
            <select
              value={nuevoInsumo}
              onChange={(e) => setNuevoInsumo(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-black outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
            >
              <option value="">Seleccionar insumo...</option>

              {insumos.map((insumo) => (
                <option key={insumo.id} value={insumo.id}>
                  {insumo.nombre} ({mostrarUnidad(insumo.unidad_medida)})
                </option>
              ))}
            </select>

            <input
              type="number"
              min="0"
              step="0.01"
              value={nuevaCantidad}
              onChange={(e) => setNuevaCantidad(e.target.value)}
              placeholder="Cantidad"
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-black outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
            />

            <button
              type="button"
              onClick={agregarInsumo}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              + Agregar
            </button>
          </div>
        </div>

        {/* INGREDIENTES */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-lg font-black text-slate-800">
              Ingredientes
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Ingredientes necesarios para preparar una unidad.
            </p>
          </div>

          {cargando ? (
            <div className="flex h-40 items-center justify-center">
              <p className="text-sm font-semibold text-slate-500">
                Cargando receta...
              </p>
            </div>
          ) : ingredientes.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <span className="text-5xl">🥣</span>

              <p className="mt-3 text-lg font-bold text-slate-700">
                Este producto todavía no tiene receta
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Agrega los insumos necesarios para preparar una unidad.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {ingredientes.map((item) => (
                <div
                  key={item.insumoId}
                  className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800">
                      {item.insumo?.nombre || "Insumo"}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      Unidad:{" "}
                      {mostrarUnidad(item.insumo?.unidad_medida)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.cantidad}
                        onChange={(e) =>
                          cambiarCantidad(
                            item.insumoId,
                            e.target.value
                          )
                        }
                        className="w-24 bg-transparent px-3 py-2.5 text-center text-sm font-bold text-black outline-none"
                      />

                      <span className="border-l border-slate-200 px-3 text-xs font-bold text-slate-500">
                        {mostrarUnidad(item.insumo?.unidad_medida)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => eliminarInsumo(item.insumoId)}
                      className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-100"
                      title="Eliminar insumo"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}