"use client";

import Cobro from "./cobro";
import { useState, useEffect } from "react";
import PersonalizarProducto from "./personalizar-producto";
import Configuracion from "./configuracion";
import ModalProducto from "./modal-producto";
import GestionProductos from "./gestion-productos";
import { supabase } from "@/lib/supabase/client";
import { detalleItems } from "./Personalizacion";
import Dashboard from "./dashboard";
import Insumos from "./insumos";
import LotesInventario from "./LotesInventario";
import HistorialVentas from "./historial-ventas";

const IMG_DEFAULT =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80";

// Tipo de ventana de personalización según categoría
const TIPOS = {
  Hamburguesas: "hamburguesa",
  Salchipapas: "cremas",
  Alitas: "alitas",
  Bebidas: "bebida",
};

const NAV = [
  ["dashboard", "🏠", "Dashboard"],
  ["carta", "🍔", "Carta"],
  ["productos", "📦", "Productos"],
  ["insumos", "🧂", "Insumos"],
  ["lotes", "📦", "Lotes"],
  ["reportes", "📊", "Reportes"],
  ["configuracion", "⚙️", "Configuración"],
];

export default function Carta() {
  const [vistaActual, setVistaActual] = useState("dashboard");
  const [categoriaActiva, setCategoriaActiva] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [pedido, setPedido] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [tipoPersonalizacion, setTipoPersonalizacion] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  const [modalProducto, setModalProducto] = useState({ abierto: false, modo: "crear", producto: null });

  // ============================================
  // CARGA DE DATOS
  // ============================================

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [rc, rp] = await Promise.all([
        supabase.from("categorias").select("*").eq("activo", true).order("orden", { ascending: true }),
        supabase.from("productos").select("*").order("id", { ascending: true }),
      ]);
      if (rc.error) throw rc.error;
      if (rp.error) throw rp.error;

      setCategorias(rc.data);
      setCategoriaActiva((prev) =>
        rc.data.some((c) => c.nombre === prev) ? prev : rc.data[0]?.nombre || ""
      );
      setProductos(rp.data);
    } catch (err) {
      console.error("Error al cargar datos de Supabase:", err);
      alert("No se pudieron cargar los datos: " + (err.message || err));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const catActivaObj = categorias.find((c) => c.nombre === categoriaActiva);
  const productosActuales = productos.filter((p) => p.categoria_id === catActivaObj?.id);

  const handleProductoGuardado = (guardado, modo) => {
    if (!guardado) return cargarDatos();
    setProductos((prev) =>
      modo === "crear" ? [...prev, guardado] : prev.map((p) => (p.id === guardado.id ? guardado : p))
    );
  };

  // ============================================
  // CARRITO
  // ============================================

  // RN-20: no vender más que el stock disponible
  const puedeAgregar = (producto) => {
    if (!producto.controla_stock) return true;
    const enCarrito = pedido.filter((i) => i.id === producto.id).reduce((a, i) => a + i.cantidad, 0);
    if (enCarrito >= Number(producto.stock_actual)) {
      alert(`Solo hay ${Number(producto.stock_actual)} unidad(es) disponibles de "${producto.nombre}".`);
      return false;
    }
    return true;
  };

  const agregarDirectamente = (producto) => {
    if (!puedeAgregar(producto)) return;
    setPedido((actual) => {
      const existe = actual.find((i) => i.id === producto.id && !i.personalizacion);
      if (existe)
        return actual.map((i) =>
          i.id === producto.id && !i.personalizacion ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      return [
        ...actual,
        {
          ...producto,
          precio: Number(producto.precio_venta),
          categoria_nombre: categoriaActiva,
          cantidad: 1,
        },
      ];
    });
  };

  const seleccionarProducto = (producto) => {
    const tipo = TIPOS[categoriaActiva];
    if (producto.permite_personalizacion && tipo) {
      setProductoSeleccionado(producto);
      setTipoPersonalizacion(tipo);
      return;
    }
    agregarDirectamente(producto);
  };

  const guardarPersonalizacion = (p) => {
    if (!puedeAgregar(p)) return;
    setPedido((actual) => [
      ...actual,
      { ...p, precio: p.precioFinal, categoria_nombre: categoriaActiva, cantidad: 1 },
    ]);
    cerrarModal();
  };

  const cerrarModal = () => {
    setProductoSeleccionado(null);
    setTipoPersonalizacion(null);
  };

  const aumentarCantidad = (index) => {
    if (!puedeAgregar(pedido[index])) return;
    setPedido((actual) => actual.map((it, i) => (i === index ? { ...it, cantidad: it.cantidad + 1 } : it)));
  };

  const disminuirCantidad = (index) => {
    setPedido((actual) =>
      actual.map((it, i) => (i === index ? { ...it, cantidad: it.cantidad - 1 } : it)).filter((it) => it.cantidad > 0)
    );
  };

  const eliminarLinea = (index) => setPedido((actual) => actual.filter((_, i) => i !== index));

  const vaciarCarrito = () => {
    if (pedido.length > 0 && window.confirm("¿Vaciar todo el carrito?")) setPedido([]);
  };

  const total = pedido.reduce((acc, it) => acc + it.precio * it.cantidad, 0);

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
      <div className="min-h-screen bg-slate-100">
        <div className="flex min-h-screen flex-col lg:flex-row">
          {/* SIDEBAR */}
          <aside className="w-full shrink-0 bg-slate-900 text-white shadow-xl lg:w-64">
            <div className="flex items-center gap-3 border-b border-slate-700 px-6 py-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500 text-xl font-black shadow-lg">F</div>
              <div>
                <h1 className="text-xl font-bold">FastOrder</h1>
                <p className="text-xs text-slate-400">Sistema de pedidos</p>
              </div>
            </div>

            <nav className="p-4">
              <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-slate-500">Menú principal</p>
              <div className="space-y-2">
                {NAV.map(([id, icono, texto]) => {
                  const activo = vistaActual === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setVistaActual(id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-bold transition ${
                        activo ? "bg-red-500 text-white shadow-lg" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <span className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg ${activo ? "bg-white/15" : "bg-slate-800"}`}>
                        {icono}
                      </span>
                      <span>{texto}</span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </aside>

          <main className="min-w-0 flex-1">
  {vistaActual === "dashboard" ? (
    <Dashboard productos={productos} />
  ) : vistaActual === "configuracion" ? (
    <Configuracion />
  ) : vistaActual === "productos" ? (
    <GestionProductos
      categorias={categorias}
      productos={productos}
      cargando={cargando}
      onAbrirModalCrear={() =>
        setModalProducto({
          abierto: true,
          modo: "crear",
          producto: null,
        })
      }
      onAbrirModalEditar={(prod) =>
        setModalProducto({
          abierto: true,
          modo: "editar",
          producto: prod,
        })
      }
      onActualizarEstado={(id, activo) =>
        setProductos((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, activo } : p
          )
        )
      }
    />
    ) : vistaActual === "reportes" ? (
  <HistorialVentas />
    ) : vistaActual === "lotes" ? (
  <LotesInventario />
    ) : vistaActual === "insumos" ? (
    <Insumos />
  ) : (
              <div className="p-3 md:p-5 lg:p-6">
                <div className="mx-auto max-w-[1500px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  {/* ENCABEZADO */}
                  <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center md:px-7">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wider text-red-500">Menú</p>
                      <h1 className="mt-1 text-3xl font-black text-slate-800 md:text-4xl">
                        Carta
                      </h1>
                    </div>
                    <div className="rounded-xl bg-slate-100 px-4 py-3 text-right">
                      <p className="text-xs font-semibold uppercase text-slate-500">Pedido actual</p>
                      <p className="text-xl font-black text-slate-800">
                        {pedido.length} {pedido.length === 1 ? "producto" : "productos"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_390px]">
                    {/* CARTA */}
                    <div className="min-w-0 p-4 md:p-6">
                      <div className="mb-6">
                        <h2 className="mb-3 text-lg font-bold text-slate-800">Categorías</h2>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                          {categorias.map((cat) => {
                            const activa = categoriaActiva === cat.nombre;
                            return (
                              <button
                                key={cat.id}
                                onClick={() => setCategoriaActiva(cat.nombre)}
                                className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-3 text-sm font-bold transition-all md:text-base ${
                                  activa
                                    ? "bg-red-500 text-white shadow-md shadow-red-200"
                                    : "border border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                                }`}
                              >
                                {cat.icono && <span>{cat.icono}</span>}
                                <span>{cat.nombre}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mb-4 border-b border-slate-100 pb-3">
                        <h2 className="text-2xl font-black text-slate-800">{categoriaActiva}</h2>
                        <p className="mt-1 text-sm text-slate-500">
                          {cargando ? "Cargando..." : `${productosActuales.filter((p) => p.activo).length} productos disponibles`}
                        </p>
                      </div>

                      {cargando && productos.length === 0 ? (
                        <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
                          <p className="font-semibold text-slate-500">Cargando carta...</p>
                        </div>
                      ) : productosActuales.length === 0 ? (
                        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                          <span className="text-4xl">🍽️</span>
                          <p className="mt-2 text-base font-bold text-slate-700">No hay productos en esta categoría</p>
                          <p className="text-xs text-slate-400">Ve a la pestaña &ldquo;Productos&rdquo; para agregar productos.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                          {productosActuales.map((p) => {
                            const sinStock = p.controla_stock && Number(p.stock_actual) <= 0;
                            const disponible = p.activo && !sinStock;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                disabled={!disponible}
                                onClick={() => seleccionarProducto(p)}
                                className={`group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition-all duration-200 ${
                                  !disponible ? "cursor-not-allowed opacity-50" : "hover:-translate-y-1 hover:border-blue-400 hover:shadow-lg"
                                }`}
                              >
                                <div className="relative h-36 overflow-hidden bg-slate-100 md:h-40">
                                  <img
                                    src={p.imagen_url || IMG_DEFAULT}
                                    alt={p.nombre}
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                    onError={(e) => (e.currentTarget.src = IMG_DEFAULT)}
                                  />
                                  <div className="absolute right-2 top-2 rounded-full bg-white px-3 py-1 shadow-md">
                                    <span className="text-sm font-black text-blue-600">S/ {Number(p.precio_venta).toFixed(2)}</span>
                                  </div>
                                  {!disponible && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                      <span className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-bold text-white">
                                        {!p.activo ? "No disponible" : "Agotado"}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="p-3">
                                  <h2 className="line-clamp-1 text-base font-bold text-slate-800 md:text-lg">{p.nombre}</h2>
                                  <div className="mt-3 flex items-center justify-between">
                                    <span className="text-sm text-slate-400">
                                      {!disponible ? "No disponible" : p.permite_personalizacion ? "Pedir / Personalizar" : "Agregar"}
                                    </span>
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                                      +
                                    </span>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* PEDIDO */}
                    <div className="flex min-h-[500px] flex-col border-t border-slate-200 bg-slate-50 lg:border-l lg:border-t-0">
                      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-5">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Orden</p>
                          <h2 className="text-2xl font-black text-slate-800">Pedido Actual</h2>
                        </div>
                        {pedido.length > 0 && (
                          <button
                            type="button"
                            onClick={vaciarCarrito}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100"
                          >
                            Vaciar Carrito
                          </button>
                        )}
                      </div>

                      <div className="flex-1 overflow-y-auto px-5 py-3">
                        {pedido.length === 0 ? (
                          <div className="flex h-full min-h-[300px] items-center justify-center text-center">
                            <div>
                              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-2xl">🛒</div>
                              <p className="mt-4 text-lg font-bold text-slate-400">No hay productos</p>
                              <p className="mt-1 text-sm text-slate-400">Selecciona un producto para agregarlo</p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {pedido.map((item, index) => (
                              <div key={`${item.id}-${index}`} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <p className="font-bold text-slate-800">{item.nombre}</p>
                                    {detalleItems(item.personalizacion).map(([k, v]) => (
                                      <p key={k} className="mt-1 text-xs text-gray-500">
                                        {k}: {v}
                                      </p>
                                    ))}
                                    <p className="mt-2 text-sm font-semibold text-blue-600">S/ {item.precio.toFixed(2)} c/u</p>
                                  </div>
                                  <p className="font-black text-slate-800">S/ {(item.precio * item.cantidad).toFixed(2)}</p>
                                </div>

                                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                                  <button
                                    onClick={() => eliminarLinea(index)}
                                    title="Eliminar"
                                    className="text-lg text-slate-400 hover:text-red-600"
                                  >
                                    🗑️
                                  </button>
                                  <div className="flex items-center gap-2">
                                    <button onClick={() => disminuirCantidad(index)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 font-bold text-slate-700 hover:bg-slate-200">
                                      −
                                    </button>
                                    <span className="min-w-6 text-center font-bold">{item.cantidad}</span>
                                    <button onClick={() => aumentarCantidad(index)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 font-bold text-white hover:bg-blue-700">
                                      +
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="border-t border-slate-200 bg-white">
                        <div className="flex items-center justify-between px-5 py-5">
                          <span className="text-xl font-black text-slate-800">Total:</span>
                          <span className="text-2xl font-black text-blue-600">S/ {total.toFixed(2)}</span>
                        </div>
                        <div className="px-5 pb-5">
                          <button
                            disabled={pedido.length === 0 || total <= 0}
                            onClick={() => setMostrarModal(true)}
                            className="w-full rounded-xl bg-blue-600 px-6 py-4 text-lg font-black text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                          >
                            Cobrar
                          </button>
                        </div>

                        {mostrarModal && (
                          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                            <div className="relative w-full max-w-lg">
                              <Cobro
                                pedido={pedido}
                                total={total}
                                onPedidoExitoso={() => {
                                  setPedido([]);
                                  setMostrarModal(false);
                                  cargarDatos(); // refresca stock
                                }}
                              />
                              <button
                                onClick={() => setMostrarModal(false)}
                                className="absolute right-2 top-2 rounded-full bg-red-600 px-3 py-1 font-bold text-white shadow-lg hover:bg-red-700"
                              >
                                X
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {productoSeleccionado && tipoPersonalizacion && (
        <PersonalizarProducto
          producto={productoSeleccionado}
          tipo={tipoPersonalizacion}
          onGuardar={guardarPersonalizacion}
          onCancelar={cerrarModal}
        />
      )}

      <ModalProducto
        abierto={modalProducto.abierto}
        modo={modalProducto.modo}
        producto={modalProducto.producto}
        categorias={categorias}
        categoriaActivaId={catActivaObj?.id}
        onCerrar={() => setModalProducto((prev) => ({ ...prev, abierto: false }))}
        onGuardado={handleProductoGuardado}
      />
    </>
  );
}