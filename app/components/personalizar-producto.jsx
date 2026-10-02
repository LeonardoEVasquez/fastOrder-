"use client";

import { useState } from "react";

export default function PersonalizarProducto({
  producto,
  tipo,
  onGuardar,
  onCancelar,
}) {
  // ============================================
  // HAMBURGUESAS
  // ============================================

  const [papas, setPapas] = useState("Ninguna");

  const [carne, setCarne] = useState("Pollo");

  const [ensalada, setEnsalada] =
    useState("Sin ensalada");

  const [modalidad, setModalidad] =
    useState("Salón");

  const [cremasHamburguesa, setCremasHamburguesa] =
    useState([]);

  const [
    observacionHamburguesa,
    setObservacionHamburguesa,
  ] = useState("");

  // ============================================
  // SALCHIPAPAS
  // ============================================

  const [cremas, setCremas] = useState([]);

  // ============================================
  // BEBIDAS
  // ============================================

  const [temperatura, setTemperatura] =
    useState("Helada");

  // ============================================
  // ALITAS
  // ============================================

  const [porcion, setPorcion] = useState(6);

  const [observacion, setObservacion] =
    useState("");

  const [salsas, setSalsas] = useState([]);

  // ============================================
  // OPCIONES HAMBURGUESAS
  // ============================================

  const opcionesPapas = [
    "Papa frita",
    "Papa hilo",
    "Ninguna",
  ];

  const opcionesCarnes = [
    "Pollo",
    "Filete",
    "Carne",
  ];

  const opcionesEnsalada = [
    "Con ensalada",
    "Sin ensalada",
  ];

  const opcionesModalidad = [
    "Salón",
    "Llevar",
    "Recoger",
    "Delivery",
  ];

  const opcionesCremasHamburguesa = [
    "Mayonesa",
    "Ketchup",
    "Ají",
  ];

  // ============================================
  // OPCIONES ALITAS
  // ============================================

  const porciones = [
    6,
    9,
    12,
    18,
    24,
    36,
  ];

  const opcionesSalsas = [
    "Acevichada",
    "BBQ",
    "BBQ Picante",
    "Maracuyá",
    "Hawaiana",
  ];

  const PRECIO_SALSA = 2.5;

  // ============================================
  // SELECCIONAR SALSA DE ALITAS
  // ============================================

  const toggleSalsa = (salsa) => {
    setSalsas((actuales) => {
      if (actuales.includes(salsa)) {
        return actuales.filter(
          (item) => item !== salsa
        );
      }

      return [...actuales, salsa];
    });
  };

  // ============================================
  // SELECCIONAR CREMA HAMBURGUESA
  // ============================================

  const toggleCremaHamburguesa = (crema) => {
    setCremasHamburguesa((actuales) => {
      if (actuales.includes(crema)) {
        return actuales.filter(
          (item) => item !== crema
        );
      }

      return [...actuales, crema];
    });
  };

  // ============================================
  // SELECCIONAR CREMA SALCHIPAPA
  // ============================================

  const toggleCrema = (crema) => {
    setCremas((actuales) => {
      if (actuales.includes(crema)) {
        return actuales.filter(
          (item) => item !== crema
        );
      }

      return [...actuales, crema];
    });
  };

  // ============================================
  // PRECIO FINAL
  // ============================================

  const calcularPrecioFinal = () => {
    if (tipo === "alitas") {
      const precioSalsas =
        salsas.length * PRECIO_SALSA;

      return producto.precio + precioSalsas;
    }

    return producto.precio;
  };

  // ============================================
  // GUARDAR
  // ============================================

  const guardar = () => {
    // --------------------------------------------
    // ALITAS
    // --------------------------------------------

    if (tipo === "alitas") {
      onGuardar({
        ...producto,

        precioFinal: calcularPrecioFinal(),

        personalizacion: {
          porcion,
          observacion,
          salsas,
        },
      });

      return;
    }

    // --------------------------------------------
    // BEBIDAS
    // --------------------------------------------

    if (tipo === "bebida") {
      onGuardar({
        ...producto,

        precioFinal: producto.precio,

        personalizacion: {
          temperatura,
        },
      });

      return;
    }

    // --------------------------------------------
    // SALCHIPAPAS
    // --------------------------------------------

    if (tipo === "cremas") {
      onGuardar({
        ...producto,

        precioFinal: producto.precio,

        personalizacion: {
          cremas,
        },
      });

      return;
    }

    // --------------------------------------------
    // HAMBURGUESAS
    // --------------------------------------------

    onGuardar({
      ...producto,

      precioFinal: producto.precio,

      personalizacion: {
        papas,
        carne,
        ensalada,
        modalidad,
        cremas: cremasHamburguesa,
        observacion: observacionHamburguesa,
      },
    });
  };

  // ============================================
  // MODAL
  // ============================================

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-2xl">

        {/* ======================================
            ENCABEZADO
        ====================================== */}

        <div className="border-b border-gray-200 p-5">

          <div className="flex items-start justify-between">

            <div>

              <h2 className="text-2xl font-bold text-slate-800">
                Personalizar producto
              </h2>

              <p className="mt-1 text-lg font-semibold text-blue-600">
                {producto.nombre}
              </p>

            </div>

            <button
              onClick={onCancelar}
              className="rounded-full bg-red-600 px-3 py-1 font-bold text-white hover:bg-red-700"
            >
              X
            </button>

          </div>

        </div>

        {/* ======================================
            CONTENIDO
        ====================================== */}

        <div className="space-y-6 p-5">

          {/* ====================================
              HAMBURGUESAS
          ==================================== */}

          {tipo === "hamburguesa" && (
            <>
              {/* PAPAS */}

              <div>

                <h3 className="mb-3 text-lg font-bold text-slate-800">
                  Papas
                </h3>

                <div className="grid grid-cols-3 gap-2">

                  {opcionesPapas.map((opcion) => {

                    const seleccionada =
                      papas === opcion;

                    return (
                      <button
                        key={opcion}
                        type="button"
                        onClick={() =>
                          setPapas(opcion)
                        }
                        className={`rounded-lg border-2 px-3 py-3 font-semibold transition ${
                          seleccionada
                            ? "border-blue-500 bg-blue-500 text-white"
                            : "border-gray-300 bg-white text-gray-700 hover:border-blue-400"
                        }`}
                      >
                        {opcion}
                      </button>
                    );
                  })}

                </div>

              </div>

              {/* CARNES */}

              <div>

                <h3 className="mb-3 text-lg font-bold text-slate-800">
                  Carne
                </h3>

                <div className="grid grid-cols-3 gap-2">

                  {opcionesCarnes.map((opcion) => {

                    const seleccionada =
                      carne === opcion;

                    return (
                      <button
                        key={opcion}
                        type="button"
                        onClick={() =>
                          setCarne(opcion)
                        }
                        className={`rounded-lg border-2 px-3 py-3 font-semibold transition ${
                          seleccionada
                            ? "border-blue-500 bg-blue-500 text-white"
                            : "border-gray-300 bg-white text-gray-700 hover:border-blue-400"
                        }`}
                      >
                        {opcion}
                      </button>
                    );
                  })}

                </div>

              </div>

              {/* ENSALADA */}

              <div>

                <h3 className="mb-3 text-lg font-bold text-slate-800">
                  Ensalada
                </h3>

                <div className="grid grid-cols-2 gap-3">

                  {opcionesEnsalada.map((opcion) => {

                    const seleccionada =
                      ensalada === opcion;

                    return (
                      <button
                        key={opcion}
                        type="button"
                        onClick={() =>
                          setEnsalada(opcion)
                        }
                        className={`rounded-lg border-2 px-4 py-3 font-bold transition ${
                          seleccionada
                            ? "border-blue-500 bg-blue-500 text-white"
                            : "border-gray-300 bg-white text-gray-700 hover:border-blue-400"
                        }`}
                      >
                        {opcion}
                      </button>
                    );
                  })}

                </div>

              </div>

              {/* MODALIDAD */}

              <div>

                <h3 className="mb-3 text-lg font-bold text-slate-800">
                  Modalidad de atención
                </h3>

                <div className="grid grid-cols-2 gap-2">

                  {opcionesModalidad.map((opcion) => {

                    const seleccionada =
                      modalidad === opcion;

                    return (
                      <button
                        key={opcion}
                        type="button"
                        onClick={() => {
                          setModalidad(opcion);

                          if (opcion === "Salón") {
                            setCremasHamburguesa([]);
                          }
                        }}
                        className={`rounded-lg border-2 px-4 py-3 font-bold transition ${
                          seleccionada
                            ? "border-red-500 bg-red-500 text-white"
                            : "border-gray-300 bg-white text-gray-700 hover:border-red-400"
                        }`}
                      >
                        {opcion}
                      </button>
                    );
                  })}

                </div>

              </div>

              {/* CREMAS */}

              {modalidad !== "Salón" && (
                <div>

                  <div className="mb-3">

                    <h3 className="text-lg font-bold text-slate-800">
                      Cremas
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      Selecciona las cremas que deseas.
                    </p>

                  </div>

                  <div className="grid grid-cols-3 gap-2">

                    {opcionesCremasHamburguesa.map(
                      (crema) => {

                        const seleccionada =
                          cremasHamburguesa.includes(
                            crema
                          );

                        return (
                          <button
                            key={crema}
                            type="button"
                            onClick={() =>
                              toggleCremaHamburguesa(
                                crema
                              )
                            }
                            className={`rounded-lg border-2 px-3 py-3 font-semibold transition ${
                              seleccionada
                                ? "border-blue-500 bg-blue-500 text-white"
                                : "border-gray-300 bg-white text-gray-700 hover:border-blue-400"
                            }`}
                          >
                            {crema}
                          </button>
                        );
                      }
                    )}

                  </div>

                </div>
              )}

              {/* OBSERVACIÓN */}

              <div>

                <h3 className="mb-2 text-lg font-bold text-slate-800">
                  Observación
                </h3>

                <textarea
                  value={observacionHamburguesa}
                  onChange={(e) =>
                    setObservacionHamburguesa(
                      e.target.value
                    )
                  }
                  placeholder="Escribe aquí alguna observación..."
                  rows={4}
                  className="w-full resize-none rounded-lg border-2 border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                />

              </div>
            </>
          )}

          {/* ====================================
              ALITAS
          ==================================== */}

          {tipo === "alitas" && (
            <>
              {/* PORCIÓN */}

              <div>

                <h3 className="mb-3 text-lg font-bold text-slate-800">
                  Selecciona la porción
                </h3>

                <div className="grid grid-cols-3 gap-2">

                  {porciones.map((cantidad) => {

                    const activa =
                      porcion === cantidad;

                    return (
                      <button
                        key={cantidad}
                        type="button"
                        onClick={() =>
                          setPorcion(cantidad)
                        }
                        className={`rounded-lg border-2 px-4 py-3 font-bold transition ${
                          activa
                            ? "border-red-500 bg-red-500 text-white"
                            : "border-gray-300 bg-white text-gray-700 hover:border-blue-500"
                        }`}
                      >
                        {cantidad} alitas
                      </button>
                    );
                  })}

                </div>

              </div>

              {/* OBSERVACIÓN */}

              <div>

                <h3 className="mb-2 text-lg font-bold text-slate-800">
                  Observación
                </h3>

                <textarea
                  value={observacion}
                  onChange={(e) =>
                    setObservacion(e.target.value)
                  }
                  placeholder="Escribe aquí alguna observación..."
                  rows={4}
                  className="w-full resize-none rounded-lg border-2 border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                />

              </div>

              {/* SALSAS */}

              <div>

                <div className="mb-3 flex items-center justify-between">

                  <h3 className="text-lg font-bold text-slate-800">
                    Salsas adicionales
                  </h3>

                  <span className="text-sm font-semibold text-blue-600">
                    S/ 2.50 c/u
                  </span>

                </div>

                <div className="space-y-2">

                  {opcionesSalsas.map((salsa) => {

                    const seleccionada =
                      salsas.includes(salsa);

                    return (
                      <button
                        key={salsa}
                        type="button"
                        onClick={() =>
                          toggleSalsa(salsa)
                        }
                        className={`flex w-full items-center justify-between rounded-lg border-2 px-4 py-3 text-left transition ${
                          seleccionada
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-300 bg-white hover:border-blue-400"
                        }`}
                      >

                        <div className="flex items-center gap-3">

                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded border-2 ${
                              seleccionada
                                ? "border-blue-600 bg-blue-600"
                                : "border-gray-400 bg-white"
                            }`}
                          >
                            {seleccionada && (
                              <span className="text-xs font-bold text-white">
                                ✓
                              </span>
                            )}
                          </div>

                          <span className="font-semibold text-slate-700">
                            {salsa}
                          </span>

                        </div>

                        <span className="text-sm font-bold text-gray-500">
                          + S/ 2.50
                        </span>

                      </button>
                    );
                  })}

                </div>

              </div>

              {/* RESUMEN */}

              <div className="rounded-lg bg-gray-100 p-4">

                <div className="flex justify-between">

                  <span className="text-gray-600">
                    Precio base:
                  </span>

                  <span className="font-semibold">
                    S/ {producto.precio.toFixed(2)}
                  </span>

                </div>

                <div className="mt-2 flex justify-between">

                  <span className="text-gray-600">
                    Salsas ({salsas.length}):
                  </span>

                  <span className="font-semibold">
                    S/{" "}
                    {(
                      salsas.length *
                      PRECIO_SALSA
                    ).toFixed(2)}
                  </span>

                </div>

                <div className="mt-3 border-t border-gray-300 pt-3">

                  <div className="flex justify-between">

                    <span className="font-bold text-slate-800">
                      Total:
                    </span>

                    <span className="text-xl font-bold text-blue-600">
                      S/{" "}
                      {calcularPrecioFinal().toFixed(2)}
                    </span>

                  </div>

                </div>

              </div>
            </>
          )}

          {/* ====================================
              BEBIDAS
          ==================================== */}

          {tipo === "bebida" && (
            <div>

              <h3 className="mb-3 text-lg font-bold text-slate-800">
                Temperatura
              </h3>

              <div className="grid grid-cols-2 gap-3">

                <button
                  type="button"
                  onClick={() =>
                    setTemperatura("Helada")
                  }
                  className={`rounded-lg border-2 px-4 py-4 font-bold ${
                    temperatura === "Helada"
                      ? "border-red-500 bg-red-500 text-white"
                      : "border-gray-300 text-gray-700"
                  }`}
                >
                  Helada
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setTemperatura("Sin helar")
                  }
                  className={`rounded-lg border-2 px-4 py-4 font-bold ${
                    temperatura === "Sin helar"
                      ? "border-red-500 bg-red-500 text-white"
                      : "border-gray-300 text-gray-700"
                  }`}
                >
                  Sin helar
                </button>

              </div>

            </div>
          )}

          {/* ====================================
              SALCHIPAPAS
          ==================================== */}

          {tipo === "cremas" && (
            <div>

              <h3 className="mb-3 text-lg font-bold text-slate-800">
                Selecciona tus cremas
              </h3>

              <div className="grid grid-cols-2 gap-2">

                {[
                  "Mayonesa",
                  "Ketchup",
                  "Mostaza",
                  "Ají",
                  "Golf",
                  "Tártara",
                ].map((crema) => {

                  const seleccionada =
                    cremas.includes(crema);

                  return (
                    <button
                      key={crema}
                      type="button"
                      onClick={() =>
                        toggleCrema(crema)
                      }
                      className={`rounded-lg border-2 px-3 py-3 font-semibold ${
                        seleccionada
                          ? "border-blue-500 bg-blue-500 text-white"
                          : "border-gray-300 bg-white text-gray-700"
                      }`}
                    >
                      {crema}
                    </button>
                  );
                })}

              </div>

            </div>
          )}

        </div>

        {/* ======================================
            BOTONES
        ====================================== */}

        <div className="flex gap-3 border-t border-gray-200 p-5">

          <button
            type="button"
            onClick={onCancelar}
            className="flex-1 rounded-lg bg-gray-200 px-5 py-3 font-bold text-gray-700 hover:bg-gray-300"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={guardar}
            className="flex-1 rounded-lg bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
          >
            Agregar al pedido
          </button>

        </div>

      </div>

    </div>
  );
}