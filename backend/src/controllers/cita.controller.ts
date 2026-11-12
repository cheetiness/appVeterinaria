// Controlador: valida los datos, aplica las reglas de negocio y llama
// al repositorio. Responde las peticiones HTTP.

import type { Request, Response } from "express";
import {
  actualizarCita, actualizarEstadoCita, buscarCitaPorId,
  crearCita, eliminarCita, horarioOcupado, listarCitas,
} from "../repositories/cita.repository.js";
import {
  estadosPermitidos,
  type ActualizarCita, type EstadoCita, type NuevaCita,
} from "../types/cita.js";
import { AppError } from "../middlewares/error.middleware.js";

// Longitudes máximas: coinciden con las columnas de la tabla citas.
const LIMITES = { mascota: 80, cliente: 120, servicio: 120 } as const;
const REGEX_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const REGEX_HORA = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

function obtenerId(req: Request): number {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, "El identificador no es válido.");
  }
  return id;
}

function esEstadoValido(valor: unknown): valor is EstadoCita {
  return typeof valor === "string" &&
    estadosPermitidos.includes(valor as EstadoCita);
}


function esFechaValida(valor: string): boolean {
  if (!REGEX_FECHA.test(valor)) return false;
  const [anio, mes, dia] = valor.split("-").map(Number);
  const fecha = new Date(Date.UTC(anio!, mes! - 1, dia!));
  return fecha.getUTCFullYear() === anio &&
    fecha.getUTCMonth() === mes! - 1 &&
    fecha.getUTCDate() === dia;
}

function fechaDeHoy(): string {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

function validarCampos(datos: Partial<NuevaCita>): void {
  const campos = [datos.mascota, datos.cliente, datos.servicio,
                  datos.fecha, datos.hora];
  const existeVacio = campos.some(
    valor => typeof valor !== "string" || valor.trim() === "",
  );
  if (existeVacio) {
    throw new AppError(400, "Todos los campos son obligatorios.");
  }

  for (const campo of ["mascota", "cliente", "servicio"] as const) {
    if (datos[campo]!.trim().length > LIMITES[campo]) {
      throw new AppError(
        400,
        `El campo ${campo} no puede superar ${LIMITES[campo]} caracteres.`,
      );
    }
  }

  if (!esFechaValida(datos.fecha!.trim())) {
    throw new AppError(400, "La fecha no es válida. Usa el formato AAAA-MM-DD.");
  }
  if (!REGEX_HORA.test(datos.hora!.trim())) {
    throw new AppError(400, "La hora no es válida. Usa el formato HH:MM.");
  }
  if (datos.estado !== undefined && !esEstadoValido(datos.estado)) {
    throw new AppError(400, "El estado de la cita no es válido.");
  }
}

function limpiar(datos: Partial<NuevaCita>): NuevaCita {
  return {
    mascota: datos.mascota!.trim(),
    cliente: datos.cliente!.trim(),
    servicio: datos.servicio!.trim(),
    fecha: datos.fecha!.trim(),
    hora: datos.hora!.trim(),
    estado: datos.estado,
  };
}

export async function obtenerCitas(req: Request, res: Response): Promise<void> {
  const estado = req.query.estado;
  if (estado !== undefined && !esEstadoValido(estado)) {
    throw new AppError(400, "El filtro de estado no es válido.");
  }
  res.json(await listarCitas(estado));
}

export async function obtenerCita(req: Request, res: Response): Promise<void> {
  const cita = await buscarCitaPorId(obtenerId(req));
  if (!cita) throw new AppError(404, "La cita no fue encontrada.");
  res.json(cita);
}

export async function registrarCita(req: Request, res: Response): Promise<void> {
  const entrada: Partial<NuevaCita> = req.body ?? {};
  validarCampos(entrada);
  const datos = limpiar(entrada);

  if (datos.fecha < fechaDeHoy()) {
    throw new AppError(400, "La fecha de la cita no puede ser anterior a hoy.");
  }
  if (await horarioOcupado(datos.fecha, datos.hora)) {
    throw new AppError(409, "Ya existe una cita activa en ese horario.");
  }
  const cita = await crearCita(datos);
  res.status(201).json({ mensaje: "Cita registrada correctamente.", cita });
}

export async function modificarCita(req: Request, res: Response): Promise<void> {
  const id = obtenerId(req);
  const entrada: Partial<ActualizarCita> = req.body ?? {};
  validarCampos(entrada);
  const estado = entrada.estado;
  if (!esEstadoValido(estado)) {
    throw new AppError(400, "El estado es obligatorio y debe ser válido.");
  }
  const datos: ActualizarCita = { ...limpiar(entrada), estado };
  if (await horarioOcupado(datos.fecha, datos.hora, id)) {
    throw new AppError(409, "Ya existe otra cita activa en ese horario.");
  }
  const cita = await actualizarCita(id, datos);
  if (!cita) throw new AppError(404, "La cita no fue encontrada.");
  res.json({ mensaje: "Cita actualizada correctamente.", cita });
}

export async function cambiarEstado(req: Request, res: Response): Promise<void> {
  const id = obtenerId(req);
  const estado: unknown = req.body?.estado;
  if (!esEstadoValido(estado)) {
    throw new AppError(400, "El estado enviado no es válido.");
  }
  const actual = await buscarCitaPorId(id);
  if (!actual) throw new AppError(404, "La cita no fue encontrada.");
  if (actual.estado === "atendida" && estado === "cancelada") {
    throw new AppError(409, "Una cita atendida no puede cancelarse.");
  }
  const cita = await actualizarEstadoCita(id, estado);
  res.json({ mensaje: "Estado actualizado correctamente.", cita });
}

export async function borrarCita(req: Request, res: Response): Promise<void> {
  if (!await eliminarCita(obtenerId(req))) {
    throw new AppError(404, "La cita no fue encontrada.");
  }
  res.status(204).send();
}