"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function Cobro({ pedido, total, onPedidoExitoso }) {
  const [tipoPedido, setTipoPedido] = useState("Llevar");
  const [nombreCliente, setNombreCliente] = useState("");
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [efectivoRecibido, setEfectivoRecibido] = useState(0);

  // Controla la aparición del modal de confirmación
  const [mostrarModal, setMostrarModal] = useState(false);
  const [guardandoPedido, setGuardandoPedido] = useState(false);

  const vuelto =
    metodoPago === "Efectivo"
      ? efectivoRecibido - total
      : 0;

  const confirmarPedido = async () => {
    try {
      setGuardandoPedido(true);
      const correlativo = `PED-${Date.now().toString().slice(-4)}`;

      // 1. Guardar en la tabla pedidos
      const { data: pedidoData, error: errPedido } = await supabase
        .from("pedidos")
        .insert([
          {
            numero_pedido: correlativo,
            cliente: nombreCliente.trim() || "Cliente General",
            tipo_pedido: tipoPedido,
            metodo_pago: metodoPago,
            total: total,
            efectivo_recibido: metodoPago === "Efectivo" ? efectivoRecibido : total,
            vuelto: Math.max(vuelto, 0),
            estado: "Pendiente",
          },
        ]);

      if (errPedido) throw errPedido;

      const pedidoId = pedidoData?.[0]?.id;

      // 2. Guardar en la tabla detalle_pedidos
      if (pedidoId && pedido.length > 0) {
        const detalles = pedido.map((item) => ({
          pedido_id: pedidoId,
          producto_id: item.id || null,
          nombre_producto: item.nombre,
          precio_unitario: item.precio,
          cantidad: item.cantidad,
          subtotal: item.precio * item.cantidad,
          personalizacion: item.personalizacion || {},
        }));

        await supabase.from("detalle_pedidos").insert(detalles);
      }

      setMostrarModal(false);
      window.print();

      if (onPedidoExitoso) {
        onPedidoExitoso();
      }
    } catch (err) {
      console.error("Error al registrar pedido en Supabase:", err);
      alert("Error al registrar el pedido: " + (err.message || err));
      window.print();
    } finally {
      setGuardandoPedido(false);
    }
  };

  return (
    /*
      ============================================================
      CONTENEDOR PRINCIPAL DEL COBRO
      ============================================================

      Este contenedor tiene una altura limitada a la ventana
      y permite hacer scroll vertical SOLO dentro del cobro.
    */
    <div className="h-[calc(100vh-2rem)] overflow-y-auto bg-slate-100 px-4 py-6">

      {/* =========================================================
          CONTENEDOR PRINCIPAL
      ========================================================== */}

      <div className="mx-auto w-full max-w-4xl">

        {/* =========================================================
            CABECERA
        ========================================================== */}

        <div className="mb-5 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                FastOrder
              </p>

              <h1 className="text-2xl font-extrabold text-slate-800">
                Generando Pedido #001
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Completa los datos del pedido antes de realizar el cobro.
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 px-4 py-3 text-center">
              <p className="text-xs font-semibold text-blue-600">
                TOTAL
              </p>

              <p className="text-2xl font-extrabold text-blue-700">
                S/ {total.toFixed(2)}
              </p>
            </div>

          </div>

        </div>

        {/* =========================================================
            TARJETA PRINCIPAL
        ========================================================== */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">

          <div className="space-y-7 p-6">

            {/* =====================================================
                TIPO DE PEDIDO
            ====================================================== */}

            <div>

              <div className="mb-3">
                <h2 className="text-lg font-bold text-slate-800">
                  Tipo de pedido
                </h2>

                <p className="text-sm text-slate-500">
                  Selecciona cómo se entregará el pedido.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

                {/* SALÓN */}

                <button
                  type="button"
                  onClick={() => setTipoPedido("Salón")}
                  className={`rounded-xl border px-4 py-3 font-bold transition-all duration-200 ${
                    tipoPedido === "Salón"
                      ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-200"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                  }`}
                >
                  Salón
                </button>

                {/* LLEVAR */}

                <button
                  type="button"
                  onClick={() => setTipoPedido("Llevar")}
                  className={`rounded-xl border px-4 py-3 font-bold transition-all duration-200 ${
                    tipoPedido === "Llevar"
                      ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-200"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                  }`}
                >
                  Llevar
                </button>

                {/* RECOGER */}

                <button
                  type="button"
                  onClick={() => setTipoPedido("Recoger")}
                  className={`rounded-xl border px-4 py-3 font-bold transition-all duration-200 ${
                    tipoPedido === "Recoger"
                      ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-200"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                  }`}
                >
                  Recoger
                </button>

                {/* DELIVERY */}

                <button
                  type="button"
                  onClick={() => setTipoPedido("Delivery")}
                  className={`rounded-xl border px-4 py-3 font-bold transition-all duration-200 ${
                    tipoPedido === "Delivery"
                      ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-200"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                  }`}
                >
                  Delivery
                </button>

              </div>

            </div>

            {/* =====================================================
                CLIENTE
            ====================================================== */}

            <div>

              <div className="mb-3">
                <h2 className="text-lg font-bold text-slate-800">
                  Datos del cliente
                </h2>

                <p className="text-sm text-slate-500">
                  Ingresa el nombre para identificar el pedido.
                </p>
              </div>

              <input
                type="text"
                value={nombreCliente}
                onChange={(e) =>
                  setNombreCliente(e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder="Escribe el nombre del cliente..."
              />

            </div>

            {/* =====================================================
                MÉTODO DE PAGO
            ====================================================== */}

            <div>

              <div className="mb-3">
                <h2 className="text-lg font-bold text-slate-800">
                  Método de pago
                </h2>

                <p className="text-sm text-slate-500">
                  Selecciona cómo realizará el pago.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

                {[
                  "Efectivo",
                  "Yape",
                  "Plin",
                  "Tarjeta",
                ].map((metodo) => (

                  <button
                    key={metodo}
                    type="button"
                    onClick={() =>
                      setMetodoPago(metodo)
                    }
                    className={`rounded-xl border px-4 py-3 font-bold transition-all duration-200 ${
                      metodoPago === metodo
                        ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-200"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    {metodo}
                  </button>

                ))}

              </div>

            </div>

            {/* =====================================================
                DETALLE DEL PEDIDO
            ====================================================== */}

            <div>

              <div className="mb-4 flex items-center justify-between">

                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Detalle del pedido
                  </h2>

                  <p className="text-sm text-slate-500">
                    Productos y personalizaciones seleccionadas.
                  </p>
                </div>

                <div className="rounded-lg bg-slate-100 px-3 py-2">
                  <span className="text-sm font-bold text-slate-600">
                    {pedido.length} producto
                    {pedido.length !== 1 ? "s" : ""}
                  </span>
                </div>

              </div>

              <div className="space-y-3">

                {pedido.map((item, i) => (

                  <div
                    key={`${item.id}-${i}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300"
                  >

                    {/* NOMBRE / PRECIO */}

                    <div className="flex items-start justify-between gap-4">

                      <div className="min-w-0">

                        <h3 className="font-bold text-slate-800">
                          {item.nombre}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Cantidad:{" "}
                          <span className="font-bold text-slate-700">
                            {item.cantidad}
                          </span>
                        </p>

                      </div>

                      <span className="whitespace-nowrap rounded-lg bg-white px-3 py-2 text-sm font-extrabold text-slate-800 shadow-sm">
                        S/{" "}
                        {(
                          item.precio *
                          item.cantidad
                        ).toFixed(2)}
                      </span>

                    </div>

                    {/* =================================================
                        PERSONALIZACIÓN
                    ================================================== */}

                    {item.personalizacion && (

                      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">

                        <p className="mb-3 text-xs font-extrabold uppercase tracking-wider text-slate-400">
                          Personalización
                        </p>

                        <div className="grid gap-2 sm:grid-cols-2">

                          {/* PAPAS */}

                          {item.personalizacion.papas && (
                            <div className="rounded-lg bg-slate-50 px-3 py-2">

                              <p className="text-xs font-semibold text-slate-400">
                                Papas
                              </p>

                              <p className="text-sm font-bold text-slate-700">
                                {item.personalizacion.papas}
                              </p>

                            </div>
                          )}

                          {/* CARNE */}

                          {item.personalizacion.carne && (
                            <div className="rounded-lg bg-slate-50 px-3 py-2">

                              <p className="text-xs font-semibold text-slate-400">
                                Carne
                              </p>

                              <p className="text-sm font-bold text-slate-700">
                                {item.personalizacion.carne}
                              </p>

                            </div>
                          )}

                          {/* ENSALADA */}

                          {item.personalizacion.ensalada && (
                            <div className="rounded-lg bg-slate-50 px-3 py-2">

                              <p className="text-xs font-semibold text-slate-400">
                                Ensalada
                              </p>

                              <p className="text-sm font-bold text-slate-700">
                                {item.personalizacion.ensalada}
                              </p>

                            </div>
                          )}

                          {/* MODALIDAD */}

                          {item.personalizacion.modalidad && (
                            <div className="rounded-lg bg-slate-50 px-3 py-2">

                              <p className="text-xs font-semibold text-slate-400">
                                Modalidad
                              </p>

                              <p className="text-sm font-bold text-slate-700">
                                {item.personalizacion.modalidad}
                              </p>

                            </div>
                          )}

                          {/* CREMAS */}

                          {item.personalizacion.cremas &&
                            item.personalizacion.modalidad !==
                              "Salón" && (

                              <div className="rounded-lg bg-slate-50 px-3 py-2 sm:col-span-2">

                                <p className="text-xs font-semibold text-slate-400">
                                  Cremas
                                </p>

                                <p className="text-sm font-bold text-slate-700">
                                  {item.personalizacion.cremas.length > 0
                                    ? item.personalizacion.cremas.join(", ")
                                    : "Ninguna"}
                                </p>

                              </div>

                          )}

                          {/* CREMAS SALCHIPAPA */}

                          {item.personalizacion.cremas &&
                            !item.personalizacion.modalidad && (

                              <div className="rounded-lg bg-slate-50 px-3 py-2 sm:col-span-2">

                                <p className="text-xs font-semibold text-slate-400">
                                  Cremas
                                </p>

                                <p className="text-sm font-bold text-slate-700">
                                  {item.personalizacion.cremas.length > 0
                                    ? item.personalizacion.cremas.join(", ")
                                    : "Ninguna"}
                                </p>

                              </div>

                          )}

                          {/* TEMPERATURA */}

                          {item.personalizacion.temperatura && (
                            <div className="rounded-lg bg-slate-50 px-3 py-2">

                              <p className="text-xs font-semibold text-slate-400">
                                Temperatura
                              </p>

                              <p className="text-sm font-bold text-slate-700">
                                {item.personalizacion.temperatura}
                              </p>

                            </div>
                          )}

                          {/* PORCIÓN */}

                          {item.personalizacion.porcion && (
                            <div className="rounded-lg bg-slate-50 px-3 py-2">

                              <p className="text-xs font-semibold text-slate-400">
                                Porción
                              </p>

                              <p className="text-sm font-bold text-slate-700">
                                {item.personalizacion.porcion} alitas
                              </p>

                            </div>
                          )}

                          {/* SALSAS */}

                          {item.personalizacion.salsas && (
                            <div className="rounded-lg bg-slate-50 px-3 py-2 sm:col-span-2">

                              <p className="text-xs font-semibold text-slate-400">
                                Salsas adicionales
                              </p>

                              <p className="text-sm font-bold text-slate-700">
                                {item.personalizacion.salsas.length > 0
                                  ? item.personalizacion.salsas.join(", ")
                                  : "Ninguna"}
                              </p>

                            </div>
                          )}

                          {/* OBSERVACIÓN */}

                          {item.personalizacion.observacion && (
                            <div className="rounded-lg bg-amber-50 px-3 py-2 sm:col-span-2">

                              <p className="text-xs font-semibold text-amber-600">
                                Observación
                              </p>

                              <p className="break-words text-sm font-medium text-slate-700">
                                {item.personalizacion.observacion}
                              </p>

                            </div>
                          )}

                          {/* INGREDIENTES */}

                          {item.personalizacion.ingredientes && (
                            <div className="rounded-lg bg-slate-50 px-3 py-2 sm:col-span-2">

                              <p className="text-xs font-semibold text-slate-400">
                                Ingredientes
                              </p>

                              <p className="text-sm font-bold text-slate-700">
                                {item.personalizacion.ingredientes.join(", ")}
                              </p>

                            </div>
                          )}

                          {/* ADICIONALES */}

                          {item.personalizacion.adicionales?.length > 0 && (

                            <div className="rounded-lg bg-slate-50 px-3 py-2 sm:col-span-2">

                              <p className="text-xs font-semibold text-slate-400">
                                Adicionales
                              </p>

                              <p className="text-sm font-bold text-slate-700">
                                {item.personalizacion.adicionales.join(", ")}
                              </p>

                            </div>

                          )}

                        </div>

                      </div>

                    )}

                    {/* PRECIO UNITARIO */}

                    <div className="mt-3 border-t border-slate-200 pt-3">

                      <p className="text-xs font-semibold text-blue-600">
                        S/ {item.precio.toFixed(2)} c/u
                      </p>

                    </div>

                  </div>

                ))}

              </div>

              {/* TOTAL */}

              <div className="mt-5 flex items-center justify-between rounded-2xl bg-slate-900 px-5 py-4 text-white">

                <span className="text-lg font-bold">
                  Total a pagar
                </span>

                <span className="text-2xl font-extrabold">
                  S/ {total.toFixed(2)}
                </span>

              </div>

            </div>

            {/* =====================================================
                EFECTIVO
            ====================================================== */}

            {metodoPago === "Efectivo" && (

              <div className="rounded-2xl border border-green-200 bg-green-50 p-5">

                <div className="mb-3">

                  <h2 className="text-lg font-bold text-slate-800">
                    Pago en efectivo
                  </h2>

                  <p className="text-sm text-slate-500">
                    Ingresa el monto recibido del cliente.
                  </p>

                </div>

                <input
                  type="number"
                  min="0"
                  value={efectivoRecibido}
                  onChange={(e) =>
                    setEfectivoRecibido(
                      Number(e.target.value)
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg font-bold text-slate-800 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  placeholder="Ej: 50.00"
                />

                <div className="mt-4 flex items-center justify-between rounded-xl bg-white px-4 py-3">

                  <span className="font-bold text-slate-600">
                    Vuelto
                  </span>

                  <span className="text-xl font-extrabold text-green-600">
                    S/{" "}
                    {Math.max(vuelto, 0).toFixed(2)}
                  </span>

                </div>

              </div>

            )}

          </div>

          {/* =====================================================
              BOTÓN REVISAR
          ====================================================== */}

          <div className="border-t border-slate-200 bg-slate-50 p-6">

            <button
              type="button"
              disabled={pedido.length === 0}
              onClick={() => setMostrarModal(true)}
              className="w-full rounded-xl bg-blue-600 px-6 py-4 text-lg font-extrabold text-white shadow-lg shadow-blue-200 transition-all duration-200 hover:bg-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              Revisar y confirmar pedido
            </button>

          </div>

        </div>

      </div>

      {/* =========================================================
          MODAL DE CONFIRMACIÓN
      ========================================================== */}

      {mostrarModal && (

        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

          <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* =====================================================
                CABECERA DEL MODAL
            ====================================================== */}

            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-4">

              <div>

                <p className="text-xs font-extrabold uppercase tracking-widest text-blue-600">
                  FastOrder
                </p>

                <h2 className="text-xl font-extrabold text-slate-800">
                  Resumen del Pedido
                </h2>

                <p className="text-sm text-slate-500">
                  Verifica la información antes de imprimir.
                </p>

              </div>

              <button
                type="button"
                onClick={() => setMostrarModal(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
              >
                ×
              </button>

            </div>

            {/* =====================================================
                CONTENIDO DEL RESUMEN
            ====================================================== */}

            <div className="min-h-0 flex-1 overflow-y-auto bg-slate-100">

              <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">

                {/* COLUMNA IZQUIERDA */}

                <div className="hidden border-r border-slate-200 bg-white p-4 lg:block">

                  <div className="space-y-4">

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Cliente
                      </p>

                      <p className="mt-1 font-bold text-slate-800">
                        {nombreCliente || "Sin nombre"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Tipo de pedido
                      </p>

                      <p className="mt-1 font-bold text-slate-800">
                        {tipoPedido}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Método de pago
                      </p>

                      <p className="mt-1 font-bold text-slate-800">
                        {metodoPago}
                      </p>
                    </div>

                    {metodoPago === "Efectivo" && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Efectivo recibido
                        </p>

                        <p className="mt-1 font-bold text-slate-800">
                          S/ {efectivoRecibido.toFixed(2)}
                        </p>
                      </div>
                    )}

                    {metodoPago === "Efectivo" && (
                      <div className="rounded-xl bg-green-50 p-3">

                        <p className="text-xs font-bold uppercase tracking-wider text-green-600">
                          Vuelto
                        </p>

                        <p className="mt-1 text-xl font-extrabold text-green-700">
                          S/ {Math.max(vuelto, 0).toFixed(2)}
                        </p>

                      </div>
                    )}

                    <div className="rounded-xl bg-blue-50 p-4">

                      <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                        Total
                      </p>

                      <p className="mt-1 text-2xl font-extrabold text-blue-700">
                        S/ {total.toFixed(2)}
                      </p>

                    </div>

                  </div>

                </div>

                {/* =================================================
                    PRODUCTOS
                ================================================== */}

                <div className="p-4">

                  <div className="mb-4">

                    <h3 className="text-lg font-extrabold text-slate-800">
                      Productos
                    </h3>

                    <p className="text-sm text-slate-500">
                      {pedido.length} producto
                      {pedido.length !== 1 ? "s" : ""} en el pedido.
                    </p>

                  </div>

                  <div className="space-y-3">

                    {pedido.map((item, i) => (

                      <div
                        key={`${item.id}-${i}`}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                      >

                        <div className="flex items-start justify-between gap-4">

                          <div>

                            <h4 className="font-extrabold text-slate-800">
                              {item.nombre}
                            </h4>

                            <p className="mt-1 text-sm text-slate-500">
                              Cantidad:{" "}
                              <span className="font-bold text-slate-700">
                                {item.cantidad}
                              </span>
                            </p>

                          </div>

                          <p className="whitespace-nowrap font-extrabold text-slate-800">
                            S/{" "}
                            {(
                              item.precio *
                              item.cantidad
                            ).toFixed(2)}
                          </p>

                        </div>

                        {item.personalizacion && (

                          <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">

                            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                              Personalización
                            </p>

                            <div className="grid gap-2 sm:grid-cols-2">

                              {item.personalizacion.papas && (
                                <div className="rounded-lg bg-slate-50 px-3 py-2">

                                  <p className="text-xs text-slate-400">
                                    Papas
                                  </p>

                                  <p className="text-sm font-bold text-slate-700">
                                    {item.personalizacion.papas}
                                  </p>

                                </div>
                              )}

                              {item.personalizacion.carne && (
                                <div className="rounded-lg bg-slate-50 px-3 py-2">

                                  <p className="text-xs text-slate-400">
                                    Carne
                                  </p>

                                  <p className="text-sm font-bold text-slate-700">
                                    {item.personalizacion.carne}
                                  </p>

                                </div>
                              )}

                              {item.personalizacion.ensalada && (
                                <div className="rounded-lg bg-slate-50 px-3 py-2">

                                  <p className="text-xs text-slate-400">
                                    Ensalada
                                  </p>

                                  <p className="text-sm font-bold text-slate-700">
                                    {item.personalizacion.ensalada}
                                  </p>

                                </div>
                              )}

                              {item.personalizacion.modalidad && (
                                <div className="rounded-lg bg-slate-50 px-3 py-2">

                                  <p className="text-xs text-slate-400">
                                    Modalidad
                                  </p>

                                  <p className="text-sm font-bold text-slate-700">
                                    {item.personalizacion.modalidad}
                                  </p>

                                </div>
                              )}

                              {item.personalizacion.cremas && (
                                <div className="rounded-lg bg-slate-50 px-3 py-2 sm:col-span-2">

                                  <p className="text-xs text-slate-400">
                                    Cremas
                                  </p>

                                  <p className="text-sm font-bold text-slate-700">
                                    {item.personalizacion.cremas.length > 0
                                      ? item.personalizacion.cremas.join(", ")
                                      : "Ninguna"}
                                  </p>

                                </div>
                              )}

                              {item.personalizacion.temperatura && (
                                <div className="rounded-lg bg-slate-50 px-3 py-2">

                                  <p className="text-xs text-slate-400">
                                    Temperatura
                                  </p>

                                  <p className="text-sm font-bold text-slate-700">
                                    {item.personalizacion.temperatura}
                                  </p>

                                </div>
                              )}

                              {item.personalizacion.porcion && (
                                <div className="rounded-lg bg-slate-50 px-3 py-2">

                                  <p className="text-xs text-slate-400">
                                    Porción
                                  </p>

                                  <p className="text-sm font-bold text-slate-700">
                                    {item.personalizacion.porcion} alitas
                                  </p>

                                </div>
                              )}

                              {item.personalizacion.salsas && (
                                <div className="rounded-lg bg-slate-50 px-3 py-2 sm:col-span-2">

                                  <p className="text-xs text-slate-400">
                                    Salsas adicionales
                                  </p>

                                  <p className="text-sm font-bold text-slate-700">
                                    {item.personalizacion.salsas.length > 0
                                      ? item.personalizacion.salsas.join(", ")
                                      : "Ninguna"}
                                  </p>

                                </div>
                              )}

                              {item.personalizacion.observacion && (
                                <div className="rounded-lg bg-amber-50 px-3 py-2 sm:col-span-2">

                                  <p className="text-xs font-semibold text-amber-600">
                                    Observación
                                  </p>

                                  <p className="break-words text-sm font-medium text-slate-700">
                                    {item.personalizacion.observacion}
                                  </p>

                                </div>
                              )}

                              {item.personalizacion.ingredientes && (
                                <div className="rounded-lg bg-slate-50 px-3 py-2 sm:col-span-2">

                                  <p className="text-xs text-slate-400">
                                    Ingredientes
                                  </p>

                                  <p className="text-sm font-bold text-slate-700">
                                    {item.personalizacion.ingredientes.join(", ")}
                                  </p>

                                </div>
                              )}

                              {item.personalizacion.adicionales?.length > 0 && (
                                <div className="rounded-lg bg-slate-50 px-3 py-2 sm:col-span-2">

                                  <p className="text-xs text-slate-400">
                                    Adicionales
                                  </p>

                                  <p className="text-sm font-bold text-slate-700">
                                    {item.personalizacion.adicionales.join(", ")}
                                  </p>

                                </div>
                              )}

                            </div>

                          </div>

                        )}

                      </div>

                    ))}

                  </div>

                  {/* TOTAL */}

                  <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-900 px-4 py-4 text-white">

                    <span className="font-bold">
                      Total a pagar
                    </span>

                    <span className="text-xl font-extrabold">
                      S/ {total.toFixed(2)}
                    </span>

                  </div>

                </div>

              </div>

            </div>

            {/* =====================================================
                BOTONES
            ====================================================== */}

            <div className="flex shrink-0 justify-end gap-3 border-t border-slate-200 bg-white p-4">

              <button
                type="button"
                onClick={() => setMostrarModal(false)}
                className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 transition hover:bg-slate-100"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={guardandoPedido}
                onClick={confirmarPedido}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 hover:shadow-lg disabled:opacity-50"
              >
                {guardandoPedido ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    <span>Guardando Pedido...</span>
                  </>
                ) : (
                  <span>Confirmar e Imprimir</span>
                )}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}