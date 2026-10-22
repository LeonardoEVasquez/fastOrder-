"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

function fechaLocal() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function calcularEstado(fechaVencimiento) {
  const hoy = new Date(`${fechaLocal()}T12:00:00`);
  const vencimiento = new Date(`${fechaVencimiento}T12:00:00`);

  const dias = Math.round(
    (vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (dias < 0) {
    return { texto: "Vencido", color: "bg-red-100 text-red-700" };
  }

  if (dias <= 3) {
    return { texto: "Por vencer", color: "bg-amber-100 text-amber-700" };
  }

  return { texto: "Vigente", color: "bg-emerald-100 text-emerald-700" };
}

function mostrarFecha(fecha) {
  if (!fecha) return "—";

  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

function formatoCantidad(cantidad) {
  return Number(cantidad).toLocaleString("es-PE", {
    maximumFractionDigits: 3,
  });
}

const FORMULARIO_INICIAL = {
  tipo: "producto",
  entidadId: "",
  codigoLote: "",
  cantidad: "",
  fechaIngreso: fechaLocal(),
  fechaVencimiento: "",
};

export default function LotesInventario() {
  const [productos, setProductos] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [lotes, setLotes] = useState([]);

  const [filtro, setFiltro] = useState("todos");
  const [busqueda, setBusqueda] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setCargando(true);

    const [
      { data: productosData, error: productosError },
      { data: insumosData, error: insumosError },
      { data: lotesData, error: lotesError },
    ] = await Promise.all([
      supabase
        .from("productos")
        .select("*")
        .order("nombre", { ascending: true }),

      supabase
        .from("insumos")
        .select("*")
        .order("nombre", { ascending: true }),

      supabase
        .from("lotes_inventario")
        .select("*")
        .order("fecha_vencimiento", { ascending: true }),
    ]);

    if (productosError || insumosError || lotesError) {
      const error =
        productosError || insumosError || lotesError;

      alert("Error al cargar los lotes: " + error.message);
      setCargando(false);
      return;
    }

    setProductos(productosData || []);
    setInsumos(insumosData || []);

    const productosLista = productosData || [];
    const insumosLista = insumosData || [];

    const lotesConNombre = (lotesData || []).map((lote) => {
      const producto = productosLista.find(
        (p) => p.id === lote.producto_id
      );

      const insumo = insumosLista.find(
        (i) => i.id === lote.insumo_id
      );

      return {
        ...lote,
        nombreEntidad:
          producto?.nombre || insumo?.nombre || "Registro no encontrado",
        tipoEntidad: lote.producto_id
          ? "producto"
          : lote.insumo_id
            ? "insumo"
            : "desconocido",
        unidad: insumo?.unidad_medida || "unidad",
      };
    });

    setLotes(lotesConNombre);
    setCargando(false);
  }

  function cambiarCampo(campo, valor) {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  function abrirModal() {
    setFormulario({
      ...FORMULARIO_INICIAL,
      fechaIngreso: fechaLocal(),
    });

    setModalAbierto(true);
  }

  function cerrarModal() {
    if (guardando) return;

    setModalAbierto(false);
  }

  async function guardarLote(e) {
    e.preventDefault();

    const {
      tipo,
      entidadId,
      codigoLote,
      cantidad,
      fechaIngreso,
      fechaVencimiento,
    } = formulario;

    if (!entidadId) {
      alert("Selecciona un producto o insumo.");
      return;
    }

    if (!cantidad || Number(cantidad) <= 0) {
      alert("La cantidad debe ser mayor a cero.");
      return;
    }

    if (!fechaIngreso || !fechaVencimiento) {
      alert("Completa las fechas de ingreso y vencimiento.");
      return;
    }

    if (fechaVencimiento < fechaIngreso) {
      alert("La fecha de vencimiento no puede ser anterior al ingreso.");
      return;
    }

    const nuevoLote = {
      producto_id: tipo === "producto" ? Number(entidadId) : null,
      insumo_id: tipo === "insumo" ? Number(entidadId) : null,
      codigo_lote: codigoLote.trim() || null,
      cantidad_inicial: Number(cantidad),
      cantidad_actual: Number(cantidad),
      fecha_ingreso: fechaIngreso,
      fecha_vencimiento: fechaVencimiento,
    };

    setGuardando(true);

    const { error } = await supabase
      .from("lotes_inventario")
      .insert(nuevoLote);

    if (error) {
      alert("No se pudo registrar el lote: " + error.message);
      setGuardando(false);
      return;
    }

    setModalAbierto(false);
    setFormulario(FORMULARIO_INICIAL);
    await cargarDatos();

    setGuardando(false);
    alert("Lote registrado correctamente.");
  }

  const lotesFiltrados = lotes.filter((lote) => {
    const estado = calcularEstado(lote.fecha_vencimiento);

    if (filtro === "productos" && lote.tipoEntidad !== "producto") {
      return false;
    }

    if (filtro === "insumos" && lote.tipoEntidad !== "insumo") {
      return false;
    }

    if (filtro === "vigentes" && estado.texto !== "Vigente") {
      return false;
    }

    if (filtro === "por-vencer" && estado.texto !== "Por vencer") {
      return false;
    }

    if (filtro === "vencidos" && estado.texto !== "Vencido") {
      return false;
    }

    const texto = busqueda.trim().toLowerCase();

    if (texto) {
      const coincide =
        lote.nombreEntidad.toLowerCase().includes(texto) ||
        (lote.codigo_lote || "").toLowerCase().includes(texto);

      if (!coincide) return false;
    }

    return true;
  });

  const conteo = {
    todos: lotes.length,
    productos: lotes.filter((l) => l.tipoEntidad === "producto").length,
    insumos: lotes.filter((l) => l.tipoEntidad === "insumo").length,
    vigentes: lotes.filter(
      (l) => calcularEstado(l.fecha_vencimiento).texto === "Vigente"
    ).length,
    porVencer: lotes.filter(
      (l) => calcularEstado(l.fecha_vencimiento).texto === "Por vencer"
    ).length,
    vencidos: lotes.filter(
      (l) => calcularEstado(l.fecha_vencimiento).texto === "Vencido"
    ).length,
  };

  const opcionesEntidad =
    formulario.tipo === "producto" ? productos : insumos;

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px] space-y-6">

        {/* CABECERA */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-xl">
                📦
              </span>

              <div>
                <h1 className="text-2xl font-black text-slate-800 md:text-3xl">
                  Lotes de inventario
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Controla las cantidades y fechas de vencimiento.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={abrirModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-200 transition hover:bg-red-700"
          >
            <span>➕</span>
            Nuevo lote
          </button>
        </div>

        {/* RESUMEN */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold text-slate-500">
              Total de lotes
            </p>
            <p className="mt-2 text-3xl font-black text-slate-800">
              {conteo.todos}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-semibold text-emerald-700">
              Vigentes
            </p>
            <p className="mt-2 text-3xl font-black text-emerald-800">
              {conteo.vigentes}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm font-semibold text-amber-700">
              Por vencer
            </p>
            <p className="mt-2 text-3xl font-black text-amber-800">
              {conteo.porVencer}
            </p>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm font-semibold text-red-700">
              Vencidos
            </p>
            <p className="mt-2 text-3xl font-black text-red-800">
              {conteo.vencidos}
            </p>
          </div>
        </div>

        {/* FILTROS */}
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por producto, insumo o código de lote..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-black outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
          />

          <div className="flex flex-wrap gap-2">
            {[
              ["todos", "Todos"],
              ["productos", "Productos"],
              ["insumos", "Insumos"],
              ["vigentes", "Vigentes"],
              ["por-vencer", "Por vencer"],
              ["vencidos", "Vencidos"],
            ].map(([valor, etiqueta]) => (
              <button
                key={valor}
                type="button"
                onClick={() => setFiltro(valor)}
                className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                  filtro === valor
                    ? "bg-red-600 text-white"
                    : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {etiqueta}
              </button>
            ))}
          </div>
        </div>

        {/* TABLA */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-lg font-black text-slate-800">
              Lotes registrados
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {lotesFiltrados.length} resultado(s)
            </p>
          </div>

          {cargando ? (
            <div className="flex h-48 items-center justify-center">
              <p className="text-sm font-semibold text-slate-500">
                Cargando lotes...
              </p>
            </div>
          ) : lotesFiltrados.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <span className="text-5xl">📦</span>
              <p className="mt-3 text-lg font-bold text-slate-700">
                No hay lotes para mostrar
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Registra un lote o cambia los filtros.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-slate-50">
                  <tr className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    <th className="px-6 py-4">Producto / Insumo</th>
                    <th className="px-6 py-4">Lote</th>
                    <th className="px-6 py-4">Ingreso</th>
                    <th className="px-6 py-4">Vencimiento</th>
                    <th className="px-6 py-4">Cantidad</th>
                    <th className="px-6 py-4">Estado</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {lotesFiltrados.map((lote) => {
                    const estado = calcularEstado(
                      lote.fecha_vencimiento
                    );

                    return (
                      <tr
                        key={lote.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800">
                            {lote.nombreEntidad}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {lote.tipoEntidad === "producto"
                              ? "Producto"
                              : "Insumo"}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                          {lote.codigo_lote || `Lote #${lote.id}`}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {mostrarFecha(lote.fecha_ingreso)}
                        </td>

                        <td
                          className={`px-6 py-4 text-sm font-bold ${
                            estado.texto === "Vencido"
                              ? "text-red-600"
                              : estado.texto === "Por vencer"
                                ? "text-amber-600"
                                : "text-slate-600"
                          }`}
                        >
                          {mostrarFecha(lote.fecha_vencimiento)}
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800">
                            {formatoCantidad(lote.cantidad_actual)}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Inicial: {formatoCantidad(lote.cantidad_inicial)}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1.5 text-xs font-extrabold ${estado.color}`}
                          >
                            {estado.texto}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL NUEVO LOTE */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="my-auto w-full max-w-xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-black text-slate-800">
                  Registrar lote
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Registra la cantidad y su fecha de vencimiento.
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarModal}
                disabled={guardando}
                className="rounded-lg px-3 py-2 text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={guardarLote} className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Tipo de registro
                </label>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["producto", "🍔 Producto"],
                    ["insumo", "🧂 Insumo"],
                  ].map(([valor, etiqueta]) => (
                    <button
                      key={valor}
                      type="button"
                      onClick={() => {
                        cambiarCampo("tipo", valor);
                        cambiarCampo("entidadId", "");
                      }}
                      className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                        formulario.tipo === valor
                          ? "border-red-500 bg-red-50 text-red-700"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    >
                      {etiqueta}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  {formulario.tipo === "producto"
                    ? "Producto"
                    : "Insumo"}
                </label>

                <select
                  required
                  value={formulario.entidadId}
                  onChange={(e) =>
                    cambiarCampo("entidadId", e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-black outline-none focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
                >
                  <option value="">
                    Seleccionar {formulario.tipo}...
                  </option>

                  {opcionesEntidad.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre}
                      {formulario.tipo === "insumo" && item.unidad_medida
                        ? ` (${item.unidad_medida})`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Código de lote
                </label>

                <input
                  type="text"
                  value={formulario.codigoLote}
                  onChange={(e) =>
                    cambiarCampo("codigoLote", e.target.value)
                  }
                  placeholder="Ej. LT001"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-black outline-none focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
                />

                <p className="mt-1 text-xs text-slate-400">
                  Opcional. Puedes usar el código del proveedor.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Cantidad ingresada
                </label>

                <input
                  type="number"
                  required
                  min="0.001"
                  step="0.001"
                  value={formulario.cantidad}
                  onChange={(e) =>
                    cambiarCampo("cantidad", e.target.value)
                  }
                  placeholder="Ej. 5"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-black outline-none focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Fecha de ingreso
                  </label>

                  <input
                    type="date"
                    required
                    value={formulario.fechaIngreso}
                    onChange={(e) =>
                      cambiarCampo("fechaIngreso", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-black outline-none focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Fecha de vencimiento
                  </label>

                  <input
                    type="date"
                    required
                    min={formulario.fechaIngreso}
                    value={formulario.fechaVencimiento}
                    onChange={(e) =>
                      cambiarCampo("fechaVencimiento", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-black outline-none focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={cerrarModal}
                  disabled={guardando}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {guardando ? "Guardando..." : "Guardar lote"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}