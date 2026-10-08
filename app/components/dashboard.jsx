"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

function obtenerJornadaNegocio() {
  const ahora = new Date();

  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(ahora);

  const obtener = (tipo) =>
    partes.find((p) => p.type === tipo)?.value;

  let año = Number(obtener("year"));
  let mes = Number(obtener("month"));
  let dia = Number(obtener("day"));
  const hora = Number(obtener("hour"));

  // Antes de las 6 PM pertenece a la jornada anterior
  if (hora < 18) {
    const fechaAnterior = new Date(
      Date.UTC(año, mes - 1, dia - 1)
    );

    año = fechaAnterior.getUTCFullYear();
    mes = fechaAnterior.getUTCMonth() + 1;
    dia = fechaAnterior.getUTCDate();
  }

  const fechaOperativa =
    `${año}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

  const inicio = `${fechaOperativa}T18:00:00-05:00`;

  const siguienteDia = new Date(
    Date.UTC(año, mes - 1, dia + 1)
  );

  const siguienteFecha =
    `${siguienteDia.getUTCFullYear()}-${String(
      siguienteDia.getUTCMonth() + 1
    ).padStart(2, "0")}-${String(
      siguienteDia.getUTCDate()
    ).padStart(2, "0")}`;

  const fin =
    hora >= 18
      ? ahora.toISOString()
      : `${siguienteFecha}T00:00:00-05:00`;

  return {
    fechaOperativa,
    inicio,
    fin,
  };
}

function formatearSoles(valor) {
  return `S/ ${Number(valor || 0).toFixed(2)}`;
}

function obtenerSaludo() {
  const ahora = new Date();

  const hora = Number(
    new Intl.DateTimeFormat("es-PE", {
      timeZone: "America/Lima",
      hour: "numeric",
      hourCycle: "h23",
    }).format(ahora)
  );

  if (hora >= 5 && hora < 12) return "Buenos días";
  if (hora >= 12 && hora < 18) return "Buenas tardes";
  return "Buenas noches";
}

export default function Dashboard({ productos = [] }) {
  const [cargando, setCargando] = useState(true);

  const [ventasHoy, setVentasHoy] = useState(0);
  const [pedidosHoy, setPedidosHoy] = useState(0);
  const [ventasPorHora, setVentasPorHora] = useState([]);
  const [masVendidos, setMasVendidos] = useState([]);
  const [stockBajo, setStockBajo] = useState([]);

  const [error, setError] = useState("");

  useEffect(() => {
    cargarDashboard();
  }, []);

  async function cargarDashboard() {
    try {
      setCargando(true);
      setError("");

      const jornada = obtenerJornadaNegocio();

      /*
       * ============================================================
       * 1. VENTAS DE LA JORNADA
       * ============================================================
       */

      const { data: ventas, error: errorVentas } = await supabase
        .from("ventas")
        .select("id, total, created_at")
        .gte("created_at", jornada.inicio)
        .lt("created_at", jornada.fin)
        .order("created_at", { ascending: true });

      if (errorVentas) throw errorVentas;

      const ventasValidas = ventas || [];

      const totalVentas = ventasValidas.reduce(
        (acumulado, venta) => acumulado + Number(venta.total || 0),
        0
      );

      setVentasHoy(totalVentas);

      /*
       * ============================================================
       * 2. PEDIDOS DE LA JORNADA
       * ============================================================
       */

      const { data: pedidos, error: errorPedidos } = await supabase
        .from("pedidos")
        .select("id")
        .eq("fecha_operativa", jornada.fechaOperativa);

      if (errorPedidos) throw errorPedidos;

      setPedidosHoy(pedidos?.length || 0);

      /*
       * ============================================================
       * 3. VENTAS POR HORA
       * ============================================================
       *
       * La jornada empieza a las 18:00.
       *
       * 18 -> 6 PM
       * 19 -> 7 PM
       * ...
       * 23 -> 11 PM
       */

      const horas = [
        { hora: 18, etiqueta: "6 PM", valor: 0 },
        { hora: 19, etiqueta: "7 PM", valor: 0 },
        { hora: 20, etiqueta: "8 PM", valor: 0 },
        { hora: 21, etiqueta: "9 PM", valor: 0 },
        { hora: 22, etiqueta: "10 PM", valor: 0 },
        { hora: 23, etiqueta: "11 PM", valor: 0 },
      ];

      ventasValidas.forEach((venta) => {
        const fecha = new Date(venta.created_at);

        const horaPeru = Number(
          new Intl.DateTimeFormat("en-US", {
            timeZone: "America/Lima",
            hour: "numeric",
            hourCycle: "h23",
          }).format(fecha)
        );

        const encontrado = horas.find((item) => item.hora === horaPeru);

        if (encontrado) {
          encontrado.valor += Number(venta.total || 0);
        }
      });

      setVentasPorHora(horas);

      /*
       * ============================================================
       * 4. PRODUCTOS MÁS VENDIDOS
       * ============================================================
       *
       * Usamos la vista que ya creaste:
       *
       * v_ventas_detalle_reporte
       *
       * Esta vista ya tiene:
       * producto_nombre
       * categoria_nombre
       * cantidad
       * subtotal
       * created_at
       */

      const { data: detallesVentas, error: errorDetalles } = await supabase
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

        ranking[nombre].cantidad += Number(detalle.cantidad || 0);
        ranking[nombre].ingresos += Number(detalle.subtotal || 0);
      });

      const rankingOrdenado = Object.values(ranking)
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 5)
        .map((producto, index) => ({
          ...producto,
          posicion: index + 1,
        }));

      setMasVendidos(rankingOrdenado);

      /*
       * ============================================================
       * 5. STOCK BAJO
       * ============================================================
       *
       * Aquí usamos:
       *
       * productos
       * insumos
       *
       * porque ambos manejan stock.
       */

      const { data: insumos, error: errorInsumos } = await supabase
        .from("insumos")
        .select("id, nombre, stock_actual, stock_minimo, activo")
        .eq("activo", true)
        .order("stock_actual", { ascending: true });

      if (errorInsumos) throw errorInsumos;

      const productosConStock = (productos || [])
        .filter((producto) => producto.activo && producto.controla_stock)
        .map((producto) => ({
          id: `producto-${producto.id}`,
          nombre: producto.nombre,
          origen: "Producto",
          stockActual: Number(producto.stock_actual || 0),
          stockMinimo: Number(producto.stock_minimo || 0),
        }))
        .filter((producto) => producto.stockActual <= producto.stockMinimo);

      const insumosConStock = (insumos || [])
        .map((insumo) => ({
          id: `insumo-${insumo.id}`,
          nombre: insumo.nombre,
          origen: "Insumo",
          stockActual: Number(insumo.stock_actual || 0),
          stockMinimo: Number(insumo.stock_minimo || 0),
        }))
        .filter((insumo) => insumo.stockActual <= insumo.stockMinimo);

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
        err?.message || "No se pudo cargar la información del dashboard."
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
      ...ventasPorHora.map((item) => Number(item.valor || 0)),
      1
    );
  }, [ventasPorHora]);

  return (
    <div className="min-h-full bg-slate-50 p-4 md:p-6 lg:p-8">
      {/* HEADER */}

      <div className="mb-8">
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

      {/* ERROR */}

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">No se pudo cargar el dashboard</p>
          <p className="mt-1">{error}</p>
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
            Desde las 6:00 PM
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
            Pedidos realizados en la jornada
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
        {/* VENTAS DEL DÍA */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">
              Ventas del día
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Ventas por hora · Jornada 6:00 PM - 12:00 AM
            </p>
          </div>

          <div className="flex h-72 items-end gap-3 overflow-x-auto">
            {ventasPorHora.map((item) => {
              const altura =
                item.valor > 0
                  ? Math.max((item.valor / maxVentaHora) * 100, 5)
                  : 2;

              return (
                <div
                  key={item.hora}
                  className="flex min-w-[55px] flex-1 flex-col items-center justify-end gap-2"
                >
                  <span className="text-xs font-semibold text-slate-600">
                    {item.valor > 0 ? formatearSoles(item.valor) : ""}
                  </span>

                  <div className="flex h-52 w-full items-end">
                    <div
                      className="w-full rounded-t-xl bg-red-500 transition-all"
                      style={{
                        height: `${altura}%`,
                      }}
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
                Todavía no hay ventas registradas en esta jornada.
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
              Productos con más unidades vendidas
            </p>
          </div>

          <div className="space-y-4">
            {masVendidos.length > 0 ? (
              masVendidos.map((producto) => (
                <div
                  key={producto.nombre}
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
                Todavía no hay productos vendidos.
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
              Productos e insumos que necesitan atención
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-lg">
            ⚠️
          </div>
        </div>

        {stockBajo.length > 0 ? (
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