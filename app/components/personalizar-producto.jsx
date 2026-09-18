"use client";

import { useState } from "react";

export default function PersonalizarProducto({
  producto,
  tipo,
  onGuardar,
  onCancelar,
}) {
  const [ingredientes, setIngredientes] = useState({
    Lechuga: true,
    Tomate: true,
    Queso: true,
    Cebolla: false,
    Pepinillos: false,
    Salsa: false,
  });

  const [adicionales, setAdicionales] = useState({
    Bacon: false,
    Huevo: false,
    "Extra Queso": true,
    "Aros de Cebolla": false,
    Guacamole: false,
  });

  const [cremas, setCremas] = useState({
    Mayonesa: false,
    Ketchup: false,
    Mostaza: false,
    "Crema de Ají": false,
    "Crema de Rocoto": false,
    "Crema Golf": false,
  });

  const ingredientesDisponibles = [
    "Lechuga",
    "Tomate",
    "Queso",
    "Cebolla",
    "Pepinillos",
    "Salsa",
  ];

  const adicionalesDisponibles = [
    { nombre: "Bacon", precio: 3 },
    { nombre: "Huevo", precio: 2 },
    { nombre: "Extra Queso", precio: 2 },
    { nombre: "Aros de Cebolla", precio: 4 },
    { nombre: "Guacamole", precio: 3.5 },
  ];

  const cremasDisponibles = [
    "Mayonesa",
    "Ketchup",
    "Mostaza",
    "Crema de Ají",
    "Crema de Rocoto",
    "Crema Golf",
  ];

  const cambiarIngrediente = (nombre) => {
    setIngredientes((actual) => ({
      ...actual,
      [nombre]: !actual[nombre],
    }));
  };

  const cambiarAdicional = (nombre) => {
    setAdicionales((actual) => ({
      ...actual,
      [nombre]: !actual[nombre],
    }));
  };

  const cambiarCrema = (nombre) => {
    setCremas((actual) => ({
      ...actual,
      [nombre]: !actual[nombre],
    }));
  };

  const totalAdicionales = adicionalesDisponibles.reduce(
    (total, adicional) => {
      if (adicionales[adicional.nombre]) {
        return total + adicional.precio;
      }

      return total;
    },
    0
  );

  const guardarHamburguesa = () => {
    onGuardar({
      ...producto,
      personalizacion: {
        ingredientes: Object.keys(ingredientes).filter(
          (nombre) => ingredientes[nombre]
        ),
        adicionales: Object.keys(adicionales).filter(
          (nombre) => adicionales[nombre]
        ),
      },
      precioFinal: producto.precio + totalAdicionales,
    });
  };

  const guardarCremas = () => {
    onGuardar({
      ...producto,
      personalizacion: {
        cremas: Object.keys(cremas).filter((nombre) => cremas[nombre]),
      },
      precioFinal: producto.precio,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
      <div className="relative max-h-[95vh] w-full max-w-4xl overflow-hidden rounded-xl border border-gray-300 bg-white shadow-2xl">
        
        {/* CABECERA */}
        <div className="border-b border-gray-300 px-6 py-4 text-center">
          <button
            onClick={onCancelar}
            className="absolute right-5 top-4 text-4xl font-light leading-none text-gray-500 transition hover:text-gray-800"
          >
            ×
          </button>

          <h2 className="text-2xl font-bold text-slate-800 md:text-3xl">
            Personalizar Producto{" "}
            <span className="font-normal">FastOrder</span>
          </h2>
        </div>

        {/* NOMBRE DEL PRODUCTO */}
        <div className="border-b border-gray-300 px-6 py-4 text-center">
          <h3 className="text-2xl font-bold text-slate-800">
            {producto.nombre}
          </h3>
        </div>

        {tipo === "hamburguesa" && (
          <>
            <div className="grid grid-cols-1 gap-8 px-7 py-5 md:grid-cols-2">
              
              <div>
                <h4 className="mb-5 text-2xl font-bold text-slate-800">
                  Ingredientes:
                </h4>

                <div className="space-y-4">
                  {ingredientesDisponibles.map((ingrediente) => (
                    <label
                      key={ingrediente}
                      className="flex cursor-pointer items-center gap-3 text-xl text-slate-800"
                    >
                      <input
                        type="checkbox"
                        checked={ingredientes[ingrediente]}
                        onChange={() => cambiarIngrediente(ingrediente)}
                        className="h-7 w-7 cursor-pointer accent-blue-600"
                      />

                      <span>{ingrediente}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="mb-5 text-2xl font-bold text-slate-800">
                  Adicionales:
                </h4>

                <div className="space-y-4">
                  {adicionalesDisponibles.map((adicional) => (
                    <label
                      key={adicional.nombre}
                      className="flex cursor-pointer items-center justify-between gap-3 text-xl text-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={adicionales[adicional.nombre]}
                          onChange={() =>
                            cambiarAdicional(adicional.nombre)
                          }
                          className="h-7 w-7 cursor-pointer accent-blue-600"
                        />

                        <span>{adicional.nombre}</span>
                      </div>

                      <span className="font-bold">
                        S/ {adicional.precio.toFixed(2)}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="mt-5 border-t border-gray-300 pt-3 text-right">
                  <span className="text-2xl font-bold text-slate-800">
                    Vuelto: S/ {totalAdicionales.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-3 border-t border-gray-300 px-6 py-4">
              <button
                onClick={onCancelar}
                className="w-full max-w-xs rounded-lg border-2 border-gray-300 bg-white px-6 py-3 text-xl font-bold text-gray-700 transition hover:bg-gray-100"
              >
                Cancelar
              </button>

              <button
                onClick={guardarHamburguesa}
                className="w-full max-w-xs rounded-lg bg-blue-600 px-6 py-3 text-xl font-bold text-white transition hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </>
        )}

        {tipo === "cremas" && (
          <>
            <div className="px-7 py-6">
              <h4 className="mb-5 text-2xl font-bold text-slate-800">
                Cremas:
              </h4>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {cremasDisponibles.map((crema) => (
                  <label
                    key={crema}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 text-xl text-slate-800 transition hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={cremas[crema]}
                      onChange={() => cambiarCrema(crema)}
                      className="h-7 w-7 cursor-pointer accent-blue-600"
                    />

                    <span>{crema}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-center gap-3 border-t border-gray-300 px-6 py-4">
              <button
                onClick={onCancelar}
                className="w-full max-w-xs rounded-lg border-2 border-gray-300 bg-white px-6 py-3 text-xl font-bold text-gray-700 transition hover:bg-gray-100"
              >
                Cancelar
              </button>

              <button
                onClick={guardarCremas}
                className="w-full max-w-xs rounded-lg bg-blue-600 px-6 py-3 text-xl font-bold text-white transition hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}