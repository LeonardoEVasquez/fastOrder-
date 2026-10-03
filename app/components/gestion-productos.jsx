"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function GestionProductos({
  categorias = [],
  productos = [],
  cargando = false,
  onAbrirModalCrear,
  onAbrirModalEditar,
  onEliminarProducto,
  onActualizarDisponibilidad,
}) {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todas");
  const [busqueda, setBusqueda] = useState("");

  // Filtrar productos por categoría y por término de búsqueda
  const productosFiltrados = productos.filter((prod) => {
    // Filtro por categoría
    if (categoriaSeleccionada !== "Todas") {
      const catObj = categorias.find((c) => c.nombre === categoriaSeleccionada);
      if (catObj && prod.categoria_id !== catObj.id) {
        return false;
      }
    }
    // Filtro por búsqueda
    if (busqueda.trim()) {
      return prod.nombre.toLowerCase().includes(busqueda.toLowerCase().trim());
    }
    return true;
  });

  const toggleDisponibilidad = async (e, producto) => {
    e.stopPropagation();
    const nuevoEstado = producto.disponible === false;
    try {
      const { error } = await supabase
        .from("productos")
        .update({ disponible: nuevoEstado })
        .eq("id", producto.id);

      if (error) throw error;
      if (onActualizarDisponibilidad) {
        onActualizarDisponibilidad(producto.id, nuevoEstado);
      }
    } catch (err) {
      alert("Error al cambiar disponibilidad: " + (err.message || err));
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        {/* ==================================================
            CABECERA PRINCIPAL
        ================================================== */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-xl font-bold text-red-600">
                📦
              </span>
              <h1 className="text-2xl font-black text-slate-800 md:text-3xl">
                Gestión de Productos
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Administra, agrega, edita o elimina los productos que se muestran en la Carta.
            </p>
          </div>

          <button
            type="button"
            onClick={onAbrirModalCrear}
            className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-200 transition hover:bg-red-700 hover:shadow-xl"
          >
            <span className="text-lg">➕</span>
            <span>Nuevo Producto</span>
          </button>
        </div>

        {/* ==================================================
            BARRA DE FILTROS Y BÚSQUEDA
        ================================================== */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs md:flex-row md:items-center md:justify-between">
          {/* BUSCADOR */}
          <div className="relative w-full md:w-80">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              🔍
            </span>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar producto por nombre..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* CATEGORÍAS */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCategoriaSeleccionada("Todas")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition md:text-sm ${
                categoriaSeleccionada === "Todas"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              🌟 Todas ({productos.length})
            </button>

            {categorias.map((cat) => {
              const nombreCat = typeof cat === "string" ? cat : cat.nombre;
              const iconoCat = typeof cat === "string" ? "" : cat.icono;
              const count = productos.filter((p) => p.categoria_id === cat.id).length;
              const activo = categoriaSeleccionada === nombreCat;

              return (
                <button
                  key={cat.id || nombreCat}
                  type="button"
                  onClick={() => setCategoriaSeleccionada(nombreCat)}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition md:text-sm ${
                    activo
                      ? "bg-red-500 text-white shadow-sm shadow-red-200"
                      : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {iconoCat && <span>{iconoCat}</span>}
                  <span>{nombreCat}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                      activo ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ==================================================
            GRID DE PRODUCTOS CRUD
        ================================================== */}
        {cargando && productos.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-red-600 border-t-transparent"></div>
            <p className="mt-3 text-sm font-semibold text-slate-500">
              Cargando productos de Supabase...
            </p>
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <span className="text-5xl">🍽️</span>
            <p className="mt-3 text-lg font-bold text-slate-700">
              No se encontraron productos
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {busqueda
                ? `No hay coincidencias para "${busqueda}".`
                : "No hay productos registrados en esta categoría."}
            </p>
            <button
              type="button"
              onClick={onAbrirModalCrear}
              className="mt-4 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
            >
              ➕ Crear Producto Ahora
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {productosFiltrados.map((producto) => {
              const catObj = categorias.find((c) => c.id === producto.categoria_id);
              const estaDisponible = producto.disponible !== false;

              return (
                <div
                  key={producto.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition hover:shadow-md"
                >
                  {/* IMAGEN Y BADGES */}
                  <div className="relative h-44 w-full bg-slate-100">
                    <img
                      src={producto.imagen}
                      alt={producto.nombre}
                      className={`h-full w-full object-cover transition duration-200 ${
                        !estaDisponible ? "grayscale opacity-60" : ""
                      }`}
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80";
                      }}
                    />

                    {/* BADGE CATEGORÍA */}
                    <div className="absolute left-2.5 top-2.5 rounded-lg bg-black/60 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-xs">
                      {catObj?.icono} {catObj?.nombre || "General"}
                    </div>

                    {/* BADGE DISPONIBILIDAD (INTERACTIVO) */}
                    <button
                      type="button"
                      title="Haz clic para alternar disponibilidad"
                      onClick={(e) => toggleDisponibilidad(e, producto)}
                      className={`absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold shadow-sm transition ${
                        estaDisponible
                          ? "bg-emerald-500 text-white hover:bg-emerald-600"
                          : "bg-rose-500 text-white hover:bg-rose-600"
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
                      <span>{estaDisponible ? "Disponible" : "Agotado"}</span>
                    </button>
                  </div>

                  {/* CONTENIDO / DETALLES */}
                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-bold text-slate-800 line-clamp-1">
                          {producto.nombre}
                        </h3>
                        <span className="text-xs font-semibold text-slate-400">
                          #{producto.id}
                        </span>
                      </div>

                      <p className="mt-2 text-xl font-black text-slate-900">
                        S/ {Number(producto.precio).toFixed(2)}
                      </p>
                    </div>

                    {/* BOTONES ACCIONES CRUD */}
                    <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={() => onAbrirModalEditar(producto)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <span>✏️</span>
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => onEliminarProducto(e, producto)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                        title="Eliminar producto"
                      >
                        🗑️
                      </button>
                    </div>
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
