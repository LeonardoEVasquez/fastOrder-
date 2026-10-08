// "use client";

// import { useState, useEffect, useCallback } from "react";
// import { supabase } from "@/lib/supabase/client";

// const inputCls =
//   "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100";

// export default function Recetas() {
//   const [productos, setProductos] = useState([]);
//   const [insumos, setInsumos] = useState([]);
//   const [seleccionado, setSeleccionado] = useState(null);
//   const [receta, setReceta] = useState([]);
//   const [busqueda, setBusqueda] = useState("");
//   const [cargando, setCargando] = useState(true);
//   const [cargandoReceta, setCargandoReceta] = useState(false);
//   const [error, setError] = useState(null);
//   const [nuevo, setNuevo] = useState({ insumo_id: "", cantidad: "" });
//   const [guardando, setGuardando] = useState(false);

//   useEffect(() => {
//     (async () => {
//       const [rp, ri] = await Promise.all([
//         supabase.from("productos").select("id, nombre, activo").order("nombre", { ascending: true }),
//         supabase.from("insumos").select("id, nombre, unidad_medida").eq("activo", true).order("nombre", { ascending: true }),
//       ]);
//       if (rp.error || ri.error) setError((rp.error || ri.error).message);
//       setProductos(rp.data || []);
//       setInsumos(ri.data || []);
//       setCargando(false);
//     })();
//   }, []);

//   const cargarReceta = useCallback(async (productoId) => {
//     setCargandoReceta(true);
//     const { data, error } = await supabase
//       .from("producto_insumos")
//       .select("insumo_id, cantidad, insumos(nombre, unidad_medida)")
//       .eq("producto_id", productoId);
//     if (error) setError(error.message);
//     else setError(null);
//     setReceta(data || []);
//     setCargandoReceta(false);
//   }, []);

//   const elegir = (p) => {
//     setSeleccionado(p);
//     setNuevo({ insumo_id: "", cantidad: "" });
//     cargarReceta(p.id);
//   };

//   const agregar = async (e) => {
//     e.preventDefault();
//     setError(null);
//     const cant = parseFloat(String(nuevo.cantidad).replace(",", "."));
//     if (!nuevo.insumo_id) return setError("Selecciona un insumo.");
//     if (isNaN(cant) || cant <= 0) return setError("La cantidad debe ser mayor a 0.");

//     setGuardando(true);
//     const { error } = await supabase.from("producto_insumos").insert([
//       { producto_id: seleccionado.id, insumo_id: parseInt(nuevo.insumo_id, 10), cantidad: cant },
//     ]);
//     setGuardando(false);
//     if (error) return setError(error.code === "23505" ? "Ese insumo ya está en la receta." : error.message);
//     setNuevo({ insumo_id: "", cantidad: "" });
//     cargarReceta(seleccionado.id);
//   };

//   const actualizarCantidad = async (insumoId, valor, actual) => {
//     const cant = parseFloat(String(valor).replace(",", "."));
//     if (isNaN(cant) || cant <= 0) {
//       setError("La cantidad debe ser mayor a 0.");
//       cargarReceta(seleccionado.id);
//       return;
//     }
//     if (cant === Number(actual)) return;
//     const { error } = await supabase
//       .from("producto_insumos")
//       .update({ cantidad: cant })
//       .eq("producto_id", seleccionado.id)
//       .eq("insumo_id", insumoId);
//     if (error) setError(error.message);
//     cargarReceta(seleccionado.id);
//   };

//   const quitar = async (insumoId) => {
//     if (!window.confirm("¿Quitar este insumo de la receta?")) return;
//     const { error } = await supabase
//       .from("producto_insumos")
//       .delete()
//       .eq("producto_id", seleccionado.id)
//       .eq("insumo_id", insumoId);
//     if (error) return setError(error.message);
//     cargarReceta(seleccionado.id);
//   };

//   const filtrados = productos.filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase().trim()));
//   const disponibles = insumos.filter((i) => !receta.some((r) => r.insumo_id === i.id));
//   const insumoSel = insumos.find((i) => String(i.id) === String(nuevo.insumo_id));

//   return (
//     <div className="p-4 md:p-6 lg:p-8">
//       <div className="mx-auto max-w-[1300px] space-y-6">
//         <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
//           <div className="flex items-center gap-2">
//             <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-xl">📋</span>
//             <h1 className="text-2xl font-black text-slate-800 md:text-3xl">Recetas</h1>
//           </div>
//           <p className="mt-1 text-sm text-slate-500">
//             Define qué insumos consume cada producto. Al cobrar, el sistema los descuenta automáticamente del inventario.
//           </p>
//         </div>

//         {error && <div className="rounded-xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-700">⚠️ {error}</div>}

//         {cargando ? (
//           <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
//             <p className="font-semibold text-slate-500">Cargando...</p>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
//             {/* LISTA DE PRODUCTOS */}
//             <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
//               <input
//                 value={busqueda}
//                 onChange={(e) => setBusqueda(e.target.value)}
//                 placeholder="🔍 Buscar producto..."
//                 className={`${inputCls} mb-3`}
//               />
//               <div className="max-h-[60vh] space-y-1.5 overflow-y-auto">
//                 {filtrados.map((p) => (
//                   <button
//                     key={p.id}
//                     type="button"
//                     onClick={() => elegir(p)}
//                     className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-bold transition ${
//                       seleccionado?.id === p.id ? "bg-red-500 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
//                     }`}
//                   >
//                     <span className="line-clamp-1">{p.nombre}</span>
//                     {!p.activo && <span className="text-[10px] opacity-70">inactivo</span>}
//                   </button>
//                 ))}
//               </div>
//             </div>

//             {/* DETALLE DE RECETA */}
//             <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//               {!seleccionado ? (
//                 <div className="flex h-64 flex-col items-center justify-center text-center">
//                   <span className="text-5xl">📋</span>
//                   <p className="mt-3 font-bold text-slate-500">Selecciona un producto para ver o editar su receta</p>
//                 </div>
//               ) : (
//                 <>
//                   <h2 className="text-xl font-black text-slate-800">{seleccionado.nombre}</h2>
//                   <p className="mb-4 text-sm text-slate-500">Insumos que se consumen por cada unidad vendida.</p>

//                   {cargandoReceta ? (
//                     <p className="py-6 text-center text-slate-400">Cargando receta...</p>
//                   ) : receta.length === 0 ? (
//                     <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-6 text-center text-sm text-slate-400">
//                       Este producto aún no tiene receta.
//                     </p>
//                   ) : (
//                     <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
//                       {receta.map((r) => (
//                         <div key={r.insumo_id} className="flex items-center justify-between gap-3 px-4 py-3">
//                           <p className="font-bold text-slate-800">{r.insumos?.nombre}</p>
//                           <div className="flex items-center gap-2">
//                             <input
//                               key={`${r.insumo_id}-${r.cantidad}`}
//                               type="number"
//                               step="any"
//                               min="0"
//                               defaultValue={Number(r.cantidad)}
//                               onBlur={(e) => actualizarCantidad(r.insumo_id, e.target.value, r.cantidad)}
//                               className="w-24 rounded-lg border border-slate-300 px-2 py-1.5 text-right text-sm font-bold outline-none focus:border-red-500"
//                             />
//                             <span className="w-12 text-xs text-slate-500">{r.insumos?.unidad_medida}</span>
//                             <button type="button" onClick={() => quitar(r.insumo_id)} title="Quitar" className="text-lg text-slate-400 hover:text-red-600">
//                               🗑️
//                             </button>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   )}

//                   {/* AGREGAR */}
//                   <form onSubmit={agregar} className="mt-5 grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-[1fr_140px_auto]">
//                     <select value={nuevo.insumo_id} onChange={(e) => setNuevo({ ...nuevo, insumo_id: e.target.value })} className={inputCls}>
//                       <option value="">Selecciona insumo</option>
//                       {disponibles.map((i) => (
//                         <option key={i.id} value={i.id}>
//                           {i.nombre} ({i.unidad_medida})
//                         </option>
//                       ))}
//                     </select>
//                     <input
//                       type="number"
//                       step="any"
//                       min="0"
//                       value={nuevo.cantidad}
//                       onChange={(e) => setNuevo({ ...nuevo, cantidad: e.target.value })}
//                       placeholder={insumoSel ? `Cant. (${insumoSel.unidad_medida})` : "Cantidad"}
//                       className={inputCls}
//                     />
//                     <button type="submit" disabled={guardando} className="rounded-xl bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50">
//                       ➕ Agregar
//                     </button>
//                   </form>
//                   {insumos.length === 0 && (
//                     <p className="mt-2 text-xs text-amber-600">No hay insumos. Créalos primero en la pestaña Inventario.</p>
//                   )}
//                 </>
//               )}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }