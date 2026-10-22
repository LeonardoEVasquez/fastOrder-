/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

const inputCls =
  "w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100";
const labelCls = "mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600";

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
  const [activo, setActivo] = useState(true);
  const [permitePers, setPermitePers] = useState(true);
  const [controlaStock, setControlaStock] = useState(false);
  const [stockActual, setStockActual] = useState("0");
  const [stockMinimo, setStockMinimo] = useState("0");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (modo === "editar" && producto) {
      setNombre(producto.nombre || "");
      setCategoriaId(producto.categoria_id || "");
      setPrecio(producto.precio_venta != null ? String(producto.precio_venta) : "");
      setImagen(producto.imagen_url || "");
      setActivo(producto.activo !== false);
      setPermitePers(producto.permite_personalizacion !== false);
      setControlaStock(!!producto.controla_stock);
      setStockActual(String(producto.stock_actual ?? 0));
      setStockMinimo(String(producto.stock_minimo ?? 0));
    } else {
      setNombre("");
      setCategoriaId(categoriaActivaId || (categorias.length > 0 ? categorias[0].id : ""));
      setPrecio("");
      setImagen("");
      setActivo(true);
      setPermitePers(true);
      setControlaStock(false);
      setStockActual("0");
      setStockMinimo("0");
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

    const precioNum = parseFloat(String(precio).trim().replace(",", "."));
    if (isNaN(precioNum) || precioNum <= 0) {
      setError("El precio debe ser un número válido mayor a 0 (ej. 24.60).");
      return;
    }

    if (!categoriaId) {
      setError("Debes seleccionar una categoría.");
      return;
    }

    const minNum = parseFloat(String(stockMinimo).replace(",", ".")) || 0;
    const actNum = parseFloat(String(stockActual).replace(",", ".")) || 0;
    if (controlaStock && (minNum < 0 || actNum < 0)) {
      setError("El stock no puede ser negativo.");
      return;
    }

    setGuardando(true);

    try {
      const payload = {
        nombre: nombre.trim(),
        categoria_id: parseInt(categoriaId, 10),
        precio_venta: precioNum,
        imagen_url: imagen.trim() || null,
        activo,
        permite_personalizacion: permitePers,
        controla_stock: controlaStock,
        stock_minimo: controlaStock ? minNum : 0,
      };

      if (modo === "crear") {
        // Stock inicial solo al crear (luego se ajusta con ajustar_inventario, RN-19)
        payload.stock_actual = controlaStock ? actNum : 0;
        const { data, error: errInsert } = await supabase.from("productos").insert([payload]).select();
        if (errInsert) throw errInsert;
        onGuardado?.(data?.[0], "crear");
      } else {
        const { data, error: errUpdate } = await supabase
          .from("productos")
          .update(payload)
          .eq("id", producto.id)
          .select();
        if (errUpdate) throw errUpdate;
        onGuardado?.(data?.[0], "editar");
      }

      onCerrar();
    } catch (err) {
      console.error("Error al guardar producto:", err);
      setError(
        err?.code === "23505"
          ? "Ya existe un producto activo con ese nombre."
          : err?.message || "Ocurrió un error al guardar el producto."
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative max-h-[95vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
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
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">⚠️ {error}</div>
          )}

          {/* NOMBRE */}
          <div>
            <label className={labelCls}>Nombre del Producto *</label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Doble Cheeseburger Suprema"
              className={inputCls}
            />
          </div>

          {/* CATEGORÍA Y PRECIO */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Categoría *</label>
              <select
                required
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className={`${inputCls} bg-white`}
              >
                <option value="">Selecciona categoría</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icono ? `${cat.icono} ` : ""}
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Precio (S/) *</label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="Ej. 15.00"
                className={`${inputCls} font-semibold`}
              />
            </div>
          </div>

          {/* URL IMAGEN */}
          <div>
            <label className={labelCls}>URL de Imagen (Web o /Image/...)</label>
            <input
              type="text"
              value={imagen}
              onChange={(e) => setImagen(e.target.value)}
              placeholder="https://... o /Image/nombre.jpg"
              className={inputCls}
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

          {/* CONTROL DE STOCK */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="controla_stock"
                checked={controlaStock}
                onChange={(e) => setControlaStock(e.target.checked)}
                className="h-4 w-4 rounded text-red-600 focus:ring-red-500"
              />
              <label htmlFor="controla_stock" className="cursor-pointer text-sm font-medium text-slate-700">
                Controlar stock (bebidas embotelladas, postres, etc.)
              </label>
            </div>

            {controlaStock && (
              <div className="mt-3 grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Stock actual</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={stockActual}
                    onChange={(e) => setStockActual(e.target.value)}
                    disabled={modo === "editar"}
                    className={`${inputCls} bg-white disabled:bg-slate-100 disabled:text-slate-400`}
                  />
                  {modo === "editar" && (
                    <p className="mt-1 text-[11px] text-slate-400">Se ajusta desde Inventario (con justificación).</p>
                  )}
                </div>
                <div>
                  <label className={labelCls}>Stock mínimo</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={stockMinimo}
                    onChange={(e) => setStockMinimo(e.target.value)}
                    className={`${inputCls} bg-white`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* OPCIONES */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="permite_personalizacion"
                checked={permitePers}
                onChange={(e) => setPermitePers(e.target.checked)}
                className="h-4 w-4 rounded text-red-600 focus:ring-red-500"
              />
              <label htmlFor="permite_personalizacion" className="cursor-pointer text-sm font-medium text-slate-700">
                Permite personalización al pedir
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="activo"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                className="h-4 w-4 rounded text-red-600 focus:ring-red-500"
              />
              <label htmlFor="activo" className="cursor-pointer text-sm font-medium text-slate-700">
                Producto disponible para venta en la carta
              </label>
            </div>
          </div>

          {/* BOTONES */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onCerrar}
              disabled={guardando}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-red-200 transition hover:bg-red-700 disabled:opacity-50"
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
