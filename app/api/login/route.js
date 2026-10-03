import { pool } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const { usuario, contrasena } = await request.json();

    if (!usuario || !contrasena) {
      return Response.json(
        { error: "Completa usuario y contraseña." },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      `SELECT id_usuario, nombre_usuario, nombres_completos, password_usuario
       FROM auth.usuario
       WHERE nombre_usuario = $1 AND activo = true`,
      [usuario.trim()]
    );

    const user = rows[0];
    const ok = user && (await bcrypt.compare(contrasena, user.password_usuario));

    if (!ok) {
      return Response.json(
        { error: "Usuario o contraseña incorrectos." },
        { status: 401 }
      );
    }

    return Response.json({
      id: user.id_usuario,
      usuario: user.nombre_usuario,
      nombre: user.nombres_completos,
    });
  } catch (err) {
    console.error("Error en login:", err);
    return Response.json(
      { error: "Error del servidor. Intenta de nuevo." },
      { status: 500 }
    );
  }
}