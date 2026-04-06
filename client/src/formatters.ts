export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function translateTicketStatus(value?: string) {
  const map: Record<string, string> = {
    RESERVADO: "Reservado",
    EMITIDO: "Emitido",
    CHECKED_IN: "Check-in realizado",
    EMBARCADO: "Embarcado",
    CANCELADO: "Cancelado",
    NO_SHOW: "No presentado",
    LISTA_ESPERA: "Lista de espera",
  };
  return value ? (map[value] ?? value) : "-";
}

export function translateCabinClass(value?: string) {
  const map: Record<string, string> = {
    ECONOMY: "Turista",
    PREMIUM_ECONOMY: "Turista premium",
    BUSINESS: "Ejecutiva",
    FIRST: "Primera",
  };
  return value ? (map[value] ?? value) : "-";
}

export function translateFlightStatus(value?: string) {
  const map: Record<string, string> = {
    PROGRAMADO: "Programado",
    CHECKIN_ABIERTO: "Check-in abierto",
    EMBARQUE: "Embarque",
    PUERTA_CERRADA: "Puerta cerrada",
    SALIDO: "Salido",
    RETRASADO: "Retrasado",
    CANCELADO: "Cancelado",
    COMPLETADO: "Completado",
  };
  return value ? (map[value] ?? value) : "-";
}

export function translateSeatState(value?: string) {
  const map: Record<string, string> = {
    LIBRE: "Libre",
    OCUPADO: "Ocupado",
    BLOQUEADO: "Bloqueado",
    TRIPULACION: "Tripulación",
    SALIDA: "Salida emergencia",
    PREMIUM: "Premium",
  };
  return value ? (map[value] ?? value) : "-";
}

export function translateRole(value?: string) {
  const map: Record<string, string> = {
    ADMIN_GENERAL: "Administrador general",
    SUPERVISOR_AEROPUERTO: "Supervisor de aeropuerto",
    SUPERVISOR_TURNO: "Supervisor de turno",
    MOSTRADOR_FACTURACION: "Mostrador / facturación",
    PUERTA_EMBARQUE: "Puerta de embarque",
    OPERACIONES: "Operaciones",
    CENTRO_CONTROL: "Centro de control",
    FLOTA: "Flota",
    ATENCION_CLIENTE: "Atención al cliente",
    BACKOFFICE: "Backoffice",
    SEGURIDAD_AUDITORIA: "Seguridad / auditoría",
    SOLO_LECTURA: "Solo lectura",
    ACTIVO: "Activo",
    SUSPENDIDO: "Suspendido",
    BLOQUEADO: "Bloqueado",
  };
  return value ? (map[value] ?? value) : "-";
}

export function translateSummaryKey(value: string) {
  const map: Record<string, string> = {
    vuelosHoy: "Vuelos de hoy",
    vuelosRetrasados: "Vuelos retrasados",
    puertasActivas: "Puertas activas",
    mostradoresActivos: "Mostradores activos",
    pasajerosPendientesCheckin: "Pendientes de check-in",
    equipajesFacturados: "Equipajes facturados",
    pasajerosEmbarcados: "Pasajeros embarcados",
    incidenciasAbiertas: "Incidencias abiertas",
    vuelosConSobreventa: "Vuelos con sobreventa",
    tasaEmbarque: "Tasa de embarque",
  };
  return map[value] ?? value;
}

export function translateAuditAction(value?: string) {
  const map: Record<string, string> = {
    CHECKIN_COMPLETED: "Check-in completado",
    BOARDING_COMPLETED: "Embarque completado",
    BAGGAGE_CHECKED: "Equipaje facturado",
    UPGRADE_APPLIED: "Upgrade aplicado",
    AIRLINE_SETTINGS_UPDATED: "Ajustes de aerolínea actualizados",
  };
  return value ? (map[value] ?? value) : "-";
}
