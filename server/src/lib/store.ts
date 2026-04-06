import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { initPersistence, persistState } from "./persistence.js";

export type Role =
  | "ADMIN"
  | "CHECKIN_AGENT"
  | "GATE_AGENT"
  | "SUPERVISOR"
  | "OPERATIONS"
  | "FLEET_MANAGER"
  | "CUSTOMER_SERVICE";

type User = {
  id: string;
  username: string;
  passwordHash: string;
  role: Role;
  active: boolean;
  lastAccessAt?: string;
};

type Employee = {
  id: string;
  userId: string;
  fullName: string;
  stationCode: string;
  title: string;
};

type Airport = {
  id: string;
  code: string;
  icaoCode: string;
  name: string;
  city: string;
  country: string;
};

type Gate = {
  id: string;
  code: string;
  terminal: string;
  airportId: string;
  active: boolean;
};

type Aircraft = {
  id: string;
  registration: string;
  model: string;
  manufacturer: string;
  seatCapacity: number;
  cabinConfigJson: string;
  status: string;
  maintenanceNote?: string;
};

type Flight = {
  id: string;
  airlineId: string;
  flightNumber: string;
  originId: string;
  destinationId: string;
  scheduledAt: string;
  estimatedAt: string;
  status: string;
  gateId?: string;
  aircraftId?: string;
  occupancyLimit: number;
  overbookLimit: number;
  operationalNotes?: string;
};

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
};

type Booking = {
  id: string;
  locator: string;
  passengerId: string;
  flightId: string;
  fareName: string;
  cabinClass: string;
  seatNumber?: string;
  baggageIncluded: number;
  ticketStatus: string;
  refundable: boolean;
  upgradeAvailable: boolean;
  checkedInAt?: string;
  boardedAt?: string;
  remarks?: string;
  ticketNumber: string;
};

type SeatAssignment = {
  id: string;
  flightId: string;
  seatNumber: string;
  cabinClass: string;
  state: string;
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
  excessFee: number;
  status: string;
  barcode: string;
  printedAt?: string;
  createdAt: string;
};

type Boarding = {
  id: string;
  bookingId: string;
  flightId: string;
  employeeId: string;
  status: string;
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
  createdAt: string;
};

type Incident = {
  id: string;
  flightId?: string;
  employeeId?: string;
  type: string;
  severity: string;
  description: string;
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
};

type AccessLog = {
  id: string;
  userId: string;
  terminalId: string;
  ipAddress?: string;
  loginAt: string;
};

type PrinterProfile = {
  id: string;
  userId: string;
  terminalName: string;
  printerName: string;
  driverType: string;
  paperWidth: number;
  isDefault: boolean;
};

type Setting = {
  id: string;
  category: string;
  key: string;
  value: string;
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
};

type StoreData = {
  airline: Airline;
  users: User[];
  employees: Employee[];
  airports: Airport[];
  gates: Gate[];
  aircraft: Aircraft[];
  flights: Flight[];
  passengers: Passenger[];
  bookings: Booking[];
  seatAssignments: SeatAssignment[];
  baggage: Baggage[];
  boardings: Boarding[];
  upgrades: Upgrade[];
  incidents: Incident[];
  auditLogs: AuditLog[];
  accessLogs: AccessLog[];
  printerProfiles: PrinterProfile[];
  settings: Setting[];
};

function createSeatAssignments(flightId: string, cabinConfigJson: string): SeatAssignment[] {
  const sections = JSON.parse(cabinConfigJson) as Array<{
    rowStart: number;
    rowEnd: number;
    seats: string[];
    cabinClass: string;
    exitRows?: number[];
  }>;

  return sections.flatMap((section) =>
    Array.from({ length: section.rowEnd - section.rowStart + 1 }).flatMap((_, offset) => {
      const row = section.rowStart + offset;
      return section.seats.map((letter) => ({
        id: randomUUID(),
        flightId,
        seatNumber: `${row}${letter}`,
        cabinClass: section.cabinClass,
        state: section.exitRows?.includes(row) ? "EXIT_ROW" : "FREE",
      }));
    }),
  );
}

async function createSeed(): Promise<StoreData> {
  const airlineId = randomUUID();
  const airline: Airline = {
    id: airlineId,
    commercialName: "SkyBridge Atlantic",
    iataCode: "SB",
    icaoCode: "SBA",
    logoUrl: "/branding/skybridge-logo.svg",
    ticketPrefix: "724",
    baggagePolicy: "1PC 23KG Economy, 2PC 32KG Business. Exceso 8.5 EUR por kg.",
    upgradePolicy: "Upgrades por pago, cortesia, sobreventa y prioridad operativa.",
    colorPrimary: "#163455",
    colorAccent: "#d6d1c4",
  };

  const airports: Airport[] = [
    { id: randomUUID(), code: "MAD", icaoCode: "LEMD", name: "Adolfo Suarez Madrid-Barajas", city: "Madrid", country: "Spain" },
    { id: randomUUID(), code: "LHR", icaoCode: "EGLL", name: "London Heathrow", city: "London", country: "United Kingdom" },
    { id: randomUUID(), code: "CDG", icaoCode: "LFPG", name: "Paris Charles de Gaulle", city: "Paris", country: "France" },
  ];

  const gates: Gate[] = [
    { id: randomUUID(), code: "A12", terminal: "T2", airportId: airports[0].id, active: true },
    { id: randomUUID(), code: "B03", terminal: "T2", airportId: airports[0].id, active: true },
    { id: randomUUID(), code: "C07", terminal: "T1", airportId: airports[0].id, active: true },
  ];

  const a320Config = JSON.stringify([
    { rowStart: 1, rowEnd: 4, seats: ["A", "C", "D", "F"], cabinClass: "BUSINESS" },
    { rowStart: 5, rowEnd: 8, seats: ["A", "B", "C", "D", "E", "F"], cabinClass: "PREMIUM_ECONOMY", exitRows: [8] },
    { rowStart: 9, rowEnd: 30, seats: ["A", "B", "C", "D", "E", "F"], cabinClass: "ECONOMY", exitRows: [14, 15] },
  ]);
  const b737Config = JSON.stringify([
    { rowStart: 1, rowEnd: 3, seats: ["A", "C", "D", "F"], cabinClass: "BUSINESS" },
    { rowStart: 4, rowEnd: 7, seats: ["A", "B", "C", "D", "E", "F"], cabinClass: "PREMIUM_ECONOMY" },
    { rowStart: 8, rowEnd: 31, seats: ["A", "B", "C", "D", "E", "F"], cabinClass: "ECONOMY", exitRows: [16, 17] },
  ]);

  const aircraft: Aircraft[] = [
    { id: randomUUID(), registration: "EC-SBA", model: "A320-200", manufacturer: "Airbus", seatCapacity: 168, cabinConfigJson: a320Config, status: "OPERATIVE" },
    { id: randomUUID(), registration: "EC-SBB", model: "737-800", manufacturer: "Boeing", seatCapacity: 174, cabinConfigJson: b737Config, status: "OPERATIVE" },
  ];

  const now = new Date();
  const flights: Flight[] = [
    {
      id: randomUUID(),
      airlineId,
      flightNumber: "SB241",
      originId: airports[0].id,
      destinationId: airports[1].id,
      scheduledAt: new Date(now.getTime() + 1000 * 60 * 90).toISOString(),
      estimatedAt: new Date(now.getTime() + 1000 * 60 * 110).toISOString(),
      status: "CHECKIN_OPEN",
      gateId: gates[0].id,
      aircraftId: aircraft[0].id,
      occupancyLimit: 168,
      overbookLimit: 4,
      operationalNotes: "Carga estandar. Embarque estimado 40 min antes.",
    },
    {
      id: randomUUID(),
      airlineId,
      flightNumber: "SB318",
      originId: airports[0].id,
      destinationId: airports[2].id,
      scheduledAt: new Date(now.getTime() + 1000 * 60 * 180).toISOString(),
      estimatedAt: new Date(now.getTime() + 1000 * 60 * 180).toISOString(),
      status: "SCHEDULED",
      gateId: gates[1].id,
      aircraftId: aircraft[1].id,
      occupancyLimit: 174,
      overbookLimit: 2,
      operationalNotes: "Pasarela asignada. Prioridad familias.",
    },
  ];

  const passengers: Passenger[] = [
    {
      id: randomUUID(),
      firstName: "Daniel",
      lastName: "Serrano",
      birthDate: "1988-04-12",
      documentNumber: "P1234567",
      nationality: "ES",
      contactEmail: "daniel.serrano@example.com",
      contactPhone: "+34 600000001",
      operationalNotes: "Viajero frecuente. Solicita pasillo.",
    },
    {
      id: randomUUID(),
      firstName: "Amina",
      lastName: "Belkadi",
      birthDate: "1993-11-06",
      documentNumber: "P7654321",
      nationality: "FR",
      contactEmail: "amina.belkadi@example.com",
      contactPhone: "+33 600000002",
      operationalNotes: "Documentacion a verificar.",
    },
    {
      id: randomUUID(),
      firstName: "Oliver",
      lastName: "Hart",
      birthDate: "1979-02-18",
      documentNumber: "UK998877",
      nationality: "GB",
      contactEmail: "oliver.hart@example.com",
      contactPhone: "+44 700000003",
      operationalNotes: "Posible upgrade por sobreventa.",
    },
  ];

  const bookings: Booking[] = [
    {
      id: randomUUID(),
      locator: "SB9KQ2",
      passengerId: passengers[0].id,
      flightId: flights[0].id,
      fareName: "Flex Corporate",
      cabinClass: "BUSINESS",
      seatNumber: "2A",
      baggageIncluded: 2,
      ticketStatus: "ISSUED",
      refundable: true,
      upgradeAvailable: false,
      remarks: "Corporate profile.",
      ticketNumber: "724000000001",
    },
    {
      id: randomUUID(),
      locator: "SB4LMM",
      passengerId: passengers[1].id,
      flightId: flights[0].id,
      fareName: "Smart Saver",
      cabinClass: "ECONOMY",
      baggageIncluded: 1,
      ticketStatus: "RESERVED",
      refundable: false,
      upgradeAvailable: true,
      remarks: "Documentacion a verificar.",
      ticketNumber: "724000000002",
    },
    {
      id: randomUUID(),
      locator: "SB7OVR",
      passengerId: passengers[2].id,
      flightId: flights[1].id,
      fareName: "Economy Plus",
      cabinClass: "PREMIUM_ECONOMY",
      baggageIncluded: 1,
      ticketStatus: "ISSUED",
      refundable: true,
      upgradeAvailable: true,
      remarks: "Candidato sobreventa.",
      ticketNumber: "724000000003",
    },
  ];

  const seatAssignments = [
    ...createSeatAssignments(flights[0].id, aircraft[0].cabinConfigJson),
    ...createSeatAssignments(flights[1].id, aircraft[1].cabinConfigJson),
  ];
  const businessSeat = seatAssignments.find((seat) => seat.flightId === flights[0].id && seat.seatNumber === "2A");
  if (businessSeat) {
    businessSeat.bookingId = bookings[0].id;
    businessSeat.state = "OCCUPIED";
  }

  const roles: Array<[string, string, Role, string, string, string]> = [
    ["admin", "Admin#1994", "ADMIN", "Helena Varela", "General Administrator", "HQ"],
    ["checkin1", "Counter#1994", "CHECKIN_AGENT", "Raul Mendoza", "Check-In Agent", "MAD"],
    ["gate1", "Gate#1994", "GATE_AGENT", "Irene Solis", "Gate Agent", "MAD"],
    ["ops1", "Ops#1994", "OPERATIONS", "Dario Conde", "Operations Control", "MAD"],
    ["fleet1", "Fleet#1994", "FLEET_MANAGER", "Lucia Prat", "Fleet Manager", "MAD"],
    ["super1", "Super#1994", "SUPERVISOR", "Marta Cueto", "Duty Supervisor", "MAD"],
    ["cs1", "Service#1994", "CUSTOMER_SERVICE", "Noelia Rivas", "Customer Service", "MAD"],
  ];

  const users: User[] = [];
  const employees: Employee[] = [];
  for (const [username, password, role, fullName, title, stationCode] of roles) {
    const userId = randomUUID();
    users.push({
      id: userId,
      username,
      passwordHash: await bcrypt.hash(password, 10),
      role,
      active: true,
    });
    employees.push({
      id: randomUUID(),
      userId,
      fullName,
      title,
      stationCode,
    });
  }

  return {
    airline,
    users,
    employees,
    airports,
    gates,
    aircraft,
    flights,
    passengers,
    bookings,
    seatAssignments,
    baggage: [],
    boardings: [],
    upgrades: [],
    incidents: [
      { id: randomUUID(), flightId: flights[0].id, type: "DELAY", severity: "MEDIUM", description: "Ajuste de secuencia de handling por llegada tardia de equipo de rampa.", createdAt: new Date().toISOString() },
      { id: randomUUID(), flightId: flights[1].id, type: "OVERBOOKING", severity: "LOW", description: "Sobreventa controlada de 1 asiento. Revisar upgrades en puerta.", createdAt: new Date().toISOString() },
    ],
    auditLogs: [],
    accessLogs: [],
    printerProfiles: [
      { id: randomUUID(), userId: users[0].id, terminalName: "COUNTER-01", printerName: "UNYKA POS THERMAL", driverType: "ESC_POS_GENERIC", paperWidth: 80, isDefault: true },
    ],
    settings: [
      { id: randomUUID(), category: "branding", key: "theme", value: "legacy-blue" },
      { id: randomUUID(), category: "boarding", key: "autoCloseGateMinutes", value: "15" },
      { id: randomUUID(), category: "upgrade", key: "overbookingPolicy", value: "business_then_premium" },
    ],
  };
}

const initialSeed = await createSeed();
const db = (await initPersistence(initialSeed)) as StoreData;

function getEmployeeByUserId(userId: string) {
  return db.employees.find((employee) => employee.userId === userId);
}

function enrichFlight(flight: Flight) {
  return {
    ...flight,
    origin: db.airports.find((airport) => airport.id === flight.originId),
    destination: db.airports.find((airport) => airport.id === flight.destinationId),
    gate: db.gates.find((gate) => gate.id === flight.gateId),
    aircraft: db.aircraft.find((aircraft) => aircraft.id === flight.aircraftId),
    bookings: db.bookings
      .filter((booking) => booking.flightId === flight.id)
      .map((booking) => ({
        ...booking,
        passenger: db.passengers.find((passenger) => passenger.id === booking.passengerId)!,
      })),
  };
}

export const store = {
  db,
  async authenticate(username: string, password: string) {
    const user = db.users.find((candidate) => candidate.username === username);
    if (!user || !user.active) {
      return null;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return null;
    }
    user.lastAccessAt = new Date().toISOString();
    const employee = getEmployeeByUserId(user.id)!;
    return { user, employee };
  },
  async recordAccess(userId: string, terminalId: string, ipAddress?: string) {
    db.accessLogs.unshift({ id: randomUUID(), userId, terminalId, ipAddress, loginAt: new Date().toISOString() });
    await persistState(db);
  },
  getAirline() {
    return db.airline;
  },
  getEmployees() {
    return db.employees.map((employee) => ({
      ...employee,
      user: db.users.find((user) => user.id === employee.userId),
    }));
  },
  getDashboard() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const flightsToday = db.flights.filter((flight) => new Date(flight.scheduledAt) >= todayStart).length;
    const delayedFlights = db.flights.filter((flight) => flight.status === "DELAYED").length;
    const activeGates = db.gates.filter((gate) => gate.active).length;
    const pendingCheckin = db.bookings.filter((booking) => ["RESERVED", "ISSUED"].includes(booking.ticketStatus)).length;
    const baggageToday = db.baggage.filter((item) => new Date(item.createdAt) >= todayStart).length;
    const boardingOpen = db.flights.filter((flight) => flight.status === "BOARDING").length;
    return {
      summary: { flightsToday, delayedFlights, activeGates, pendingCheckin, baggageToday, boardingOpen },
      incidents: db.incidents.slice(0, 5),
      occupancyByFlight: db.flights.slice(0, 8).map((flight) => ({
        id: flight.id,
        flightNumber: flight.flightNumber,
        gate: db.gates.find((gate) => gate.id === flight.gateId)?.code ?? "TBD",
        status: flight.status,
        occupancy: `${db.bookings.filter((booking) => booking.flightId === flight.id).length}/${flight.occupancyLimit}`,
      })),
      notifications: [
        "OPS MESSAGE: Prioridad de embarque activa para vuelos internacionales.",
        "RAMP CONTROL: Revision preventiva en SB-NEO-204 a las 16:10.",
        "CUSTOMER SERVICE: 3 upgrades cortesia pendientes de aprobacion.",
      ],
    };
  },
  getFlights() {
    return db.flights.map((flight) => {
      const enriched = enrichFlight(flight);
      return { ...enriched, passengerCount: enriched.bookings.length };
    });
  },
  async updateFlightStatus(id: string, status: string, operationalNotes?: string) {
    const flight = db.flights.find((item) => item.id === id);
    if (!flight) {
      return null;
    }
    flight.status = status;
    flight.operationalNotes = operationalNotes;
    await persistState(db);
    return flight;
  },
  getPassengers() {
    return db.passengers.map((passenger) => ({
      ...passenger,
      bookings: db.bookings
        .filter((booking) => booking.passengerId === passenger.id)
        .map((booking) => ({ ...booking, flight: db.flights.find((flight) => flight.id === booking.flightId)! })),
      baggageItems: db.baggage.filter((item) => item.passengerId === passenger.id),
    }));
  },
  getBookings() {
    return db.bookings.map((booking) => ({
      ...booking,
      passenger: db.passengers.find((passenger) => passenger.id === booking.passengerId),
      flight: enrichFlight(db.flights.find((flight) => flight.id === booking.flightId)!),
      ticket: { number: booking.ticketNumber, status: booking.ticketStatus, issuedAt: booking.checkedInAt ?? new Date().toISOString() },
    }));
  },
  getSeatMap(flightId: string) {
    const flight = db.flights.find((item) => item.id === flightId);
    if (!flight) {
      return null;
    }
    return {
      ...flight,
      aircraft: db.aircraft.find((aircraft) => aircraft.id === flight.aircraftId),
      seatAssignments: db.seatAssignments.filter((seat) => seat.flightId === flightId),
    };
  },
  async assignSeat(bookingId: string, flightId: string, seatNumber: string) {
    const seat = db.seatAssignments.find((item) => item.flightId === flightId && item.seatNumber === seatNumber);
    const booking = db.bookings.find((item) => item.id === bookingId);
    if (!seat || !booking || ["BLOCKED", "CREW"].includes(seat.state) || (seat.bookingId && seat.bookingId !== bookingId)) {
      return { error: "Asiento no disponible." };
    }
    seat.bookingId = bookingId;
    seat.state = "OCCUPIED";
    booking.seatNumber = seatNumber;
    await persistState(db);
    return { seat };
  },
  async checkin(bookingId: string, employeeId: string, seatNumber: string, documentAlert?: string) {
    const booking = db.bookings.find((item) => item.id === bookingId);
    if (!booking) {
      return { error: "Reserva no encontrada." };
    }
    const flight = db.flights.find((item) => item.id === booking.flightId)!;
    if (booking.ticketStatus === "CHECKED_IN") {
      return { error: "Pasajero ya facturado." };
    }
    if (["GATE_CLOSED", "DEPARTED", "CANCELLED", "COMPLETED"].includes(flight.status)) {
      return { error: "Vuelo cerrado para check-in." };
    }
    const assignResult = await this.assignSeat(bookingId, flight.id, seatNumber);
    if ("error" in assignResult) {
      return assignResult;
    }
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
      },
      booking,
    };
  },
  async addBaggage(passengerId: string, flightId: string, employeeId: string, pieces: number, totalWeightKg: number) {
    const passenger = db.passengers.find((item) => item.id === passengerId);
    const flight = db.flights.find((item) => item.id === flightId);
    if (!passenger || !flight) {
      return { error: "Datos de equipaje invalidos." };
    }
    const excessFee = totalWeightKg > 23 ? (totalWeightKg - 23) * 8.5 : 0;
    const bagTag = `SB${flight.flightNumber}${Date.now().toString().slice(-6)}`;
    const baggage = {
      id: randomUUID(),
      passengerId,
      flightId,
      employeeId,
      bagTag,
      pieces,
      totalWeightKg,
      excessFee,
      status: "CHECKED",
      barcode: `${bagTag}-${pieces}`,
      printedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    db.baggage.unshift(baggage);
    await persistState(db);
    return { baggage, passenger, flight };
  },
  async board(bookingId: string, employeeId: string, manualOverride: boolean) {
    const booking = db.bookings.find((item) => item.id === bookingId);
    if (!booking) {
      return { error: "Reserva no encontrada." };
    }
    const flight = db.flights.find((item) => item.id === booking.flightId)!;
    if (booking.ticketStatus !== "CHECKED_IN" && !manualOverride) {
      return { error: "No se puede embarcar sin check-in." };
    }
    if (["GATE_CLOSED", "DEPARTED", "CANCELLED", "COMPLETED"].includes(flight.status) && !manualOverride) {
      return { error: "Vuelo cerrado para embarque." };
    }
    booking.ticketStatus = "BOARDED";
    booking.boardedAt = new Date().toISOString();
    const boarding = {
      id: randomUUID(),
      bookingId,
      flightId: booking.flightId,
      employeeId,
      status: "BOARDED",
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
  async createUpgrade(bookingId: string, employeeId: string, toClass: string, newSeat: string | undefined, reason: string, price: number) {
    const booking = db.bookings.find((item) => item.id === bookingId);
    if (!booking) {
      return { error: "Reserva no encontrada." };
    }
    if (newSeat) {
      const assignResult = await this.assignSeat(bookingId, booking.flightId, newSeat);
      if ("error" in assignResult) {
        return assignResult;
      }
    }
    const upgrade = {
      id: randomUUID(),
      bookingId,
      flightId: booking.flightId,
      employeeId,
      fromClass: booking.cabinClass,
      toClass,
      reason,
      newSeat,
      price,
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
    }));
  },
  getAudit() {
    return db.auditLogs.map((log) => ({
      ...log,
      user: {
        ...db.users.find((user) => user.id === log.userId)!,
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
    });
    await persistState(db);
  },
  getSettings() {
    return {
      airline: db.airline,
      settings: db.settings,
      airports: db.airports,
      printerProfiles: db.printerProfiles,
    };
  },
  async updateAirlineSettings(patch: Partial<Airline>) {
    Object.assign(db.airline, patch);
    await persistState(db);
    return db.airline;
  },
  getPublicSite() {
    return {
      airline: db.airline,
      airports: db.airports,
      featuredFlights: this.getFlights()
        .filter((flight) => flight.origin && flight.destination)
        .slice(0, 6)
        .map((flight) => ({
          id: flight.id,
          flightNumber: flight.flightNumber,
          route: `${flight.origin!.code} - ${flight.destination!.code}`,
          originCity: flight.origin!.city,
          destinationCity: flight.destination!.city,
          scheduledAt: flight.scheduledAt,
          status: flight.status,
        })),
      services: [
        {
          title: "Check-in y embarque asistido",
          description: "Procesos coordinados para facturacion, validacion documental y embarque por prioridades.",
        },
        {
          title: "Gestion de equipaje y trazabilidad",
          description: "Control de maletas, resguardos termicos, incidencias y preparacion para lectores de codigos.",
        },
        {
          title: "Operaciones y atencion al pasajero",
          description: "Paneles de operaciones, upgrades, sobreventa controlada y asistencia al cliente.",
        },
      ],
    };
  },
};
