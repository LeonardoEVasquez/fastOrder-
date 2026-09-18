"use client";

import { useState } from "react";

export default function Cobro({ pedido, total }) {
  const [tipoPedido, setTipoPedido] = useState("Llevar");
  const [nombreCliente, setNombreCliente] = useState("");
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [efectivoRecibido, setEfectivoRecibido] = useState(0);

  const vuelto =
    metodoPago === "Efectivo"
      ? efectivoRecibido - total
      : 0;

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
      <div className="w-full max-w-lg rounded-xl border border-gray-300 bg-white shadow-md overflow-hidden">

        
        <div className="border-b border-gray-300 px-6 py-4 text-center">
          <h1 className="text-2xl font-bold text-slate-800">
            Generando Pedido #001
          </h1>
        </div>

        <div className="p-6 space-y-5">

          
          <div className="flex gap-3">
            <button
              onClick={() => setTipoPedido("Salón")}
              className={`flex-1 rounded-lg px-4 py-2 font-bold transition ${
                tipoPedido === "Salón"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Salón
            </button>

            <button
              onClick={() => setTipoPedido("Llevar")}
              className={`flex-1 rounded-lg px-4 py-2 font-bold transition ${
                tipoPedido === "Llevar"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Llevar
            </button>
          </div>

          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Cliente
            </label>

            <input
              type="text"
              value={nombreCliente}
              onChange={(e) => setNombreCliente(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
              placeholder="Escribe el nombre..."
            />
          </div>

          
          <div className="grid grid-cols-2 gap-3">
            {["Efectivo", "Yape", "Plin", "Tarjeta"].map((metodo) => (
              <button
                key={metodo}
                onClick={() => setMetodoPago(metodo)}
                className={`rounded-lg px-4 py-3 font-bold transition ${
                  metodoPago === metodo
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {metodo}
              </button>
            ))}
          </div>

          
          <div className="border-t border-gray-300 pt-4">
            <h2 className="text-lg font-bold mb-2">
              Detalle del Pedido
            </h2>

            <ul className="space-y-2">
              {pedido.map((item, i) => (
                <li
                  key={`${item.id}-${i}`}
                  className="text-gray-700 font-medium"
                >
                  <div className="flex justify-between">
                    <span>
                      {item.nombre} x{item.cantidad}
                    </span>

                    <span>
                      S/ {(item.precio * item.cantidad).toFixed(2)}
                    </span>
                  </div>

                  {/* Personalización */}
                  {item.personalizacion?.ingredientes && (
                    <p className="text-xs text-gray-500">
                      {item.personalizacion.ingredientes.join(", ")}
                    </p>
                  )}

                  {item.personalizacion?.adicionales?.length > 0 && (
                    <p className="text-xs text-gray-500">
                      + {item.personalizacion.adicionales.join(", ")}
                    </p>
                  )}

                  {item.personalizacion?.cremas && (
                    <p className="text-xs text-gray-500">
                      Cremas:{" "}
                      {item.personalizacion.cremas.length > 0
                        ? item.personalizacion.cremas.join(", ")
                        : "Ninguna"}
                    </p>
                  )}
                </li>
              ))}
            </ul>

            <div className="flex justify-between font-bold text-lg mt-4">
              <span>Total:</span>

              <span>
                S/ {total.toFixed(2)}
              </span>
            </div>
          </div>

          
          {metodoPago === "Efectivo" && (
            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Efectivo Recibido
                </label>

                <input
                  type="number"
                  value={efectivoRecibido}
                  onChange={(e) =>
                    setEfectivoRecibido(Number(e.target.value))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
                  placeholder="Ej: 50.00"
                />
              </div>

              <div className="flex justify-between font-bold text-green-600">
                <span>Vuelto:</span>

                <span>
                  S/ {Math.max(vuelto, 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        
        <div className="px-6 pb-6">
          <button
            disabled={pedido.length === 0}
            className="w-full rounded-lg bg-blue-600 px-6 py-4 text-xl font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            Imprimir
          </button>
        </div>

      </div>
    </div>
  );
}