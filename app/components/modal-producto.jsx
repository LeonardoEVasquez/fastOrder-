/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

export default function ModalProducto({
  abierto,
  modo = "crear", // "crear" | "editar"
  producto = null,
  categorias = [],
  categoriaActivaId = null,
  onCerrar,
  onGuardado,
}) {
  const [nombre, setNombre] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [precio, setPrecio] = useState("");
  const [imagen, setImagen] = useState("");
  const [disponible, setDisponible] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (modo === "editar" && producto) {
      setNombre(producto.nombre || "");
      setCategoriaId(producto.categoria_id || "");
      setPrecio(producto.precio ? String(producto.precio) : "");
      setImagen(producto.imagen || "");
      setDisponible(producto.disponible !== false);
    } else {
      setNombre("");
      setCategoriaId(categoriaActivaId || (categorias.length > 0 ? categorias[0].id : ""));
      setPrecio("");
      setImagen("");
      setDisponible(true);
    }
    setError(null);
  }, [modo, producto, categoriaActivaId, categorias, abierto]);

  if (!abierto) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim()) {
      setError("El nombre del producto es obligatorio.");
      return;
    }

    const precioLimpio = String(precio).trim().replace(",", ".");
    const precioNum = parseFloat(precioLimpio);
    if (isNaN(precioNum) || precioNum <= 0) {
      setError("El precio debe ser un número válido mayor a 0 (ej. 24.60).");
      return;
    }

    if (!categoriaId) {
      setError("Debes seleccionar una categoría.");
      return;
    }

    setGuardando(true);

    try {
      const payload = {
        nombre: nombre.trim(),
        categoria_id: parseInt(categoriaId, 10),
        precio: precioNum,
        imagen: imagen.trim() || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
        disponible: disponible,
      };

      if (modo === "crear") {
        const { data, error: errInsert } = await supabase
          .from("productos")
          .insert([payload])
          .select();

        if (errInsert) throw errInsert;
        if (onGuardado) onGuardado(data?.[0], "crear");
      } else {
        const { data, error: errUpdate } = await supabase
          .from("productos")
          .update(payload)
          .eq("id", producto.id)
          .select();

        if (errUpdate) throw errUpdate;
        if (onGuardado) onGuardado(data?.[0], "editar");
      }

      onCerrar();
    } catch (err) {
      console.error("Error al guardar producto:", err);
      setError(err.message || "Ocurrió un error al guardar el producto.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* CABECERA */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-xl font-bold text-red-600">
              {modo === "crear" ? "➕" : "✏️"}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {modo === "crear" ? "Agregar Nuevo Producto" : "Editar Producto"}
              </h2>
              <p className="text-xs text-slate-500">
                {modo === "crear"
                  ? "Ingresa los datos para registrar el producto en la carta."
                  : `Modificando: ${producto?.nombre || ""}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              ⚠️ {error}
            </div>
          )}

          {/* NOMBRE */}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
              Nombre del Producto *
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Doble Cheeseburger Suprema"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
            />
          </div>

          {/* CATEGORÍA Y PRECIO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                Categoría *
              </label>
              <select
                required
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
              >
                <option value="">Selecciona categoría</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icono ? `${cat.icono} ` : ""}{cat.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                Precio (S/) *
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="Ej. 15.00"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
              />
            </div>
          </div>

          {/* URL IMAGEN */}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
              URL de Imagen (Web o /Image/...)
            </label>
            <input
              type="text"
              value={imagen}
              onChange={(e) => setImagen(e.target.value)}
              placeholder="https://... o /Image/nombre.jpg"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
            />
            {imagen && (
              <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2">
                <img
                  src={imagen}
                  alt="Vista previa"
                  className="h-12 w-12 rounded-lg object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80";
                  }}
                />
                <span className="text-xs text-slate-500">Vista previa de imagen</span>
              </div>
            )}
          </div>

          {/* DISPONIBILIDAD */}
          <div className="flex items-center gap-3 pt-1">
            <input
              type="checkbox"
              id="disponible"
              checked={disponible}
              onChange={(e) => setDisponible(e.target.checked)}
              className="h-4 w-4 rounded text-red-600 focus:ring-red-500"
            />
            <label htmlFor="disponible" className="text-sm font-medium text-slate-700 cursor-pointer">
              Producto disponible para venta en la carta
            </label>
          </div>

          {/* BOTONES */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onCerrar}
              disabled={guardando}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-red-200 hover:bg-red-700 transition disabled:opacity-50"
            >
              {guardando ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Guardando...
                </>
              ) : modo === "crear" ? (
                "Guardar Producto"
              ) : (
                "Actualizar Cambios"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
