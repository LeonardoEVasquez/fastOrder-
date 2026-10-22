// import Carta from "./components/carta";

// export default function Home() {
//   return (
//    <Carta />
//   );
// }


"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Carta from "./components/carta";
import { supabaseAuth } from "@/lib/supabase/auth";

export default function Home() {
  const router = useRouter();
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    let activo = true;

    async function verificarSesion() {
      const { data, error } = await supabaseAuth.auth.getSession();

      if (!activo) return;

      if (error || !data.session) {
        router.replace("/login");
      } else {
        setVerificando(false);
      }
    }

    verificarSesion();

    const {
      data: { subscription },
    } = supabaseAuth.auth.onAuthStateChange((_event, session) => {
      if (!activo) return;

      if (!session) {
        router.replace("/login");
      } else {
        setVerificando(false);
      }
    });

    return () => {
      activo = false;
      subscription.unsubscribe();
    };
  }, [router]);

  if (verificando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-500">Verificando sesión...</p>
      </main>
    );
  }

  return <Carta />;
}