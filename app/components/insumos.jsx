"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function Insumos() {
const [modalAbierto, setModalAbierto] = useState(false);
const [insumos, setInsumos] = useState([]);
const [cargando, setCargando] = useState(true);
const [guardando, setGuardando] = useState(false);

const [insumoEditando, setInsumoEditando] = useState(null);
const [desactivandoId, setDesactivandoId] = useState(null);

const [formulario, setFormulario] = useState({
nombre: "",
unidad: "unidad",
stockActual: "",
stockMinimo: "",
tieneVencimiento: true,
});

const cargarInsumos = async () => {
try {
setCargando(true);

  const { data, error } = await supabase
    .from("insumos")
    .select("*")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  if (error) throw error;

  setInsumos(data || []);
} catch (error) {
  console.error("Error al cargar insumos:", error);

  alert(
    "No se pudieron cargar los insumos: " +
      (error?.message || error)
  );
} finally {
  setCargando(false);
}

};

useEffect(() => {
cargarInsumos();
}, []);

const abrirModal = () => {
setInsumoEditando(null);

setFormulario({
  nombre: "",
  unidad: "unidad",
  stockActual: "",
  stockMinimo: "",
  tieneVencimiento: true,
});

setModalAbierto(true);

};

const cerrarModal = () => {
if (guardando) return;

setModalAbierto(false);
setInsumoEditando(null);

};

const cambiarCampo = (campo, valor) => {
setFormulario((prev) => ({
...prev,
[campo]: valor,
}));
};

const validarCantidad = (valor, unidad, campo) => {
  if (valor === "" || !Number.isFinite(Number(valor))) {
    return "Ingresa una cantidad válida.";
  }

  const cantidad = Number(valor);

  if (cantidad < 0) {
    return "La cantidad no puede ser negativa.";
  }

  if (cantidad === 0 && campo === "stock actual") {
    return null;
  }

  const cantidadesMinimas = {
    unidad: 1,
    kg: 1,
    g: 100,
    l: 1,
    ml: 100,
  };

  const minimo = cantidadesMinimas[unidad];

  if (minimo === undefined) {
    return "Selecciona una unidad de medida válida.";
  }

  if (cantidad < minimo) {
    return `El ${campo} debe ser como mínimo ${minimo} ${unidad}.`;
  }

  if (
    ["unidad", "kg", "l"].includes(unidad) &&
    !Number.isInteger(cantidad)
  ) {
    return "Esta unidad solo permite cantidades enteras.";
  }

  if (
    ["g", "ml"].includes(unidad) &&
    !/^\d+(\.\d{1,2})?$/.test(valor)
  ) {
    return "Ingresa como máximo dos decimales.";
  }

  return null;
};

const guardarInsumo = async (e) => {
e.preventDefault();

const nombre = formulario.nombre.trim();
const stockActual = Number(formulario.stockActual);
const stockMinimo = Number(formulario.stockMinimo);

if (!nombre) {
  alert("Ingresa el nombre del insumo.");
  return;
}

const errorStockActual = validarCantidad(
  formulario.stockActual,
  formulario.unidad,
  "stock actual"
);

if (errorStockActual) {
  alert(errorStockActual);
  return;
}

const errorStockMinimo = validarCantidad(
  formulario.stockMinimo,
  formulario.unidad,
  "stock mínimo"
);

if (errorStockMinimo) {
  alert(errorStockMinimo);
  return;
}

if (
  formulario.stockActual === "" ||
  Number.isNaN(stockActual) ||
  stockActual < 0
) {
  alert("Ingresa un stock actual válido.");
  return;
}

if (
  formulario.stockMinimo === "" ||
  Number.isNaN(stockMinimo) ||
  stockMinimo < 0
) {
  alert("Ingresa un stock mínimo válido.");
  return;
}

if (stockMinimo > stockActual) {
  const continuar = window.confirm(
    "El stock mínimo es mayor que el stock actual.\n\n" +
      "El insumo quedará registrado como stock bajo.\n\n" +
      "¿Deseas continuar?"
  );

  if (!continuar) return;
}

try {
  setGuardando(true);

  if (insumoEditando) {
    
const { data: actualizado, error } = await supabase
  .from("insumos")
  .update({
    nombre,
    unidad_medida: formulario.unidad,
    stock_actual: stockActual,
    stock_minimo: stockMinimo,
    perecible: formulario.tieneVencimiento,
  })
  .eq("id", insumoEditando.id)
  .select("*")
  .single();


    if (error) throw error;

    setInsumos((prev) =>
      prev
        .map((item) =>
          item.id === actualizado.id ? actualizado : item
        )
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
    );

    setFormulario({
      nombre: "",
      unidad: "unidad",
      stockActual: "",
      stockMinimo: "",
      tieneVencimiento: true,
    });

    setModalAbierto(false);
    setInsumoEditando(null);

    alert("Insumo actualizado correctamente.");

    return;
  }

  const { data: nuevoInsumo, error: errorInsumo } =
    await supabase
      .from("insumos")
      .insert({
        nombre,
        unidad_medida: formulario.unidad,
        stock_actual: stockActual,
        stock_minimo: stockMinimo,
        perecible: formulario.tieneVencimiento,
        activo: true,
      })
      .select("*")
      .single();

  if (errorInsumo) throw errorInsumo;

  if (stockActual > 0) {
    const { error: errorMovimiento } = await supabase
      .from("movimientos_inventario")
      .insert({
        insumo_id: nuevoInsumo.id,
        tipo: "ingreso_manual",
        cantidad: stockActual,
        stock_antes: 0,
        stock_despues: stockActual,
        justificacion: "Stock inicial",
      });

    if (errorMovimiento) {
      console.error(
        "Error al registrar movimiento:",
        errorMovimiento
      );

      alert(
        "El insumo fue creado, pero no se pudo registrar " +
          "el movimiento de stock inicial: " +
          (errorMovimiento?.message || errorMovimiento)
      );
    }
  }

  setInsumos((prev) =>
    [...prev, nuevoInsumo].sort((a, b) =>
      a.nombre.localeCompare(b.nombre)
    )
  );

  setFormulario({
    nombre: "",
    unidad: "unidad",
    stockActual: "",
    stockMinimo: "",
    tieneVencimiento: true,
  });

  setModalAbierto(false);

  alert("Insumo registrado correctamente.");
} catch (error) {
  console.error("Error al guardar insumo:", error);

  alert(
    "No se pudo guardar el insumo: " +
      (error?.message || error)
  );
} finally {
  setGuardando(false);
}

};

const abrirEdicion = (insumo) => {
setInsumoEditando(insumo);

setFormulario({
  nombre: insumo.nombre || "",
  unidad: insumo.unidad_medida || "unidad",
  stockActual: String(insumo.stock_actual ?? 0),
  stockMinimo: String(insumo.stock_minimo ?? 0),
  tieneVencimiento: Boolean(insumo.perecible),
});

setModalAbierto(true);

};

const desactivarInsumo = async (insumo) => {
const confirmar = window.confirm(
"¿Deseas desactivar \"" + insumo.nombre + "\"?\n\n" +
"Dejará de aparecer entre los insumos activos, " +
"pero conservará su historial."
);

if (!confirmar) return;

try {
  setDesactivandoId(insumo.id);

  const { error } = await supabase
    .from("insumos")
    .update({ activo: false })
    .eq("id", insumo.id);

  if (error) throw error;

  setInsumos((prev) =>
    prev.filter((item) => item.id !== insumo.id)
  );

  alert("Insumo desactivado correctamente.");
} catch (error) {
  console.error("Error al desactivar insumo:", error);

  alert(
    "No se pudo desactivar el insumo: " +
      (error?.message || error)
  );
} finally {
  setDesactivandoId(null);
}

};

const obtenerEstadoStock = (insumo) => {
const stock = Number(insumo.stock_actual || 0);
const minimo = Number(insumo.stock_minimo || 0);

if (stock <= 0) {
  return {
    texto: "Agotado",
    clase: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
  };
}

if (stock <= minimo) {
  return {
    texto: "Bajo",
    clase: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  };
}

return {
  texto: "Normal",
  clase: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
};

};

const mostrarUnidad = (unidad) => {
const unidades = {
unidad: "Unidad",
kg: "kg",
g: "g",
l: "L",
ml: "ml",
};

return unidades[unidad] || unidad;

};

const claseInput =
"w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder hover focus focus focus/10 disabled disabled disabled";

const claseLabel =
"mb-2 block text-sm font-semibold text-slate-700";

return (
<div className="min-h-full space-y-8 bg-slate-50/50 p-4 sm:p-6 lg:p-8">
<div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
<div className="space-y-2">
<div className="flex items-center gap-3">
<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6" >
<path strokeLinecap="round" strokeLinejoin="round" d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z" />
<path strokeLinecap="round" strokeLinejoin="round" d="m4.5 7.8 7.5 4.4 7.5-4.4M12 12.2V21M8 5.3l8 4.6" />
</svg>
</div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Insumos
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestiona los insumos y controla su stock.
          </p>
        </div>
      </div>
    </div>

    <button
      type="button"
      onClick={abrirModal}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-red-600/20 transition hover:bg-red-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-red-500/20 active:scale-[0.98] sm:self-auto"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-5 w-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 5v14m-7-7h14"
        />
      </svg>
      Nuevo insumo
    </button>
  </div>

  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Total de insumos
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {cargando ? "—" : insumos.length}
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m4 7.5 8 4.7 8-4.7M12 12.2V21"
            />
          </svg>
        </div>
      </div>
    </div>

    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Stock bajo
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-amber-600">
            {cargando
              ? "—"
              : insumos.filter(
                  (item) =>
                    Number(item.stock_actual || 0) > 0 &&
                    Number(item.stock_actual || 0) <=
                      Number(item.stock_minimo || 0)
                ).length}
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v4m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3l-7.5-13.1a2 2 0 0 0-3.4 0Z"
            />
          </svg>
        </div>
      </div>
    </div>

    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Insumos agotados
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-red-600">
            {cargando
              ? "—"
              : insumos.filter(
                  (item) =>
                    Number(item.stock_actual || 0) <= 0
                ).length}
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v5m0 4h.01M5.6 20h12.8a2 2 0 0 0 1.7-3L13.7 5a2 2 0 0 0-3.4 0L3.9 17a2 2 0 0 0 1.7 3Z"
            />
          </svg>
        </div>
      </div>
    </div>
  </div>

  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div>
        <h2 className="text-base font-bold text-slate-900">
          Inventario de insumos
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Consulta las cantidades disponibles y administra tus insumos.
        </p>
      </div>

      <span className="inline-flex w-fit items-center rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
        {cargando
          ? "Cargando..."
          : `${insumos.length} ${insumos.length === 1 ? "registro" : "registros"}`}
      </span>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full min-w-[850px] text-left">
        <thead className="border-b border-slate-200 bg-slate-50/80">
          <tr>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
              Insumo
            </th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
              Unidad
            </th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
              Stock actual
            </th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
              Stock mínimo
            </th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
              Estado
            </th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
              Acciones
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {cargando ? (
            <tr>
              <td colSpan="6" className="px-6 py-20 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-red-600" />
                  <p className="text-sm font-medium text-slate-500">
                    Cargando insumos...
                  </p>
                </div>
              </td>
            </tr>
          ) : insumos.length === 0 ? (
            <tr>
              <td colSpan="6" className="px-6 py-20 text-center">
                <div className="mx-auto flex max-w-sm flex-col items-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="h-8 w-8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m4 7.5 8 4.7 8-4.7M12 12.2V21"
                      />
                    </svg>
                  </div>

                  <p className="text-base font-bold text-slate-800">
                    No hay insumos registrados
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Empieza agregando tu primer insumo para llevar el control de tu inventario.
                  </p>

                  <button
                    type="button"
                    onClick={abrirModal}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-4 w-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 5v14m-7-7h14"
                      />
                    </svg>
                    Nuevo insumo
                  </button>
                </div>
              </td>
            </tr>
          ) : (
            insumos.map((insumo) => {
              const estado = obtenerEstadoStock(insumo);

              return (
                <tr
                  key={insumo.id}
                  className="transition-colors hover:bg-slate-50/80"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          className="h-5 w-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m4 7.5 8 4.7 8-4.7M12 12.2V21"
                          />
                        </svg>
                      </div>
                      <span className="text-sm font-semibold text-slate-800">
                        {insumo.nombre}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-5 text-sm text-slate-600">
                    {mostrarUnidad(insumo.unidad_medida)}
                  </td>

                  <td className="px-6 py-5">
                    <span className="text-sm font-bold tabular-nums text-slate-900">
                      {Number(insumo.stock_actual || 0)}
                    </span>
                    <span className="ml-2 text-xs text-slate-400">
                      {mostrarUnidad(insumo.unidad_medida)}
                    </span>
                  </td>

                  <td className="px-6 py-5 text-sm font-medium tabular-nums text-slate-600">
                    {Number(insumo.stock_minimo || 0)}
                  </td>

                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${estado.clase}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {estado.texto}
                    </span>
                  </td>

                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => abrirEdicion(insumo)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="h-4 w-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m16.5 4.5 3 3M4 20l4.5-1 11-11a2.12 2.12 0 0 0-3-3l-11 11L4 20Z"
                          />
                        </svg>
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => desactivarInsumo(insumo)}
                        disabled={desactivandoId === insumo.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 shadow-sm transition hover:border-red-300 hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {desactivandoId === insumo.id ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="h-4 w-4 animate-spin"
                          >
                            <circle
                              cx="12"
                              cy="12"
                              r="9"
                              strokeOpacity="0.25"
                            />
                            <path
                              strokeLinecap="round"
                              d="M21 12a9 9 0 0 0-9-9"
                            />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="h-4 w-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4 7h16M10 11v6m4-6v6M5.5 7l1 13h11l1-13M9 7V4h6v3"
                            />
                          </svg>
                        )}
                        {desactivandoId === insumo.id
                          ? "Desactivando..."
                          : "Desactivar"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>

    {!cargando && insumos.length > 0 && (
      <div className="flex flex-col gap-1 border-t border-slate-200 bg-slate-50/70 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          Mostrando{" "}
          <span className="font-semibold text-slate-700">
            {insumos.length}
          </span>{" "}
          {insumos.length === 1 ? "insumo activo" : "insumos activos"}
        </p>
        <p className="text-xs text-slate-400">
          El stock se actualiza mediante movimientos de inventario.
        </p>
      </div>
    )}
  </div>

  {modalAbierto && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) cerrarModal();
      }}
    >
      <div className="my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl shadow-slate-950/20 sm:max-h-[calc(100dvh-3rem)]">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-5 sm:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-6 w-6"
              >
                {insumoEditando ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m16.5 4.5 3 3M4 20l4.5-1 11-11a2.12 2.12 0 0 0-3-3l-11 11L4 20Z"
                  />
                ) : (
                  <>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4 7.5 8 4.7 8-4.7M12 12.2V21"
                    />
                  </>
                )}
              </svg>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                {insumoEditando ? "Editar insumo" : "Nuevo insumo"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {insumoEditando
                  ? "Actualiza los datos del insumo."
                  : "Completa los datos para registrar un insumo."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={cerrarModal}
            disabled={guardando}
            aria-label="Cerrar modal"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-2xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={guardarInsumo}
          className="min-h-0 space-y-6 overflow-y-auto px-6 py-6 sm:px-8"
        >
          <div className="space-y-2">
            <label className={claseLabel}>
              Nombre del insumo
            </label>

            <input
              type="text"
              value={formulario.nombre}
              onChange={(e) =>
                cambiarCampo("nombre", e.target.value)
              }
              placeholder="Ej. Carne de hamburguesa"
              required
              disabled={guardando}
              className={claseInput}
            />
          </div>

          <div className="space-y-2">
            <label className={claseLabel}>
              Unidad de medida
            </label>

            <select
              value={formulario.unidad}
              onChange={(e) =>
                cambiarCampo("unidad", e.target.value)
              }
              disabled={guardando}
              className={claseInput}
            >
              <option value="unidad">Unidad</option>
              <option value="kg">Kilogramos (kg)</option>
              <option value="g">Gramos (g)</option>
              <option value="l">Litros (L)</option>
              <option value="ml">Mililitros (ml)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className={claseLabel}>
                Stock actual
              </label>

              <input
                type="number"
                min="0"
                step={formulario.unidad === "g" || formulario.unidad === "ml" ? "0.01" : "1"}
                value={formulario.stockActual}
                onChange={(e) =>
                  cambiarCampo("stockActual", e.target.value)
                }
                placeholder="Ej. 10"
                required
                disabled={guardando}
                className={claseInput}
              />

              <p className="text-xs leading-5 text-slate-500">
                {insumoEditando
                  ? "El stock se modifica mediante movimientos de inventario."
                  : "Cantidad inicial disponible actualmente."}
              </p>
            </div>

            <div className="space-y-2">
              <label className={claseLabel}>
                Stock mínimo
              </label>

              <input
                type="number"
                min={formulario.unidad === "g" || formulario.unidad === "ml" ? "100" : "1"}
                step={formulario.unidad === "g" || formulario.unidad === "ml" ? "0.01" : "1"}
                value={formulario.stockMinimo}
                onChange={(e) =>
                  cambiarCampo("stockMinimo", e.target.value)
                }
                placeholder="Ej. 2"
                required
                disabled={guardando}
                className={claseInput}
              />

              <p className="text-xs leading-5 text-slate-500">
                Al llegar a este valor, el insumo se mostrará como bajo.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <label className="mb-3 block text-sm font-semibold text-slate-800">
              ¿Tiene vencimiento?
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  cambiarCampo("tieneVencimiento", true)
                }
                disabled={guardando}
                className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-red-500/10 disabled:cursor-not-allowed disabled:opacity-60 ${
                  formulario.tieneVencimiento
                    ? "border-red-500 bg-white text-red-600 shadow-sm"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-xs">
                  {formulario.tieneVencimiento ? "✓" : ""}
                </span>
                Sí, tiene
              </button>

              <button
                type="button"
                onClick={() =>
                  cambiarCampo("tieneVencimiento", false)
                }
                disabled={guardando}
                className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-red-500/10 disabled:cursor-not-allowed disabled:opacity-60 ${
                  !formulario.tieneVencimiento
                    ? "border-red-500 bg-white text-red-600 shadow-sm"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-xs">
                  {!formulario.tieneVencimiento ? "✓" : ""}
                </span>
                No tiene
              </button>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={cerrarModal}
              disabled={guardando}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={guardando}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-red-600/20 transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {guardando && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4 animate-spin"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    strokeOpacity="0.25"
                  />
                  <path
                    strokeLinecap="round"
                    d="M21 12a9 9 0 0 0-9-9"
                  />
                </svg>
              )}
              {guardando
                ? "Guardando..."
                : insumoEditando
                  ? "Guardar cambios"
                  : "Guardar insumo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )}
</div>

);
}