import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_PRODUCTOS = 100;

export async function POST(request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Falta configurar GEMINI_API_KEY en el servidor." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const productos = body?.productos;

    if (
      !Array.isArray(productos) ||
      productos.length === 0 ||
      productos.length > MAX_PRODUCTOS
    ) {
      return NextResponse.json(
        { error: "Envía entre 1 y 100 productos para analizar." },
        { status: 400 }
      );
    }

    const productosLimpios = productos.map((producto) => ({
      id: String(producto.id ?? "").slice(0, 100),
      nombre: String(producto.nombre ?? "").slice(0, 120),
      categoria: String(producto.categoria ?? "Sin categoría").slice(0, 100),
      precio: Number(producto.precio),
      unidades: Number(producto.unidades),
      ingresos: Number(producto.ingresos),
      costoInsumos:
        producto.costoInsumos == null
          ? null
          : Number(producto.costoInsumos),
      margenPorcentaje:
        producto.margenPorcentaje == null
          ? null
          : Number(producto.margenPorcentaje),
      popularidad: String(producto.popularidad ?? "Sin ventas"),
    }));

    const ids = new Set();

    for (const producto of productosLimpios) {
      if (
        !producto.id ||
        !producto.nombre ||
        !Number.isFinite(producto.precio) ||
        !Number.isFinite(producto.unidades) ||
        !Number.isFinite(producto.ingresos) ||
        (producto.costoInsumos !== null &&
          (!Number.isFinite(producto.costoInsumos) ||
            producto.costoInsumos < 0)) ||
        (producto.margenPorcentaje !== null &&
          !Number.isFinite(producto.margenPorcentaje))
      ) {
        return NextResponse.json(
          { error: "Los datos de uno o más productos no son válidos." },
          { status: 400 }
        );
      }

      if (ids.has(producto.id)) {
        return NextResponse.json(
          { error: "Hay productos duplicados en la solicitud." },
          { status: 400 }
        );
      }

      ids.add(producto.id);
    }

    const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
        // model: "gemini-3.6-flash",
        model: "gemini-3.5-flash-lite", 
        contents: `
        Eres un analista comercial especializado en restaurantes.

        Analiza los datos de estos productos y recomienda acciones para
        optimizar la carta según su rentabilidad y popularidad.

        DATOS:
        ${JSON.stringify(productosLimpios)}

        REGLAS:
        1. Usa únicamente las cifras recibidas. No inventes ventas, costos ni márgenes.
        2. Un margen nulo significa que no hay información suficiente para evaluar
          la rentabilidad. Recomienda completar o verificar los costos.
        3. Considera las unidades vendidas, los ingresos, el precio, el margen
          y la categoría de cada producto.
        4. No recomiendes eliminar productos únicamente porque vendieron poco.
        5. Conserva la variedad entre categorías. Prioriza promociones, visibilidad,
          revisión de costos, porciones o precios antes de sugerir retirar productos.
        6. No cambies precios automáticamente. Propón acciones para que el encargado
          las evalúe.
        7. Si hay pocas ventas o el periodo es limitado, aclara esa incertidumbre.
        8. Las recomendaciones deben ser concretas, breves y distintas cuando
          los datos justifiquen acciones diferentes.
        9. Devuelve exactamente una recomendación por cada producto recibido.
        10. Copia el id de cada producto exactamente como fue recibido.

        Devuelve exclusivamente un JSON con esta estructura:
        {
          "recomendaciones": [
            {
              "id": "id original del producto",
              "recomendacion": "Acción breve",
              "motivo": "Explicación basada en los datos",
              "accion": "Siguiente paso concreto"
            }
          ]
        }
      `,
            config: {
        responseMimeType: "application/json",
        maxOutputTokens: 6000,
      },
    });

    const texto = response.text;

    if (!texto) {
      throw new Error("La IA no devolvió recomendaciones.");
    }

    const resultado = JSON.parse(texto);

    if (!Array.isArray(resultado.recomendaciones)) {
      throw new Error("La respuesta de la IA tiene un formato inválido.");
    }

    const recomendaciones = resultado.recomendaciones
      .filter(
        (item) =>
          item &&
          ids.has(String(item.id)) &&
          typeof item.recomendacion === "string" &&
          typeof item.motivo === "string" &&
          typeof item.accion === "string"
      )
      .filter(
        (item, index, array) =>
          array.findIndex((otro) => String(otro.id) === String(item.id)) ===
          index
      )
      .map((item) => ({
        id: String(item.id),
        recomendacion: item.recomendacion.slice(0, 100),
        motivo: item.motivo.slice(0, 600),
        accion: item.accion.slice(0, 400),
      }));

    if (recomendaciones.length !== productosLimpios.length) {
      throw new Error(
        "La IA no generó una recomendación válida para todos los productos."
      );
    }

        return NextResponse.json({ recomendaciones });
  } catch (error) {
    console.error("Error en la optimización con Gemini:", error);

    const mensaje =
      error instanceof Error ? error.message : "Error desconocido";

    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development"
            ? mensaje
            : "No se pudo generar el análisis con IA. Inténtalo nuevamente.",
      },
      { status: 502 }
    );
  }
}