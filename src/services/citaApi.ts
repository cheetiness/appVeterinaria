import type { Cita, EstadoCita, NuevaCita } from "../types";

const API_URL = "http://localhost:3000/api/citas";

async function solicitar<T>(url: string, opciones?: RequestInit): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await fetch(url, opciones);
  } catch {
    throw new Error(
      "No se pudo conectar con el servidor. Verifica que el backend esté encendido.",
    );
  }

  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    throw new Error(
      datos?.mensaje ?? "Ocurrió un error al procesar la solicitud.",
    );
  }
  return datos as T;
}

export function obtenerCitas(): Promise<Cita[]> {
  return solicitar<Cita[]>(API_URL);
}

export async function actualizarEstado(
  id: number, estado: EstadoCita,
): Promise<Cita> {
  const resultado = await solicitar<{ cita: Cita }>(`${API_URL}/${id}/estado`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado }),
  });
  return resultado.cita;
}

export async function crearCita(datos: NuevaCita): Promise<Cita> {
  const resultado = await solicitar<{ cita: Cita }>(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  return resultado.cita;
}