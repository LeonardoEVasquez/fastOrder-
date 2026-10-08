"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import RecetaProducto from "./RecetaProducto";

const IMG_DEFAULT =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80";

export default function GestionProductos({
  categorias = [],
  productos = [],
  cargando = false,
  onAbrirModalCrear,
  onAbrirModalEditar,
  onActualizarEstado,
}) {
  const [categoriaSel, setCategoriaSel] = useState("Todas");
  const [busqueda, setBusqueda] = useState("");
  const [productoReceta, setProductoReceta] = useState(null);

  const [vencimientos, setVencimientos] = useState({});

  const filtrados = productos.filter((p) => {
    if (categoriaSel !== "Todas") {
      const cat = categorias.find((c) => c.nombre === categoriaSel);
      if (cat && p.categoria_id !== cat.id) return false;
    }
    if (busqueda.trim())
      return p.nombre.toLowerCase().includes(busqueda.toLowerCase().trim());
    return true;
  });

  // RF-01-03: desactivación lógica (nunca se borra físicamente)
  const toggleActivo = async (producto) => {
    const nuevo = !producto.activo;
    const { error } = await supabase
      .from("productos")
      .update({ activo: nuevo })
      .eq("id", producto.id);
    if (error) {
      alert(
        error.code === "23505"
          ? "No se puede activar: ya existe otro producto activo con ese nombre."
          : "Error al cambiar estado: " + error.message
      );
      return;
    }
    onActualizarEstado?.(producto.id, nuevo);
  };

  


const cargarVencimientos = async () => {
  const productosPerecibles = productos.filter(
    (p) => p.perecible === true
  );

  if (productosPerecibles.length === 0) {
    setVencimientos({});
    return;
  }

  const ids = productosPerecibles.map((p) => p.id);

  const { data, error } = await supabase
    .from("lotes_inventario")
    .select("producto_id, fecha_vencimiento, cantidad_actual")
    .in("producto_id", ids)
    .gt("cantidad_actual", 0)
    .order("fecha_vencimiento", { ascending: true });

  if (error) {
    console.error("Error al cargar vencimientos:", error);
    return;
  }

  const mapa = {};

  (data || []).forEach((lote) => {
    if (!mapa[lote.producto_id]) {
      mapa[lote.producto_id] = lote.fecha_vencimiento;
    }
  });

  setVencimientos(mapa);
};

const mostrarVencimiento = (fecha) => {
  if (!fecha) return null;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const vencimiento = new Date(`${fecha}T00:00:00`);
  vencimiento.setHours(0, 0, 0, 0);

  const diferencia = Math.ceil(
    (vencimiento - hoy) / (1000 * 60 * 60 * 24)
  );

  if (diferencia < 0) {
    return {
      texto: "VENCIDO",
      clase: "text-red-600",
    };
  }

  if (diferencia <= 3) {
    return {
      texto: `Vence en ${diferencia} ${diferencia === 1 ? "día" : "días"}`,
      clase: "text-red-600",
    };
  }

  const [anio, mes, dia] = fecha.split("-");

  return {
    texto: `Vence: ${dia}/${mes}/${anio}`,
    clase: "text-red-600",
  };
};

useEffect(() => {
  cargarVencimientos();
}, [productos]);

  if (productoReceta) {
  return (
    <RecetaProducto
      producto={productoReceta}
      onVolver={() => setProductoReceta(null)}
    />
  );
}


  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        {/* CABECERA */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-xl">📦</span>
              <h1 className="text-2xl font-black text-slate-800 md:text-3xl">Gestión de Productos</h1>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Registra, edita y activa o desactiva los productos de la Carta.
            </p>
          </div>
          <button
            type="button"
            onClick={onAbrirModalCrear}
            className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-200 transition hover:bg-red-700"
          >
            <span className="text-lg">➕</span>
            <span>Nuevo Producto</span>
          </button>
        </div>

        {/* FILTROS */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:w-80">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar producto por nombre..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-black outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[{ id: "todas", nombre: "Todas", icono: "🌟" }, ...categorias].map((cat) => {
              const activo = categoriaSel === cat.nombre;
              const count =
                cat.nombre === "Todas"
                  ? productos.length
                  : productos.filter((p) => p.categoria_id === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoriaSel(cat.nombre)}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition md:text-sm ${
                    activo
                      ? "bg-red-500 text-white shadow-sm shadow-red-200"
                      : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {cat.icono && <span>{cat.icono}</span>}
                  <span>{cat.nombre}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${activo ? "bg-white/20" : "bg-slate-200 text-slate-700"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* GRID */}
        {cargando && productos.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
            <p className="text-sm font-semibold text-slate-500">Cargando productos...</p>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <span className="text-5xl">🍽️</span>
            <p className="mt-3 text-lg font-bold text-slate-700">No se encontraron productos</p>
            <button
              type="button"
              onClick={onAbrirModalCrear}
              className="mt-4 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700"
            >
              ➕ Crear Producto Ahora
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtrados.map((p) => {
              const cat = categorias.find((c) => c.id === p.categoria_id);
              const stockBajo = p.controla_stock && Number(p.stock_actual) <= Number(p.stock_minimo);
              const vencimiento = p.perecible
              ? mostrarVencimiento(vencimientos[p.id])
              : null;
              return (
                <div key={p.id} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition hover:shadow-md">
                  <div className="relative h-44 w-full bg-slate-100">
                    <img
                      src={p.imagen_url || IMG_DEFAULT}
                      alt={p.nombre}
                      className={`h-full w-full object-cover ${!p.activo ? "opacity-60 grayscale" : ""}`}
                      onError={(e) => (e.currentTarget.src = IMG_DEFAULT)}
                    />
                    <div className="absolute left-2.5 top-2.5 rounded-lg bg-black/60 px-2.5 py-1 text-xs font-bold text-white">
                      {cat?.icono} {cat?.nombre || "General"}
                    </div>
                    <span
                      className={`absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold text-white shadow-sm ${
                        p.activo ? "bg-emerald-500" : "bg-rose-500"
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      {p.activo ? "Disponible" : "No disponible"}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="line-clamp-1 text-base font-bold text-slate-800">{p.nombre}</h3>
                        {vencimiento && (
                          <p className={`mt-1 text-xs font-bold ${vencimiento.clase}`}>
                            ⚠️ {vencimiento.texto}
                          </p>
                        )}
                        <span className="text-xs font-semibold text-slate-400">#{p.id}</span>
                      </div>
                      <p className="mt-2 text-xl font-black text-slate-900">S/ {Number(p.precio_venta).toFixed(2)}</p>
                      {p.controla_stock && (
                        <p className={`mt-1 text-xs font-bold ${stockBajo ? "text-rose-600" : "text-slate-500"}`}>
                          Stock: {Number(p.stock_actual)}
                          {Number(p.stock_actual) <= 0 ? " (Agotado)" : stockBajo ? " (Stock bajo)" : ""}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={() => onAbrirModalEditar(p)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                      >
                        ✏️ Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => setProductoReceta(p)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
                      >
                        📋 Receta
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleActivo(p)}
                        className={`flex-1 rounded-xl border py-2.5 text-xs font-bold transition ${
                          p.activo
                            ? "border-slate-200 bg-slate-50 text-slate-600 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        {p.activo ? "Desactivar" : "Activar"}
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