export type EstadoCita =
  | 'solicitada'
  | 'confirmada'
  | 'atendida'
  | 'rechazada'
  | 'cancelada';

export type Cita = {
  id: number;
  mascota: string;
  cliente: string;
  servicio: string;
  fecha: string;
  hora: string;
  estado: EstadoCita;
};

export type NuevaCita = Omit<Cita, 'id' | 'estado'>;