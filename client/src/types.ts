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
  | "ADMIN";

export type SessionUser = {
  id: string;
  username: string;
  role: Role;
  employeeId: string;
  fullName: string;
  terminalId: string;
  permissions: string[];
  forcePasswordChange: boolean;
};

export type CustomerSession = {
  id: string;
  email: string;
  fullName: string;
};

export type Airline = {
  id?: string;
  commercialName: string;
  iataCode: string;
  icaoCode: string;
  logoUrl: string;
  colorPrimary: string;
  colorAccent: string;
};

export type AuthResponse = {
  user: SessionUser;
};

export type DashboardData = {
  summary: Record<string, number>;
  incidents: Array<{ id: string; severity: string; description: string; type: string }>;
  occupancyByFlight: Array<{ id: string; flightNumber: string; gate: string; status: string; occupancy: string }>;
  notifications: string[];
  kpisAvanzados?: Record<string, string>;
  actividadReciente?: Array<{ id: string; action: string; createdAt: string }>;
};

export type PublicPayload = {
  airline: Airline;
  airportName: string;
  airlines: Array<Airline & { contactEmail: string }>;
  airports: Array<{ code: string; city: string; country: string; name: string }>;
  destinations: Array<{ code: string; city: string; country: string; name: string }>;
  featuredFlights: Array<{ id: string; flightNumber: string; route: string; originCity: string; destinationCity: string; scheduledAt: string; status: string; terminal?: string; gate?: string }>;
  services: Array<{ title: string; description: string }>;
  news: Array<{ id: string; title: string; excerpt: string; body: string; createdAt: string }>;
  notices: Array<{ id: string; title: string; body: string; severity: string }>;
  faqs: Array<{ id: string; question: string; answer: string }>;
  stats: Record<string, number>;
};

export type Flight = {
  id: string;
  flightNumber: string;
  status: string;
  scheduledDeparture: string;
  estimatedDeparture: string;
  terminal?: { code: string };
  gate?: { code: string };
  origin?: { code: string; city: string };
  destination?: { code: string; city: string };
  aircraft?: { registration: string; model: string };
  passengerCount: number;
  boardedCount: number;
  baggageCount: number;
  bookings: Array<{
    id: string;
    locator: string;
    seatNumber?: string;
    ticketStatus: string;
    cabinClass: string;
    passenger: { id: string; firstName: string; lastName: string; documentNumber: string; documentVerified?: boolean; assistanceRequired?: boolean };
  }>;
};

export type FlightDetail = Flight & {
  crew: string[];
  seatAssignments: Array<{ id: string; seatNumber: string; cabinClass: string; state: string; position: string; bookingId?: string; passenger?: { firstName: string; lastName: string } }>;
  baggage: Array<{ id: string; bagTag: string; totalWeightKg: number; status: string }>;
  incidents: Array<{ id: string; type: string; severity: string; status: string; description: string }>;
  timeline: Array<{ label: string; at: string }>;
};

export type Passenger = {
  id: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
  nationality: string;
  type: string;
  documentVerified: boolean;
  assistanceRequired: boolean;
  bookings: Array<{ id: string; locator: string; ticketStatus: string; seatNumber?: string; cabinClass: string; flight: { flightNumber: string } }>;
  baggageItems: Array<{ id: string; bagTag: string; totalWeightKg: number }>;
  incidents: Array<{ id: string; type: string; status: string }>;
};

export type CustomerArea = {
  account: { id: string; email: string; fullName: string; phone: string; nationality: string; loyaltyLevel: string; preferences: string[] };
  upcoming: Array<{ id: string; locator: string; seatNumber?: string; ticketStatus: string; flight: { flightNumber: string; scheduledDeparture: string; gate?: { code: string }; terminal?: { code: string } } }>;
  history: Array<{ id: string; locator: string; ticketStatus: string; flight: { flightNumber: string; scheduledDeparture: string } }>;
  messages: Array<{ id: string; subject: string; body: string; priority: string; createdAt: string }>;
};

export type SearchFlight = {
  id: string;
  flightNumber: string;
  airline: string;
  origin: string;
  destination: string;
  salida: string;
  llegada: string;
  cabinas: string[];
  disponible: number;
  precioBase: number;
};

export type EmployeeMessage = { id: string; subject: string; body: string; priority: string; createdAt: string; channel: string };
export type CustomerAccountAdmin = { id: string; email: string; fullName: string; nationality: string; messagesUnread: number; profile?: { loyaltyLevel: string } };
export type Incident = { id: string; type: string; severity: string; status: string; description: string; scope: string };
export type Aircraft = { id: string; registration: string; model: string; manufacturer: string; seatCapacity: number; status: string; flights: Array<{ flightNumber: string; status: string }> };
export type AuditLog = { id: string; action: string; entityType: string; terminalId: string; createdAt: string; critical: boolean; user: { employee?: { fullName: string } } };
export type SettingsPayload = {
  airline: Airline & { ticketPrefix: string; baggagePolicy: string; upgradePolicy: string };
  airlines: Array<{ id: string; commercialName: string; iataCode: string; active: boolean }>;
  airports: Array<{ id: string; code: string; name: string }>;
  terminals: Array<{ id: string; code: string; name: string }>;
  gates: Array<{ id: string; code: string; active: boolean }>;
  counters: Array<{ id: string; code: string; active: boolean }>;
  users: Array<{ id: string; fullName: string; title: string; user: { role: string; status: string; forcePasswordChange: boolean; failedAttempts: number } }>;
  printerProfiles: Array<{ terminalName: string; printerName: string; simulationMode: boolean }>;
  security: { bloqueoIntentos: string; sesionesActivas: number };
};
export type PrintHistory = { id: string; type: string; mode: string; copies: number; createdAt: string; user?: { username: string } };
export type BarcodeSegment = { id: string; width: number; dark: boolean };
export type DocumentPayload = {
  bookingId: string;
  boardingPass: {
    passenger: string;
    vuelo: string;
    localizador: string;
    asiento: string;
    puerta: string;
    terminal: string;
    qrDataUrl: string;
    barcodeValue: string;
    barcodeSegments: BarcodeSegment[];
    thermalPreview: { escpos: string };
    a4Preview: { titulo: string; subtitulo: string };
  };
  baggageReceipt?: Array<{
    id: string;
    bagTag: string;
    pieces: number;
    totalWeightKg: number;
    excessFee: number;
    barcode: string;
    barcodeSegments: BarcodeSegment[];
    thermalPreview: { escpos: string };
  }>;
};
