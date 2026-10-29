"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

function obtenerFechaActualPeru() {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const fecha = Object.fromEntries(
    partes.map(({ type, value }) => [type, value])
  );

  return `${fecha.year}-${fecha.month}-${fecha.day}`;
}

export default function OptimizacionCarta() {
 const [desde, setDesde] = useState(obtenerFechaActualPeru);
  const [hasta, setHasta] = useState(obtenerFechaActualPeru);
  const [productos, setProductos] = useState([]);
  const [recomendacionesIA, setRecomendacionesIA] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [cargandoIA, setCargandoIA] = useState(false);
  const [error, setError] = useState("");
  const [errorIA, setErrorIA] = useState("");

  const cargarAnalisis = useCallback(async () => {
    setCargando(true);
    setError("");
    setErrorIA("");
    setRecomendacionesIA([]);

    try {
      let consulta = supabase
        .from("ventas")
        .select("id, created_at")
        .order("created_at", { ascending: false });

      if (desde) {
        consulta = consulta.gte(
          "created_at",
          new Date(`${desde}T00:00:00-05:00`).toISOString()
        );
      }

      if (hasta) {
        const diaSiguiente = new Date(`${hasta}T00:00:00-05:00`);
        diaSiguiente.setUTCDate(diaSiguiente.getUTCDate() + 1);

        consulta = consulta.lt(
          "created_at",
          diaSiguiente.toISOString()
        );
      }

      const { data: dataVentas, error: errorVentas } = await consulta;

      if (errorVentas) throw errorVentas;

      const [
        { data: catalogo, error: errorProductos },
        { data: categorias, error: errorCategorias },
        { data: recetas, error: errorRecetas },
        { data: insumos, error: errorInsumos },
      ] = await Promise.all([
        supabase
          .from("productos")
          .select("id, nombre, precio_venta, categoria_id")
          .eq("activo", true),

        supabase
          .from("categorias")
          .select("id, nombre"),

        supabase
          .from("producto_insumos")
          .select("producto_id, insumo_id, cantidad"),

        supabase
          .from("insumos")
          .select("id, costo_unitario"),
      ]);

      if (errorProductos) throw errorProductos;
      if (errorCategorias) throw errorCategorias;
      if (errorRecetas) throw errorRecetas;
      if (errorInsumos) throw errorInsumos;

      const ventas = dataVentas || [];
      let detalles = [];

      if (ventas.length > 0) {
        const { data: dataDetalles, error: errorDetalles } =
          await supabase
            .from("venta_detalles")
            .select(`
              venta_id,
              producto_id,
              producto_nombre,
              categoria_nombre,
              cantidad,
              subtotal
            `);

        if (errorDetalles) throw errorDetalles;

        const idsVentas = new Set(
          ventas.map((venta) => String(venta.id))
        );

        detalles = (dataDetalles || []).filter((detalle) =>
          idsVentas.has(String(detalle.venta_id))
        );
      }

      const mapaCategorias = new Map(
        (categorias || []).map((categoria) => [
          String(categoria.id),
          categoria.nombre,
        ])
      );

      const mapaInsumos = new Map(
        (insumos || []).map((insumo) => [
          String(insumo.id),
          Number(insumo.costo_unitario || 0),
        ])
      );

      const recetasPorProducto = new Map();

      for (const receta of recetas || []) {
        const idProducto = String(receta.producto_id);

        if (!recetasPorProducto.has(idProducto)) {
          recetasPorProducto.set(idProducto, []);
        }

        recetasPorProducto.get(idProducto).push(receta);
      }

      const resumenVentas = new Map();

      for (const detalle of detalles) {
        if (detalle.producto_id == null) continue;

        const id = String(detalle.producto_id);

        if (!resumenVentas.has(id)) {
          resumenVentas.set(id, {
            unidades: 0,
            ingresos: 0,
            ventas: 0,
          });
        }

        const resumen = resumenVentas.get(id);

        resumen.unidades += Number(detalle.cantidad || 0);
        resumen.ingresos += Number(detalle.subtotal || 0);
        resumen.ventas += 1;
      }

      const cantidadPorCategoria = new Map();

      for (const producto of catalogo || []) {
        if (producto.categoria_id == null) continue;

        const categoriaId = String(producto.categoria_id);

        cantidadPorCategoria.set(
          categoriaId,
          (cantidadPorCategoria.get(categoriaId) || 0) + 1
        );
      }

      const maxUnidades = Math.max(
        0,
        ...(resumenVentas.size > 0
          ? Array.from(resumenVentas.values()).map(
              (producto) => producto.unidades
            )
          : [0])
      );

      const resultado = (catalogo || [])
        .map((producto) => {
          const id = String(producto.id);

          const categoriaId =
            producto.categoria_id == null
              ? null
              : String(producto.categoria_id);

          const venta = resumenVentas.get(id) || {
            unidades: 0,
            ingresos: 0,
            ventas: 0,
          };

          const receta = recetasPorProducto.get(id) || [];
          const precio = Number(producto.precio_venta || 0);

          const recetaCompleta =
            receta.length > 0 &&
            receta.every(
              (item) =>
                mapaInsumos.has(String(item.insumo_id)) &&
                Number(item.cantidad) >= 0 &&
                mapaInsumos.get(String(item.insumo_id)) > 0
            );

          const costoInsumos = recetaCompleta
            ? receta.reduce(
                (total, item) =>
                  total +
                  Number(item.cantidad || 0) *
                    mapaInsumos.get(String(item.insumo_id)),
                0
              )
            : null;

          const margen =
            costoInsumos !== null
              ? precio - costoInsumos
              : null;

          const margenPorcentaje =
            margen !== null && precio > 0
              ? (margen / precio) * 100
              : null;

          const esUnicoEnCategoria =
            categoriaId !== null &&
            cantidadPorCategoria.get(categoriaId) === 1;

          let popularidad = "Sin ventas";

          if (venta.unidades > 0 && maxUnidades > 0) {
            const proporcion = venta.unidades / maxUnidades;

            if (proporcion >= 0.75) {
              popularidad = "Alta";
            } else if (proporcion >= 0.35) {
              popularidad = "Media";
            } else {
              popularidad = "Baja";
            }
          }

          return {
            id,
            nombre: producto.nombre,
            categoria:
              (categoriaId && mapaCategorias.get(categoriaId)) ||
              "Sin categoría",
            precio,
            unidades: venta.unidades,
            ingresos: Math.round(venta.ingresos * 100) / 100,
            ventas: venta.ventas,
            costoInsumos:
              costoInsumos === null
                ? null
                : Math.round(costoInsumos * 100) / 100,
            margen:
              margen === null
                ? null
                : Math.round(margen * 100) / 100,
            margenPorcentaje:
              margenPorcentaje === null
                ? null
                : Math.round(margenPorcentaje * 10) / 10,
            popularidad,
            esUnicoEnCategoria,
            productosEnCategoria:
              categoriaId === null
                ? 0
                : cantidadPorCategoria.get(categoriaId) || 0,
          };
        })
        .sort(
          (a, b) =>
            b.unidades - a.unidades ||
            a.nombre.localeCompare(b.nombre)
        );

      console.log("Ventas recibidas:", ventas.length);
      console.log("Detalles del periodo:", detalles.length);
      console.log("Productos analizados:", resultado.length);

      setProductos(resultado);

      if (resultado.length === 0) {
        setRecomendacionesIA([]);
        return;
      }

      setCargandoIA(true);

      const recomendacionesAcumuladas = [];

      for (let inicio = 0; inicio < resultado.length; inicio += 100) {
        const lote = resultado.slice(inicio, inicio + 100);

        const respuesta = await fetch("/api/optimizacion-carta", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productos: lote.map((producto) => ({
              id: producto.id,
              nombre: producto.nombre,
              categoria: producto.categoria,
              precio: producto.precio,
              unidades: producto.unidades,
              ingresos: producto.ingresos,
              costoInsumos: producto.costoInsumos,
              margenPorcentaje: producto.margenPorcentaje,
              popularidad: producto.popularidad,
              esUnicoEnCategoria: producto.esUnicoEnCategoria,
              productosEnCategoria: producto.productosEnCategoria,
            })),
          }),
        });

        const datosIA = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(
            datosIA.error || "No se pudieron generar las recomendaciones."
          );
        }

        if (!Array.isArray(datosIA.recomendaciones)) {
          throw new Error("La respuesta de la IA no tiene el formato esperado.");
        }

        recomendacionesAcumuladas.push(...datosIA.recomendaciones);
      }

      // Comprobar que la IA devolvió una recomendación por producto.
      const recomendacionesPorId = new Map();

      for (const recomendacion of recomendacionesAcumuladas) {
        if (
          recomendacion &&
          typeof recomendacion.id === "string" &&
          typeof recomendacion.recomendacion === "string" &&
          typeof recomendacion.motivo === "string" &&
          typeof recomendacion.accion === "string"
        ) {
          recomendacionesPorId.set(
            recomendacion.id,
            recomendacion
          );
        }
      }

      const recomendacionesFinales = resultado.map((producto) => {
        const recomendacion = recomendacionesPorId.get(
          String(producto.id)
        );

        if (!recomendacion) {
          throw new Error(
            `La IA no devolvió una recomendación válida para ${producto.nombre}.`
          );
        }

        return {
          id: String(producto.id),
          recomendacion: recomendacion.recomendacion,
          motivo: recomendacion.motivo,
          accion: recomendacion.accion,
        };
      });

      setRecomendacionesIA(recomendacionesFinales);
    } catch (err) {
      console.error("Error en el análisis de la carta:", err);

      if (productos.length === 0 && !error) {
        // El error principal se muestra en la interfaz.
      }

      setErrorIA(
        err instanceof Error
          ? err.message
          : "No se pudo completar el análisis con IA."
      );
    } finally {
      setCargando(false);
      setCargandoIA(false);
    }
  }, [desde, hasta]);

  useEffect(() => {
    cargarAnalisis();
  }, [cargarAnalisis]);

  const totalUnidades = productos.reduce(
    (total, producto) => total + producto.unidades,
    0
  );

  const totalIngresos = productos.reduce(
    (total, producto) => total + producto.ingresos,
    0
  );

  const productosConCostos = productos.filter(
    (producto) => producto.margenPorcentaje !== null
  );

  const dinero = (valor) =>
    `S/ ${Number(valor).toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const colorRecomendacion = (recomendacion) => {
    const texto = String(recomendacion || "").toLowerCase();

    if (
      texto.includes("potenciar") ||
      texto.includes("promocion") ||
      texto.includes("impulsar") ||
      texto.includes("destacar") ||
      texto.includes("mantener")
    ) {
      return "bg-emerald-100 text-emerald-700";
    }

    if (
      texto.includes("costo") ||
      texto.includes("margen") ||
      texto.includes("precio") ||
      texto.includes("revisar") ||
      texto.includes("completar")
    ) {
      return "bg-amber-100 text-amber-800";
    }

    if (
      texto.includes("evaluar") ||
      texto.includes("demanda") ||
      texto.includes("probar")
    ) {
      return "bg-violet-100 text-violet-700";
    }

    return "bg-blue-100 text-blue-700";
  };

  const colorPopularidad = (popularidad) => {
    if (popularidad === "Alta") {
      return "bg-emerald-100 text-emerald-700";
    }

    if (popularidad === "Media") {
      return "bg-blue-100 text-blue-700";
    }

    if (popularidad === "Baja") {
      return "bg-amber-100 text-amber-800";
    }

    return "bg-slate-100 text-slate-600";
  };

  const recomendacionPorId = new Map(
    recomendacionesIA.map((recomendacion) => [
      String(recomendacion.id),
      recomendacion,
    ])
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <header>
          <p className="text-sm font-bold uppercase tracking-wider text-red-500">
            FastOrder · Inteligencia comercial
          </p>

          <h1 className="mt-1 text-3xl font-black text-slate-800">
            Optimización de carta
          </h1>

          <p className="mt-2 max-w-3xl text-slate-500">
            Analiza las ventas, la rentabilidad estimada y la popularidad
            para obtener recomendaciones de inteligencia artificial que
            ayuden a mejorar la carta y conservar su variedad.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Unidades vendidas
            </p>
            <p className="mt-2 text-3xl font-black text-slate-800">
              {totalUnidades.toLocaleString("es-PE")}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Ingresos registrados
            </p>
            <p className="mt-2 text-3xl font-black text-slate-800">
              {dinero(totalIngresos)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Productos analizados
            </p>
            <p className="mt-2 text-3xl font-black text-slate-800">
              {productos.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Con margen calculable
            </p>
            <p className="mt-2 text-3xl font-black text-slate-800">
              {productosConCostos.length}
              <span className="ml-1 text-base font-semibold text-slate-400">
                / {productos.length}
              </span>
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-black text-slate-800">
            Periodo de análisis
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Si dejas las fechas vacías, se analizará todo el historial
            disponible.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="text-sm font-semibold text-slate-600">
              Desde
              <input
                type="date"
                value={desde}
                max={hasta || undefined}
                onChange={(e) => setDesde(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2.5"
              />
            </label>

            <label className="text-sm font-semibold text-slate-600">
              Hasta
              <input
                type="date"
                value={hasta}
                min={desde || undefined}
                onChange={(e) => setHasta(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2.5"
              />
            </label>

            <button
              type="button"
              onClick={cargarAnalisis}
              disabled={cargando}
              className="self-end rounded-xl bg-red-500 px-5 py-3 font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cargando
                ? cargandoIA
                  ? "Consultando IA..."
                  : "Analizando ventas..."
                : "Analizar ventas"}
            </button>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-bold">
              No se pudo completar el análisis de ventas.
            </p>
            <p className="mt-1 break-words">{error}</p>
          </div>
        )}

        {!error && productos.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-black text-slate-800">
                Recomendaciones de inteligencia artificial
              </h2>

              <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
                Gemini AI
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Las recomendaciones se generan a partir de los datos
              calculados por FastOrder. Son sugerencias para el encargado;
              no cambian automáticamente los precios ni eliminan productos.
            </p>

            {cargandoIA && (
              <div className="mt-4 rounded-xl bg-violet-50 p-4">
                <p className="font-bold text-violet-800">
                  Gemini está analizando tu carta...
                </p>
                <p className="mt-1 text-sm text-violet-700">
                  Está evaluando las ventas, los márgenes y la variedad
                  de las categorías.
                </p>
              </div>
            )}

            {errorIA && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="font-bold text-amber-800">
                  No se pudieron generar las recomendaciones de IA.
                </p>
                <p className="mt-1 break-words text-sm text-amber-700">
                  {errorIA}
                </p>
                <button
                  type="button"
                  onClick={cargarAnalisis}
                  disabled={cargando}
                  className="mt-3 rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  Intentar nuevamente
                </button>
              </div>
            )}

            {!cargandoIA &&
              !errorIA &&
              recomendacionesIA.length === 0 && (
                <p className="mt-4 text-sm text-slate-500">
                  Todavía no hay recomendaciones disponibles.
                </p>
              )}

            {recomendacionesIA.length > 0 && (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {productos
                  .map((producto) => ({
                    producto,
                    recomendacion: recomendacionPorId.get(
                      String(producto.id)
                    ),
                  }))
                  .filter((item) => item.recomendacion)
                  .sort((a, b) => {
                    const prioridad = (producto) => {
                      if (producto.margenPorcentaje === null) return 0;
                      if (producto.margenPorcentaje < 0) return 1;
                      if (producto.margenPorcentaje < 20) return 2;
                      if (producto.unidades === 0) return 3;
                      return 4;
                    };

                    return (
                      prioridad(a.producto) - prioridad(b.producto) ||
                      b.producto.unidades - a.producto.unidades
                    );
                  })
                  .slice(0, 6)
                  .map(({ producto, recomendacion }) => (
                    <article
                      key={producto.id}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-slate-800">
                            {producto.nombre}
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            {producto.categoria}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${colorRecomendacion(recomendacion.recomendacion)}`}
                        >
                          {recomendacion.recomendacion}
                        </span>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {recomendacion.motivo}
                      </p>

                      <div className="mt-3 rounded-lg bg-slate-50 p-3">
                        <p className="text-xs font-bold uppercase text-slate-500">
                          Acción sugerida
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                          {recomendacion.accion}
                        </p>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                        <span className="text-slate-500">
                          Unidades:{" "}
                          <strong className="text-slate-800">
                            {producto.unidades}
                          </strong>
                        </span>

                        <span className="text-slate-500">
                          Ingresos:{" "}
                          <strong className="text-slate-800">
                            {dinero(producto.ingresos)}
                          </strong>
                        </span>

                        <span className="text-slate-500">
                          Margen:{" "}
                          <strong className="text-slate-800">
                            {producto.margenPorcentaje === null
                              ? "Sin datos suficientes"
                              : `${producto.margenPorcentaje}%`}
                          </strong>
                        </span>
                      </div>
                    </article>
                  ))}
              </div>
            )}

            {recomendacionesIA.length > 6 && (
              <p className="mt-4 text-sm text-slate-500">
                Se muestran seis recomendaciones. La tabla inferior
                permite consultar los resultados de todos los productos.
              </p>
            )}
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="font-black text-slate-800">
              Análisis de productos
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              El margen se calcula por unidad cuando la receta tiene
              costos positivos registrados para todos sus insumos.
              Las recomendaciones provienen de Gemini.
            </p>
          </div>

          {cargando ? (
            <p className="p-8 text-center text-slate-500">
              Analizando ventas y preparando recomendaciones...
            </p>
          ) : error ? (
            <p className="p-8 text-center text-slate-500">
              Corrige el error para visualizar los resultados.
            </p>
          ) : productos.length === 0 ? (
            <p className="p-8 text-center text-slate-500">
              No hay productos activos en el catálogo.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1150px]">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Producto</th>
                    <th className="px-5 py-3">Categoría</th>
                    <th className="px-5 py-3 text-right">Unidades</th>
                    <th className="px-5 py-3 text-right">Ingresos</th>
                    <th className="px-5 py-3 text-right">
                      Costo estimado
                    </th>
                    <th className="px-5 py-3 text-right">Margen</th>
                    <th className="px-5 py-3">Popularidad</th>
                    <th className="px-5 py-3">Recomendación IA</th>
                  </tr>
                </thead>

                <tbody>
                  {productos.map((producto) => {
                    const recomendacion = recomendacionPorId.get(
                      String(producto.id)
                    );

                    return (
                      <tr
                        key={producto.id}
                        className="border-t border-slate-100 align-top"
                      >
                        <td className="px-5 py-4 font-bold text-slate-800">
                          {producto.nombre}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-500 text-black">
                          {producto.categoria}
                        </td>

                        <td className="px-5 py-4 text-right font-bold text-black">
                          {producto.unidades}
                        </td>

                        <td className="px-5 py-4 text-right font-semibold text-black">
                          {dinero(producto.ingresos)}
                        </td>

                        <td className="px-5 py-4 text-right text-sm text-black">
                          {producto.costoInsumos === null
                            ? "Pendiente"
                            : dinero(producto.costoInsumos)}
                        </td>

                        <td className="px-5 py-4 text-right text-sm">
                          {producto.margenPorcentaje === null ? (
                            <span className="text-slate-400">
                              Sin datos
                            </span>
                          ) : (
                            <div>
                              <p
                                className={`font-bold ${
                                  producto.margenPorcentaje < 0
                                    ? "text-red-600"
                                    : producto.margenPorcentaje < 20
                                      ? "text-red-600"
                                      : producto.margenPorcentaje < 30
                                        ? "text-amber-700"
                                        : "text-emerald-700"
                                }`}
                              >
                                {dinero(producto.margen)}
                              </p>
                              <p className="text-xs text-slate-500">
                                {producto.margenPorcentaje}%
                              </p>
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${colorPopularidad(producto.popularidad)}`}
                          >
                            {producto.popularidad}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          {recomendacion ? (
                            <>
                              <span
                                className={`inline-block max-w-xs rounded-full px-3 py-1 text-xs font-bold whitespace-normal ${colorRecomendacion(recomendacion.recomendacion)}`}
                              >
                                {recomendacion.recomendacion}
                              </span>

                              <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">
                                {recomendacion.motivo}
                              </p>

                              <p className="mt-2 max-w-xs text-xs leading-5 text-slate-700">
                                <strong>Acción:</strong>{" "}
                                {recomendacion.accion}
                              </p>
                            </>
                          ) : (
                            <span className="text-sm text-slate-400">
                              {cargandoIA
                                ? "Esperando respuesta de IA..."
                                : errorIA
                                  ? "IA no disponible"
                                  : "Sin recomendación"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
