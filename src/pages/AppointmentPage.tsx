import { useEffect, useState } from "react";
import { AppointmentCard } from "../components/AppointmentCard";
import { NuevaCitaForm } from "../components/NuevaCitaForm";
import { StatCard } from "../components/StatCard";
import {
  actualizarEstado, crearCita, obtenerCitas,
} from "../services/citaApi";
import type { Cita, EstadoCita, NuevaCita } from "../types";

type Filtro = "todas" | EstadoCita;

export function AppointmentsPage() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Carga inicial: GET /api/citas
  useEffect(() => {
    async function cargarCitas() {
      try {
        setCitas(await obtenerCitas());
      } catch (error) {
        setError(error instanceof Error ? error.message : "Ocurrió un error.");
      } finally {
        setCargando(false);
      }
    }

    void cargarCitas();
  }, []);

  // El mensaje de éxito desaparece solo a los 4 segundos.
  useEffect(() => {
    if (!mensaje) return;
    const temporizador = setTimeout(() => setMensaje(""), 4000);
    return () => clearTimeout(temporizador);
  }, [mensaje]);

  // PATCH /api/citas/:id/estado
  async function confirmarCita(id: number) {
    try {
      const actualizada = await actualizarEstado(id, "confirmada");
      setError("");
      setMensaje("Cita confirmada correctamente.");
      setCitas((actuales) =>
        actuales.map((cita) => (cita.id === id ? actualizada : cita)),
      );
    } catch (error) {
      setMensaje("");
      setError(error instanceof Error ? error.message : "Error al confirmar.");
    }
  }

  // POST /api/citas. Si falla, lanza el error para que lo muestre el formulario.
  async function registrarCita(datos: NuevaCita) {
    const nueva = await crearCita(datos);
    setCitas((actuales) =>
      [...actuales, nueva].sort((a, b) =>
        `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`),
      ),
    );
    setError("");
    setMensaje("Cita registrada correctamente.");
    setMostrarFormulario(false);
  }

  const citasFiltradas =
    filtro === "todas" ? citas : citas.filter((cita) => cita.estado === filtro);

  const pendientes = citas.filter((c) => c.estado === "solicitada").length;
  const confirmadas = citas.filter((c) => c.estado === "confirmada").length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-950">Agenda de citas</h2>
          <p className="mt-1 text-slate-600">
            Consulta y administra las citas de la veterinaria.
          </p>
        </div>
        <button
          onClick={() => setMostrarFormulario(true)}
          disabled={mostrarFormulario}
          className="rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          + Nueva cita
        </button>
      </section>

      {mostrarFormulario && (
        <NuevaCitaForm
          onGuardar={registrarCita}
          onCancelar={() => setMostrarFormulario(false)}
        />
      )}

      <section className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          titulo="Total de citas"
          valor={citas.length}
          color="text-teal-700"
        />
        <StatCard
          titulo="Pendientes"
          valor={pendientes}
          color="text-amber-600"
        />
        <StatCard
          titulo="Confirmadas"
          valor={confirmadas}
          color="text-green-600"
        />
      </section>

      <section className="mt-8">
        <label
          htmlFor="filtro"
          className="mb-2 block font-semibold text-slate-700"
        >
          Filtrar por estado
        </label>
        <select
          id="filtro"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value as Filtro)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 sm:w-64"
        >
          <option value="todas">Todas</option>
          <option value="solicitada">Solicitadas</option>
          <option value="confirmada">Confirmadas</option>
          <option value="atendida">Atendidas</option>
          <option value="rechazada">Rechazadas</option>
          <option value="cancelada">Canceladas</option>
        </select>
      </section>

      {cargando && <p className="mt-6 text-slate-500">Cargando citas...</p>}

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-xl bg-red-100 px-4 py-3 text-red-800"
        >
          {error}
        </p>
      )}

      {mensaje && (
        <p
          aria-live="polite"
          className="mt-6 rounded-xl bg-green-100 px-4 py-3 text-green-800"
        >
          {mensaje}
        </p>
      )}

      <section className="mt-6 grid gap-4">
        {citasFiltradas.map((cita) => (
          <AppointmentCard
            key={cita.id}
            cita={cita}
            onConfirmar={confirmarCita}
          />
        ))}

        {!cargando && !error && citasFiltradas.length === 0 && (
          <p className="rounded-2xl bg-white p-8 text-center text-slate-500">
            No se encontraron citas con ese estado.
          </p>
        )}
      </section>
    </main>
  );
}