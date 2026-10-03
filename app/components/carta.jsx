"use client";

import Cobro from "./cobro";
import { useState, useEffect } from "react";
import PersonalizarProducto from "./personalizar-producto";
import Configuracion from "./configuracion";
import ModalProducto from "./modal-producto";
import GestionProductos from "./gestion-productos";
import { supabase } from "@/lib/supabase/client";

export default function Carta() {
  // ============================================
  // ESTADOS Y NAVEGACIÓN
  // ============================================

  const [vistaActual, setVistaActual] = useState("carta");
  const [categoriaActiva, setCategoriaActiva] = useState("Hamburguesas");
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [pedido, setPedido] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [tipoPersonalizacion, setTipoPersonalizacion] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  // Modal para CRUD de producto (Crear / Editar)
  const [modalProducto, setModalProducto] = useState({
    abierto: false,
    modo: "crear",
    producto: null,
  });

  // ============================================
  // CARGA DE DATOS DESDE SUPABASE
  // ============================================

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const { data: dataCats } = await supabase
        .from("categorias")
        .select("*")
        .order("orden", { ascending: true });

      const { data: dataProds } = await supabase
        .from("productos")
        .select("*")
        .order("id", { ascending: true });

      if (dataCats && dataCats.length > 0) {
        setCategorias(dataCats);
        setCategoriaActiva((prev) => prev || dataCats[0].nombre);
      }
      if (dataProds) {
        setProductos(dataProds);
      }
    } catch (err) {
      console.error("Error al cargar datos de Supabase:", err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Categoría activa como objeto
  const catActivaObj = categorias.find(
    (c) => (typeof c === "string" ? c : c.nombre) === categoriaActiva
  );

  // Productos filtrados por categoría activa
  const productosActuales = productos.filter((p) => {
    if (!catActivaObj?.id) return true;
    return p.categoria_id === catActivaObj.id;
  });

  // ============================================
  // ACCIONES CRUD DE PRODUCTOS
  // ============================================

  const handleProductoGuardado = (productoGuardado, modo) => {
    if (!productoGuardado) {
      cargarDatos();
      return;
    }
    if (modo === "crear") {
      setProductos((prev) => [...prev, productoGuardado]);
    } else {
      setProductos((prev) =>
        prev.map((p) => (p.id === productoGuardado.id ? productoGuardado : p))
      );
    }
  };

  const eliminarProducto = async (e, producto) => {
    e.stopPropagation();
    const seguro = window.confirm(
      `¿Estás seguro de que deseas eliminar "${producto.nombre}" de la carta?`
    );
    if (!seguro) return;

    try {
      const { error } = await supabase
        .from("productos")
        .delete()
        .eq("id", producto.id);

      if (error) throw error;
      setProductos((prev) => prev.filter((p) => p.id !== producto.id));
    } catch (err) {
      alert("Error al eliminar el producto: " + (err.message || err));
    }
  };

  // ============================================
  // AGREGAR PRODUCTO DIRECTAMENTE
  // ============================================

  const agregarDirectamente = (producto) => {
    setPedido((pedidoActual) => {
      const existente = pedidoActual.find(
        (item) =>
          item.id === producto.id &&
          !item.personalizacion
      );

      if (existente) {
        return pedidoActual.map((item) =>
          item.id === producto.id &&
            !item.personalizacion
            ? {
              ...item,
              cantidad: item.cantidad + 1,
            }
            : item
        );
      }

      return [
        ...pedidoActual,
        {
          ...producto,
          cantidad: 1,
        },
      ];
    });
  };

  // ============================================
  // SELECCIONAR PRODUCTO
  // ============================================

  const seleccionarProducto = (producto) => {
    if (categoriaActiva === "Hamburguesas") {
      setProductoSeleccionado(producto);
      setTipoPersonalizacion("hamburguesa");
      return;
    }

    if (categoriaActiva === "Salchipapas") {
      setProductoSeleccionado(producto);
      setTipoPersonalizacion("cremas");
      return;
    }

    if (categoriaActiva === "Alitas") {
      setProductoSeleccionado(producto);
      setTipoPersonalizacion("alitas");
      return;
    }

    if (categoriaActiva === "Bebidas") {
      setProductoSeleccionado(producto);
      setTipoPersonalizacion("bebida");
      return;
    }

    agregarDirectamente(producto);
  };

  // ============================================
  // GUARDAR PERSONALIZACIÓN
  // ============================================

  const guardarPersonalizacion = (
    productoPersonalizado
  ) => {
    setPedido((pedidoActual) => [
      ...pedidoActual,
      {
        ...productoPersonalizado,
        precio:
          productoPersonalizado.precioFinal,
        cantidad: 1,
      },
    ]);

    setProductoSeleccionado(null);
    setTipoPersonalizacion(null);
  };

  // ============================================
  // CERRAR MODAL
  // ============================================

  const cerrarModal = () => {
    setProductoSeleccionado(null);
    setTipoPersonalizacion(null);
  };

  // ============================================
  // AUMENTAR CANTIDAD
  // ============================================

  const aumentarCantidad = (index) => {
    setPedido((pedidoActual) =>
      pedidoActual.map((item, i) =>
        i === index
          ? {
            ...item,
            cantidad: item.cantidad + 1,
          }
          : item
      )
    );
  };

  // ============================================
  // DISMINUIR CANTIDAD
  // ============================================

  const disminuirCantidad = (index) => {
    setPedido((pedidoActual) =>
      pedidoActual
        .map((item, i) =>
          i === index
            ? {
              ...item,
              cantidad: item.cantidad - 1,
            }
            : item
        )
        .filter(
          (item) => item.cantidad > 0
        )
    );
  };

  // ============================================
  // TOTAL
  // ============================================

  const total = pedido.reduce(
    (acumulado, item) =>
      acumulado +
      item.precio * item.cantidad,
    0
  );

  return (
    <>
      <div className="min-h-screen bg-slate-100">

        {/* ==================================================
            CONTENEDOR PRINCIPAL
        ================================================== */}

        <div className="flex min-h-screen flex-col lg:flex-row">

          {/* ==================================================
              SIDEBAR
          ================================================== */}

          <aside className="w-full shrink-0 bg-slate-900 text-white shadow-xl lg:w-64">

            {/* LOGO */}

            <div className="flex items-center gap-3 border-b border-slate-700 px-6 py-6">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500 text-xl font-black shadow-lg">
                F
              </div>

              <div>
                <h1 className="text-xl font-bold">
                  FastOrder
                </h1>

                <p className="text-xs text-slate-400">
                  Sistema de pedidos
                </p>
              </div>

            </div>

            {/* MENÚ */}

            <nav className="p-4">

              <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                Menú principal
              </p>

              <div className="space-y-2">

                {/* CARTA */}

                <button
                  type="button"
                  onClick={() =>
                    setVistaActual("carta")
                  }
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-bold transition ${vistaActual === "carta"
                      ? "bg-red-500 text-white shadow-lg"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                >

                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg ${vistaActual === "carta"
                        ? "bg-white/15"
                        : "bg-slate-800"
                      }`}
                  >
                    🍔
                  </span>

                  <span>Carta</span>

                </button>

                {/* PRODUCTOS (CRUD) */}

                <button
                  type="button"
                  onClick={() => setVistaActual("productos")}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-bold transition ${vistaActual === "productos"
                      ? "bg-red-500 text-white shadow-lg"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                >

                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg ${vistaActual === "productos"
                        ? "bg-white/15"
                        : "bg-slate-800"
                      }`}
                  >
                    📦
                  </span>

                  <span>Productos</span>

                </button>

                {/* REPORTES */}

                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                >

                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-lg">
                    📊
                  </span>

                  <span>Reportes</span>

                </button>

                {/* CONFIGURACIÓN */}

                <button
                  type="button"
                  onClick={() =>
                    setVistaActual("configuracion")
                  }
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-semibold transition ${vistaActual === "configuracion"
                      ? "bg-red-500 text-white shadow-lg"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                >

                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg ${vistaActual === "configuracion"
                        ? "bg-white/15"
                        : "bg-slate-800"
                      }`}
                  >
                    ⚙️
                  </span>

                  <span>Configuración</span>

                </button>

              </div>

            </nav>

            {/* PARTE INFERIOR */}

            <div className="hidden px-4 pb-5 lg:block">

              <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-4">

                <p className="text-xs font-semibold text-slate-400">
                  FastOrder
                </p>

                <p className="mt-1 text-sm font-bold text-white">
                  Gestión de pedidos
                </p>

                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  Administra productos y pedidos
                  desde un solo lugar.
                </p>

              </div>

            </div>

          </aside>

          {/* ==================================================
              CONTENIDO DERECHO
          ================================================== */}

          <main className="min-w-0 flex-1">

            {/* ==================================================
                VISTA CONFIGURACIÓN O PRODUCTOS O CARTA
            ================================================== */}

            {vistaActual === "configuracion" ? (

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
                onEliminarProducto={eliminarProducto}
                onActualizarDisponibilidad={(id, disp) =>
                  setProductos((prev) =>
                    prev.map((p) =>
                      p.id === id ? { ...p, disponible: disp } : p
                    )
                  )
                }
              />

            ) : (

              /* ==================================================
                  VISTA CARTA (TOMA DE PEDIDOS / POS)
              ================================================== */

              <div className="p-3 md:p-5 lg:p-6">

                <div className="mx-auto max-w-[1500px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                  {/* ==================================================
                      ENCABEZADO
                  ================================================== */}

                  <div className="border-b border-slate-200 bg-white px-5 py-5 md:px-7">

                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

                      <div>

                        <p className="text-sm font-semibold uppercase tracking-wider text-red-500">
                          Menú
                        </p>

                        <h1 className="mt-1 text-3xl font-black text-slate-800 md:text-4xl">
                          Carta{" "}
                          <span className="font-normal text-slate-500">
                            FastOrder
                          </span>
                        </h1>

                      </div>

                      <div className="rounded-xl bg-slate-100 px-4 py-3 text-right">

                        <p className="text-xs font-semibold uppercase text-slate-500">
                          Pedido actual
                        </p>

                        <p className="text-xl font-black text-slate-800">
                          {pedido.length}{" "}
                          {pedido.length === 1
                            ? "producto"
                            : "productos"}
                        </p>

                      </div>

                    </div>

                  </div>

                  {/* ==================================================
                      CONTENIDO CARTA + PEDIDO
                  ================================================== */}

                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_390px]">

                    {/* ==================================================
                        CARTA
                    ================================================== */}

                    <div className="min-w-0 p-4 md:p-6">

                      {/* CATEGORÍAS */}

                      <div className="mb-6">

                        <div className="mb-3 flex items-center justify-between">

                          <h2 className="text-lg font-bold text-slate-800">
                            Categorías
                          </h2>

                          <span className="text-sm text-slate-400">
                            Selecciona una categoría
                          </span>

                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">

                          {categorias.map(
                            (cat) => {
                              const nombreCat = typeof cat === "string" ? cat : cat.nombre;
                              const iconoCat = typeof cat === "string" ? "" : cat.icono;
                              const activa = categoriaActiva === nombreCat;

                              return (
                                <button
                                  key={cat.id || nombreCat}
                                  onClick={() =>
                                    setCategoriaActiva(
                                      nombreCat
                                    )
                                  }
                                  className={`relative flex items-center justify-center gap-1.5 rounded-xl px-3 py-3 text-sm font-bold transition-all md:text-base ${activa
                                      ? "bg-red-500 text-white shadow-md shadow-red-200"
                                      : "border border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                                    }`}
                                >
                                  {iconoCat && <span>{iconoCat}</span>}
                                  <span>{nombreCat}</span>

                                  {activa && (
                                    <span className="absolute bottom-0 left-1/2 h-1 w-8 -translate-x-1/2 rounded-t-full bg-white/80" />
                                  )}
                                </button>
                              );
                            }
                          )}

                        </div>

                      </div>

                      {/* TÍTULO CATEGORÍA */}

                      <div className="mb-4 flex items-end justify-between border-b border-slate-100 pb-3">

                        <div>

                          <h2 className="text-2xl font-black text-slate-800">
                            {categoriaActiva}
                          </h2>

                          <p className="mt-1 text-sm text-slate-500">
                            {cargando ? (
                              <span className="inline-flex items-center gap-1 text-blue-600">
                                <span className="inline-block h-3 w-3 animate-spin rounded-full border border-blue-600 border-t-transparent"></span>
                                Sincronizando con Supabase...
                              </span>
                            ) : (
                              `${productosActuales.length} productos disponibles`
                            )}
                          </p>

                        </div>

                      </div>

                      {/* PRODUCTOS */}

                      {cargando && productos.length === 0 ? (
                        <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
                          <p className="font-semibold text-slate-500">
                            Cargando carta desde Supabase...
                          </p>
                        </div>
                      ) : productosActuales.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                          <span className="text-4xl">🍽️</span>
                          <p className="mt-2 text-base font-bold text-slate-700">
                            No hay productos en esta categoría
                          </p>
                          <p className="text-xs text-slate-400">
                            Ve a la pestaña &ldquo;Productos&rdquo; para agregar productos al menú.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3">

                          {productosActuales.map(
                            (producto) => {
                              const disponible = producto.disponible !== false;
                              return (
                                <button
                                  key={producto.id}
                                  type="button"
                                  disabled={!disponible}
                                  onClick={() =>
                                    seleccionarProducto(
                                      producto
                                    )
                                  }
                                  className={`group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition-all duration-200 ${!disponible
                                      ? "opacity-50 cursor-not-allowed"
                                      : "hover:-translate-y-1 hover:border-blue-400 hover:shadow-lg"
                                    }`}
                                >

                                  {/* IMAGEN */}

                                  <div className="relative h-36 overflow-hidden bg-slate-100 md:h-40">

                                    <img
                                      src={
                                        producto.imagen
                                      }
                                      alt={
                                        producto.nombre
                                      }
                                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                      onError={(e) => {
                                        e.currentTarget.src =
                                          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80";
                                      }}
                                    />

                                    {/* PRECIO */}

                                    <div className="absolute right-2 top-2 rounded-full bg-white px-3 py-1 shadow-md">

                                      <span className="text-sm font-black text-blue-600">
                                        S/{" "}
                                        {Number(
                                          producto.precio
                                        ).toFixed(2)}
                                      </span>

                                    </div>

                                    {!disponible && (
                                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                        <span className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                                          Agotado
                                        </span>
                                      </div>
                                    )}

                                  </div>

                                  {/* INFORMACIÓN */}

                                  <div className="p-3">

                                    <h2 className="line-clamp-1 text-base font-bold text-slate-800 md:text-lg">
                                      {producto.nombre}
                                    </h2>

                                    <div className="mt-3 flex items-center justify-between">

                                      <span className="text-sm text-slate-400">
                                        {!disponible ? "No disponible" : "Pedir / Personalizar"}
                                      </span>

                                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                                        +
                                      </span>

                                    </div>

                                  </div>

                                </button>
                              );
                            }
                          )}

                        </div>
                      )}

                    </div>

                    {/* ==================================================
                        PEDIDO
                    ================================================== */}

                    <div className="flex min-h-[500px] flex-col border-t border-slate-200 bg-slate-50 lg:border-l lg:border-t-0">

                      <div className="border-b border-slate-200 bg-white px-5 py-5">

                        <div className="flex items-center justify-between">

                          <div>

                            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                              Orden
                            </p>

                            <h2 className="text-2xl font-black text-slate-800">
                              Pedido Actual
                            </h2>

                          </div>

                          {pedido.length > 0 && (
                            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-700">
                              {pedido.length}
                            </span>
                          )}

                        </div>

                      </div>

                      <div className="flex-1 overflow-y-auto px-5 py-3">

                        {pedido.length === 0 ? (

                          <div className="flex h-full min-h-[300px] items-center justify-center text-center">

                            <div>

                              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-2xl">
                                🛒
                              </div>

                              <p className="mt-4 text-lg font-bold text-slate-400">
                                No hay productos
                              </p>

                              <p className="mt-1 text-sm text-slate-400">
                                Selecciona un producto
                                para agregarlo al pedido
                              </p>

                            </div>

                          </div>

                        ) : (

                          <div className="space-y-2">

                            {pedido.map(
                              (item, index) => (

                                <div
                                  key={`${item.id}-${index}`}
                                  className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                                >

                                  <div className="flex items-start justify-between gap-3">

                                    <div className="flex-1">

                                      <p className="font-bold text-slate-800">
                                        {item.nombre}
                                      </p>

                                      {/* HAMBURGUESAS */}

                                      {item.personalizacion
                                        ?.papas && (
                                          <p className="mt-1 text-xs text-gray-500">
                                            Papas:{" "}
                                            {
                                              item
                                                .personalizacion
                                                .papas
                                            }
                                          </p>
                                        )}

                                      {item.personalizacion
                                        ?.carne && (
                                          <p className="mt-1 text-xs text-gray-500">
                                            Carne:{" "}
                                            {
                                              item
                                                .personalizacion
                                                .carne
                                            }
                                          </p>
                                        )}

                                      {item.personalizacion
                                        ?.ensalada && (
                                          <p className="mt-1 text-xs text-gray-500">
                                            {
                                              item
                                                .personalizacion
                                                .ensalada
                                            }
                                          </p>
                                        )}

                                      {item.personalizacion
                                        ?.modalidad && (
                                          <p className="mt-1 text-xs font-semibold text-gray-600">
                                            Modalidad:{" "}
                                            {
                                              item
                                                .personalizacion
                                                .modalidad
                                            }
                                          </p>
                                        )}

                                      {/* CREMAS HAMBURGUESA */}

                                      {item.personalizacion
                                        ?.modalidad !==
                                        "Salón" &&
                                        item.personalizacion
                                          ?.cremas && (
                                          <p className="mt-1 text-xs text-gray-500">
                                            Cremas:{" "}
                                            {item
                                              .personalizacion
                                              .cremas
                                              .length >
                                              0
                                              ? item.personalizacion.cremas.join(
                                                ", "
                                              )
                                              : "Ninguna"}
                                          </p>
                                        )}

                                      {/* OBSERVACIÓN */}

                                      {item.personalizacion
                                        ?.observacion && (
                                          <p className="mt-1 text-xs text-gray-500">
                                            Observación:{" "}
                                            {
                                              item
                                                .personalizacion
                                                .observacion
                                            }
                                          </p>
                                        )}

                                      {/* SALCHIPAPAS */}

                                      {!item
                                        .personalizacion
                                        ?.modalidad &&
                                        item.personalizacion
                                          ?.cremas && (
                                          <p className="mt-1 text-xs text-gray-500">
                                            Cremas:{" "}
                                            {item
                                              .personalizacion
                                              .cremas
                                              .length > 0
                                              ? item.personalizacion.cremas.join(
                                                ", "
                                              )
                                              : "Ninguna"}
                                          </p>
                                        )}

                                      {/* BEBIDAS */}

                                      {item.personalizacion
                                        ?.temperatura && (
                                          <p className="mt-1 text-xs text-gray-500">
                                            Temperatura:{" "}
                                            {
                                              item
                                                .personalizacion
                                                .temperatura
                                            }
                                          </p>
                                        )}

                                      {/* ALITAS */}

                                      {item.personalizacion
                                        ?.porcion && (
                                          <p className="mt-1 text-xs font-semibold text-gray-600">
                                            Porción:{" "}
                                            {
                                              item
                                                .personalizacion
                                                .porcion
                                            }{" "}
                                            alitas
                                          </p>
                                        )}

                                      {item.personalizacion
                                        ?.salsas
                                        ?.length > 0 && (
                                          <p className="mt-1 text-xs text-gray-500">
                                            Salsas:{" "}
                                            {item.personalizacion.salsas.join(
                                              ", "
                                            )}
                                          </p>
                                        )}

                                      {/* PRECIO */}

                                      <p className="mt-2 text-sm font-semibold text-blue-600">
                                        S/{" "}
                                        {item.precio.toFixed(
                                          2
                                        )}{" "}
                                        c/u
                                      </p>

                                    </div>

                                    <p className="font-black text-slate-800">
                                      S/{" "}
                                      {(
                                        item.precio *
                                        item.cantidad
                                      ).toFixed(2)}
                                    </p>

                                  </div>

                                  {/* CANTIDAD */}

                                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">

                                    <span className="text-xs font-semibold text-slate-400">
                                      Cantidad
                                    </span>

                                    <div className="flex items-center gap-2">

                                      <button
                                        onClick={() =>
                                          disminuirCantidad(
                                            index
                                          )
                                        }
                                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 font-bold text-slate-700 transition hover:bg-slate-200"
                                      >
                                        −
                                      </button>

                                      <span className="min-w-6 text-center font-bold">
                                        {
                                          item.cantidad
                                        }
                                      </span>

                                      <button
                                        onClick={() =>
                                          aumentarCantidad(
                                            index
                                          )
                                        }
                                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 font-bold text-white transition hover:bg-blue-700"
                                      >
                                        +
                                      </button>

                                    </div>

                                  </div>

                                </div>

                              )
                            )}

                          </div>

                        )}

                      </div>

                      {/* TOTAL */}

                      <div className="border-t border-slate-200 bg-white">

                        <div className="flex items-center justify-between px-5 py-5">

                          <span className="text-xl font-black text-slate-800">
                            Total:
                          </span>

                          <span className="text-2xl font-black text-blue-600">
                            S/{" "}
                            {total.toFixed(2)}
                          </span>

                        </div>

                        <div className="px-5 pb-5">

                          <button
                            disabled={
                              pedido.length === 0
                            }
                            onClick={() =>
                              setMostrarModal(true)
                            }
                            className="w-full rounded-xl bg-blue-600 px-6 py-4 text-lg font-black text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                          >
                            Cobrar
                          </button>

                        </div>

                        {/* MODAL COBRO */}

                        {/* MODAL COBRO */}

                        {mostrarModal && (
                          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

                            <div className="relative w-full max-w-lg">

                              <Cobro
                                pedido={pedido}
                                total={total}
                                onPedidoExitoso={() => {
                                  setPedido([]);
                                  setMostrarModal(false);
                                }}
                              />

                              <button
                                onClick={() =>
                                  setMostrarModal(
                                    false
                                  )
                                }
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

      {/* ==================================================
          PERSONALIZACIÓN
      ================================================== */}

      {productoSeleccionado &&
        tipoPersonalizacion && (
          <PersonalizarProducto
            producto={productoSeleccionado}
            tipo={tipoPersonalizacion}
            onGuardar={
              guardarPersonalizacion
            }
            onCancelar={cerrarModal}
          />
        )}

      {/* MODAL CRUD PRODUCTO (CREAR / EDITAR) */}
      <ModalProducto
        abierto={modalProducto.abierto}
        modo={modalProducto.modo}
        producto={modalProducto.producto}
        categorias={categorias}
        categoriaActivaId={catActivaObj?.id}
        onCerrar={() =>
          setModalProducto((prev) => ({ ...prev, abierto: false }))
        }
        onGuardado={handleProductoGuardado}
      />

    </>
  );
}