"use client";

import { useState } from "react";

const PRECIO_SALSA = 2.5;
const PAPAS = ["Papa frita", "Papa hilo", "Ninguna"];
const CARNES = ["Pollo", "Filete", "Carne"];
const ENSALADA = ["Con ensalada", "Sin ensalada"];
const MODALIDADES = ["Salón", "Llevar", "Recoger", "Delivery"];
const CREMAS_HAMB = ["Mayonesa", "Ketchup", "Ají", "Mostaza", "Huancaina", "Huacatay", "Tartara", "Aceituna", "Piña"];
const CREMAS_SALCHI = ["Mayonesa", "Ketchup", "Mostaza", "Ají", "Golf", "Tártara"];
const PORCIONES = [6, 9, 12, 18, 24, 36];
const SALSAS_ALITAS = ["Acevichada", "BBQ", "BBQ Picante", "Maracuyá", "Hawaiana"];

const AZUL = "border-blue-500 bg-blue-500 text-white";
const ROJO = "border-red-500 bg-red-500 text-white";
const OFF = "border-gray-300 bg-white text-gray-700 hover:border-blue-400";

function Seccion({ titulo, nota, children }) {
  return (
    <div>
      <h3 className="text-lg font-bold text-slate-800">{titulo}</h3>
      {nota && <p className="mt-1 text-sm text-gray-500">{nota}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Botones({ opciones, activa, onClick, cols = "grid-cols-3", on = AZUL, etiqueta = (o) => o }) {
  return (
    <div className={`grid ${cols} gap-2`}>
      {opciones.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onClick(o)}
          className={`rounded-lg border-2 px-3 py-3 font-semibold transition ${activa(o) ? on : OFF}`}
        >
          {etiqueta(o)}
        </button>
      ))}
    </div>
  );
}

const alternar = (setter, valor) =>
  setter((a) => (a.includes(valor) ? a.filter((x) => x !== valor) : [...a, valor]));

export default function PersonalizarProducto({ producto, tipo, onGuardar, onCancelar }) {
  const [papas, setPapas] = useState("Ninguna");
  const [carne, setCarne] = useState("Pollo");
  const [ensalada, setEnsalada] = useState("Sin ensalada");
  const [modalidad, setModalidad] = useState("Salón");
  const [cremasHamb, setCremasHamb] = useState([]);
  const [cremas, setCremas] = useState([]);
  const [temperatura, setTemperatura] = useState("Helada");
  const [porcion, setPorcion] = useState(6);
  const [salsas, setSalsas] = useState([]);
  const [observacion, setObservacion] = useState("");

  const precioBase = Number(producto.precio_venta);
  const precioFinal = tipo === "alitas" ? precioBase + salsas.length * PRECIO_SALSA : precioBase;

  // personalizacion -> se muestra y se guarda como JSON
  // opciones -> filas para pedido_detalle_opciones (tipo, nombre, precio_adicional)
  const guardar = () => {
    let personalizacion = {};
    let opciones = [];

    if (tipo === "alitas") {
      personalizacion = { porcion, observacion, salsas, modalidad };
      opciones = salsas.map((s) => ({ tipo: "extra", nombre: `Salsa ${s}`, precio_adicional: PRECIO_SALSA }));
    } else if (tipo === "bebida") {
      personalizacion = { temperatura };
    } else if (tipo === "cremas") {
      personalizacion = { cremas, modalidad };
      opciones = cremas.map((c) => ({ tipo: "salsa", nombre: c, precio_adicional: 0 }));
    } else {
      personalizacion = { papas, carne, ensalada, modalidad, cremas: cremasHamb, observacion };
      opciones = cremasHamb.map((c) => ({ tipo: "salsa", nombre: c, precio_adicional: 0 }));
      if (ensalada === "Sin ensalada")
        opciones.push({ tipo: "retirable", nombre: "ensalada", precio_adicional: 0 });
    }

    onGuardar({ ...producto, precioFinal, personalizacion, opciones });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 p-5">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Personalizar producto</h2>
            <p className="mt-1 text-lg font-semibold text-blue-600">{producto.nombre}</p>
          </div>
          <button onClick={onCancelar} className="rounded-full bg-red-600 px-3 py-1 font-bold text-white hover:bg-red-700">
            X
          </button>
        </div>

        <div className="space-y-6 p-5">
          {/* HAMBURGUESAS */}
          {tipo === "hamburguesa" && (
            <>
              <Seccion titulo="Papas">
                <Botones opciones={PAPAS} activa={(o) => papas === o} onClick={setPapas} />
              </Seccion>

              <Seccion titulo="Carne">
                <Botones opciones={CARNES} activa={(o) => carne === o} onClick={setCarne} />
              </Seccion>

              <Seccion titulo="Ensalada">
                <Botones
                  opciones={ENSALADA}
                  cols="grid-cols-2"
                  activa={(o) => ensalada === o}
                  onClick={setEnsalada}
                />
              </Seccion>

              {modalidad !== "Salón" && (
                <Seccion titulo="Cremas" nota="Selecciona las cremas que deseas.">
                  <Botones
                    opciones={CREMAS_HAMB}
                    activa={(o) => cremasHamb.includes(o)}
                    onClick={(o) => alternar(setCremasHamb, o)}
                  />
                </Seccion>
              )}
            </>
          )}

          {(tipo === "hamburguesa" || tipo === "cremas" || tipo === "alitas") && (
            <Seccion titulo="Modalidad de atención">
              <Botones
                opciones={MODALIDADES}
                cols="grid-cols-2"
                on={ROJO}
                activa={(o) => modalidad === o}
                onClick={(o) => {
                  setModalidad(o);

                  if (o === "Salón") {
                    setCremasHamb([]);
                  }
                }}
              />
            </Seccion>
          )}

          {/* ALITAS */}
          {tipo === "alitas" && (
            <>
              <Seccion titulo="Selecciona la porción">
                <Botones
                  opciones={PORCIONES}
                  on={ROJO}
                  activa={(o) => porcion === o}
                  onClick={setPorcion}
                  etiqueta={(o) => `${o} alitas`}
                />
              </Seccion>
              <Seccion titulo={`Salsas adicionales (S/ ${PRECIO_SALSA.toFixed(2)} c/u)`}>
                <Botones
                  opciones={SALSAS_ALITAS}
                  cols="grid-cols-2"
                  activa={(o) => salsas.includes(o)}
                  onClick={(o) => alternar(setSalsas, o)}
                  etiqueta={(o) => (salsas.includes(o) ? `✓ ${o}` : o)}
                />
              </Seccion>
              <div className="rounded-lg bg-gray-100 p-4 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Precio base:</span><span className="font-semibold">S/ {precioBase.toFixed(2)}</span></div>
                <div className="mt-2 flex justify-between"><span className="text-gray-600">Salsas ({salsas.length}):</span><span className="font-semibold">S/ {(salsas.length * PRECIO_SALSA).toFixed(2)}</span></div>
                <div className="mt-3 flex justify-between border-t border-gray-300 pt-3">
                  <span className="font-bold text-slate-800">Total:</span>
                  <span className="text-xl font-bold text-blue-600">S/ {precioFinal.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}

          {/* BEBIDAS */}
          {tipo === "bebida" && (
            <Seccion titulo="Temperatura">
              <Botones
                opciones={["Helada", "Sin helar"]}
                cols="grid-cols-2"
                on={ROJO}
                activa={(o) => temperatura === o}
                onClick={setTemperatura}
              />
            </Seccion>
          )}

          {/* SALCHIPAPAS */}
          {tipo === "cremas" && (
            <Seccion titulo="Selecciona tus cremas">
              <Botones
                opciones={CREMAS_SALCHI}
                cols="grid-cols-2"
                activa={(o) => cremas.includes(o)}
                onClick={(o) => alternar(setCremas, o)}
              />
            </Seccion>
          )}

          {/* OBSERVACIÓN (hamburguesas y alitas) */}
          {(tipo === "hamburguesa" || tipo === "alitas") && (
            <Seccion titulo="Observación">
              <textarea
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                placeholder="Escribe aquí alguna observación..."
                rows={3}
                className="w-full resize-none rounded-lg border-2 border-gray-300 px-4 py-3 text-sm text-black outline-none transition focus:border-blue-500"
              />
            </Seccion>
          )}
        </div>

        <div className="flex gap-3 border-t border-gray-200 p-5">
          <button type="button" onClick={onCancelar} className="flex-1 rounded-lg bg-gray-200 px-5 py-3 font-bold text-gray-700 hover:bg-gray-300">
            Cancelar
          </button>
          <button type="button" onClick={guardar} className="flex-1 rounded-lg bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700">
            Agregar al pedido
          </button>
        </div>
      </div>
    </div>
  );
}