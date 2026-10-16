"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

// ============================================================
// FECHAS DE LA JORNADA DEL NEGOCIO
// ============================================================

// Obtiene la fecha actual según la zona horaria de Perú.
function obtenerFechaHoyLima() {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const obtener = (tipo) =>
    partes.find((p) => p.type === tipo)?.value;

  return `${obtener("year")}-${obtener("month")}-${obtener("day")}`;
}

// Construye el intervalo de la jornada correspondiente
// a la fecha seleccionada en el filtro.

function obtenerJornadaNegocio(fechaSeleccionada) {
  // Si no llega una fecha válida, usar la fecha actual de Perú.
  const fecha =
    /^\d{4}-\d{2}-\d{2}$/.test(fechaSeleccionada || "")
      ? fechaSeleccionada
      : obtenerFechaHoyLima();

  const [año, mes, dia] = fecha.split("-").map(Number);

  const siguienteDia = new Date(
    Date.UTC(año, mes - 1, dia + 1)
  );

  const siguienteFecha =
    `${siguienteDia.getUTCFullYear()}-${String(
      siguienteDia.getUTCMonth() + 1
    ).padStart(2, "0")}-${String(
      siguienteDia.getUTCDate()
    ).padStart(2, "0")}`;

  // Inicio de la jornada: 6:00 p. m. de Perú.
  const inicio = `${fecha}T18:00:00-05:00`;

  // Fin de la jornada: medianoche del día siguiente.
  const finCompleto = `${siguienteFecha}T00:00:00-05:00`;

  const hoy = obtenerFechaHoyLima();

  // Para hoy, no consultar ventas posteriores al momento actual.
  const fin =
    fecha === hoy
      ? new Date().toISOString()
      : finCompleto;

  return {
    fechaOperativa: fecha,
    inicio,
    fin,
  };
}


function formatearSoles(valor) {
  return `S/ ${Number(valor || 0).toFixed(2)}`;
}

function obtenerSaludo() {
  const hora = Number(
    new Intl.DateTimeFormat("es-PE", {
      timeZone: "America/Lima",
      hour: "numeric",
      hourCycle: "h23",
    }).format(new Date())
  );

  if (hora >= 5 && hora < 12) return "Buenos días";
  if (hora >= 12 && hora < 18) return "Buenas tardes";
  return "Buenas noches";
}

function formatearFecha(fecha) {
  if (!fecha) return "";

  const [año, mes, dia] = fecha.split("-");

  return `${dia}/${mes}/${año}`;
}

export default function Dashboard({ productos = [] }) {
  const [cargando, setCargando] = useState(true);

  // El filtro inicia automáticamente con la fecha de hoy en Perú.
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    () => obtenerFechaHoyLima()
  );

  const [ventasHoy, setVentasHoy] = useState(0);
  const [pedidosHoy, setPedidosHoy] = useState(0);
  const [ventasPorHora, setVentasPorHora] = useState([]);
  const [masVendidos, setMasVendidos] = useState([]);
  const [stockBajo, setStockBajo] = useState([]);
  const [error, setError] = useState("");

  // Cada vez que se cambia la fecha, se actualizan los datos.
  useEffect(() => {
    cargarDashboard(fechaSeleccionada);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaSeleccionada]);

  async function cargarDashboard(fecha) {
    try {
      setCargando(true);
      setError("");

      const jornada = obtenerJornadaNegocio(fecha);

      // ========================================================
      // 1. VENTAS DE LA JORNADA SELECCIONADA
      // ========================================================

      const { data: ventas, error: errorVentas } = await supabase
        .from("ventas")
        .select("id, total, created_at")
        .gte("created_at", jornada.inicio)
        .lt("created_at", jornada.fin)
        .order("created_at", { ascending: true });

      if (errorVentas) throw errorVentas;

      const ventasValidas = ventas || [];

      const totalVentas = ventasValidas.reduce(
        (acumulado, venta) =>
          acumulado + Number(venta.total || 0),
        0
      );

      setVentasHoy(totalVentas);

      // ========================================================
      // 2. PEDIDOS DE LA JORNADA SELECCIONADA
      // ========================================================

      const { data: pedidos, error: errorPedidos } = await supabase
        .from("pedidos")
        .select("id")
        .eq("fecha_operativa", jornada.fechaOperativa);

      if (errorPedidos) throw errorPedidos;

      setPedidosHoy(pedidos?.length || 0);

      // ========================================================
      // 3. VENTAS POR HORA
      // ========================================================

      const horas = [
        { hora: 18, etiqueta: "6 PM", valor: 0 },
        { hora: 19, etiqueta: "7 PM", valor: 0 },
        { hora: 20, etiqueta: "8 PM", valor: 0 },
        { hora: 21, etiqueta: "9 PM", valor: 0 },
        { hora: 22, etiqueta: "10 PM", valor: 0 },
        { hora: 23, etiqueta: "11 PM", valor: 0 },
      ];

      ventasValidas.forEach((venta) => {
        const fechaVenta = new Date(venta.created_at);

        const horaPeru = Number(
          new Intl.DateTimeFormat("en-US", {
            timeZone: "America/Lima",
            hour: "numeric",
            hourCycle: "h23",
          }).format(fechaVenta)
        );

        const encontrado = horas.find(
          (item) => item.hora === horaPeru
        );

        if (encontrado) {
          encontrado.valor += Number(venta.total || 0);
        }
      });

      setVentasPorHora(horas);

      // ========================================================
      // 4. PRODUCTOS MÁS VENDIDOS
      // ========================================================

      const { data: detallesVentas, error: errorDetalles } =
        await supabase
          .from("v_ventas_detalle_reporte")
          .select(
            "producto_nombre, categoria_nombre, cantidad, subtotal, created_at"
          )
          .gte("created_at", jornada.inicio)
          .lt("created_at", jornada.fin);

      if (errorDetalles) throw errorDetalles;

      const ranking = {};

      (detallesVentas || []).forEach((detalle) => {
        const nombre = detalle.producto_nombre;

        if (!ranking[nombre]) {
          ranking[nombre] = {
            nombre,
            categoria: detalle.categoria_nombre,
            cantidad: 0,
            ingresos: 0,
          };
        }

        ranking[nombre].cantidad += Number(
          detalle.cantidad || 0
        );

        ranking[nombre].ingresos += Number(
          detalle.subtotal || 0
        );
      });

      const rankingOrdenado = Object.values(ranking)
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 5)
        .map((producto, index) => ({
          ...producto,
          posicion: index + 1,
        }));

      setMasVendidos(rankingOrdenado);

      // ========================================================
      // 5. STOCK BAJO
      // Se mantiene como información del stock actual.
      // ========================================================

      const { data: insumos, error: errorInsumos } = await supabase
        .from("insumos")
        .select("id, nombre, stock_actual, stock_minimo, activo")
        .eq("activo", true)
        .order("stock_actual", { ascending: true });

      if (errorInsumos) throw errorInsumos;

      const productosConStock = (productos || [])
        .filter(
          (producto) =>
            producto.activo && producto.controla_stock
        )
        .map((producto) => ({
          id: `producto-${producto.id}`,
          nombre: producto.nombre,
          origen: "Producto",
          stockActual: Number(producto.stock_actual || 0),
          stockMinimo: Number(producto.stock_minimo || 0),
        }))
        .filter(
          (producto) =>
            producto.stockActual <= producto.stockMinimo
        );

      const insumosConStock = (insumos || [])
        .map((insumo) => ({
          id: `insumo-${insumo.id}`,
          nombre: insumo.nombre,
          origen: "Insumo",
          stockActual: Number(insumo.stock_actual || 0),
          stockMinimo: Number(insumo.stock_minimo || 0),
        }))
        .filter(
          (insumo) =>
            insumo.stockActual <= insumo.stockMinimo
        );

      const stockOrdenado = [
        ...productosConStock,
        ...insumosConStock,
      ]
        .sort((a, b) => a.stockActual - b.stockActual)
        .slice(0, 5);

      setStockBajo(stockOrdenado);
    } catch (err) {
      console.error("Error cargando dashboard:", err);

      setError(
        err?.message ||
          "No se pudo cargar la información del dashboard."
      );
    } finally {
      setCargando(false);
    }
  }

  const ticketPromedio = useMemo(() => {
    if (!ventasHoy || !pedidosHoy) return 0;

    return ventasHoy / pedidosHoy;
  }, [ventasHoy, pedidosHoy]);

  const maxVentaHora = useMemo(() => {
    if (!ventasPorHora.length) return 1;

    return Math.max(
      ...ventasPorHora.map((item) =>
        Number(item.valor || 0)
      ),
      1
    );
  }, [ventasPorHora]);

  return (
    <div className="min-h-full bg-slate-50 p-4 md:p-6 lg:p-8">
      {/* HEADER */}

      <div className="mb-6">
        <p className="mb-1 text-sm font-medium text-slate-500">
          Resumen de la jornada
        </p>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          RESUMEN DEL NEGOCIO
        </h1>

        <p className="mt-2 text-slate-500">
          {obtenerSaludo()} - Aquí tienes el resumen de tu negocio.
        </p>
      </div>

      {/* FILTRO POR FECHA */}

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Consultar por fecha
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Selecciona un día para consultar sus ventas y pedidos.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <label
              htmlFor="filtroFecha"
              className="text-sm font-medium text-slate-700"
            >
              Fecha de la jornada
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <input
                id="filtroFecha"
                type="date"
                value={fechaSeleccionada}
                max={obtenerFechaHoyLima()}
                onChange={(e) =>
                  setFechaSeleccionada(e.target.value)
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
              />

              <button
                type="button"
                onClick={() =>
                  setFechaSeleccionada(obtenerFechaHoyLima())
                }
                disabled={
                  fechaSeleccionada === obtenerFechaHoyLima()
                }
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Hoy
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-800">
              Fecha consultada:
            </span>{" "}
            {formatearFecha(fechaSeleccionada)}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Jornada de 6:00 p. m. a 12:00 a. m., hora de Perú.
          </p>
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">
            No se pudo cargar el dashboard
          </p>
          <p className="mt-1">{error}</p>

          <button
            type="button"
            onClick={() => cargarDashboard(fechaSeleccionada)}
            className="mt-3 rounded-lg bg-red-100 px-3 py-2 font-semibold text-red-800 hover:bg-red-200"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* KPI */}

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* VENTAS */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              Ventas de la jornada
            </span>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-lg">
              💰
            </div>
          </div>

          <p className="text-3xl font-bold text-slate-900">
            {cargando ? "..." : formatearSoles(ventasHoy)}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            {formatearFecha(fechaSeleccionada)} · Desde las 6:00 p. m.
          </p>
        </div>

        {/* PEDIDOS */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              Pedidos
            </span>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-lg">
              🧾
            </div>
          </div>

          <p className="text-3xl font-bold text-slate-900">
            {cargando ? "..." : pedidosHoy}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Pedidos de la jornada seleccionada
          </p>
        </div>

        {/* TICKET PROMEDIO */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              Ticket promedio
            </span>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-lg">
              📈
            </div>
          </div>

          <p className="text-3xl font-bold text-slate-900">
            {cargando ? "..." : formatearSoles(ticketPromedio)}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Venta promedio por pedido
          </p>
        </div>
      </div>

      {/* GRÁFICO + MÁS VENDIDOS */}

      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* VENTAS POR HORA */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">
              Ventas del día
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Ventas por hora · Jornada del{" "}
              {formatearFecha(fechaSeleccionada)}
            </p>
          </div>

          <div className="flex h-72 items-end gap-3 overflow-x-auto">
            {ventasPorHora.map((item) => {
              const altura =
                item.valor > 0
                  ? Math.max(
                      (item.valor / maxVentaHora) * 100,
                      5
                    )
                  : 2;

              return (
                <div
                  key={item.hora}
                  className="flex min-w-[55px] flex-1 flex-col items-center justify-end gap-2"
                >
                  <span className="text-xs font-semibold text-slate-600">
                    {item.valor > 0
                      ? formatearSoles(item.valor)
                      : ""}
                  </span>

                  <div className="flex h-52 w-full items-end">
                    <div
                      className="w-full rounded-t-xl bg-red-500 transition-all"
                      style={{ height: `${altura}%` }}
                    />
                  </div>

                  <span className="text-xs font-medium text-slate-500">
                    {item.etiqueta}
                  </span>
                </div>
              );
            })}
          </div>

          {!cargando &&
            ventasPorHora.every((item) => item.valor === 0) && (
              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">
                No hay ventas registradas en esta jornada.
              </div>
            )}
        </div>

        {/* MÁS VENDIDOS */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">
              Más vendidos
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Productos con más unidades vendidas en la fecha consultada
            </p>
          </div>

          <div className="space-y-4">
            {cargando ? (
              <p className="text-sm text-slate-500">
                Cargando productos...
              </p>
            ) : masVendidos.length > 0 ? (
              masVendidos.map((producto) => (
                <div
                  key={`${producto.nombre}-${producto.posicion}`}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                    {producto.posicion}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {producto.nombre}
                    </p>

                    <p className="text-xs text-slate-500">
                      {producto.categoria}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">
                      {producto.cantidad}
                    </p>

                    <p className="text-xs text-slate-500">
                      unidades
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">
                No hay productos vendidos en esta jornada.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* STOCK BAJO */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Stock bajo
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Estado actual de los productos e insumos que necesitan atención
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-lg">
            ⚠️
          </div>
        </div>

        {cargando ? (
          <div className="rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">
            Cargando información del stock...
          </div>
        ) : stockBajo.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {stockBajo.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-orange-100 bg-orange-50/50 p-4"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {item.nombre}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {item.origen}
                    </p>
                  </div>

                  {item.stockActual <= 0 ? (
                    <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                      Agotado
                    </span>
                  ) : (
                    <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-700">
                      Stock bajo
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <p className="text-xs text-slate-500">
                      Stock actual
                    </p>

                    <p className="text-xl font-bold text-slate-900">
                      {item.stockActual}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-slate-500">
                      Mínimo
                    </p>

                    <p className="font-semibold text-slate-700">
                      {item.stockMinimo}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-emerald-50 p-5 text-center">
            <p className="font-semibold text-emerald-700">
              Todo está bien 👍
            </p>

            <p className="mt-1 text-sm text-emerald-600">
              No hay productos ni insumos por debajo de su stock mínimo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
