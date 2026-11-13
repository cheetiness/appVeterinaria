import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/database.js";
import type {
  ActualizarCita, Cita, EstadoCita, NuevaCita,
} from "../types/cita.js";

type CitaRow = Cita & RowDataPacket;

export async function listarCitas(estado?: EstadoCita): Promise<Cita[]> {
  if (estado) {
    const [rows] = await pool.execute<CitaRow[]>(
      `SELECT * FROM citas WHERE estado = ? ORDER BY fecha, hora`,
      [estado],
    );
    return rows;
  }

  const [rows] = await pool.query<CitaRow[]>(
    `SELECT * FROM citas ORDER BY fecha, hora`,
  );
  return rows;
}

export async function buscarCitaPorId(id: number): Promise<Cita | null> {
  const [rows] = await pool.execute<CitaRow[]>(
    `SELECT * FROM citas WHERE id = ?`, [id],
  );
  return rows[0] ?? null;
}

export async function horarioOcupado(
  fecha: string, hora: string, exceptoId?: number,
): Promise<boolean> {
  let sql = `SELECT id FROM citas
             WHERE fecha = ? AND hora = ?
             AND estado IN ('solicitada', 'confirmada')`;
  const valores: Array<string | number> = [fecha, hora];

  if (exceptoId !== undefined) {
    sql += " AND id <> ?";
    valores.push(exceptoId);
  }

  const [rows] = await pool.execute<RowDataPacket[]>(sql, valores);
  return rows.length > 0;
}

export async function crearCita(datos: NuevaCita): Promise<Cita> {
  const [resultado] = await pool.execute<ResultSetHeader>(
    `INSERT INTO citas
     (mascota, cliente, servicio, fecha, hora, estado)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [datos.mascota, datos.cliente, datos.servicio,
     datos.fecha, datos.hora, datos.estado ?? "solicitada"],
  );

  const cita = await buscarCitaPorId(resultado.insertId);
  if (!cita) throw new Error("La cita se guardó, pero no pudo recuperarse.");
  return cita;
}

export async function actualizarCita(
  id: number, datos: ActualizarCita,
): Promise<Cita | null> {
  const [resultado] = await pool.execute<ResultSetHeader>(
    `UPDATE citas SET mascota = ?, cliente = ?, servicio = ?,
     fecha = ?, hora = ?, estado = ? WHERE id = ?`,
    [datos.mascota, datos.cliente, datos.servicio,
     datos.fecha, datos.hora, datos.estado, id],
  );
  return resultado.affectedRows === 0 ? null : buscarCitaPorId(id);
}

export async function actualizarEstadoCita(
  id: number, estado: EstadoCita,
): Promise<Cita | null> {
  const [resultado] = await pool.execute<ResultSetHeader>(
    `UPDATE citas SET estado = ? WHERE id = ?`, [estado, id],
  );
  return resultado.affectedRows === 0 ? null : buscarCitaPorId(id);
}

export async function eliminarCita(id: number): Promise<boolean> {
  const [resultado] = await pool.execute<ResultSetHeader>(
    `DELETE FROM citas WHERE id = ?`, [id],
  );
  return resultado.affectedRows > 0;
}