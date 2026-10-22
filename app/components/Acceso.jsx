"use client";

import { useState } from "react";
import Login from "./login";
import Carta from "./carta";

console.log("Login:", typeof Login, "| Carta:", typeof Carta);

export default function Acceso() {
  const [sesionIniciada, setSesionIniciada] = useState(false);

  if (!sesionIniciada) {
    return (
      <Login
        onLogin={() => setSesionIniciada(true)}
      />
    );
  }

  return <Carta />;
}