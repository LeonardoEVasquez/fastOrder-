"use client";

import { useState } from "react";
import PersonalizarProducto from "./personalizar-producto";

const productos = {
  Hamburguesas: [
    {
      id: 1,
      nombre: "Cheeseburger",
      precio: 12,
      imagen:
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: 2,
      nombre: "Doble Burger",
      precio: 16,
      imagen:
        "https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: 3,
      nombre: "Burger Clásica",
      precio: 13,
      imagen:
        "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: 4,
      nombre: "Burger BBQ",
      precio: 15,
      imagen:
        "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: 5,
      nombre: "Burger Crispy",
      precio: 14,
      imagen:
        "https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: 6,
      nombre: "Burger Especial",
      precio: 18,
      imagen:
        "https://images.unsplash.com/photo-1565299507177-b0ac66763828?auto=format&fit=crop&w=500&q=80",
    },
  ],

  Salchipapas: [
    {
      id: 7,
      nombre: "Salchipapa Clásica",
      precio: 10,
      imagen:
        "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: 8,
      nombre: "Salchipapa Grande",
      precio: 15,
      imagen:
        "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: 9,
      nombre: "Salchipapa Especial",
      precio: 18,
      imagen:
        "https://images.unsplash.com/photo-1598679253544-2c97992403ea?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: 10,
      nombre: "Salchipapa con Huevo",
      precio: 14,
      imagen:
        "https://images.unsplash.com/photo-1623238913973-21e45cced554?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: 11,
      nombre: "Salchipollo",
      precio: 17,
      imagen:
        "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: 12,
      nombre: "Salchipapa BBQ",
      precio: 16,
      imagen:
        "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=500&q=80",
    },
  ],

  Alitas: [
    {
      id: 13,
      nombre: "Alitas BBQ",
      precio: 16,
      imagen:
        "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: 14,
      nombre: "Alitas Picantes",
      precio: 17,
      imagen:
        "https://images.unsplash.com/photo-1608039755401-742486e5f2f3?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: 15,
      nombre: "Alitas Crispy",
      precio: 18,
      imagen:
        "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: 16,
      nombre: "Alitas Miel",
      precio: 17,
      imagen:
        "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: 17,
      nombre: "Alitas Teriyaki",
      precio: 18,
      imagen:
        "https://images.unsplash.com/photo-1569058242253-92a9c755a0d4?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: 18,
      nombre: "Alitas Especiales",
      precio: 20,
      imagen:
        "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=500&q=80",
    },
  ],

  Bebidas: [
    {
      id: 19,
      nombre: "Gaseosa",
      precio: 4,
      imagen:
        "https://images.unsplash.com/photo-1629203849820-fdd70d49c38e?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: 20,
      nombre: "Inca Kola",
      precio: 4,
      imagen:
        "https://images.unsplash.com/photo-1629203849820-fdd70d49c38e?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: 21,
      nombre: "Coca Cola",
      precio: 4,
      imagen:
        "https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: 22,
      nombre: "Limonada",
      precio: 5,
      imagen:
        "https://images.unsplash.com/photo-1523677011781-c91d1bbe2f0e?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: 23,
      nombre: "Agua",
      precio: 3,
      imagen:
        "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: 24,
      nombre: "Jugo Natural",
      precio: 6,
      imagen:
        "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=500&q=80",
    },
  ],

  Postres: [
    {
      id: 25,
      nombre: "Pie de Manzana",
      precio: 7,
      imagen:
        "https://images.unsplash.com/photo-1535920527002-b35e96722eb9?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: 26,
      nombre: "Cheesecake",
      precio: 8,
      imagen:
        "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: 27,
      nombre: "Brownie",
      precio: 7,
      imagen:
        "https://images.unsplash.com/photo-1606313564200-e75d5e30476e?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: 28,
      nombre: "Torta de Chocolate",
      precio: 9,
      imagen:
        "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: 29,
      nombre: "Helado",
      precio: 6,
      imagen:
        "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: 30,
      nombre: "Brownie con Helado",
      precio: 10,
      imagen:
        "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=500&q=80",
    },
  ],
};

const categorias = [
  "Hamburguesas",
  "Salchipapas",
  "Alitas",
  "Bebidas",
  "Postres",
];

export default function Carta() {
  const [categoriaActiva, setCategoriaActiva] = useState("Hamburguesas");

  const [pedido, setPedido] = useState([]);

  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  const [tipoPersonalizacion, setTipoPersonalizacion] = useState(null);

  const productosActuales = productos[categoriaActiva];

  const [pedidoOrden, setPedidoOrden] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);

  const agregarDirectamente = (producto) => {
    setPedido((pedidoActual) => {
      const existente = pedidoActual.find(
        (item) =>
          item.id === producto.id &&
          !item.personalizacion
      );

      if (existente) {
        return pedidoActual.map((item) =>
          item.id === producto.id && !item.personalizacion
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

  const seleccionarProducto = (producto) => {
    if (categoriaActiva === "Hamburguesas") {
      setProductoSeleccionado(producto);
      setTipoPersonalizacion("hamburguesa");
      return;
    }

    if (
      categoriaActiva === "Salchipapas" ||
      categoriaActiva === "Alitas"
    ) {
      setProductoSeleccionado(producto);
      setTipoPersonalizacion("cremas");
      return;
    }
    agregarDirectamente(producto);
  };

  const guardarPersonalizacion = (productoPersonalizado) => {
    setPedido((pedidoActual) => [
      ...pedidoActual,
      {
        ...productoPersonalizado,
        precio: productoPersonalizado.precioFinal,
        cantidad: 1,
      },
    ]);

    setProductoSeleccionado(null);
    setTipoPersonalizacion(null);
  };

  const cerrarModal = () => {
    setProductoSeleccionado(null);
    setTipoPersonalizacion(null);
  };

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
        .filter((item) => item.cantidad > 0)
    );
  };

  const total = pedido.reduce(
    (acumulado, item) =>
      acumulado + item.precio * item.cantidad,
    0
  );

  return (
    <>
      <div className="min-h-screen bg-gray-100 p-4 md:p-6">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm">

          <div className="border-b border-gray-300 px-6 py-4 text-center">
            <h1 className="text-3xl font-bold text-slate-800 md:text-4xl">
              Pantalla Principal{" "}
              <span className="font-normal">
                FastOrder
              </span>
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_390px]">
            <div className="p-4 md:p-5">

              <div className="mb-4 grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-5">
                {categorias.map((categoria) => {
                  const activa =
                    categoriaActiva === categoria;

                  return (
                    <button
                      key={categoria}
                      onClick={() =>
                        setCategoriaActiva(categoria)
                      }
                      className={`relative px-3 py-3 text-base font-bold transition-all md:text-lg ${
                        activa
                          ? "bg-red-500 text-white"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {categoria}

                      {activa && (
                        <span className="absolute -bottom-2 left-1/2 h-0 w-0 -translate-x-1/2 border-l-[10px] border-r-[10px] border-t-[10px] border-l-transparent border-r-transparent border-t-red-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {productosActuales.map((producto) => (
                  <button
                    key={producto.id}
                    onClick={() =>
                      seleccionarProducto(producto)
                    }
                    className="group overflow-hidden rounded-lg border-2 border-gray-200 bg-white transition-all hover:-translate-y-1 hover:border-blue-500 hover:shadow-md"
                  >
                    <div className="flex h-32 items-center justify-center overflow-hidden bg-gray-50 md:h-36">
                      <img
                        src={producto.imagen}
                        alt={producto.nombre}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                    </div>

                    <div className="p-2 text-center">
                      <h2 className="text-base font-bold text-slate-800 md:text-lg">
                        {producto.nombre}
                      </h2>

                      <p className="mt-1 text-lg font-bold text-blue-600">
                        S/ {producto.precio.toFixed(2)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex min-h-[500px] flex-col border-t border-gray-300 lg:border-l lg:border-t-0">

              <div className="border-b border-gray-300 px-5 py-4">
                <h2 className="text-2xl font-bold text-slate-800">
                  Pedido Actual
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-3">

                {pedido.length === 0 ? (
                  <div className="flex h-full min-h-[300px] items-center justify-center text-center">
                    <div>
                      <p className="text-lg font-semibold text-gray-400">
                        No hay productos
                      </p>

                      <p className="mt-1 text-sm text-gray-400">
                        Selecciona un producto para agregarlo al pedido
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">

                    {pedido.map((item, index) => (
                      <div
                        key={`${item.id}-${index}`}
                        className="border-b border-gray-200 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">

                          <div className="flex-1">

                            <p className="font-bold text-slate-800">
                              {item.nombre}
                            </p>

                            {item.personalizacion?.ingredientes && (
                              <p className="mt-1 text-xs text-gray-500">
                                {item.personalizacion.ingredientes.join(
                                  ", "
                                )}
                              </p>
                            )}

                            {item.personalizacion?.adicionales
                              ?.length > 0 && (
                              <p className="mt-1 text-xs text-gray-500">
                                +{" "}
                                {item.personalizacion.adicionales.join(
                                  ", "
                                )}
                              </p>
                            )}

                            {item.personalizacion?.cremas && (
                              <p className="mt-1 text-xs text-gray-500">
                                Cremas:{" "}
                                {item.personalizacion.cremas.length > 0
                                  ? item.personalizacion.cremas.join(
                                      ", "
                                    )
                                  : "Ninguna"}
                              </p>
                            )}

                            <p className="mt-1 text-sm text-gray-500">
                              S/ {item.precio.toFixed(2)} c/u
                            </p>
                          </div>

                          <p className="font-bold text-slate-800">
                            S/{" "}
                            {(
                              item.precio * item.cantidad
                            ).toFixed(2)}
                          </p>
                        </div>

                        <div className="mt-2 flex items-center gap-2">

                          <button
                            onClick={() =>
                              disminuirCantidad(index)
                            }
                            className="flex h-7 w-7 items-center justify-center rounded bg-gray-200 font-bold text-gray-700 hover:bg-gray-300"
                          >
                            −
                          </button>

                          <span className="min-w-6 text-center font-bold">
                            {item.cantidad}
                          </span>

                          <button
                            onClick={() =>
                              aumentarCantidad(index)
                            }
                            className="flex h-7 w-7 items-center justify-center rounded bg-blue-600 font-bold text-white hover:bg-blue-700"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* TOTAL */}

              <div className="border-t border-gray-300">

                <div className="flex items-center justify-between px-5 py-5">
                  <span className="text-xl font-bold text-slate-800">
                    Total:
                  </span>

                  <span className="text-2xl font-bold text-slate-800">
                    S/ {total.toFixed(2)}
                  </span>
                </div>

                <div className="px-5 pb-5">
                  <button
                    disabled={pedido.length === 0}
                    onClick={() => setMostrarModal(true)}
                    className="w-full rounded-lg bg-blue-600 px-6 py-4 text-xl font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    Cobrar
                  </button>
                </div>

                {mostrarModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="relative w-full max-w-lg">

                      {/* Botón cerrar */}
                      <button
                        onClick={() => setMostrarModal(false)}
                        className="absolute top-2 right-2 rounded-full bg-red-600 px-3 py-1 text-white font-bold hover:bg-red-700"
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

      {productoSeleccionado && tipoPersonalizacion && (
        <PersonalizarProducto
          producto={productoSeleccionado}
          tipo={tipoPersonalizacion}
          onGuardar={guardarPersonalizacion}
          onCancelar={cerrarModal}
        />
      )}
    </>
  );
}