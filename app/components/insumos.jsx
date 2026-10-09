"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function Insumos() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [insumos, setInsumos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [insumoEditando, setInsumoEditando] = useState(null);
  const [desactivandoId, setDesactivandoId] = useState(null);

  const [formulario, setFormulario] = useState({
    nombre: "",
    unidad: "unidad",
    stockActual: "",
    stockMinimo: "",
    tieneVencimiento: true,
  });

  // ==============================
  // CARGAR INSUMOS
  // ==============================

  const cargarInsumos = async () => {
    try {
      setCargando(true);

      const { data, error } = await supabase
        .from("insumos")
        .select("*")
        .eq("activo", true)
        .order("nombre", { ascending: true });

      if (error) throw error;

      setInsumos(data || []);
    } catch (error) {
      console.error("Error al cargar insumos:", error);

      alert(
        "No se pudieron cargar los insumos: " +
          (error?.message || error)
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarInsumos();
  }, []);

  // ==============================
  // MODAL
  // ==============================

  const abrirModal = () => {
  setInsumoEditando(null);

  setFormulario({
    nombre: "",
    unidad: "unidad",
    stockActual: "",
    stockMinimo: "",
    tieneVencimiento: true,
  });

  setModalAbierto(true);
};

  const cerrarModal = () => {
  if (guardando) return;

  setModalAbierto(false);
  setInsumoEditando(null);
};

  // ==============================
  // FORMULARIO
  // ==============================

  const cambiarCampo = (campo, valor) => {
    setFormulario((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  
const guardarInsumo = async (e) => {
  e.preventDefault();

  const nombre = formulario.nombre.trim();
  const stockActual = Number(formulario.stockActual);
  const stockMinimo = Number(formulario.stockMinimo);

  // ------------------------------
  // VALIDACIONES
  // ------------------------------

  if (!nombre) {
    alert("Ingresa el nombre del insumo.");
    return;
  }

  if (
    formulario.stockActual === "" ||
    Number.isNaN(stockActual) ||
    stockActual < 0
  ) {
    alert("Ingresa un stock actual válido.");
    return;
  }

  if (
    formulario.stockMinimo === "" ||
    Number.isNaN(stockMinimo) ||
    stockMinimo < 0
  ) {
    alert("Ingresa un stock mínimo válido.");
    return;
  }

  if (stockMinimo > stockActual) {
    const continuar = window.confirm(
      "El stock mínimo es mayor que el stock actual.\n\n" +
        "El insumo quedará registrado como stock bajo.\n\n" +
        "¿Deseas continuar?"
    );

    if (!continuar) return;
  }

  try {
    setGuardando(true);

    // ------------------------------
    // 1. EDITAR INSUMO EXISTENTE
    // ------------------------------

    if (insumoEditando) {
      const { data: actualizado, error } = await supabase
        .from("insumos")
        .update({
          nombre,
          unidad_medida: formulario.unidad,
          stock_minimo: stockMinimo,
          perecible: formulario.tieneVencimiento,
        })
        .eq("id", insumoEditando.id)
        .select("*")
        .single();

      if (error) throw error;

      // Actualizar el insumo en la tabla sin modificar su stock.
      setInsumos((prev) =>
        prev
          .map((item) =>
            item.id === actualizado.id ? actualizado : item
          )
          .sort((a, b) => a.nombre.localeCompare(b.nombre))
      );

      // Limpiar el formulario y cerrar el modal.
      setFormulario({
        nombre: "",
        unidad: "unidad",
        stockActual: "",
        stockMinimo: "",
        tieneVencimiento: true,
      });

      setModalAbierto(false);
      setInsumoEditando(null);

      alert("Insumo actualizado correctamente.");

      return;
    }

    // ------------------------------
    // 2. CREAR INSUMO NUEVO
    // ------------------------------

    const { data: nuevoInsumo, error: errorInsumo } =
      await supabase
        .from("insumos")
        .insert({
          nombre,
          unidad_medida: formulario.unidad,
          stock_actual: stockActual,
          stock_minimo: stockMinimo,
          perecible: formulario.tieneVencimiento,
          activo: true,
        })
        .select("*")
        .single();

    if (errorInsumo) throw errorInsumo;

    // ------------------------------
    // 3. REGISTRAR STOCK INICIAL
    // ------------------------------

    if (stockActual > 0) {
      const { error: errorMovimiento } = await supabase
        .from("movimientos_inventario")
        .insert({
          insumo_id: nuevoInsumo.id,
          tipo: "ingreso_manual",
          cantidad: stockActual,
          stock_antes: 0,
          stock_despues: stockActual,
          justificacion: "Stock inicial",
        });

      if (errorMovimiento) {
        console.error(
          "Error al registrar movimiento:",
          errorMovimiento
        );

        alert(
          "El insumo fue creado, pero no se pudo registrar " +
            "el movimiento de stock inicial: " +
            (errorMovimiento?.message || errorMovimiento)
        );
      }
    }

    // ------------------------------
    // 4. ACTUALIZAR TABLA
    // ------------------------------

    setInsumos((prev) =>
      [...prev, nuevoInsumo].sort((a, b) =>
        a.nombre.localeCompare(b.nombre)
      )
    );

    // ------------------------------
    // 5. LIMPIAR FORMULARIO
    // ------------------------------

    setFormulario({
      nombre: "",
      unidad: "unidad",
      stockActual: "",
      stockMinimo: "",
      tieneVencimiento: true,
    });

    setModalAbierto(false);

    alert("Insumo registrado correctamente.");
  } catch (error) {
    console.error("Error al guardar insumo:", error);

    alert(
      "No se pudo guardar el insumo: " +
        (error?.message || error)
    );
  } finally {
    setGuardando(false);
  }
};

  
  // ==============================
  // EDITAR INSUMO
  // ==============================

  const abrirEdicion = (insumo) => {
    setInsumoEditando(insumo);

    setFormulario({
      nombre: insumo.nombre || "",
      unidad: insumo.unidad_medida || "unidad",
      stockActual: String(insumo.stock_actual ?? 0),
      stockMinimo: String(insumo.stock_minimo ?? 0),
      tieneVencimiento: Boolean(insumo.perecible),
    });

    setModalAbierto(true);
  };

  // ==============================
  // DESACTIVAR INSUMO
  // ==============================

  const desactivarInsumo = async (insumo) => {
    const confirmar = window.confirm(
      `¿Deseas desactivar "${insumo.nombre}"?\n\n` +
      "Dejará de aparecer entre los insumos activos, " +
      "pero conservará su historial."
    );

    if (!confirmar) return;

    try {
      setDesactivandoId(insumo.id);

      const { error } = await supabase
        .from("insumos")
        .update({ activo: false })
        .eq("id", insumo.id);

      if (error) throw error;

      setInsumos((prev) =>
        prev.filter((item) => item.id !== insumo.id)
      );

      alert("Insumo desactivado correctamente.");
    } catch (error) {
      console.error("Error al desactivar insumo:", error);

      alert(
        "No se pudo desactivar el insumo: " +
        (error?.message || error)
      );
    } finally {
      setDesactivandoId(null);
    }
  };

  // ==============================
  // ESTADO DEL STOCK
  // ==============================

  const obtenerEstadoStock = (insumo) => {
    const stock = Number(insumo.stock_actual || 0);
    const minimo = Number(insumo.stock_minimo || 0);

    if (stock <= 0) {
      return {
        texto: "Agotado",
        clase: "bg-red-100 text-red-700",
      };
    }

    if (stock <= minimo) {
      return {
        texto: "Bajo",
        clase: "bg-amber-100 text-amber-700",
      };
    }

    return {
      texto: "Normal",
      clase: "bg-emerald-100 text-emerald-700",
    };
  };

  // ==============================
  // MOSTRAR UNIDAD
  // ==============================

  const mostrarUnidad = (unidad) => {
    const unidades = {
      unidad: "Unidad",
      kg: "kg",
      g: "g",
      l: "L",
      ml: "ml",
    };

    return unidades[unidad] || unidad;
  };

  return (
    <div className="space-y-6">
      {/* ============================== */}
      {/* ENCABEZADO */}
      {/* ============================== */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Insumos
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Gestiona los insumos y controla su stock.
          </p>
        </div>

        <button
          onClick={abrirModal}
          className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
        >
          + Nuevo insumo
        </button>
      </div>

      {/* ============================== */}
      {/* TABLA */}
      {/* ============================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Insumo
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Unidad
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Stock
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Mínimo
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Estado
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {cargando ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-16 text-center text-sm text-slate-500"
                  >
                    Cargando insumos...
                  </td>
                </tr>
              ) : insumos.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-16 text-center"
                  >
                    <div className="flex flex-col items-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
                        📦
                      </div>

                      <p className="text-sm font-semibold text-slate-700">
                        No hay insumos registrados
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        Agrega tu primer insumo usando el botón
                        &quot;+ Nuevo insumo&quot;.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                insumos.map((insumo) => {
                  const estado = obtenerEstadoStock(insumo);

                  return (
                    <tr
                      key={insumo.id}
                      className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-slate-800">
                          {insumo.nombre}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {mostrarUnidad(insumo.unidad_medida)}
                      </td>

                      <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                        {Number(insumo.stock_actual || 0)}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {Number(insumo.stock_minimo || 0)}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${estado.clase}`}
                        >
                          {estado.texto}
                        </span>
                      </td>

                      
  <td className="px-6 py-4">
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => abrirEdicion(insumo)}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
      >
        Editar
      </button>

      <button
        type="button"
        onClick={() => desactivarInsumo(insumo)}
        disabled={desactivandoId === insumo.id}
        className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
      >
        {desactivandoId === insumo.id
          ? "Desactivando..."
          : "Desactivar"}
      </button>
    </div>
  </td> 
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================== */}
      {/* MODAL */}
      {/* ============================== */}

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {insumoEditando ? "Editar insumo" : "Nuevo insumo"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {insumoEditando
                  ? "Actualiza los datos del insumo."
                  : "Registra un nuevo insumo."}
              </p>
            </div>

              <button
                type="button"
                onClick={cerrarModal}
                disabled={guardando}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ×
              </button>
            </div>

            {/* FORMULARIO */}
            <form
              onSubmit={guardarInsumo}
              className="space-y-5 px-6 py-6"
            >
              {/* NOMBRE */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Nombre
                </label>

                <input
                  type="text"
                  value={formulario.nombre}
                  onChange={(e) =>
                    cambiarCampo("nombre", e.target.value)
                  }
                  placeholder="Carne de hamburguesa"
                  required
                  disabled={guardando}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-black outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {/* UNIDAD */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Unidad de medida
                </label>

                <select
                  value={formulario.unidad}
                  onChange={(e) =>
                    cambiarCampo("unidad", e.target.value)
                  }
                  disabled={guardando}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-black outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="unidad">Unidad</option>
                  <option value="kg">Kilogramos</option>
                  <option value="g">Gramos</option>
                  <option value="l">Litros</option>
                  <option value="ml">Mililitros</option>
                </select>
              </div>

              {/* STOCK ACTUAL */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Stock actual
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formulario.stockActual}
                  onChange={(e) =>
                    cambiarCampo("stockActual", e.target.value)
                  }
                  readOnly={Boolean(insumoEditando)}
                  placeholder="10"
                  required
                  disabled={guardando}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-black outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                />

                                
                <p className="mt-1.5 text-xs text-slate-400">
                  {insumoEditando
                    ? "El stock solo se modifica mediante movimientos de inventario."
                    : "Cantidad inicial disponible actualmente."}
                </p>
              </div>

              {/* STOCK MINIMO */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Stock mínimo
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formulario.stockMinimo}
                  onChange={(e) =>
                    cambiarCampo("stockMinimo", e.target.value)
                  }
                  placeholder="2"
                  required
                  disabled={guardando}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-black outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <p className="mt-1.5 text-xs text-slate-400">
                  Cuando el stock llegue a este valor, se
                  mostrará como bajo.
                </p>
              </div>

              {/* VENCIMIENTO */}
              <div>
                <label className="mb-3 block text-sm font-semibold text-slate-700">
                  ¿Tiene vencimiento?
                </label>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      cambiarCampo("tieneVencimiento", true)
                    }
                    disabled={guardando}
                    className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      formulario.tieneVencimiento
                        ? "border-red-500 bg-red-50 text-red-600"
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    ✓ Sí
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      cambiarCampo("tieneVencimiento", false)
                    }
                    disabled={guardando}
                    className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      !formulario.tieneVencimiento
                        ? "border-red-500 bg-red-50 text-red-600"
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    ○ No
                  </button>
                </div>
              </div>

              {/* BOTONES */}
              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={cerrarModal}
                  disabled={guardando}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  
                {guardando
                  ? "Guardando..."
                  : insumoEditando
                    ? "Guardar cambios"
                    : "Guardar insumo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}