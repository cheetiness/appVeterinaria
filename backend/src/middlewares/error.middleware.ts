import type { ErrorRequestHandler, RequestHandler } from "express";

export class AppError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function esErrorDeJson(error: unknown): boolean {
  return typeof error === "object" && error !== null &&
    (error as { type?: string }).type === "entity.parse.failed";
}

export const rutaNoEncontrada: RequestHandler = (req, res) => {
  res.status(404).json({
    mensaje: `No existe la ruta ${req.method} ${req.path}`,
  });
};

export const manejarErrores: ErrorRequestHandler = (
  error,
  _req,
  res,

  _next,
) => {
  console.error(error);

  if (error instanceof AppError) {
    res.status(error.status).json({ mensaje: error.message });
    return;
  }

  if (esErrorDeJson(error)) {
    res.status(400).json({
      mensaje: "El cuerpo de la solicitud no es un JSON válido.",
    });
    return;
  }

  res.status(500).json({
    mensaje: "Error interno del servidor. Intenta de nuevo más tarde.",
  });
};