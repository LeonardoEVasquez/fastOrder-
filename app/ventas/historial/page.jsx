"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

const METODOS_PAGO = [
  "Todos",
  "EFECTIVO",
  "YAPE",
  "PLIN",
  "TRANSFERENCIA",
  "TARJETA",
];

const CAJEROS = ["Todos"];

export default function HistorialVentasPage() {
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [metodoPago, setMetodoPago] = useState("Todos");
  const [cajero, setCajero] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    cargarVentas();
  }, []);

  const cargarVentas = async () => {
    setCargando(true);

    const { data, error } = await supabase
      .from("ventas")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error al cargar ventas:", error);
      alert("Error al cargar el historial de ventas: " + error.message);
      setCargando(false);
      return;
    }

    setVentas(data || []);
    setCargando(false);
  };

  const ventasFiltradas = useMemo(() => {
    return ventas.filter((venta) => {
      const fechaVenta = new Date(venta.created_at);

      // FILTRO DESDE
      if (desde) {
        const fechaDesde = new Date(`${desde}T00:00:00`);

        if (fechaVenta < fechaDesde) {
          return false;
        }
      }

      // FILTRO HASTA
      if (hasta) {
        const fechaHasta = new Date(`${hasta}T23:59:59`);

        if (fechaVenta > fechaHasta) {
          return false;
        }
      }

      // FILTRO MÉTODO DE PAGO
      if (
        metodoPago !== "Todos" &&
        venta.metodo_pago !== metodoPago
      ) {
        return false;
      }

      // FILTRO CAJERO
      if (cajero !== "Todos") {
        if (venta.cajero !== cajero) {
          return false;
        }
      }

      // BUSCAR TICKET
      if (busqueda.trim()) {
        const texto = busqueda.trim().toLowerCase();

        const ticket = obtenerTicket(venta).toLowerCase();

        if (!ticket.includes(texto)) {
          return false;
        }
      }

      return true;
    });
  }, [
    ventas,
    desde,
    hasta,
    metodoPago,
    cajero,
    busqueda,
  ]);

  const obtenerTicket = (venta) => {
    if (venta.numero_ticket) {
      return String(venta.numero_ticket);
    }

    if (venta.ticket) {
      return String(venta.ticket);
    }

    return `NV-${String(venta.id).padStart(5, "0")}`;
  };

  const obtenerPedido = (venta) => {
    if (venta.numero_pedido) {
      return `#${String(venta.numero_pedido).padStart(3, "0")}`;
    }

    if (venta.pedido_id) {
      return `#${String(venta.pedido_id).padStart(3, "0")}`;
    }

    return `#${String(venta.id).padStart(3, "0")}`;
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "-";

    const date = new Date(fecha);

    return date.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
    }) +
      " " +
      date.toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
  };

  const formatearMetodoPago = (metodo) => {
    if (!metodo) return "-";

    const nombres = {
      EFECTIVO: "Efectivo",
      YAPE: "Yape",
      PLIN: "Plin",
      TRANSFERENCIA: "Transferencia",
      TARJETA: "Tarjeta",
    };

    return nombres[metodo] || metodo;
  };

  const obtenerEstado = (venta) => {
    if (venta.estado) {
      return venta.estado;
    }

    return "Pagada";
  };

  const limpiarFiltros = () => {
    setDesde("");
    setHasta("");
    setMetodoPago("Todos");
    setCajero("Todos");
    setBusqueda("");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px] space-y-6">

        {/* CABECERA */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-xl">
                🧾
              </span>

              <div>
                <h1 className="text-2xl font-black text-slate-800 md:text-3xl">
                  Historial de Ventas
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Consulta y filtra las ventas realizadas.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={cargarVentas}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            🔄 Actualizar
          </button>
        </div>

        {/* FILTROS */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-800">
                Filtros
              </h2>

              <p className="text-xs text-slate-500">
                Filtra las ventas según tus necesidades.
              </p>
            </div>

            <button
              type="button"
              onClick={limpiarFiltros}
              className="text-xs font-bold text-red-600 hover:text-red-700"
            >
              Limpiar filtros
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">

            {/* DESDE */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Desde
              </label>

              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-black outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
              />
            </div>

            {/* HASTA */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Hasta
              </label>

              <input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-black outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
              />
            </div>

            {/* MÉTODO */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Método de pago
              </label>

              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-black outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
              >
                {METODOS_PAGO.map((metodo) => (
                  <option key={metodo} value={metodo}>
                    {metodo === "Todos"
                      ? "Todos"
                      : formatearMetodoPago(metodo)}
                  </option>
                ))}
              </select>
            </div>

            {/* CAJERO */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Cajero
              </label>

              <select
                value={cajero}
                onChange={(e) => setCajero(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-black outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
              >
                {CAJEROS.map((nombre) => (
                  <option key={nombre} value={nombre}>
                    {nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* BUSCAR TICKET */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Buscar ticket
              </label>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  🔍
                </span>

                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="NV-00125"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-black outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* TABLA */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* CABECERA TABLA */}
          <div className="flex flex-col gap-1 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-black text-slate-800">
                Ventas realizadas
              </h2>

              <p className="text-xs text-slate-500">
                {ventasFiltradas.length} venta
                {ventasFiltradas.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {cargando ? (
            <div className="flex h-60 items-center justify-center">
              <p className="text-sm font-semibold text-slate-500">
                Cargando historial...
              </p>
            </div>
          ) : ventasFiltradas.length === 0 ? (
            <div className="flex h-60 flex-col items-center justify-center text-center">
              <span className="text-5xl">🧾</span>

              <p className="mt-3 text-base font-bold text-slate-700">
                No se encontraron ventas
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Prueba cambiando los filtros.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left">
                    <th className="px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-slate-500">
                      Ticket
                    </th>

                    <th className="px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-slate-500">
                      Fecha
                    </th>

                    <th className="px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-slate-500">
                      Pedido
                    </th>

                    <th className="px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-slate-500">
                      Total
                    </th>

                    <th className="px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-slate-500">
                      Estado
                    </th>

                    <th className="px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-slate-500">
                      Método
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {ventasFiltradas.map((venta) => {
                    const estado = obtenerEstado(venta);

                    return (
                      <tr
                        key={venta.id}
                        className="border-b border-slate-100 transition hover:bg-slate-50"
                      >
                        {/* TICKET */}
                        <td className="px-5 py-4">
                          <span className="font-bold text-slate-800">
                            {obtenerTicket(venta)}
                          </span>
                        </td>

                        {/* FECHA */}
                        <td className="px-5 py-4 text-sm font-medium text-slate-600">
                          {formatearFecha(venta.created_at)}
                        </td>

                        {/* PEDIDO */}
                        <td className="px-5 py-4">
                          <span className="font-bold text-slate-700">
                            {obtenerPedido(venta)}
                          </span>
                        </td>

                        {/* TOTAL */}
                        <td className="px-5 py-4">
                          <span className="font-black text-slate-900">
                            S/{Number(venta.total || 0).toFixed(2)}
                          </span>
                        </td>

                        {/* ESTADO */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-extrabold ${
                              estado === "Pagada"
                                ? "bg-emerald-100 text-emerald-700"
                                : estado === "Anulada"
                                ? "bg-red-100 text-red-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {estado}
                          </span>
                        </td>

                        {/* MÉTODO */}
                        <td className="px-5 py-4 text-sm font-semibold text-slate-600">
                          {formatearMetodoPago(venta.metodo_pago)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}