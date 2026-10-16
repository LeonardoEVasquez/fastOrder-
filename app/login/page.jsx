
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseAuth } from "@/lib/supabase/auth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  async function ingresar(e) {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const { data, error: errorLogin } =
        await supabaseAuth.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (errorLogin || !data.session) {
        setError("Correo o contraseña incorrectos.");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#09090b] px-4 py-10 text-white selection:bg-red-500/30">
      {/* Fondo decorativo */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-red-600/10 blur-[110px]" />
        <div className="absolute -bottom-40 -right-20 h-[450px] w-[450px] rounded-full bg-red-800/10 blur-[130px]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />
      </div>

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#111114] shadow-2xl shadow-black/40 md:min-h-[610px] md:grid-cols-2">
        {/* Panel de marca */}
        <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-red-600 via-red-700 to-[#780e19] p-10 md:flex lg:p-12">
          <div className="absolute -right-24 top-28 h-72 w-72 rounded-full border border-white/10" />
          <div className="absolute -right-12 top-40 h-48 w-48 rounded-full border border-white/10" />
          <div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-black/10 blur-2xl" />

          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-xl font-black">
              F
            </div>
            <span className="text-xl font-bold tracking-tight">
              FastOrder<span className="text-red-200">.</span>
            </span>
          </div>

          <div className="relative py-12">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-red-50">
              <span className="h-2 w-2 rounded-full bg-green-300" />
              Plataforma de gestión
            </span>

            <h2 className="max-w-sm text-4xl font-bold leading-tight tracking-tight lg:text-5xl">
              Tu negocio,
              <br />
              bajo control.
            </h2>

            <p className="mt-5 max-w-sm text-sm leading-7 text-red-100/90 lg:text-base">
              Gestiona tus productos, pedidos y ventas desde un solo lugar.
              Dedica menos tiempo a las tareas y más a hacer crecer tu negocio.
            </p>

            <div className="mt-9 flex items-center gap-3">
              <div className="flex -space-x-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-red-700 bg-white/20 text-xs font-bold">
                  P
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-red-700 bg-white/15 text-xs font-bold">
                  V
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-red-700 bg-white/10 text-xs font-bold">
                  G
                </div>
              </div>
              <p className="text-xs leading-5 text-red-100">
                Todo lo que necesitas
                <br />
                para gestionar tu negocio.
              </p>
            </div>
          </div>

          <p className="relative text-xs text-red-100/70">
            © {new Date().getFullYear()} FastOrder. Todos los derechos reservados.
          </p>
        </section>

        {/* Formulario de acceso */}
        <section className="flex items-center justify-center px-6 py-10 sm:px-10 md:px-9 lg:px-14">
          <form onSubmit={ingresar} className="w-full max-w-sm">
            <div className="mb-9 md:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600 text-xl font-black shadow-lg shadow-red-950/40">
                  F
                </div>
                <span className="text-xl font-bold tracking-tight">
                  FastOrder<span className="text-red-500">.</span>
                </span>
              </div>
            </div>

            <div className="mb-8">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-7 w-7"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5m5 5H3"
                  />
                </svg>
              </div>

              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-red-400">
                Bienvenido de nuevo
              </p>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Iniciar sesión
              </h1>

              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Ingresa tus credenciales para acceder al panel de gestión.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-zinc-200"
                >
                  Correo electrónico
                </label>

                <div className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-4 transition focus-within:border-red-500/70 focus-within:bg-white/[0.055] focus-within:ring-4 focus-within:ring-red-500/10">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    className="h-5 w-5 shrink-0 text-zinc-500 transition group-focus-within:text-red-400"
                    aria-hidden="true"
                  >
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4 7 8 6 8-6"
                    />
                  </svg>

                  <input
                    id="email"
                    type="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="min-w-0 w-full bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-zinc-600"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-zinc-200"
                  >
                    Contraseña
                  </label>
                </div>

                <div className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-4 transition focus-within:border-red-500/70 focus-within:bg-white/[0.055] focus-within:ring-4 focus-within:ring-red-500/10">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    className="h-5 w-5 shrink-0 text-zinc-500 transition group-focus-within:text-red-400"
                    aria-hidden="true"
                  >
                    <rect x="4" y="10" width="16" height="11" rx="2" />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 10V7a4 4 0 1 1 8 0v3"
                    />
                  </svg>

                  <input
                    id="password"
                    type={mostrarPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    className="min-w-0 w-full bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-zinc-600"
                  />

                  <button
                    type="button"
                    onClick={() => setMostrarPassword((actual) => !actual)}
                    aria-label={
                      mostrarPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    className="shrink-0 rounded-md p-1 text-zinc-500 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  >
                    {mostrarPassword ? (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        className="h-5 w-5"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.5 4.5 9 7-.2 1.1-1.1 2.5-2.7 3.8M6.2 6.2C4 7.6 2.5 9.7 2 12c.5 2.5 4 7 10 7 1.3 0 2.5-.3 3.6-.7"
                        />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        className="h-5 w-5"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"
                        />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-sm leading-5 text-red-300"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="mt-0.5 h-5 w-5 shrink-0"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4m0 4h.01"
                    />
                  </svg>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={cargando}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-red-950/30 transition duration-200 hover:bg-red-500 hover:shadow-red-900/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cargando ? (
                  <>
                    <svg
                      className="h-5 w-5 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="currentColor"
                        strokeWidth="3"
                        opacity="0.25"
                      />
                      <path
                        d="M21 12a9 9 0 0 0-9-9"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                    Ingresando...
                  </>
                ) : (
                  <>
                    Ingresar al sistema
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-5 w-5 transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 12h14m-6-6 6 6-6 6"
                      />
                    </svg>
                  </>
                )}
              </button>
            </div>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-600">
                Acceso seguro
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <p className="text-center text-xs leading-5 text-zinc-500">
              Área exclusiva para personal autorizado.
              <br />
              Si no tienes acceso, contacta con el administrador.
            </p>

            <p className="mt-8 text-center text-xs text-zinc-600 md:hidden">
              © {new Date().getFullYear()} FastOrder
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}