import bcrypt from "bcryptjs";
import { CabinClass, FlightStatus, PrismaClient, TicketStatus, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function createUser(username: string, password: string, role: UserRole, fullName: string, title: string, stationCode: string) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: {
      username,
      passwordHash,
      role,
      employee: {
        create: {
          fullName,
          title,
          stationCode,
        },
      },
    },
    include: { employee: true },
  });
}

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.accessLog.deleteMany();
  await prisma.boarding.deleteMany();
  await prisma.baggage.deleteMany();
  await prisma.checkin.deleteMany();
  await prisma.upgrade.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.seatAssignment.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.flight.deleteMany();
  await prisma.gate.deleteMany();
  await prisma.airport.deleteMany();
  await prisma.aircraft.deleteMany();
  await prisma.printerProfile.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.passenger.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();
  await prisma.airline.deleteMany();

  const airline = await prisma.airline.create({
    data: {
      commercialName: "SkyBridge Atlantic",
      iataCode: "SB",
      icaoCode: "SBA",
      logoUrl: "/branding/skybridge-logo.svg",
      ticketPrefix: "724",
      baggagePolicy: "1PC 23KG Economy, 2PC 32KG Business. Exceso 8.5 EUR por kg.",
      upgradePolicy: "Upgrades por pago, cortesia, sobreventa y prioridad operativa.",
      colorPrimary: "#163455",
      colorAccent: "#d6d1c4",
    },
  });

  const madrid = await prisma.airport.create({
    data: {
      code: "MAD",
      icaoCode: "LEMD",
      name: "Adolfo Suarez Madrid-Barajas",
      city: "Madrid",
      country: "Spain",
      airlineId: airline.id,
    },
  });

  const london = await prisma.airport.create({
    data: {
      code: "LHR",
      icaoCode: "EGLL",
      name: "London Heathrow",
      city: "London",
      country: "United Kingdom",
      airlineId: airline.id,
    },
  });

  const paris = await prisma.airport.create({
    data: {
      code: "CDG",
      icaoCode: "LFPG",
      name: "Paris Charles de Gaulle",
      city: "Paris",
      country: "France",
      airlineId: airline.id,
    },
  });

  const gates = await Promise.all([
    prisma.gate.create({ data: { code: "A12", terminal: "T2", airportId: madrid.id } }),
    prisma.gate.create({ data: { code: "B03", terminal: "T2", airportId: madrid.id } }),
    prisma.gate.create({ data: { code: "C07", terminal: "T1", airportId: madrid.id } }),
  ]);

  const a320Config = JSON.stringify([
    { rowStart: 1, rowEnd: 4, seats: ["A", "C", "D", "F"], cabinClass: CabinClass.BUSINESS },
    { rowStart: 5, rowEnd: 8, seats: ["A", "B", "C", "D", "E", "F"], cabinClass: CabinClass.PREMIUM_ECONOMY, exitRows: [8] },
    { rowStart: 9, rowEnd: 30, seats: ["A", "B", "C", "D", "E", "F"], cabinClass: CabinClass.ECONOMY, exitRows: [14, 15] },
  ]);

  const b737Config = JSON.stringify([
    { rowStart: 1, rowEnd: 3, seats: ["A", "C", "D", "F"], cabinClass: CabinClass.BUSINESS },
    { rowStart: 4, rowEnd: 7, seats: ["A", "B", "C", "D", "E", "F"], cabinClass: CabinClass.PREMIUM_ECONOMY },
    { rowStart: 8, rowEnd: 31, seats: ["A", "B", "C", "D", "E", "F"], cabinClass: CabinClass.ECONOMY, exitRows: [16, 17] },
  ]);

  const aircraft = await Promise.all([
    prisma.aircraft.create({
      data: {
        registration: "EC-SBA",
        model: "A320-200",
        manufacturer: "Airbus",
        seatCapacity: 168,
        cabinConfigJson: a320Config,
        status: "OPERATIVE",
      },
    }),
    prisma.aircraft.create({
      data: {
        registration: "EC-SBB",
        model: "737-800",
        manufacturer: "Boeing",
        seatCapacity: 174,
        cabinConfigJson: b737Config,
        status: "OPERATIVE",
      },
    }),
  ]);

  const now = new Date();
  const flight1 = await prisma.flight.create({
    data: {
      airlineId: airline.id,
      flightNumber: "SB241",
      originId: madrid.id,
      destinationId: london.id,
      scheduledAt: new Date(now.getTime() + 1000 * 60 * 90),
      estimatedAt: new Date(now.getTime() + 1000 * 60 * 110),
      status: FlightStatus.CHECKIN_OPEN,
      gateId: gates[0].id,
      aircraftId: aircraft[0].id,
      occupancyLimit: 168,
      overbookLimit: 4,
      operationalNotes: "Carga estandar. Embarque estimado 40 min antes.",
    },
  });

  const flight2 = await prisma.flight.create({
    data: {
      airlineId: airline.id,
      flightNumber: "SB318",
      originId: madrid.id,
      destinationId: paris.id,
      scheduledAt: new Date(now.getTime() + 1000 * 60 * 180),
      estimatedAt: new Date(now.getTime() + 1000 * 60 * 180),
      status: FlightStatus.SCHEDULED,
      gateId: gates[1].id,
      aircraftId: aircraft[1].id,
      occupancyLimit: 174,
      overbookLimit: 2,
      operationalNotes: "Pasarela asignada. Prioridad familias.",
    },
  });

  await Promise.all([
    createUser("admin", "Admin#1994", UserRole.ADMIN, "Helena Varela", "General Administrator", "HQ"),
    createUser("checkin1", "Counter#1994", UserRole.CHECKIN_AGENT, "Raul Mendoza", "Check-In Agent", "MAD"),
    createUser("gate1", "Gate#1994", UserRole.GATE_AGENT, "Irene Solis", "Gate Agent", "MAD"),
    createUser("ops1", "Ops#1994", UserRole.OPERATIONS, "Dario Conde", "Operations Control", "MAD"),
    createUser("fleet1", "Fleet#1994", UserRole.FLEET_MANAGER, "Lucia Prat", "Fleet Manager", "MAD"),
    createUser("super1", "Super#1994", UserRole.SUPERVISOR, "Marta Cueto", "Duty Supervisor", "MAD"),
    createUser("cs1", "Service#1994", UserRole.CUSTOMER_SERVICE, "Noelia Rivas", "Customer Service", "MAD"),
  ]);

  const passengers = await Promise.all([
    prisma.passenger.create({
      data: {
        firstName: "Daniel",
        lastName: "Serrano",
        birthDate: new Date("1988-04-12"),
        documentNumber: "P1234567",
        nationality: "ES",
        contactEmail: "daniel.serrano@example.com",
        contactPhone: "+34 600000001",
        operationalNotes: "Viajero frecuente. Solicita pasillo.",
      },
    }),
    prisma.passenger.create({
      data: {
        firstName: "Amina",
        lastName: "Belkadi",
        birthDate: new Date("1993-11-06"),
        documentNumber: "P7654321",
        nationality: "FR",
        contactEmail: "amina.belkadi@example.com",
        contactPhone: "+33 600000002",
      },
    }),
    prisma.passenger.create({
      data: {
        firstName: "Oliver",
        lastName: "Hart",
        birthDate: new Date("1979-02-18"),
        documentNumber: "UK998877",
        nationality: "GB",
        contactEmail: "oliver.hart@example.com",
        contactPhone: "+44 700000003",
        operationalNotes: "Posible upgrade por sobreventa.",
      },
    }),
  ]);

  const bookings = await Promise.all([
    prisma.booking.create({
      data: {
        locator: "SB9KQ2",
        passengerId: passengers[0].id,
        flightId: flight1.id,
        fareName: "Flex Corporate",
        cabinClass: CabinClass.BUSINESS,
        seatNumber: "2A",
        baggageIncluded: 2,
        ticketStatus: TicketStatus.ISSUED,
        refundable: true,
        upgradeAvailable: false,
        remarks: "Corporate profile.",
        ticket: {
          create: {
            number: "724000000001",
            status: TicketStatus.ISSUED,
            issuedAt: new Date(),
          },
        },
      },
    }),
    prisma.booking.create({
      data: {
        locator: "SB4LMM",
        passengerId: passengers[1].id,
        flightId: flight1.id,
        fareName: "Smart Saver",
        cabinClass: CabinClass.ECONOMY,
        baggageIncluded: 1,
        ticketStatus: TicketStatus.RESERVED,
        refundable: false,
        upgradeAvailable: true,
        remarks: "Documentacion a verificar.",
        ticket: {
          create: {
            number: "724000000002",
            status: TicketStatus.RESERVED,
            issuedAt: new Date(),
          },
        },
      },
    }),
    prisma.booking.create({
      data: {
        locator: "SB7OVR",
        passengerId: passengers[2].id,
        flightId: flight2.id,
        fareName: "Economy Plus",
        cabinClass: CabinClass.PREMIUM_ECONOMY,
        baggageIncluded: 1,
        ticketStatus: TicketStatus.ISSUED,
        refundable: true,
        upgradeAvailable: true,
        remarks: "Candidato sobreventa.",
        ticket: {
          create: {
            number: "724000000003",
            status: TicketStatus.ISSUED,
            issuedAt: new Date(),
          },
        },
      },
    }),
  ]);

  for (const flight of [flight1, flight2]) {
    const aircraftForFlight = flight.id === flight1.id ? aircraft[0] : aircraft[1];
    const sections = JSON.parse(aircraftForFlight.cabinConfigJson) as Array<{
      rowStart: number;
      rowEnd: number;
      seats: string[];
      cabinClass: CabinClass;
      exitRows?: number[];
    }>;

    await prisma.seatAssignment.createMany({
      data: sections.flatMap((section) =>
        Array.from({ length: section.rowEnd - section.rowStart + 1 }).flatMap((_, index) => {
          const row = section.rowStart + index;
          return section.seats.map((letter) => ({
            flightId: flight.id,
            seatNumber: `${row}${letter}`,
            cabinClass: section.cabinClass,
            state: section.exitRows?.includes(row) ? "EXIT_ROW" : "FREE",
          }));
        }),
      ),
    });
  }

  await prisma.seatAssignment.updateMany({
    where: { flightId: flight1.id, seatNumber: "2A" },
    data: { bookingId: bookings[0].id, state: "OCCUPIED" },
  });

  await prisma.incident.createMany({
    data: [
      {
        flightId: flight1.id,
        type: "DELAY",
        severity: "MEDIUM",
        description: "Ajuste de secuencia de handling por llegada tardia de equipo de rampa.",
      },
      {
        flightId: flight2.id,
        type: "OVERBOOKING",
        severity: "LOW",
        description: "Sobreventa controlada de 1 asiento. Revisar upgrades en puerta.",
      },
    ],
  });

  const admin = await prisma.user.findUniqueOrThrow({ where: { username: "admin" } });
  await prisma.printerProfile.create({
    data: {
      airlineId: airline.id,
      userId: admin.id,
      terminalName: "COUNTER-01",
      printerName: "UNYKA POS THERMAL",
      driverType: "ESC_POS_GENERIC",
      paperWidth: 80,
      isDefault: true,
    },
  });

  await prisma.setting.createMany({
    data: [
      { airlineId: airline.id, category: "branding", key: "theme", value: "legacy-blue" },
      { airlineId: airline.id, category: "boarding", key: "autoCloseGateMinutes", value: "15" },
      { airlineId: airline.id, category: "upgrade", key: "overbookingPolicy", value: "business_then_premium" },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
