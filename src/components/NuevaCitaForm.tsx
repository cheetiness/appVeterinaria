import { useState, type ChangeEvent, type FormEvent } from "react";
import type { NuevaCita } from "../types";

type Props = {
  onGuardar: (datos: NuevaCita) => Promise<void>;
  onCancelar: () => void;
};

const CAMPOS_TEXTO = [
  { nombre: "mascota", etiqueta: "Mascota", max: 80 },
  { nombre: "cliente", etiqueta: "Cliente", max: 120 },
  { nombre: "servicio", etiqueta: "Servicio", max: 120 },
] as const;

const VACIA: NuevaCita = {
  mascota: "",
  cliente: "",
  servicio: "",
  fecha: "",
  hora: "",
};

const CLASE_INPUT =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 focus:outline-none focus:ring-4 focus:ring-teal-200";

function fechaDeHoy(): string {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

export function NuevaCitaForm({ onGuardar, onCancelar }: Props) {
  const [datos, setDatos] = useState<NuevaCita>(VACIA);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  function manejarCambio(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setDatos((actuales) => ({ ...actuales, [name]: value }));
  }

  async function manejarEnvio(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const hayVacios = Object.values(datos).some((v) => v.trim() === "");
    if (hayVacios) {
      setError("Todos los campos son obligatorios.");
      return;
    }
    if (datos.fecha < fechaDeHoy()) {
      setError("La fecha de la cita no puede ser anterior a hoy.");
      return;
    }

    try {
      setGuardando(true);
      setError("");
      await onGuardar(datos);

    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la cita.");
      setGuardando(false);
    }
  }

  return (
    <form
      onSubmit={manejarEnvio}
      noValidate
      className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
    >
      <h3 className="text-xl font-bold text-slate-900">Registrar nueva cita</h3>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CAMPOS_TEXTO.map((campo) => (
          <div key={campo.nombre}>
            <label
              htmlFor={campo.nombre}
              className="mb-1 block font-semibold text-slate-700"
            >
              {campo.etiqueta}
            </label>
            <input
              id={campo.nombre}
              name={campo.nombre}
              type="text"
              maxLength={campo.max}
              value={datos[campo.nombre]}
              onChange={manejarCambio}
              className={CLASE_INPUT}
            />
          </div>
        ))}

        <div>
          <label htmlFor="fecha" className="mb-1 block font-semibold text-slate-700">
            Fecha
          </label>
          <input
            id="fecha"
            name="fecha"
            type="date"
            min={fechaDeHoy()}
            value={datos.fecha}
            onChange={manejarCambio}
            className={CLASE_INPUT}
          />
        </div>

        <div>
          <label htmlFor="hora" className="mb-1 block font-semibold text-slate-700">
            Hora
          </label>
          <input
            id="hora"
            name="hora"
            type="time"
            value={datos.hora}
            onChange={manejarCambio}
            className={CLASE_INPUT}
          />
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-red-100 px-4 py-3 text-red-800"
        >
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={guardando}
          className="rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {guardando ? "Guardando..." : "Guardar cita"}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          disabled={guardando}
          className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}