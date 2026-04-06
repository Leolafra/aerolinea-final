import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { initPersistence, persistState } from "./persistence.js";

export type Role =
  | "ADMIN_GENERAL"
  | "SUPERVISOR_AEROPUERTO"
  | "SUPERVISOR_TURNO"
  | "MOSTRADOR_FACTURACION"
  | "PUERTA_EMBARQUE"
  | "OPERACIONES"
  | "CENTRO_CONTROL"
  | "FLOTA"
  | "ATENCION_CLIENTE"
  | "BACKOFFICE"
  | "SEGURIDAD_AUDITORIA"
  | "SOLO_LECTURA"
  | "ADMIN"
  | "SUPERVISOR"
  | "CHECKIN_AGENT"
  | "GATE_AGENT"
  | "OPERATIONS"
  | "FLEET_MANAGER"
  | "CUSTOMER_SERVICE";

type Permission =
  | "dashboard.ver"
  | "vuelos.ver"
  | "vuelos.editar"
  | "pasajeros.ver"
  | "pasajeros.editar"
  | "checkin.ejecutar"
  | "equipaje.gestionar"
  | "embarque.gestionar"
  | "upgrades.gestionar"
  | "incidencias.gestionar"
  | "auditoria.ver"
  | "impresion.reimprimir"
  | "ajustes.ver"
  | "ajustes.editar"
  | "mensajeria.interna"
  | "clientes.ver";

type UserStatus = "ACTIVO" | "SUSPENDIDO" | "BLOQUEADO";

type EmployeeUser = {
  id: string;
  username: string;
  passwordHash: string;
  role: Role;
  active: boolean;
  status: UserStatus;
  failedAttempts: number;
  forcePasswordChange: boolean;
  lastAccessAt?: string;
  lockedUntil?: string;
  airportIds: string[];
  airlineIds: string[];
  permissions: Permission[];
};

type CustomerAccount = {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  documentNumber: string;
  phone: string;
  nationality: string;
  createdAt: string;
  lastAccessAt?: string;
  messagesUnread: number;
};

type Airline = {
  id: string;
  commercialName: string;
  iataCode: string;
  icaoCode: string;
  logoUrl: string;
  ticketPrefix: string;
  baggagePolicy: string;
  upgradePolicy: string;
  colorPrimary: string;
  colorAccent: string;
  contactEmail: string;
  active: boolean;
};

type Airport = {
  id: string;
  code: string;
  icaoCode: string;
  name: string;
  city: string;
  country: string;
  active: boolean;
};

type Terminal = {
  id: string;
  airportId: string;
  code: string;
  name: string;
  active: boolean;
};

type Counter = {
  id: string;
  terminalId: string;
  code: string;
  active: boolean;
  assignedAirlineId?: string;
};

type Gate = {
  id: string;
  terminalId: string;
  code: string;
  active: boolean;
};

type Aircraft = {
  id: string;
  registration: string;
  model: string;
  manufacturer: string;
  seatCapacity: number;
  cabinConfigJson: string;
  status: "OPERATIVA" | "MANTENIMIENTO" | "RESERVA";
  maintenanceNote?: string;
  rangeType: "REGIONAL" | "NARROW_BODY" | "WIDE_BODY";
};

type Employee = {
  id: string;
  userId: string;
  fullName: string;
  stationCode: string;
  title: string;
  airlineId?: string;
  airportId?: string;
  terminalIds: string[];
};

type CustomerProfile = {
  id: string;
  accountId: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  documentNumber: string;
  nationality: string;
  contactEmail: string;
  contactPhone: string;
  loyaltyLevel: "BASICO" | "SILVER" | "GOLD";
  preferences: string[];
};

type PassengerType = "ADULTO" | "MENOR" | "INFANTE" | "PMR" | "VIP";

type Passenger = {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  documentNumber: string;
  nationality: string;
  contactEmail: string;
  contactPhone: string;
  operationalNotes?: string;
  type: PassengerType;
  ssr: string[];
  assistanceRequired: boolean;
  documentVerified: boolean;
  waitlist: boolean;
  deniedBoarding: boolean;
  noShow: boolean;
  customerAccountId?: string;
};

type FlightStatus =
  | "PROGRAMADO"
  | "CHECKIN_ABIERTO"
  | "EMBARQUE"
  | "PUERTA_CERRADA"
  | "SALIDO"
  | "RETRASADO"
  | "CANCELADO"
  | "COMPLETADO";

type Flight = {
  id: string;
  airlineId: string;
  flightNumber: string;
  originId: string;
  destinationId: string;
  terminalId: string;
  gateId?: string;
  counterIds: string[];
  aircraftId?: string;
  flightType: "NACIONAL" | "INTERNACIONAL";
  scheduledDeparture: string;
  scheduledArrival: string;
  estimatedDeparture: string;
  estimatedArrival: string;
  actualDeparture?: string;
  actualArrival?: string;
  status: FlightStatus;
  occupancyLimit: number;
  overbookLimit: number;
  waitlistCount: number;
  crew: string[];
  notes: string[];
  weatherImpact?: string;
};

type BookingStatus = "RESERVADO" | "EMITIDO" | "CHECKED_IN" | "EMBARCADO" | "CANCELADO" | "NO_SHOW" | "LISTA_ESPERA";

type Booking = {
  id: string;
  locator: string;
  passengerId: string;
  flightId: string;
  customerAccountId?: string;
  fareName: string;
  cabinClass: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
  seatNumber?: string;
  baggageIncluded: number;
  extraServices: string[];
  ticketStatus: BookingStatus;
  refundable: boolean;
  upgradeAvailable: boolean;
  checkedInAt?: string;
  boardedAt?: string;
  remarks?: string;
  ticketNumber: string;
  priceTotal: number;
  boardingGroup: string;
};

type SeatAssignment = {
  id: string;
  flightId: string;
  seatNumber: string;
  cabinClass: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
  state: "LIBRE" | "OCUPADO" | "BLOQUEADO" | "TRIPULACION" | "SALIDA" | "PREMIUM";
  position: "VENTANA" | "PASILLO" | "CENTRO";
  bookingId?: string;
};

type Baggage = {
  id: string;
  passengerId: string;
  flightId: string;
  employeeId: string;
  bagTag: string;
  pieces: number;
  totalWeightKg: number;
  kind: "FACTURADO" | "MANO" | "EXTRA" | "ESPECIAL" | "PRIORITARIO";
  excessFee: number;
  status: "FACTURADO" | "CARGADO" | "RETENIDO" | "OFFLOAD" | "ENTREGADO";
  barcode: string;
  printedAt?: string;
  createdAt: string;
  fragile: boolean;
};

type Boarding = {
  id: string;
  bookingId: string;
  flightId: string;
  employeeId: string;
  status: "PENDIENTE" | "EMBARCADO" | "DENEGADO";
  boardedAt?: string;
  manualOverride: boolean;
};

type Upgrade = {
  id: string;
  bookingId: string;
  flightId: string;
  employeeId: string;
  fromClass: string;
  toClass: string;
  reason: string;
  newSeat?: string;
  price: number;
  compensation?: string;
  createdAt: string;
};

type Incident = {
  id: string;
  scope: "VUELO" | "PASAJERO" | "EQUIPAJE" | "PUERTA" | "MOSTRADOR" | "SISTEMA";
  flightId?: string;
  passengerId?: string;
  baggageId?: string;
  gateId?: string;
  counterId?: string;
  employeeId?: string;
  type: string;
  severity: "BAJA" | "MEDIA" | "ALTA" | "CRITICA";
  status: "ABIERTA" | "EN_SEGUIMIENTO" | "RESUELTA";
  description: string;
  comments: string[];
  createdAt: string;
};

type AuditLog = {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  terminalId: string;
  previousData?: string;
  nextData?: string;
  createdAt: string;
  critical: boolean;
};

type AccessLog = {
  id: string;
  userId: string;
  terminalId: string;
  ipAddress?: string;
  loginAt: string;
  success: boolean;
  detail?: string;
};

type PrinterProfile = {
  id: string;
  userId: string;
  terminalName: string;
  printerName: string;
  driverType: string;
  paperWidth: number;
  isDefault: boolean;
  simulationMode: boolean;
};

type PrintHistory = {
  id: string;
  userId: string;
  type: string;
  referenceId: string;
  copies: number;
  mode: "SIMULACION" | "TERMICA" | "A4";
  createdAt: string;
};

type Message = {
  id: string;
  channel: "INTERNA" | "CLIENTE";
  fromType: "EMPLEADO" | "CLIENTE" | "SISTEMA";
  fromId: string;
  toEmployeeId?: string;
  toCustomerAccountId?: string;
  subject: string;
  body: string;
  priority: "BAJA" | "MEDIA" | "ALTA";
  readAt?: string;
  createdAt: string;
};

type NewsItem = {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  category: "OPERATIVA" | "CORPORATIVA" | "DESTINOS" | "SERVICIOS";
  createdAt: string;
};

type Notice = {
  id: string;
  title: string;
  body: string;
  severity: "INFO" | "ALERTA" | "URGENTE";
  createdAt: string;
};

type FAQ = { id: string; question: string; answer: string };

type Setting = {
  id: string;
  category: string;
  key: string;
  value: string;
};

type Shift = {
  id: string;
  employeeId: string;
  terminalId: string;
  startsAt: string;
  endsAt: string;
  status: "PROGRAMADO" | "ACTIVO" | "FINALIZADO";
};

type StoreData = {
  airlines: Airline[];
  airports: Airport[];
  terminals: Terminal[];
  counters: Counter[];
  gates: Gate[];
  aircraft: Aircraft[];
  employeeUsers: EmployeeUser[];
  employees: Employee[];
  customerAccounts: CustomerAccount[];
  customerProfiles: CustomerProfile[];
  passengers: Passenger[];
  flights: Flight[];
  bookings: Booking[];
  seatAssignments: SeatAssignment[];
  baggage: Baggage[];
  boardings: Boarding[];
  upgrades: Upgrade[];
  incidents: Incident[];
  auditLogs: AuditLog[];
  accessLogs: AccessLog[];
  printerProfiles: PrinterProfile[];
  printHistory: PrintHistory[];
  settings: Setting[];
  messages: Message[];
  news: NewsItem[];
  notices: Notice[];
  faqs: FAQ[];
  shifts: Shift[];
};

const rolePermissions: Record<Role, Permission[]> = {
  ADMIN_GENERAL: [
    "dashboard.ver", "vuelos.ver", "vuelos.editar", "pasajeros.ver", "pasajeros.editar", "checkin.ejecutar",
    "equipaje.gestionar", "embarque.gestionar", "upgrades.gestionar", "incidencias.gestionar", "auditoria.ver",
    "impresion.reimprimir", "ajustes.ver", "ajustes.editar", "mensajeria.interna", "clientes.ver",
  ],
  ADMIN: [
    "dashboard.ver", "vuelos.ver", "vuelos.editar", "pasajeros.ver", "pasajeros.editar", "checkin.ejecutar",
    "equipaje.gestionar", "embarque.gestionar", "upgrades.gestionar", "incidencias.gestionar", "auditoria.ver",
    "impresion.reimprimir", "ajustes.ver", "ajustes.editar", "mensajeria.interna", "clientes.ver",
  ],
  SUPERVISOR_AEROPUERTO: ["dashboard.ver", "vuelos.ver", "vuelos.editar", "pasajeros.ver", "checkin.ejecutar", "equipaje.gestionar", "embarque.gestionar", "incidencias.gestionar", "auditoria.ver", "mensajeria.interna", "ajustes.ver"],
  SUPERVISOR_TURNO: ["dashboard.ver", "vuelos.ver", "vuelos.editar", "pasajeros.ver", "checkin.ejecutar", "equipaje.gestionar", "embarque.gestionar", "incidencias.gestionar", "mensajeria.interna"],
  MOSTRADOR_FACTURACION: ["dashboard.ver", "vuelos.ver", "pasajeros.ver", "pasajeros.editar", "checkin.ejecutar", "equipaje.gestionar", "impresion.reimprimir"],
  PUERTA_EMBARQUE: ["dashboard.ver", "vuelos.ver", "pasajeros.ver", "embarque.gestionar", "impresion.reimprimir"],
  OPERACIONES: ["dashboard.ver", "vuelos.ver", "vuelos.editar", "incidencias.gestionar", "mensajeria.interna"],
  CENTRO_CONTROL: ["dashboard.ver", "vuelos.ver", "vuelos.editar", "incidencias.gestionar", "auditoria.ver", "mensajeria.interna"],
  FLOTA: ["dashboard.ver", "vuelos.ver", "vuelos.editar", "ajustes.ver"],
  ATENCION_CLIENTE: ["dashboard.ver", "vuelos.ver", "pasajeros.ver", "pasajeros.editar", "upgrades.gestionar", "clientes.ver", "mensajeria.interna"],
  BACKOFFICE: ["dashboard.ver", "vuelos.ver", "clientes.ver", "ajustes.ver"],
  SEGURIDAD_AUDITORIA: ["dashboard.ver", "auditoria.ver", "ajustes.ver"],
  SOLO_LECTURA: ["dashboard.ver", "vuelos.ver", "pasajeros.ver"],
  SUPERVISOR: ["dashboard.ver", "vuelos.ver", "vuelos.editar", "pasajeros.ver", "checkin.ejecutar", "equipaje.gestionar", "embarque.gestionar", "incidencias.gestionar", "auditoria.ver", "mensajeria.interna", "ajustes.ver"],
  CHECKIN_AGENT: ["dashboard.ver", "vuelos.ver", "pasajeros.ver", "pasajeros.editar", "checkin.ejecutar", "equipaje.gestionar", "impresion.reimprimir"],
  GATE_AGENT: ["dashboard.ver", "vuelos.ver", "pasajeros.ver", "embarque.gestionar", "impresion.reimprimir"],
  OPERATIONS: ["dashboard.ver", "vuelos.ver", "vuelos.editar", "incidencias.gestionar", "mensajeria.interna"],
  FLEET_MANAGER: ["dashboard.ver", "vuelos.ver", "vuelos.editar", "ajustes.ver"],
  CUSTOMER_SERVICE: ["dashboard.ver", "vuelos.ver", "pasajeros.ver", "pasajeros.editar", "upgrades.gestionar", "clientes.ver", "mensajeria.interna"],
};

function addMinutes(base: Date, minutes: number) {
  return new Date(base.getTime() + minutes * 60_000);
}

function randomFrom<T>(items: readonly T[], index: number) {
  return items[index % items.length];
}

function getSeatPosition(letter: string): "VENTANA" | "PASILLO" | "CENTRO" {
  if (["A", "F", "K"].includes(letter)) return "VENTANA";
  if (["C", "D", "G", "H"].includes(letter)) return "PASILLO";
  return "CENTRO";
}

function createSeatAssignments(flightId: string, cabinConfigJson: string): SeatAssignment[] {
  const sections = JSON.parse(cabinConfigJson) as Array<{
    rowStart: number;
    rowEnd: number;
    seats: string[];
    cabinClass: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
    exitRows?: number[];
    premiumRows?: number[];
    blockedSeats?: string[];
  }>;

  return sections.flatMap((section) =>
    Array.from({ length: section.rowEnd - section.rowStart + 1 }).flatMap((_, offset) => {
      const row = section.rowStart + offset;
      return section.seats.map((letter) => {
        const seatNumber = `${row}${letter}`;
        let state: SeatAssignment["state"] = "LIBRE";
        if (section.exitRows?.includes(row)) state = "SALIDA";
        if (section.premiumRows?.includes(row)) state = "PREMIUM";
        if (section.blockedSeats?.includes(seatNumber)) state = "BLOQUEADO";
        return {
          id: randomUUID(),
          flightId,
          seatNumber,
          cabinClass: section.cabinClass,
          state,
          position: getSeatPosition(letter),
        };
      });
    }),
  );
}

async function createSeed(): Promise<StoreData> {
  const airlines: Airline[] = [
    {
      id: randomUUID(),
      commercialName: "SkyBridge Atlantic",
      iataCode: "SB",
      icaoCode: "SBA",
      logoUrl: "/branding/skybridge-logo.svg",
      ticketPrefix: "724",
      baggagePolicy: "1 pieza de 23 kg en Economy y 2 piezas de 32 kg en Business.",
      upgradePolicy: "Upgrades por pago, fidelizacion, sobreventa o cortesia operativa.",
      colorPrimary: "#163455",
      colorAccent: "#d6d1c4",
      contactEmail: "operaciones@skybridge-atlantic.com",
      active: true,
    },
    {
      id: randomUUID(),
      commercialName: "Iberic Regional Connect",
      iataCode: "IR",
      icaoCode: "IRC",
      logoUrl: "/branding/skybridge-logo.svg",
      ticketPrefix: "312",
      baggagePolicy: "1 pieza de 20 kg y prioridad para conexones regionales.",
      upgradePolicy: "Upgrades segun disponibilidad en premium o cabina delantera.",
      colorPrimary: "#0a5d67",
      colorAccent: "#d8dfd7",
      contactEmail: "control@iberic-regional.com",
      active: true,
    },
  ];

  const airports: Airport[] = [
    { id: randomUUID(), code: "MAD", icaoCode: "LEMD", name: "Aeropuerto Haider Madrid Central", city: "Madrid", country: "Espana", active: true },
    { id: randomUUID(), code: "BCN", icaoCode: "LEBL", name: "Aeropuerto Haider Barcelona Mar", city: "Barcelona", country: "Espana", active: true },
    { id: randomUUID(), code: "LHR", icaoCode: "EGLL", name: "London Heathrow", city: "Londres", country: "Reino Unido", active: true },
    { id: randomUUID(), code: "CDG", icaoCode: "LFPG", name: "Paris Charles de Gaulle", city: "Paris", country: "Francia", active: true },
    { id: randomUUID(), code: "FCO", icaoCode: "LIRF", name: "Roma Fiumicino", city: "Roma", country: "Italia", active: true },
    { id: randomUUID(), code: "LIS", icaoCode: "LPPT", name: "Lisboa Humberto Delgado", city: "Lisboa", country: "Portugal", active: true },
  ];

  const terminals: Terminal[] = [
    { id: randomUUID(), airportId: airports[0].id, code: "T1", name: "Terminal 1", active: true },
    { id: randomUUID(), airportId: airports[0].id, code: "T2", name: "Terminal 2", active: true },
    { id: randomUUID(), airportId: airports[1].id, code: "T1", name: "Terminal Principal", active: true },
  ];

  const counters: Counter[] = [
    { id: randomUUID(), terminalId: terminals[0].id, code: "M-101", active: true, assignedAirlineId: airlines[0].id },
    { id: randomUUID(), terminalId: terminals[0].id, code: "M-102", active: true, assignedAirlineId: airlines[0].id },
    { id: randomUUID(), terminalId: terminals[1].id, code: "M-201", active: true, assignedAirlineId: airlines[1].id },
    { id: randomUUID(), terminalId: terminals[2].id, code: "B-011", active: true, assignedAirlineId: airlines[1].id },
  ];

  const gates: Gate[] = [
    { id: randomUUID(), terminalId: terminals[0].id, code: "A12", active: true },
    { id: randomUUID(), terminalId: terminals[0].id, code: "A16", active: true },
    { id: randomUUID(), terminalId: terminals[1].id, code: "B03", active: true },
    { id: randomUUID(), terminalId: terminals[1].id, code: "B07", active: true },
    { id: randomUUID(), terminalId: terminals[2].id, code: "C02", active: true },
  ];

  const configs = {
    a320: JSON.stringify([
      { rowStart: 1, rowEnd: 3, seats: ["A", "C", "D", "F"], cabinClass: "BUSINESS" },
      { rowStart: 4, rowEnd: 7, seats: ["A", "B", "C", "D", "E", "F"], cabinClass: "PREMIUM_ECONOMY", premiumRows: [4, 5] },
      { rowStart: 8, rowEnd: 30, seats: ["A", "B", "C", "D", "E", "F"], cabinClass: "ECONOMY", exitRows: [12, 13], blockedSeats: ["30E"] },
    ]),
    a321: JSON.stringify([
      { rowStart: 1, rowEnd: 4, seats: ["A", "C", "D", "F"], cabinClass: "BUSINESS" },
      { rowStart: 5, rowEnd: 9, seats: ["A", "B", "C", "D", "E", "F"], cabinClass: "PREMIUM_ECONOMY", premiumRows: [5, 6] },
      { rowStart: 10, rowEnd: 35, seats: ["A", "B", "C", "D", "E", "F"], cabinClass: "ECONOMY", exitRows: [15, 16] },
    ]),
    b738: JSON.stringify([
      { rowStart: 1, rowEnd: 3, seats: ["A", "C", "D", "F"], cabinClass: "BUSINESS" },
      { rowStart: 4, rowEnd: 7, seats: ["A", "B", "C", "D", "E", "F"], cabinClass: "PREMIUM_ECONOMY", premiumRows: [4] },
      { rowStart: 8, rowEnd: 31, seats: ["A", "B", "C", "D", "E", "F"], cabinClass: "ECONOMY", exitRows: [14, 15] },
    ]),
    e190: JSON.stringify([
      { rowStart: 1, rowEnd: 2, seats: ["A", "C", "D", "F"], cabinClass: "BUSINESS" },
      { rowStart: 3, rowEnd: 22, seats: ["A", "C", "D", "F"], cabinClass: "ECONOMY", exitRows: [9] },
    ]),
    b787: JSON.stringify([
      { rowStart: 1, rowEnd: 2, seats: ["A", "D", "G", "K"], cabinClass: "FIRST", premiumRows: [1] },
      { rowStart: 3, rowEnd: 7, seats: ["A", "C", "D", "F", "G", "J", "K"], cabinClass: "BUSINESS" },
      { rowStart: 8, rowEnd: 12, seats: ["A", "C", "D", "E", "F", "G", "H", "J", "K"], cabinClass: "PREMIUM_ECONOMY" },
      { rowStart: 13, rowEnd: 35, seats: ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K"], cabinClass: "ECONOMY", exitRows: [20, 21] },
    ]),
    a330: JSON.stringify([
      { rowStart: 1, rowEnd: 5, seats: ["A", "C", "D", "G", "H", "K"], cabinClass: "BUSINESS" },
      { rowStart: 6, rowEnd: 8, seats: ["A", "C", "D", "E", "F", "G", "H", "K"], cabinClass: "PREMIUM_ECONOMY" },
      { rowStart: 9, rowEnd: 32, seats: ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K"], cabinClass: "ECONOMY", exitRows: [18, 19] },
    ]),
  } as const;

  const aircraft: Aircraft[] = [
    { id: randomUUID(), registration: "EC-LAF", model: "A320-200", manufacturer: "Airbus", seatCapacity: 168, cabinConfigJson: configs.a320, status: "OPERATIVA", rangeType: "NARROW_BODY" },
    { id: randomUUID(), registration: "EC-HDR", model: "A321-200", manufacturer: "Airbus", seatCapacity: 196, cabinConfigJson: configs.a321, status: "OPERATIVA", rangeType: "NARROW_BODY" },
    { id: randomUUID(), registration: "EC-SB8", model: "737-800", manufacturer: "Boeing", seatCapacity: 174, cabinConfigJson: configs.b738, status: "OPERATIVA", rangeType: "NARROW_BODY" },
    { id: randomUUID(), registration: "EC-RG1", model: "Embraer 190", manufacturer: "Embraer", seatCapacity: 96, cabinConfigJson: configs.e190, status: "OPERATIVA", rangeType: "REGIONAL" },
    { id: randomUUID(), registration: "EC-WB7", model: "787-9", manufacturer: "Boeing", seatCapacity: 290, cabinConfigJson: configs.b787, status: "OPERATIVA", rangeType: "WIDE_BODY" },
    { id: randomUUID(), registration: "EC-WA3", model: "A330-300", manufacturer: "Airbus", seatCapacity: 276, cabinConfigJson: configs.a330, status: "MANTENIMIENTO", maintenanceNote: "Revision A programada.", rangeType: "WIDE_BODY" },
  ];

  const roleSeed: Array<[string, string, Role, string, string, string, string | undefined, string[]]> = [
    ["Leo Lafragueta", "Leo_012345678901", "ADMIN_GENERAL", "Leo Lafragueta", "Administrador General", "MAD", undefined, terminals.map((terminal) => terminal.id)],
    ["helena.admin", "Admin#1994", "ADMIN", "Helena Varela", "Administradora de Sistema", "MAD", undefined, terminals.map((terminal) => terminal.id)],
    ["super.aeropuerto", "Haider#Turno1", "SUPERVISOR_AEROPUERTO", "Marta Cueto", "Supervisora de Aeropuerto", "MAD", undefined, [terminals[0].id, terminals[1].id]],
    ["turno.a12", "Turno#A12", "SUPERVISOR_TURNO", "Ruben Salas", "Supervisor de Turno", "MAD", airlines[0].id, [terminals[0].id]],
    ["mostrador.01", "Counter#1994", "MOSTRADOR_FACTURACION", "Raul Mendoza", "Agente de Facturacion", "MAD", airlines[0].id, [terminals[0].id]],
    ["puerta.a12", "Gate#1994", "PUERTA_EMBARQUE", "Irene Solis", "Agente de Puerta", "MAD", airlines[0].id, [terminals[0].id]],
    ["ops.control", "Ops#1994", "OPERACIONES", "Dario Conde", "Operaciones", "MAD", airlines[0].id, [terminals[0].id, terminals[1].id]],
    ["centro.control", "Control#1994", "CENTRO_CONTROL", "Nadia Ribes", "Centro de Control", "MAD", undefined, terminals.map((terminal) => terminal.id)],
    ["flota.01", "Fleet#1994", "FLOTA", "Lucia Prat", "Gestora de Flota", "MAD", airlines[0].id, [terminals[0].id]],
    ["cliente.01", "Service#1994", "ATENCION_CLIENTE", "Noelia Rivas", "Atencion al Cliente", "MAD", airlines[0].id, [terminals[0].id]],
    ["backoffice.01", "Back#1994", "BACKOFFICE", "Eva Montalban", "Backoffice", "MAD", airlines[1].id, [terminals[1].id]],
    ["auditor.01", "Audit#1994", "SEGURIDAD_AUDITORIA", "Tomas Vera", "Seguridad y Auditoria", "MAD", undefined, terminals.map((terminal) => terminal.id)],
    ["visor.01", "Read#1994", "SOLO_LECTURA", "Alicia Otero", "Consulta", "MAD", undefined, terminals.map((terminal) => terminal.id)],
  ];

  const employeeUsers: EmployeeUser[] = [];
  const employees: Employee[] = [];
  for (const [username, password, role, fullName, title, stationCode, airlineId, terminalIds] of roleSeed) {
    const userId = randomUUID();
    employeeUsers.push({
      id: userId,
      username,
      passwordHash: await bcrypt.hash(password, 10),
      role,
      active: true,
      status: "ACTIVO",
      failedAttempts: 0,
      forcePasswordChange: true,
      airportIds: [airports[0].id],
      airlineIds: airlineId ? [airlineId] : [],
      permissions: rolePermissions[role],
    });
    employees.push({
      id: randomUUID(),
      userId,
      fullName,
      stationCode,
      title,
      airlineId,
      airportId: airports[0].id,
      terminalIds,
    });
  }

  const customerSeed = [
    ["clara.santos@example.com", "ClaraSantos#2026", "Clara Santos", "DOC001234", "+34 611000001", "ES"],
    ["julien.morel@example.com", "JulienMorel#2026", "Julien Morel", "DOC001235", "+33 611000002", "FR"],
    ["maria.vega@example.com", "MariaVega#2026", "Maria Vega", "DOC001236", "+34 611000003", "ES"],
    ["luca.romani@example.com", "LucaRomani#2026", "Luca Romani", "DOC001237", "+39 611000004", "IT"],
  ] as const;

  const customerAccounts: CustomerAccount[] = [];
  const customerProfiles: CustomerProfile[] = [];
  const passengers: Passenger[] = [];

  for (let index = 0; index < customerSeed.length; index += 1) {
    const [email, password, fullName, documentNumber, phone, nationality] = customerSeed[index];
    const accountId = randomUUID();
    const [firstName, lastName] = fullName.split(" ");
    customerAccounts.push({
      id: accountId,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      fullName,
      documentNumber,
      phone,
      nationality,
      createdAt: new Date().toISOString(),
      messagesUnread: 2,
    });
    customerProfiles.push({
      id: randomUUID(),
      accountId,
      firstName,
      lastName,
      birthDate: `199${index}-0${index + 1}-1${index}`,
      documentNumber,
      nationality,
      contactEmail: email,
      contactPhone: phone,
      loyaltyLevel: index % 2 === 0 ? "SILVER" : "BASICO",
      preferences: index % 2 === 0 ? ["Pasillo", "Check-in online"] : ["Ventana"],
    });
    passengers.push({
      id: randomUUID(),
      firstName,
      lastName,
      birthDate: `199${index}-0${index + 1}-1${index}`,
      documentNumber,
      nationality,
      contactEmail: email,
      contactPhone: phone,
      operationalNotes: index === 0 ? "Cliente premium con mensajes no leidos." : undefined,
      type: index === 1 ? "VIP" : "ADULTO",
      ssr: index === 2 ? ["WCHR"] : ["VGML"],
      assistanceRequired: index === 2,
      documentVerified: index !== 3,
      waitlist: false,
      deniedBoarding: false,
      noShow: false,
      customerAccountId: accountId,
    });
  }

  const extraPassengerNames = [
    ["Daniel", "Serrano"], ["Amina", "Belkadi"], ["Oliver", "Hart"], ["Paula", "Mena"], ["Jon", "Garrido"],
    ["Sara", "Lopez"], ["Riccardo", "Bassi"], ["Fatima", "Rami"], ["Miguel", "Calvo"], ["Ines", "Martel"],
    ["Victor", "Navarro"], ["Aitana", "Campos"], ["Ahmed", "El Idrissi"], ["Nuria", "Soler"], ["Sven", "Lund"],
    ["Youssef", "Khaldi"], ["Julia", "Pons"], ["Hugo", "Barros"], ["Mila", "Silva"], ["Marco", "Ferri"],
  ];
  extraPassengerNames.forEach(([firstName, lastName], index) => {
    passengers.push({
      id: randomUUID(),
      firstName,
      lastName,
      birthDate: `198${index % 10}-0${(index % 8) + 1}-15`,
      documentNumber: `PAX${1000 + index}`,
      nationality: randomFrom(["ES", "FR", "IT", "PT", "GB"], index),
      contactEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@mail.com`,
      contactPhone: `+34 62200${String(index).padStart(4, "0")}`,
      operationalNotes: index % 5 === 0 ? "Requiere seguimiento en puerta." : undefined,
      type: index % 9 === 0 ? "PMR" : index % 7 === 0 ? "MENOR" : "ADULTO",
      ssr: index % 3 === 0 ? ["WCHR"] : ["AVIH"],
      assistanceRequired: index % 9 === 0,
      documentVerified: index % 4 !== 0,
      waitlist: index % 11 === 0,
      deniedBoarding: false,
      noShow: false,
    });
  });

  const routes = [
    [airports[0], airports[2]], [airports[0], airports[3]], [airports[0], airports[4]], [airports[0], airports[5]],
    [airports[1], airports[2]], [airports[1], airports[3]], [airports[0], airports[1]], [airports[1], airports[5]],
  ] as const;

  const flights: Flight[] = [];
  const seatAssignments: SeatAssignment[] = [];
  const bookings: Booking[] = [];
  const boardings: Boarding[] = [];
  const baggage: Baggage[] = [];
  const upgrades: Upgrade[] = [];
  const incidents: Incident[] = [];

  const now = new Date();
  for (let index = 0; index < 12; index += 1) {
    const airline = randomFrom(airlines, index);
    const aircraftForFlight = randomFrom(aircraft, index);
    const [origin, destination] = randomFrom(routes, index);
    const terminal = origin.id === airports[0].id ? randomFrom([terminals[0], terminals[1]], index) : terminals[2];
    const flightId = randomUUID();
    const std = addMinutes(now, 45 + index * 35);
    const sta = addMinutes(std, 90 + (index % 4) * 20);
    const status: FlightStatus = index % 6 === 0 ? "EMBARQUE" : index % 5 === 0 ? "RETRASADO" : index % 4 === 0 ? "CHECKIN_ABIERTO" : "PROGRAMADO";
    const flight: Flight = {
      id: flightId,
      airlineId: airline.id,
      flightNumber: `${airline.iataCode}${230 + index}`,
      originId: origin.id,
      destinationId: destination.id,
      terminalId: terminal.id,
      gateId: randomFrom(gates.filter((gate) => gate.terminalId === terminal.id), index)?.id,
      counterIds: counters.filter((counter) => counter.terminalId === terminal.id).slice(0, 2).map((counter) => counter.id),
      aircraftId: aircraftForFlight.id,
      flightType: destination.country === "Espana" ? "NACIONAL" : "INTERNACIONAL",
      scheduledDeparture: std.toISOString(),
      scheduledArrival: sta.toISOString(),
      estimatedDeparture: addMinutes(std, index % 5 === 0 ? 30 : 0).toISOString(),
      estimatedArrival: addMinutes(sta, index % 5 === 0 ? 30 : 0).toISOString(),
      actualDeparture: undefined,
      actualArrival: undefined,
      status,
      occupancyLimit: aircraftForFlight.seatCapacity,
      overbookLimit: index % 4 === 0 ? 3 : 1,
      waitlistCount: index % 4,
      crew: ["CPT. Ruiz", "FO. Serra", "TCP 1", "TCP 2"],
      notes: [`Salida prevista por ${terminal.code}`, "Revision documental activa", index % 5 === 0 ? "Posible ajuste de puerta." : "Operativa estable"],
      weatherImpact: index % 5 === 0 ? "Niebla ligera en llegada." : undefined,
    };
    flights.push(flight);
    const flightSeats = createSeatAssignments(flightId, aircraftForFlight.cabinConfigJson);
    seatAssignments.push(...flightSeats);

    const paxCount = Math.min(aircraftForFlight.seatCapacity - 8, 18 + index * 3);
    for (let passengerIndex = 0; passengerIndex < paxCount; passengerIndex += 1) {
      const passenger = randomFrom(passengers, index * 5 + passengerIndex);
      const bookingId = randomUUID();
      const seat = flightSeats.find((item) => item.state !== "BLOQUEADO" && !item.bookingId && (passengerIndex % 8 !== 0 || item.cabinClass !== "FIRST"));
      if (seat) {
        seat.bookingId = bookingId;
        seat.state = seat.state === "SALIDA" || seat.state === "PREMIUM" ? seat.state : "OCUPADO";
      }
      const statusBooking: BookingStatus =
        passengerIndex % 9 === 0 ? "EMBARCADO" :
        passengerIndex % 5 === 0 ? "CHECKED_IN" :
        passengerIndex % 7 === 0 ? "LISTA_ESPERA" :
        passengerIndex % 11 === 0 ? "NO_SHOW" :
        "EMITIDO";

      const booking: Booking = {
        id: bookingId,
        locator: `${airline.iataCode}${String(index).padStart(2, "0")}${String(passengerIndex).padStart(3, "0")}`,
        passengerId: passenger.id,
        flightId,
        customerAccountId: passenger.customerAccountId,
        fareName: passengerIndex % 4 === 0 ? "Flex Corporate" : passengerIndex % 3 === 0 ? "Basic Saver" : "Smart Plus",
        cabinClass: seat?.cabinClass ?? "ECONOMY",
        seatNumber: seat?.seatNumber,
        baggageIncluded: passengerIndex % 5 === 0 ? 2 : 1,
        extraServices: passengerIndex % 3 === 0 ? ["Asiento preferente", "Embarque prioritario"] : [],
        ticketStatus: statusBooking,
        refundable: passengerIndex % 4 === 0,
        upgradeAvailable: passengerIndex % 6 === 0,
        checkedInAt: statusBooking === "CHECKED_IN" || statusBooking === "EMBARCADO" ? addMinutes(std, -85).toISOString() : undefined,
        boardedAt: statusBooking === "EMBARCADO" ? addMinutes(std, -28).toISOString() : undefined,
        remarks: passenger.documentVerified ? undefined : "Documentacion pendiente de comprobacion.",
        ticketNumber: `${airline.ticketPrefix}${100000000 + index * 1000 + passengerIndex}`,
        priceTotal: 89 + passengerIndex * 7,
        boardingGroup: passengerIndex % 5 === 0 ? "PRIORITARIO" : `GRUPO ${((passengerIndex % 4) + 1).toString()}`,
      };
      bookings.push(booking);

      if (statusBooking === "CHECKED_IN" || statusBooking === "EMBARCADO") {
        baggage.push({
          id: randomUUID(),
          passengerId: passenger.id,
          flightId,
          employeeId: employees[4].id,
          bagTag: `${airline.iataCode}${flight.flightNumber}${passengerIndex}`.slice(0, 14),
          pieces: passengerIndex % 2 === 0 ? 1 : 2,
          totalWeightKg: 17 + (passengerIndex % 8),
          kind: passengerIndex % 6 === 0 ? "PRIORITARIO" : "FACTURADO",
          excessFee: passengerIndex % 10 === 0 ? 24 : 0,
          status: statusBooking === "EMBARCADO" ? "CARGADO" : "FACTURADO",
          barcode: `${flight.flightNumber}-${booking.locator}-${passengerIndex}`,
          printedAt: addMinutes(std, -88).toISOString(),
          createdAt: addMinutes(std, -90).toISOString(),
          fragile: passengerIndex % 7 === 0,
        });
      }

      if (statusBooking === "EMBARCADO") {
        boardings.push({
          id: randomUUID(),
          bookingId,
          flightId,
          employeeId: employees[5].id,
          status: "EMBARCADO",
          boardedAt: addMinutes(std, -25).toISOString(),
          manualOverride: false,
        });
      }

      if (booking.upgradeAvailable && passengerIndex % 10 === 0) {
        upgrades.push({
          id: randomUUID(),
          bookingId,
          flightId,
          employeeId: employees[8].id,
          fromClass: booking.cabinClass,
          toClass: "BUSINESS",
          reason: "Prioridad comercial por sobreventa",
          newSeat: "2A",
          price: 45,
          compensation: "Voucher lounge",
          createdAt: addMinutes(std, -100).toISOString(),
        });
      }
    }

    if (index % 3 === 0) {
      incidents.push({
        id: randomUUID(),
        scope: "VUELO",
        flightId,
        employeeId: employees[6].id,
        type: index % 2 === 0 ? "RETRASO OPERATIVO" : "CAMBIO DE PUERTA",
        severity: index % 2 === 0 ? "MEDIA" : "BAJA",
        status: index % 2 === 0 ? "EN_SEGUIMIENTO" : "ABIERTA",
        description: index % 2 === 0 ? "Ajuste de secuencia por handling y posicion remota." : "Puerta reasignada por rotacion de aeronave.",
        comments: ["Notificado a supervisores", "Pendiente actualizacion de FIDS"],
        createdAt: addMinutes(std, -75).toISOString(),
      });
    }
  }

  const messages: Message[] = [
    {
      id: randomUUID(),
      channel: "INTERNA",
      fromType: "SISTEMA",
      fromId: "sistema",
      toEmployeeId: employees[2].id,
      subject: "Retraso estimado vuelo SB235",
      body: "Se solicita revisar coordinacion de mostradores y actualizar prioridad de embarque.",
      priority: "ALTA",
      createdAt: new Date().toISOString(),
    },
    {
      id: randomUUID(),
      channel: "CLIENTE",
      fromType: "SISTEMA",
      fromId: "sistema",
      toCustomerAccountId: customerAccounts[0].id,
      subject: "Su embarque ha sido actualizado",
      body: "La puerta de embarque de su vuelo ha cambiado a A16. Consulte su tarjeta de embarque.",
      priority: "MEDIA",
      createdAt: new Date().toISOString(),
    },
    {
      id: randomUUID(),
      channel: "INTERNA",
      fromType: "EMPLEADO",
      fromId: employees[6].id,
      toEmployeeId: employees[3].id,
      subject: "Revision de lista de espera",
      body: "Necesitamos priorizar tres pasajeros premium en el vuelo IR238.",
      priority: "MEDIA",
      createdAt: new Date().toISOString(),
    },
  ];

  const news: NewsItem[] = [
    { id: randomUUID(), title: "Nueva ruta Madrid - Lisboa con doble frecuencia diaria", excerpt: "La operativa refuerza la conectividad peninsular para clientes corporativos y de ocio.", body: "SkyBridge Atlantic amplía su red con una ruta reforzada entre Madrid y Lisboa, con enfoque en puntualidad y proceso digital de check-in.", category: "DESTINOS", createdAt: new Date().toISOString() },
    { id: randomUUID(), title: "Mejoras en el sistema de embarque y autoservicio", excerpt: "El aeropuerto acelera el acceso a puerta con nuevos flujos digitales y control operativo.", body: "Se ha desplegado una mejora del ecosistema de embarque, equipaje y comunicación operativa.", category: "SERVICIOS", createdAt: new Date().toISOString() },
  ];

  const notices: Notice[] = [
    { id: randomUUID(), title: "Aviso operativo por alta ocupacion", body: "Se recomienda acudir con antelacion a mostradores de facturacion en Terminal 1.", severity: "ALERTA", createdAt: new Date().toISOString() },
    { id: randomUUID(), title: "Servicio de check-in online disponible", body: "Los clientes pueden completar el proceso y descargar su tarjeta digital desde el area privada.", severity: "INFO", createdAt: new Date().toISOString() },
  ];

  const faqs: FAQ[] = [
    { id: randomUUID(), question: "¿Cuando abre el check-in online?", answer: "Entre 24 horas y 90 minutos antes de la salida programada del vuelo." },
    { id: randomUUID(), question: "¿Puedo añadir equipaje despues de reservar?", answer: "Si, desde el area privada de clientes o en mostrador segun tarifa." },
    { id: randomUUID(), question: "¿Que ocurre si cambia la puerta de embarque?", answer: "Recibira un aviso en la zona privada, en correo operativo y en el panel de vuelos." },
  ];

  const printerProfiles: PrinterProfile[] = [
    { id: randomUUID(), userId: employeeUsers[0].id, terminalName: "COUNTER-01", printerName: "UNYKA POS THERMAL", driverType: "ESC_POS_GENERIC", paperWidth: 80, isDefault: true, simulationMode: true },
    { id: randomUUID(), userId: employeeUsers[4].id, terminalName: "COUNTER-M101", printerName: "Mostrador M101", driverType: "ESC_POS_GENERIC", paperWidth: 80, isDefault: true, simulationMode: true },
  ];

  const shifts: Shift[] = employees.slice(0, 8).map((employee, index) => ({
    id: randomUUID(),
    employeeId: employee.id,
    terminalId: employee.terminalIds[0] ?? terminals[0].id,
    startsAt: addMinutes(now, -90 + index * 15).toISOString(),
    endsAt: addMinutes(now, 360 + index * 20).toISOString(),
    status: index < 6 ? "ACTIVO" : "PROGRAMADO",
  }));

  const settings: Setting[] = [
    { id: randomUUID(), category: "branding", key: "nombreAeropuerto", value: "Aeropuerto Haider" },
    { id: randomUUID(), category: "branding", key: "textoHero", value: "Operativa aeroportuaria integral para pasajeros, aerolineas y personal de tierra." },
    { id: randomUUID(), category: "seguridad", key: "bloqueoIntentos", value: "4" },
    { id: randomUUID(), category: "operativa", key: "cierrePuertaMinutos", value: "15" },
    { id: randomUUID(), category: "simulacion", key: "generacionAutomaticaVuelos", value: "true" },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: randomUUID(),
      userId: employeeUsers[6].id,
      action: "VUELO_RETRASADO",
      entityType: "Flight",
      entityId: flights[0].id,
      terminalId: "T1-A12",
      previousData: JSON.stringify({ estado: "CHECKIN_ABIERTO" }),
      nextData: JSON.stringify({ estado: "RETRASADO", etd: flights[0].estimatedDeparture }),
      createdAt: new Date().toISOString(),
      critical: false,
    },
  ];

  const accessLogs: AccessLog[] = [
    { id: randomUUID(), userId: employeeUsers[0].id, terminalId: "SEC-ADM", loginAt: addMinutes(now, -55).toISOString(), success: true, ipAddress: "10.10.1.20" },
    { id: randomUUID(), userId: employeeUsers[4].id, terminalId: "COUNTER-M101", loginAt: addMinutes(now, -35).toISOString(), success: true, ipAddress: "10.10.1.45" },
  ];

  return {
    airlines,
    airports,
    terminals,
    counters,
    gates,
    aircraft,
    employeeUsers,
    employees,
    customerAccounts,
    customerProfiles,
    passengers,
    flights,
    bookings,
    seatAssignments,
    baggage,
    boardings,
    upgrades,
    incidents,
    auditLogs,
    accessLogs,
    printerProfiles,
    printHistory: [],
    settings,
    messages,
    news,
    notices,
    faqs,
    shifts,
  };
}

const initialSeed = await createSeed();
const db = (await initPersistence(initialSeed)) as StoreData;

function getPrimaryAirline() {
  return db.airlines[0];
}

function getEmployeeByUserId(userId: string) {
  return db.employees.find((employee) => employee.userId === userId);
}

function getCustomerProfile(accountId: string) {
  return db.customerProfiles.find((profile) => profile.accountId === accountId);
}

function enrichBooking(booking: Booking) {
  return {
    ...booking,
    passenger: db.passengers.find((passenger) => passenger.id === booking.passengerId)!,
    flight: enrichFlight(db.flights.find((flight) => flight.id === booking.flightId)!),
  };
}

function enrichFlight(flight: Flight) {
  return {
    ...flight,
    airline: db.airlines.find((airline) => airline.id === flight.airlineId),
    origin: db.airports.find((airport) => airport.id === flight.originId),
    destination: db.airports.find((airport) => airport.id === flight.destinationId),
    terminal: db.terminals.find((terminal) => terminal.id === flight.terminalId),
    gate: db.gates.find((gate) => gate.id === flight.gateId),
    counters: db.counters.filter((counter) => flight.counterIds.includes(counter.id)),
    aircraft: db.aircraft.find((aircraftItem) => aircraftItem.id === flight.aircraftId),
    bookings: db.bookings.filter((booking) => booking.flightId === flight.id).map((booking) => ({
      ...booking,
      passenger: db.passengers.find((passenger) => passenger.id === booking.passengerId)!,
    })),
    baggageSummary: db.baggage.filter((item) => item.flightId === flight.id).length,
    incidents: db.incidents.filter((incident) => incident.flightId === flight.id),
  };
}

function createBarcodeValue(booking: Booking) {
  return `${booking.ticketNumber}-${booking.locator}-${booking.flightId.slice(0, 6)}`;
}

async function toPasswordHash(password: string) {
  return bcrypt.hash(password, 10);
}

export const store = {
  db,
  async authenticate(username: string, password: string) {
    const user = db.employeeUsers.find((candidate) => candidate.username.toLowerCase() === username.toLowerCase());
    if (!user || !user.active || user.status !== "ACTIVO") {
      if (user) {
        user.failedAttempts += 1;
        db.accessLogs.unshift({ id: randomUUID(), userId: user.id, terminalId: "UNKNOWN", loginAt: new Date().toISOString(), success: false, detail: "Usuario suspendido o inactivo." });
        await persistState(db);
      }
      return { error: "Cuenta no disponible." };
    }
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      return { error: "Cuenta bloqueada temporalmente por seguridad." };
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      user.failedAttempts += 1;
      if (user.failedAttempts >= 4) {
        user.lockedUntil = addMinutes(new Date(), 20).toISOString();
      }
      db.accessLogs.unshift({ id: randomUUID(), userId: user.id, terminalId: "UNKNOWN", loginAt: new Date().toISOString(), success: false, detail: "Contrasena incorrecta." });
      await persistState(db);
      return { error: "Credenciales invalidas." };
    }
    user.failedAttempts = 0;
    user.lockedUntil = undefined;
    user.lastAccessAt = new Date().toISOString();
    const employee = getEmployeeByUserId(user.id)!;
    return { user, employee };
  },
  async changeEmployeePassword(userId: string, currentPassword: string, nextPassword: string) {
    const user = db.employeeUsers.find((item) => item.id === userId);
    if (!user) return { error: "Usuario no encontrado." };
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return { error: "La contrasena actual no es correcta." };
    user.passwordHash = await toPasswordHash(nextPassword);
    user.forcePasswordChange = false;
    await persistState(db);
    return { ok: true };
  },
  async forceChangeEmployeePassword(userId: string, nextPassword: string) {
    const user = db.employeeUsers.find((item) => item.id === userId);
    if (!user) return { error: "Usuario no encontrado." };
    user.passwordHash = await toPasswordHash(nextPassword);
    user.forcePasswordChange = false;
    await persistState(db);
    return { ok: true };
  },
  async registerCustomer(payload: { fullName: string; email: string; password: string; documentNumber: string; phone: string; nationality: string; }) {
    if (db.customerAccounts.some((account) => account.email.toLowerCase() === payload.email.toLowerCase())) {
      return { error: "Ya existe una cuenta con ese correo." };
    }
    const accountId = randomUUID();
    const [firstName, ...rest] = payload.fullName.trim().split(" ");
    const lastName = rest.join(" ") || "Cliente";
    const account: CustomerAccount = {
      id: accountId,
      email: payload.email,
      passwordHash: await toPasswordHash(payload.password),
      fullName: payload.fullName,
      documentNumber: payload.documentNumber,
      phone: payload.phone,
      nationality: payload.nationality,
      createdAt: new Date().toISOString(),
      messagesUnread: 1,
    };
    const profile: CustomerProfile = {
      id: randomUUID(),
      accountId,
      firstName,
      lastName,
      birthDate: "1990-01-01",
      documentNumber: payload.documentNumber,
      nationality: payload.nationality,
      contactEmail: payload.email,
      contactPhone: payload.phone,
      loyaltyLevel: "BASICO",
      preferences: [],
    };
    const passenger: Passenger = {
      id: randomUUID(),
      firstName,
      lastName,
      birthDate: "1990-01-01",
      documentNumber: payload.documentNumber,
      nationality: payload.nationality,
      contactEmail: payload.email,
      contactPhone: payload.phone,
      type: "ADULTO",
      ssr: [],
      assistanceRequired: false,
      documentVerified: false,
      waitlist: false,
      deniedBoarding: false,
      noShow: false,
      customerAccountId: accountId,
    };
    db.customerAccounts.unshift(account);
    db.customerProfiles.unshift(profile);
    db.passengers.unshift(passenger);
    db.messages.unshift({
      id: randomUUID(),
      channel: "CLIENTE",
      fromType: "SISTEMA",
      fromId: "sistema",
      toCustomerAccountId: accountId,
      subject: "Bienvenido al area privada",
      body: "Su cuenta ya esta operativa para reservar vuelos, gestionar equipaje y completar check-in online.",
      priority: "MEDIA",
      createdAt: new Date().toISOString(),
    });
    await persistState(db);
    return { account };
  },
  async authenticateCustomer(email: string, password: string) {
    const account = db.customerAccounts.find((candidate) => candidate.email.toLowerCase() === email.toLowerCase());
    if (!account) return { error: "Credenciales invalidas." };
    const valid = await bcrypt.compare(password, account.passwordHash);
    if (!valid) return { error: "Credenciales invalidas." };
    account.lastAccessAt = new Date().toISOString();
    await persistState(db);
    return { account, profile: getCustomerProfile(account.id)! };
  },
  async recordAccess(userId: string, terminalId: string, ipAddress?: string) {
    db.accessLogs.unshift({ id: randomUUID(), userId, terminalId, ipAddress, loginAt: new Date().toISOString(), success: true });
    await persistState(db);
  },
  getAirline() {
    return getPrimaryAirline();
  },
  getEmployees() {
    return db.employees.map((employee) => {
      const user = db.employeeUsers.find((item) => item.id === employee.userId)!;
      return {
        ...employee,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          status: user.status,
          lastAccessAt: user.lastAccessAt,
          forcePasswordChange: user.forcePasswordChange,
          failedAttempts: user.failedAttempts,
          permissions: user.permissions,
        },
        airline: employee.airlineId ? db.airlines.find((airline) => airline.id === employee.airlineId) : null,
      };
    });
  },
  getDashboard(filters?: { airportId?: string; terminalId?: string; airlineId?: string }) {
    const flights = db.flights.filter((flight) => {
      if (filters?.airportId) {
        const terminal = db.terminals.find((item) => item.id === flight.terminalId);
        if (!terminal || terminal.airportId !== filters.airportId) return false;
      }
      if (filters?.terminalId && flight.terminalId !== filters.terminalId) return false;
      if (filters?.airlineId && flight.airlineId !== filters.airlineId) return false;
      return true;
    });
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const bookings = db.bookings.filter((booking) => flights.some((flight) => flight.id === booking.flightId));
    const boardedCount = bookings.filter((booking) => booking.ticketStatus === "EMBARCADO").length;
    const checkedCount = bookings.filter((booking) => booking.ticketStatus === "CHECKED_IN").length;
    const delayed = flights.filter((flight) => flight.status === "RETRASADO");
    const overbooked = flights.filter((flight) => bookings.filter((booking) => booking.flightId === flight.id && booking.ticketStatus !== "CANCELADO").length > flight.occupancyLimit);
    return {
      summary: {
        vuelosHoy: flights.filter((flight) => new Date(flight.scheduledDeparture) >= todayStart).length,
        vuelosRetrasados: delayed.length,
        puertasActivas: db.gates.filter((gate) => gate.active).length,
        mostradoresActivos: db.counters.filter((counter) => counter.active).length,
        pasajerosPendientesCheckin: bookings.filter((booking) => ["RESERVADO", "EMITIDO"].includes(booking.ticketStatus)).length,
        equipajesFacturados: db.baggage.filter((item) => flights.some((flight) => flight.id === item.flightId)).length,
        pasajerosEmbarcados: boardedCount,
        incidenciasAbiertas: db.incidents.filter((incident) => incident.status !== "RESUELTA").length,
        vuelosConSobreventa: overbooked.length,
        tasaEmbarque: checkedCount > 0 ? Math.round((boardedCount / checkedCount) * 100) : 0,
      },
      incidents: db.incidents.slice(0, 8),
      occupancyByFlight: flights.slice(0, 10).map((flight) => ({
        id: flight.id,
        flightNumber: flight.flightNumber,
        gate: db.gates.find((gate) => gate.id === flight.gateId)?.code ?? "Por asignar",
        status: flight.status,
        occupancy: `${bookings.filter((booking) => booking.flightId === flight.id && booking.ticketStatus !== "CANCELADO").length}/${flight.occupancyLimit}`,
      })),
      notifications: db.notices.map((notice) => `${notice.severity}: ${notice.title}`),
      kpisAvanzados: {
        tiempoMedioSalida: "18 min",
        integridadSistema: "99.6%",
        climaOperativo: "Condiciones estables",
      },
      actividadReciente: db.auditLogs.slice(0, 8),
      turnosActivos: db.shifts.filter((shift) => shift.status === "ACTIVO").length,
    };
  },
  getFlights(filters?: { status?: string; airlineId?: string; search?: string }) {
    return db.flights
      .filter((flight) => {
        if (filters?.status && flight.status !== filters.status) return false;
        if (filters?.airlineId && flight.airlineId !== filters.airlineId) return false;
        if (filters?.search && !`${flight.flightNumber} ${db.airports.find((airport) => airport.id === flight.originId)?.code} ${db.airports.find((airport) => airport.id === flight.destinationId)?.code}`.toLowerCase().includes(filters.search.toLowerCase())) return false;
        return true;
      })
      .map((flight) => {
        const enriched = enrichFlight(flight);
        return {
          ...enriched,
          passengerCount: enriched.bookings.length,
          boardedCount: db.boardings.filter((boarding) => boarding.flightId === flight.id && boarding.status === "EMBARCADO").length,
          baggageCount: db.baggage.filter((item) => item.flightId === flight.id).length,
        };
      });
  },
  getFlightDetail(flightId: string) {
    const flight = db.flights.find((item) => item.id === flightId);
    if (!flight) return null;
    return {
      ...enrichFlight(flight),
      seatAssignments: db.seatAssignments.filter((seat) => seat.flightId === flightId),
      baggage: db.baggage.filter((item) => item.flightId === flightId),
      boardings: db.boardings.filter((item) => item.flightId === flightId),
      upgrades: db.upgrades.filter((item) => item.flightId === flightId),
      timeline: [
        { label: "Programacion inicial", at: flight.scheduledDeparture },
        { label: "Apertura de check-in", at: addMinutes(new Date(flight.scheduledDeparture), -120).toISOString() },
        { label: "Inicio de embarque", at: addMinutes(new Date(flight.scheduledDeparture), -35).toISOString() },
        { label: "Cierre de puerta", at: addMinutes(new Date(flight.scheduledDeparture), -15).toISOString() },
      ],
    };
  },
  async updateFlightStatus(id: string, status: FlightStatus, operationalNotes?: string) {
    const flight = db.flights.find((item) => item.id === id);
    if (!flight) return null;
    flight.status = status;
    if (status === "SALIDO") flight.actualDeparture = new Date().toISOString();
    if (operationalNotes) flight.notes.unshift(operationalNotes);
    await persistState(db);
    return flight;
  },
  getPassengers(filters?: { search?: string; status?: string; flightId?: string }) {
    return db.passengers
      .filter((passenger) => {
        if (filters?.search && !`${passenger.firstName} ${passenger.lastName} ${passenger.documentNumber}`.toLowerCase().includes(filters.search.toLowerCase())) return false;
        if (filters?.flightId && !db.bookings.some((booking) => booking.passengerId === passenger.id && booking.flightId === filters.flightId)) return false;
        if (filters?.status && !db.bookings.some((booking) => booking.passengerId === passenger.id && booking.ticketStatus === filters.status)) return false;
        return true;
      })
      .map((passenger) => ({
        ...passenger,
        bookings: db.bookings.filter((booking) => booking.passengerId === passenger.id).map((booking) => ({ ...booking, flight: db.flights.find((flight) => flight.id === booking.flightId)! })),
        baggageItems: db.baggage.filter((item) => item.passengerId === passenger.id),
        incidents: db.incidents.filter((incident) => incident.passengerId === passenger.id),
        timeline: db.auditLogs.filter((log) => log.entityId === passenger.id || log.previousData?.includes(passenger.documentNumber) || log.nextData?.includes(passenger.documentNumber)).slice(0, 8),
      }));
  },
  getPassengerDetail(passengerId: string) {
    return this.getPassengers().find((passenger) => passenger.id === passengerId) ?? null;
  },
  getBookings(filters?: { customerAccountId?: string }) {
    return db.bookings
      .filter((booking) => !filters?.customerAccountId || booking.customerAccountId === filters.customerAccountId)
      .map((booking) => ({
        ...booking,
        passenger: db.passengers.find((passenger) => passenger.id === booking.passengerId)!,
        flight: enrichFlight(db.flights.find((flight) => flight.id === booking.flightId)!),
        ticket: { number: booking.ticketNumber, status: booking.ticketStatus, issuedAt: booking.checkedInAt ?? booking.boardedAt ?? new Date().toISOString() },
      }));
  },
  getSeatMap(flightId: string) {
    const flight = db.flights.find((item) => item.id === flightId);
    if (!flight) return null;
    return {
      ...flight,
      aircraft: db.aircraft.find((aircraftItem) => aircraftItem.id === flight.aircraftId),
      seatAssignments: db.seatAssignments
        .filter((seat) => seat.flightId === flightId)
        .map((seat) => ({
          ...seat,
          passenger: seat.bookingId ? db.passengers.find((passenger) => passenger.id === db.bookings.find((booking) => booking.id === seat.bookingId)?.passengerId) : undefined,
        })),
      summary: {
        business: db.seatAssignments.filter((seat) => seat.flightId === flightId && seat.cabinClass === "BUSINESS").length,
        premium: db.seatAssignments.filter((seat) => seat.flightId === flightId && seat.cabinClass === "PREMIUM_ECONOMY").length,
        economy: db.seatAssignments.filter((seat) => seat.flightId === flightId && seat.cabinClass === "ECONOMY").length,
      },
    };
  },
  async assignSeat(bookingId: string, flightId: string, seatNumber: string) {
    const seat = db.seatAssignments.find((item) => item.flightId === flightId && item.seatNumber === seatNumber);
    const booking = db.bookings.find((item) => item.id === bookingId);
    if (!seat || !booking || ["BLOQUEADO", "TRIPULACION"].includes(seat.state) || (seat.bookingId && seat.bookingId !== bookingId)) {
      return { error: "Asiento no disponible." };
    }
    if (seat.state === "SALIDA") {
      const passenger = db.passengers.find((item) => item.id === booking.passengerId);
      if (passenger?.type === "MENOR") {
        return { error: "El asiento de salida de emergencia no es valido para este pasajero." };
      }
    }
    db.seatAssignments
      .filter((item) => item.flightId === flightId && item.bookingId === bookingId && item.id !== seat.id)
      .forEach((item) => {
        item.bookingId = undefined;
        item.state = item.state === "PREMIUM" ? "PREMIUM" : "LIBRE";
      });
    seat.bookingId = bookingId;
    if (!["SALIDA", "PREMIUM"].includes(seat.state)) seat.state = "OCUPADO";
    booking.seatNumber = seatNumber;
    await persistState(db);
    return { seat };
  },
  async checkin(bookingId: string, employeeId: string, seatNumber: string, documentAlert?: string) {
    const booking = db.bookings.find((item) => item.id === bookingId);
    if (!booking) return { error: "Reserva no encontrada." };
    const passenger = db.passengers.find((item) => item.id === booking.passengerId)!;
    const flight = db.flights.find((item) => item.id === booking.flightId)!;
    if (["PUERTA_CERRADA", "SALIDO", "CANCELADO", "COMPLETADO"].includes(flight.status)) return { error: "Vuelo cerrado para check-in." };
    if (!passenger.documentVerified) return { error: "Documentacion pendiente de verificacion." };
    const assignResult = await this.assignSeat(bookingId, flight.id, seatNumber);
    if ("error" in assignResult) return assignResult;
    booking.ticketStatus = "CHECKED_IN";
    booking.checkedInAt = new Date().toISOString();
    await persistState(db);
    return {
      checkin: {
        id: randomUUID(),
        bookingId,
        flightId: flight.id,
        employeeId,
        assignedSeat: seatNumber,
        checkedAt: new Date().toISOString(),
        documentAlert,
        warning: passenger.assistanceRequired ? "Pasajero con asistencia especial." : undefined,
      },
      booking,
    };
  },
  async customerCheckin(bookingId: string) {
    const booking = db.bookings.find((item) => item.id === bookingId);
    if (!booking) return { error: "Reserva no encontrada." };
    const passenger = db.passengers.find((item) => item.id === booking.passengerId);
    if (passenger && !passenger.documentVerified) {
      passenger.documentVerified = true;
      passenger.operationalNotes = `${passenger.operationalNotes ? `${passenger.operationalNotes} · ` : ""}Documentacion prevalidada en check-in online.`;
    }
    const seatNumber = booking.seatNumber ?? this.getSeatMap(booking.flightId)?.seatAssignments.find((seat) => !seat.bookingId && !["BLOQUEADO", "TRIPULACION"].includes(seat.state))?.seatNumber;
    if (!seatNumber) return { error: "No hay asiento disponible para check-in online." };
    return this.checkin(bookingId, db.employees[4].id, seatNumber, "Check-in online");
  },
  async addBaggage(passengerId: string, flightId: string, employeeId: string, pieces: number, totalWeightKg: number) {
    const passenger = db.passengers.find((item) => item.id === passengerId);
    const flight = db.flights.find((item) => item.id === flightId);
    if (!passenger || !flight) return { error: "Datos de equipaje invalidos." };
    const excessFee = totalWeightKg > 23 ? (totalWeightKg - 23) * 8.5 : 0;
    const bagTag = `${flight.flightNumber}${Date.now().toString().slice(-7)}`;
    const baggage: Baggage = {
      id: randomUUID(),
      passengerId,
      flightId,
      employeeId,
      bagTag,
      pieces,
      totalWeightKg,
      kind: excessFee > 0 ? "EXTRA" : "FACTURADO",
      excessFee,
      status: "FACTURADO",
      barcode: `${flight.flightNumber}-${bagTag}`,
      printedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      fragile: false,
    };
    db.baggage.unshift(baggage);
    await persistState(db);
    return { baggage, passenger, flight };
  },
  async board(bookingId: string, employeeId: string, manualOverride: boolean) {
    const booking = db.bookings.find((item) => item.id === bookingId);
    if (!booking) return { error: "Reserva no encontrada." };
    const passenger = db.passengers.find((item) => item.id === booking.passengerId)!;
    const flight = db.flights.find((item) => item.id === booking.flightId)!;
    if (booking.ticketStatus !== "CHECKED_IN" && !manualOverride) return { error: "No se puede embarcar sin check-in." };
    if (!passenger.documentVerified && !manualOverride) return { error: "No se puede embarcar sin documentacion validada." };
    booking.ticketStatus = "EMBARCADO";
    booking.boardedAt = new Date().toISOString();
    const boarding: Boarding = {
      id: randomUUID(),
      bookingId,
      flightId: booking.flightId,
      employeeId,
      status: "EMBARCADO",
      boardedAt: new Date().toISOString(),
      manualOverride,
    };
    db.boardings.unshift(boarding);
    await persistState(db);
    return { boarding };
  },
  getUpgrades() {
    return db.upgrades.map((upgrade) => ({
      ...upgrade,
      booking: {
        ...db.bookings.find((booking) => booking.id === upgrade.bookingId)!,
        passenger: db.passengers.find((passenger) => passenger.id === db.bookings.find((booking) => booking.id === upgrade.bookingId)!.passengerId)!,
        flight: db.flights.find((flight) => flight.id === upgrade.flightId)!,
      },
      employee: db.employees.find((employee) => employee.id === upgrade.employeeId)!,
    }));
  },
  async createUpgrade(bookingId: string, employeeId: string, toClass: Booking["cabinClass"], newSeat: string | undefined, reason: string, price: number) {
    const booking = db.bookings.find((item) => item.id === bookingId);
    if (!booking) return { error: "Reserva no encontrada." };
    if (newSeat) {
      const assignResult = await this.assignSeat(bookingId, booking.flightId, newSeat);
      if ("error" in assignResult) return assignResult;
    }
    const upgrade: Upgrade = {
      id: randomUUID(),
      bookingId,
      flightId: booking.flightId,
      employeeId,
      fromClass: booking.cabinClass,
      toClass,
      reason,
      newSeat,
      price,
      compensation: reason.toLowerCase().includes("sobreventa") ? "Bono de 100 EUR" : undefined,
      createdAt: new Date().toISOString(),
    };
    booking.cabinClass = toClass;
    booking.seatNumber = newSeat ?? booking.seatNumber;
    booking.upgradeAvailable = false;
    booking.remarks = `${booking.remarks ?? ""}\nUPGRADE: ${reason}`.trim();
    db.upgrades.unshift(upgrade);
    await persistState(db);
    return { upgrade };
  },
  getFleet() {
    return db.aircraft.map((item) => ({
      ...item,
      flights: db.flights.filter((flight) => flight.aircraftId === item.id),
      cabinSummary: JSON.parse(item.cabinConfigJson),
    }));
  },
  getAudit(filters?: { userId?: string; entityType?: string; search?: string }) {
    return db.auditLogs
      .filter((log) => {
        if (filters?.userId && log.userId !== filters.userId) return false;
        if (filters?.entityType && log.entityType !== filters.entityType) return false;
        if (filters?.search && !`${log.action} ${log.entityType} ${log.entityId}`.toLowerCase().includes(filters.search.toLowerCase())) return false;
        return true;
      })
      .map((log) => ({
        ...log,
        user: {
          ...db.employeeUsers.find((user) => user.id === log.userId)!,
          employee: getEmployeeByUserId(log.userId),
        },
      }));
  },
  async addAudit(userId: string, action: string, entityType: string, entityId: string, terminalId: string, previousData?: unknown, nextData?: unknown) {
    db.auditLogs.unshift({
      id: randomUUID(),
      userId,
      action,
      entityType,
      entityId,
      terminalId,
      previousData: previousData ? JSON.stringify(previousData) : undefined,
      nextData: nextData ? JSON.stringify(nextData) : undefined,
      createdAt: new Date().toISOString(),
      critical: ["VUELO_CANCELADO", "EMBARQUE_DENEGADO", "PASSWORD_CHANGED"].includes(action),
    });
    await persistState(db);
  },
  getSettings() {
    return {
      airline: getPrimaryAirline(),
      airlines: db.airlines,
      settings: db.settings,
      airports: db.airports,
      terminals: db.terminals,
      gates: db.gates,
      counters: db.counters,
      printerProfiles: db.printerProfiles,
      users: this.getEmployees(),
      security: {
        bloqueoIntentos: db.settings.find((item) => item.key === "bloqueoIntentos")?.value ?? "4",
        sesionesActivas: db.accessLogs.filter((item) => item.success).length,
      },
    };
  },
  async updateAirlineSettings(patch: Partial<Airline>) {
    Object.assign(db.airlines[0], patch);
    await persistState(db);
    return db.airlines[0];
  },
  getMessagesForEmployee(employeeId: string) {
    return db.messages.filter((message) => message.toEmployeeId === employeeId || (message.channel === "INTERNA" && message.fromType === "SISTEMA")).slice(0, 50);
  },
  getMessagesForCustomer(accountId: string) {
    return db.messages.filter((message) => message.toCustomerAccountId === accountId).slice(0, 50);
  },
  async sendInternalMessage(fromEmployeeId: string, toEmployeeId: string, subject: string, body: string, priority: Message["priority"]) {
    const message: Message = {
      id: randomUUID(),
      channel: "INTERNA",
      fromType: "EMPLEADO",
      fromId: fromEmployeeId,
      toEmployeeId,
      subject,
      body,
      priority,
      createdAt: new Date().toISOString(),
    };
    db.messages.unshift(message);
    await persistState(db);
    return message;
  },
  async sendCustomerMessage(toCustomerAccountId: string, subject: string, body: string) {
    const account = db.customerAccounts.find((item) => item.id === toCustomerAccountId);
    if (!account) return { error: "Cliente no encontrado." };
    account.messagesUnread += 1;
    const message: Message = {
      id: randomUUID(),
      channel: "CLIENTE",
      fromType: "SISTEMA",
      fromId: "sistema",
      toCustomerAccountId,
      subject,
      body,
      priority: "MEDIA",
      createdAt: new Date().toISOString(),
    };
    db.messages.unshift(message);
    await persistState(db);
    return { message };
  },
  searchFlightsForCustomers(filters: { originCode?: string; destinationCode?: string; date?: string; airlineId?: string }) {
    return this.getFlights()
      .filter((flight) => {
        if (filters.originCode && flight.origin?.code !== filters.originCode) return false;
        if (filters.destinationCode && flight.destination?.code !== filters.destinationCode) return false;
        if (filters.date && !flight.scheduledDeparture.startsWith(filters.date)) return false;
        if (filters.airlineId && flight.airlineId !== filters.airlineId) return false;
        return ["PROGRAMADO", "CHECKIN_ABIERTO", "EMBARQUE"].includes(flight.status);
      })
      .map((flight) => ({
        id: flight.id,
        flightNumber: flight.flightNumber,
        airline: flight.airline?.commercialName,
        origin: flight.origin?.code,
        destination: flight.destination?.code,
        salida: flight.scheduledDeparture,
        llegada: flight.scheduledArrival,
        cabinas: ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS"],
        disponible: flight.occupancyLimit - flight.bookings.length,
        precioBase: 79,
      }));
  },
  async createReservation(payload: { accountId: string; flightId: string; cabinClass: Booking["cabinClass"]; seatNumber?: string; baggagePieces: number; extras: string[] }) {
    const account = db.customerAccounts.find((item) => item.id === payload.accountId);
    const profile = getCustomerProfile(payload.accountId);
    const flight = db.flights.find((item) => item.id === payload.flightId);
    if (!account || !profile || !flight) return { error: "No se pudo completar la reserva." };
    const passenger = db.passengers.find((item) => item.customerAccountId === payload.accountId)!;
    const bookingId = randomUUID();
    const seatNumber = payload.seatNumber ?? db.seatAssignments.find((seat) => seat.flightId === payload.flightId && seat.cabinClass === payload.cabinClass && !seat.bookingId && !["BLOQUEADO", "TRIPULACION"].includes(seat.state))?.seatNumber;
    if (!seatNumber) return { error: "No hay disponibilidad de asiento para la cabina seleccionada." };
    await this.assignSeat(bookingId, payload.flightId, seatNumber);
    const airline = db.airlines.find((item) => item.id === flight.airlineId)!;
    const booking: Booking = {
      id: bookingId,
      locator: `${airline.iataCode}${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      passengerId: passenger.id,
      flightId: payload.flightId,
      customerAccountId: payload.accountId,
      fareName: payload.cabinClass === "BUSINESS" ? "Business Flex" : "Tarifa Web",
      cabinClass: payload.cabinClass,
      seatNumber,
      baggageIncluded: payload.baggagePieces,
      extraServices: payload.extras,
      ticketStatus: "RESERVADO",
      refundable: payload.cabinClass !== "ECONOMY",
      upgradeAvailable: payload.cabinClass !== "BUSINESS",
      ticketNumber: `${airline.ticketPrefix}${Math.floor(Math.random() * 900000000 + 100000000)}`,
      priceTotal: 79 + payload.extras.length * 15 + payload.baggagePieces * 12,
      boardingGroup: "GRUPO 3",
    };
    db.bookings.unshift(booking);
    db.messages.unshift({
      id: randomUUID(),
      channel: "CLIENTE",
      fromType: "SISTEMA",
      fromId: "sistema",
      toCustomerAccountId: payload.accountId,
      subject: "Reserva confirmada",
      body: `Su reserva ${booking.locator} ha sido confirmada para el vuelo ${flight.flightNumber}.`,
      priority: "MEDIA",
      createdAt: new Date().toISOString(),
    });
    await persistState(db);
    return { booking: enrichBooking(booking) };
  },
  getCustomerArea(accountId: string) {
    const account = db.customerAccounts.find((item) => item.id === accountId);
    const profile = getCustomerProfile(accountId);
    if (!account || !profile) return null;
    const reservations = this.getBookings({ customerAccountId: accountId });
    const upcoming = reservations.filter((booking) => new Date(booking.flight.scheduledDeparture) > new Date());
    const history = reservations.filter((booking) => new Date(booking.flight.scheduledDeparture) <= new Date());
    return {
      account: {
        id: account.id,
        email: account.email,
        fullName: account.fullName,
        phone: account.phone,
        nationality: account.nationality,
        loyaltyLevel: profile.loyaltyLevel,
        preferences: profile.preferences,
      },
      upcoming,
      history,
      messages: this.getMessagesForCustomer(accountId),
    };
  },
  getPublicSite() {
    return {
      airline: getPrimaryAirline(),
      airportName: db.settings.find((item) => item.key === "nombreAeropuerto")?.value ?? "Aeropuerto Haider",
      airlines: db.airlines.filter((airline) => airline.active),
      airports: db.airports,
      destinations: db.airports.filter((airport) => airport.code !== "MAD").slice(0, 8),
      featuredFlights: this.getFlights().slice(0, 8).map((flight) => ({
        id: flight.id,
        flightNumber: flight.flightNumber,
        route: `${flight.origin?.code} - ${flight.destination?.code}`,
        originCity: flight.origin?.city,
        destinationCity: flight.destination?.city,
        scheduledAt: flight.scheduledDeparture,
        status: flight.status,
        terminal: flight.terminal?.code,
        gate: flight.gate?.code ?? "Pendiente",
      })),
      services: [
        { title: "Check-in online y tarjeta digital", description: "Acceso a su reserva, seleccion de asiento, QR de embarque y notificaciones operativas." },
        { title: "Gestion avanzada de equipaje", description: "Contratacion de piezas, prioridad, seguimiento y resguardos digitales." },
        { title: "Operativa aeroportuaria integral", description: "Plataforma para mostradores, puerta, supervisores, centro de control y flota." },
      ],
      news: db.news,
      notices: db.notices,
      faqs: db.faqs,
      stats: {
        vuelosHoy: db.flights.length,
        aerolineasActivas: db.airlines.filter((airline) => airline.active).length,
        puertasOperativas: db.gates.filter((gate) => gate.active).length,
      },
    };
  },
  getDocumentsForBooking(bookingId: string) {
    const booking = enrichBooking(db.bookings.find((item) => item.id === bookingId)!);
    if (!booking) return null;
    const barcode = createBarcodeValue(booking);
    return {
      bookingId,
      boardingPass: {
        passenger: `${booking.passenger.firstName} ${booking.passenger.lastName}`,
        vuelo: booking.flight.flightNumber,
        localizador: booking.locator,
        asiento: booking.seatNumber ?? "Por asignar",
        puerta: booking.flight.gate?.code ?? "Pendiente",
        terminal: booking.flight.terminal?.code ?? "Pendiente",
        qrValue: `BK:${booking.locator}|FL:${booking.flight.flightNumber}|ST:${booking.seatNumber ?? ""}`,
        barcodeValue: barcode,
      },
      baggageReceipt: db.baggage.filter((item) => item.passengerId === booking.passengerId && item.flightId === booking.flightId),
    };
  },
  async registerPrint(userId: string, type: string, referenceId: string, copies = 1, mode: PrintHistory["mode"] = "SIMULACION") {
    db.printHistory.unshift({
      id: randomUUID(),
      userId,
      type,
      referenceId,
      copies,
      mode,
      createdAt: new Date().toISOString(),
    });
    await persistState(db);
  },
  getPrintHistory() {
    return db.printHistory.map((item) => ({
      ...item,
      user: db.employeeUsers.find((user) => user.id === item.userId),
    }));
  },
  simulateLiveTick() {
    const targetFlight = db.flights.find((flight) => ["PROGRAMADO", "CHECKIN_ABIERTO", "EMBARQUE"].includes(flight.status));
    if (!targetFlight) {
      return { ok: true, message: "No hay vuelos disponibles para simulacion." };
    }
    const note = `${new Date().toLocaleTimeString("es-ES")} Cambio operativo automatico aplicado.`;
    if (targetFlight.status === "PROGRAMADO") targetFlight.status = "CHECKIN_ABIERTO";
    else if (targetFlight.status === "CHECKIN_ABIERTO") targetFlight.status = "EMBARQUE";
    else if (targetFlight.status === "EMBARQUE") targetFlight.status = "PUERTA_CERRADA";
    targetFlight.notes.unshift(note);
    db.notices.unshift({
      id: randomUUID(),
      title: `Actualizacion automatica ${targetFlight.flightNumber}`,
      body: `El vuelo ${targetFlight.flightNumber} ha pasado a estado ${targetFlight.status}.`,
      severity: "INFO",
      createdAt: new Date().toISOString(),
    });
    persistState(db).catch(() => undefined);
    return { ok: true, message: "Simulacion actualizada.", flightId: targetFlight.id };
  },
};
