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
    <main className="min-h-screen bg-[#111214] text-white selection:bg-red-500/30">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">

        {/* PANEL VISUAL */}
        <section className="relative hidden min-h-screen overflow-hidden bg-[#191817] lg:flex lg:flex-col lg:justify-between">
          {/* Fotografía gastronómica */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('/Image/logoCompany.png')",
            }}
          />

          {/* Oscurecimiento para mantener la legibilidad */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/15 to-black/85" />
          <div className="absolute inset-0 bg-black/10" />

          {/* Marca */}
          <div className="relative z-10 flex items-center justify-between px-12 pt-10 xl:px-16">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#e5483f] text-xl font-black text-white">
                F
              </div>

              <div>
                <p className="text-xl font-bold tracking-tight">
                  FastOrder<span className="text-[#f16a60]"></span>
                </p>
                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.22em] text-white/60">
                  Restaurant management
                </p>
              </div>
            </div>

            
          </div>

          {/* Mensaje principal */}
          <div className="relative z-10 max-w-2xl px-12 pb-14 xl:px-16 xl:pb-16">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.25em] text-[#ff8178]">
              MENOS OPERACIONES. MÁS CRECIMIENTO.
            </p>

            <h2 className="max-w-xl text-5xl font-semibold leading-[1.12] tracking-[-0.045em] xl:text-6xl">
              Todo listo
              <br />
              para servir.
            </h2>

            <p className="mt-6 max-w-md text-base leading-7 text-white/75">
              Controla tus productos, organiza tus pedidos y supervisa tus
              ventas desde un solo lugar.
            </p>

            

            <p className="mt-14 text-xs text-white/45">
              © {new Date().getFullYear()} FastOrder Todos los derechos
              reservados.
            </p>
          </div>
        </section>

        {/* PANEL DE ACCESO */}
        <section className="relative flex min-h-screen flex-col justify-center bg-[#111214] px-6 py-10 sm:px-12 lg:px-14 xl:px-20">

          {/* Marca para pantallas pequeñas */}
          <div className="absolute left-6 top-7 sm:left-12 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e5483f] text-lg font-black">
                F
              </div>

              <span className="text-lg font-bold tracking-tight">
                FastOrder<span className="text-[#e5483f]">.</span>
              </span>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[390px] pt-12 lg:pt-0">

            {/* Encabezado */}
            <div className="mb-9">
              

              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#f16a60]">
                ACCESO A TU CUENTA
              </p>

              <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-[38px]">
                Bienvenido de nuevo
              </h1>

              <p className="mt-3 text-sm leading-6 text-[#929297]">
                Introduce tus credenciales para acceder al panel de gestión.
              </p>
            </div>

            {/* FORMULARIO */}
            <form onSubmit={ingresar} className="space-y-5">

              {/* Correo */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2.5 block text-sm font-medium text-[#e4e4e7]"
                >
                  Correo electrónico
                </label>

                <div className="group flex items-center gap-3 rounded-lg border border-[#343438] bg-[#19191c] px-3.5 transition-colors duration-200 focus-within:border-[#e5483f] focus-within:ring-4 focus-within:ring-[#e5483f]/10">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    className="h-5 w-5 shrink-0 text-[#77777f] transition-colors group-focus-within:text-[#f16a60]"
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
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@restaurante.com"
                    className="min-w-0 w-full bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-[#626269]"
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2.5 block text-sm font-medium text-[#e4e4e7]"
                >
                  Contraseña
                </label>

                <div className="group flex items-center gap-3 rounded-lg border border-[#343438] bg-[#19191c] px-3.5 transition-colors duration-200 focus-within:border-[#e5483f] focus-within:ring-4 focus-within:ring-[#e5483f]/10">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    className="h-5 w-5 shrink-0 text-[#77777f] transition-colors group-focus-within:text-[#f16a60]"
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
                    className="min-w-0 w-full bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-[#626269]"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setMostrarPassword((actual) => !actual)
                    }
                    aria-label={
                      mostrarPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    aria-pressed={mostrarPassword}
                    className="shrink-0 rounded-md p-1 text-[#77777f] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e5483f]"
                  >
                    {mostrarPassword ? (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
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
                        strokeWidth="1.6"
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

              {/* Error de autenticación */}
              {error && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="flex items-start gap-3 rounded-lg border border-red-500/25 bg-red-500/[0.08] p-3.5 text-sm leading-5 text-red-300"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
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

                  <p>{error}</p>
                </div>
              )}

              {/* Botón de acceso */}
              <button
                type="submit"
                disabled={cargando}
                className="group flex w-full items-center justify-center gap-2.5 rounded-lg bg-[#e5483f] px-4 py-3.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#f05449] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#e5483f]/25 disabled:cursor-not-allowed disabled:opacity-60"
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
                    Iniciar sesión

                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1"
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
            </form>

            {/* Seguridad */}
            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-[#303034]" />

              <div className="flex items-center gap-2 text-[#818187]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <rect x="5" y="10" width="14" height="11" rx="2" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 10V7a4 4 0 1 1 8 0v3"
                  />
                </svg>

                <span className="whitespace-nowrap text-[11px] font-medium">
                  Acceso protegido
                </span>
              </div>

              <div className="h-px flex-1 bg-[#303034]" />
            </div>

            <p className="text-center text-xs leading-6 text-[#85858b]">
              Área exclusiva para personal autorizado.
              <br />
              Si no tienes acceso, contacta con el administrador.
            </p>
          </div>

          {/* Pie de página para escritorio */}
          <div className="absolute bottom-6 right-8 hidden lg:block">
            <p className="text-[11px] text-[#626269]">
              © {new Date().getFullYear()} FastOrder
            </p>
          </div>

          {/* Pie de página para móvil */}
          <div className="mt-12 text-center lg:hidden">
            <p className="text-[11px] text-[#626269]">
              © {new Date().getFullYear()} FastOrder. Todos los derechos
              reservados.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}