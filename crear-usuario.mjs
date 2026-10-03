import pg from "pg";
import bcrypt from "bcryptjs";

const usuario = "admin";
const contrasena = "admin123";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const hash = await bcrypt.hash(contrasena, 10);

const actualizado = await pool.query(
  `UPDATE auth.usuario
   SET password_usuario = $2, activo = true
   WHERE nombre_usuario = $1`,
  [usuario, hash]
);

if (actualizado.rowCount === 0) {
  await pool.query(
    `INSERT INTO auth.usuario
       (nombres_completos, apellidos_completos, nombre_usuario,
        password_usuario, correo, nro_celular, dni, activo)
     VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
    ["Administrador", "Sistema", usuario, hash, "admin@fastorder.com", "900000000", "00000000"]
  );
}

console.log(`Usuario "${usuario}" listo.`);
await pool.end();