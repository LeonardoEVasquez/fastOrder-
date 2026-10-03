"use client";

import { useState } from "react";

// Imagen de fondo de toda la pantalla de login.
// Guarda tu foto en la carpeta /public (ej: public/hamburguesa-login.jpg)
// o pega aquí la misma URL que usas en la carta.
const IMAGEN_HAMBURGUESA = "/Image/fondo2.png";

export default function Login({ onLogin }) {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const iniciarSesion = async (e) => {
    e.preventDefault();
    setError("");

    if (!usuario.trim() || !contrasena.trim()) {
      setError("Completa usuario y contraseña.");
      return;
    }

    setCargando(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, contrasena }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "No se pudo iniciar sesión.");
        return;
      }

      onLogin(data);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-8">

      {/* IMAGEN DE FONDO */}

      <img
        src={IMAGEN_HAMBURGUESA}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* CAPA OSCURA PARA QUE EL FORMULARIO DESTAQUE */}

      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/75 to-red-900/60" />

      {/* FONDOS DECORATIVOS */}

      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-red-600/20 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-amber-500/20 blur-3xl" />

      {/* CONTENEDOR */}

      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl lg:grid-cols-2">

        {/* PANEL IZQUIERDO */}

        <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-red-600 via-red-700 to-slate-950 p-10 text-white lg:flex">

          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border border-white/10" />

          <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full border border-white/10" />

          <div className="relative z-10">

            {/* LOGO */}

            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl font-black text-red-700 shadow-lg">
                F
              </div>

              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">
                  FastOrder
                </h1>

                <p className="text-sm text-red-100">
                  Sistema de gestión de pedidos
                </p>
              </div>

            </div>

          </div>

          {/* MENSAJE PRINCIPAL */}

          <div className="relative z-10 my-12">

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-red-50">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Plataforma de pedidos
            </div>

            <h2 className="text-4xl font-extrabold leading-tight tracking-tight">
              Gestiona tus pedidos.
              <br />

              <span className="text-amber-300">
                Simplifica tu trabajo.
              </span>
            </h2>

            <p className="mt-6 max-w-sm text-base leading-7 text-red-50/80">
              Administra tu carta, personaliza productos y organiza
              tus pedidos desde una sola plataforma.
            </p>

          </div>

          {/* PIE */}

          <div className="relative z-10 border-t border-white/15 pt-5">

            <p className="text-sm text-red-100">
              FastOrder · Sistema de pedidos para restaurantes
            </p>

          </div>

        </section>

        {/* PANEL DERECHO: FORMULARIO */}

        <section className="flex items-center justify-center bg-white px-6 py-10 sm:px-10 lg:px-12">

          <div className="w-full max-w-md">

            {/* LOGO PARA MÓVILES */}

            <div className="mb-10 flex items-center gap-3 lg:hidden">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-2xl font-black text-white shadow-lg shadow-red-200">
                F
              </div>

              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                  FastOrder
                </h1>

                <p className="text-sm text-slate-500">
                  Sistema de gestión de pedidos
                </p>
              </div>

            </div>

            {/* ENCABEZADO */}

            <div className="mb-8">

              <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-red-600">
                Bienvenido
              </p>

              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Iniciar sesión
              </h2>

              <p className="mt-3 leading-6 text-slate-500">
                Ingresa tus credenciales para acceder al sistema.
              </p>

            </div>

            {/* FORMULARIO */}

            <form onSubmit={iniciarSesion} className="space-y-5">

              {/* USUARIO */}

              <div>

                <label
                  htmlFor="usuario"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Usuario
                </label>

                <div className="relative">

                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">

                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="8" r="4" />
                      <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
                    </svg>

                  </div>

                  <input
                    id="usuario"
                    type="text"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    placeholder="Ingresa tu usuario"
                    autoComplete="username"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100"
                  />

                </div>

              </div>

              {/* CONTRASEÑA */}

              <div>

                <div className="mb-2 flex items-center justify-between">

                  <label
                    htmlFor="contrasena"
                    className="block text-sm font-bold text-slate-700"
                  >
                    Contraseña
                  </label>

                </div>

                <div className="relative">

                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">

                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>

                  </div>

                  <input
                    id="contrasena"
                    type={mostrarContrasena ? "text" : "password"}
                    value={contrasena}
                    onChange={(e) => setContrasena(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    autoComplete="current-password"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-14 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100"
                  />

                  <button
                    type="button"
                    onClick={() => setMostrarContrasena(!mostrarContrasena)}
                    aria-label={
                      mostrarContrasena
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 transition hover:text-red-600"
                  >

                    {mostrarContrasena ? (

                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 3l18 18" />
                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                        <path d="M9.9 5.2A11 11 0 0 1 12 5c5 0 9 4 10 7-0.5 1.5-1.5 2.8-2.8 3.8" />
                        <path d="M6.2 6.2C3.9 7.5 2.5 9.4 2 12c1 3 5 7 10 7 1 0 2-.2 2.9-.5" />
                      </svg>

                    ) : (

                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>

                    )}

                  </button>

                </div>

              </div>

              {/* MENSAJE DE ERROR */}

              {error && (

                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4" />
                    <path d="M12 16h.01" />
                  </svg>

                  <p>{error}</p>

                </div>

              )}

              {/* BOTÓN */}

              <button
                type="submit"
                disabled={cargando}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-red-600 px-5 py-4 font-extrabold text-white shadow-lg shadow-red-200 transition duration-200 hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-xl active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
              >

                {cargando ? "Ingresando..." : "Iniciar sesión"}

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>

              </button>

            </form>

            {/* INFORMACIÓN INFERIOR */}

            <div className="mt-8 border-t border-slate-100 pt-6">

              <div className="flex items-center justify-center gap-2 text-sm text-slate-500">

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>

                <span>Acceso al sistema FastOrder</span>

              </div>

              <p className="mt-4 text-center text-xs text-slate-400">
                © {new Date().getFullYear()} FastOrder. Todos los derechos reservados.
              </p>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}