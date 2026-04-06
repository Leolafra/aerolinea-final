import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { api } from "./api";
import type { Airline, AuthResponse, DashboardData, SessionUser } from "./types";

type ViewMode = "public" | "employee-access" | "portal";
type ScreenKey = "dashboard" | "flights" | "passengers" | "checkin" | "boarding" | "upgrades" | "fleet" | "audit" | "settings";

type PublicSitePayload = {
  airline: Airline;
  airports: Array<{ code: string; city: string; country: string; name: string }>;
  featuredFlights: Array<{ id: string; flightNumber: string; route: string; originCity: string; destinationCity: string; scheduledAt: string; status: string }>;
  services: Array<{ title: string; description: string }>;
};

type Flight = {
  id: string;
  flightNumber: string;
  status: string;
  scheduledAt: string;
  estimatedAt: string;
  occupancyLimit: number;
  overbookLimit: number;
  operationalNotes?: string | null;
  passengerCount: number;
  gate?: { code: string };
  origin: { code: string; city: string };
  destination: { code: string; city: string };
  aircraft?: { registration: string; model: string };
  bookings: Array<{
    id: string;
    locator: string;
    seatNumber?: string | null;
    ticketStatus: string;
    cabinClass: string;
    passenger: { firstName: string; lastName: string; documentNumber: string };
  }>;
};

type Passenger = {
  id: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
  nationality: string;
  contactEmail: string;
  operationalNotes?: string;
  bookings: Array<{ locator: string; ticketStatus: string; seatNumber?: string | null; flight: { flightNumber: string } }>;
  baggageItems: Array<{ bagTag: string; totalWeightKg: number }>;
};

type SeatAssignment = { id: string; seatNumber: string; cabinClass: string; state: string; bookingId?: string | null };
type SeatMapResponse = { id: string; aircraft?: { registration: string; model: string; cabinConfigJson: string }; seatAssignments: SeatAssignment[] };
type Upgrade = { id: string; reason: string; fromClass: string; toClass: string; newSeat?: string | null; booking: { locator: string; passenger: { firstName: string; lastName: string }; flight: { flightNumber: string } }; employee: { fullName: string } };
type Aircraft = { id: string; registration: string; model: string; manufacturer: string; seatCapacity: number; status: string; cabinConfigJson: string; flights: Array<{ flightNumber: string; status: string }> };
type AuditLog = { id: string; action: string; entityType: string; terminalId: string; createdAt: string; user: { employee?: { fullName: string } } };
type SettingsPayload = { airline: Airline & { baggagePolicy: string; upgradePolicy: string; ticketPrefix: string }; settings: Array<{ category: string; key: string; value: string }>; printerProfiles: Array<{ printerName: string; driverType: string; terminalName: string; paperWidth: number }> };
type PrintPreview = { type: string; escpos: string; windowsPrintableText: string };

const screensByRole: Record<string, ScreenKey[]> = {
  ADMIN: ["dashboard", "flights", "passengers", "checkin", "boarding", "upgrades", "fleet", "audit", "settings"],
  CHECKIN_AGENT: ["dashboard", "flights", "passengers", "checkin"],
  GATE_AGENT: ["dashboard", "flights", "boarding"],
  SUPERVISOR: ["dashboard", "flights", "passengers", "checkin", "boarding", "upgrades", "fleet", "audit", "settings"],
  OPERATIONS: ["dashboard", "flights", "upgrades", "fleet"],
  FLEET_MANAGER: ["dashboard", "fleet", "flights"],
  CUSTOMER_SERVICE: ["dashboard", "passengers", "upgrades", "flights"],
};

const labels: Record<ScreenKey, string> = {
  dashboard: "OPERATIONS SUMMARY",
  flights: "FLIGHT CONTROL",
  passengers: "PASSENGER MASTER",
  checkin: "CHECK-IN DESK",
  boarding: "GATE BOARDING",
  upgrades: "UPGRADES / OVERSALE",
  fleet: "FLEET CONFIGURATION",
  audit: "EMPLOYEE AUDIT",
  settings: "SYSTEM SETTINGS",
};

function formatDateTime(input: string) {
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(input));
}

function groupSeats(seats: SeatAssignment[]) {
  const grouped = new Map<number, SeatAssignment[]>();
  for (const seat of seats) {
    const row = Number(seat.seatNumber.replace(/[A-Z]/g, ""));
    grouped.set(row, [...(grouped.get(row) ?? []), seat].sort((a, b) => a.seatNumber.localeCompare(b.seatNumber)));
  }
  return [...grouped.entries()].sort((a, b) => a[0] - b[0]);
}

function resolveView(pathname: string): ViewMode {
  if (pathname.startsWith("/employee-access") || pathname.startsWith("/staff")) {
    return "employee-access";
  }
  return "public";
}

function App() {
  const [view, setView] = useState<ViewMode>(resolveView(window.location.pathname));
  const [user, setUser] = useState<SessionUser | null>(null);
  const [airline, setAirline] = useState<Airline | null>(null);
  const [publicSite, setPublicSite] = useState<PublicSitePayload | null>(null);
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [seatMap, setSeatMap] = useState<SeatMapResponse | null>(null);
  const [upgrades, setUpgrades] = useState<Upgrade[]>([]);
  const [fleet, setFleet] = useState<Aircraft[]>([]);
  const [audit, setAudit] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<SettingsPayload | null>(null);
  const [printPreview, setPrintPreview] = useState<PrintPreview | null>(null);
  const [statusMessage, setStatusMessage] = useState("SYSTEM READY");
  const [search, setSearch] = useState("");
  const [loginForm, setLoginForm] = useState({ username: "admin", password: "Admin#1994", terminalId: "COUNTER-01" });

  const allowedScreens = user ? screensByRole[user.role] : [];
  const selectedFlight = flights[0];

  function navigate(next: ViewMode, path: string) {
    window.history.pushState({}, "", path);
    setView(next);
  }

  useEffect(() => {
    const onPopState = () => setView(resolveView(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    api.get<PublicSitePayload>("/public/site").then(setPublicSite).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!window.location.pathname.startsWith("/staff")) return;
    api
      .get<{ user: SessionUser; airline: Airline }>("/auth/me")
      .then(async (session) => {
        setUser(session.user);
        setAirline(session.airline);
        await loadCore();
        setView("portal");
      })
      .catch(() => setView("employee-access"));
  }, []);

  async function loadCore() {
    const [dashboardData, flightsData, passengersData] = await Promise.all([
      api.get<DashboardData>("/dashboard"),
      api.get<Flight[]>("/flights"),
      api.get<Passenger[]>("/passengers"),
    ]);
    setDashboard(dashboardData);
    setFlights(flightsData);
    setPassengers(passengersData);
  }

  async function loadRoleData(currentScreen: ScreenKey, currentFlights: Flight[]) {
    if (!currentFlights.length) return;
    if (["checkin", "flights", "boarding"].includes(currentScreen)) setSeatMap(await api.get<SeatMapResponse>(`/seats/${currentFlights[0].id}`));
    if (currentScreen === "upgrades") setUpgrades(await api.get<Upgrade[]>("/upgrades"));
    if (currentScreen === "fleet") setFleet(await api.get<Aircraft[]>("/fleet"));
    if (currentScreen === "audit") setAudit(await api.get<AuditLog[]>("/audit"));
    if (currentScreen === "settings") setSettings(await api.get<SettingsPayload>("/settings"));
  }

  useEffect(() => {
    if (!user) return;
    loadRoleData(screen, flights).catch((loadError: Error) => setError(loadError.message));
  }, [screen, user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function login() {
    try {
      setError("");
      const session = await api.post<AuthResponse>("/auth/login", loginForm);
      setUser(session.user);
      const me = await api.get<{ user: SessionUser; airline: Airline }>("/auth/me");
      setAirline(me.airline);
      await loadCore();
      setStatusMessage(`SESSION OPEN FOR ${session.user.fullName.toUpperCase()}`);
      navigate("portal", "/staff");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Acceso denegado.");
    }
  }

  async function assignSeat(bookingId: string, seatNumber: string) {
    if (!selectedFlight) return;
    try {
      await api.post("/seats/assign", { bookingId, flightId: selectedFlight.id, seatNumber });
      setStatusMessage(`SEAT ${seatNumber} ASSIGNED`);
      const [flightsData, map] = await Promise.all([api.get<Flight[]>("/flights"), api.get<SeatMapResponse>(`/seats/${selectedFlight.id}`)]);
      setFlights(flightsData);
      setSeatMap(map);
    } catch (seatError) {
      setError(seatError instanceof Error ? seatError.message : "No fue posible asignar asiento.");
    }
  }

  async function performCheckin(bookingId: string, seatNumber: string) {
    if (!selectedFlight) return;
    try {
      await api.post("/checkin", { bookingId, seatNumber });
      const booking = selectedFlight.bookings.find((item) => item.id === bookingId);
      if (booking) {
        setPrintPreview(await api.post<PrintPreview>("/printing/preview", { type: "boarding-pass", payload: { passenger: `${booking.passenger.firstName} ${booking.passenger.lastName}`, flightNumber: selectedFlight.flightNumber, origin: selectedFlight.origin.code, destination: selectedFlight.destination.code, date: formatDateTime(selectedFlight.scheduledAt), gate: selectedFlight.gate?.code ?? "TBD", seat: seatNumber, cabinClass: booking.cabinClass, locator: booking.locator } }));
      }
      await loadCore();
      setSeatMap(await api.get<SeatMapResponse>(`/seats/${selectedFlight.id}`));
      setStatusMessage(`CHECK-IN COMPLETED FOR ${bookingId}`);
    } catch (checkinError) {
      setError(checkinError instanceof Error ? checkinError.message : "Check-in no disponible.");
    }
  }

  async function addBag(passengerId: string) {
    if (!selectedFlight) return;
    try {
      const result = await api.post<{ printPreview: PrintPreview }>("/baggage", { passengerId, flightId: selectedFlight.id, pieces: 1, totalWeightKg: 26 });
      setPrintPreview(result.printPreview);
      setStatusMessage("BAGGAGE RECEIPT GENERATED");
    } catch (bagError) {
      setError(bagError instanceof Error ? bagError.message : "No se pudo facturar equipaje.");
    }
  }

  async function boardPassenger(bookingId: string) {
    try {
      await api.post("/boarding", { bookingId });
      await loadCore();
      setStatusMessage(`BOARDING REGISTERED FOR ${bookingId}`);
    } catch (boardingError) {
      setError(boardingError instanceof Error ? boardingError.message : "Embarque bloqueado.");
    }
  }

  async function createUpgrade(bookingId: string) {
    try {
      await api.post("/upgrades", { bookingId, toClass: "BUSINESS", newSeat: "3C", reason: "OVERSALE PRIORITY REALLOCATION", price: 0 });
      setUpgrades(await api.get<Upgrade[]>("/upgrades"));
      setStatusMessage("UPGRADE PROCESSED");
    } catch (upgradeError) {
      setError(upgradeError instanceof Error ? upgradeError.message : "Upgrade no disponible.");
    }
  }

  const filteredPassengers = passengers.filter((passenger) => !search || `${passenger.firstName} ${passenger.lastName} ${passenger.documentNumber}`.toLowerCase().includes(search.toLowerCase()));

  if (view !== "portal") {
    return (
      <div className="public-site">
        <header className="public-header">
          <div className="public-brand">
            <img src="/branding/skybridge-logo.svg" alt="SkyBridge Atlantic" className="public-logo" />
            <div>
              <div className="public-brand-name">{publicSite?.airline.commercialName ?? "SkyBridge Atlantic"}</div>
              <div className="public-brand-sub">Aerolinea y operaciones aeroportuarias internacionales</div>
            </div>
          </div>
          <nav className="public-nav">
            <a href="#inicio">Inicio</a>
            <a href="#vuelos">Vuelos</a>
            <a href="#informacion">Informacion</a>
            <a href="#servicios">Servicios</a>
            <a href="#contacto">Contacto</a>
            <button className="employee-access-button" onClick={() => navigate("employee-access", "/employee-access")}>Acceso empleados</button>
          </nav>
        </header>

        <section id="inicio" className="hero">
          <div className="hero-copy">
            <span className="hero-kicker">Corporate Airline Operations</span>
            <h1>Infraestructura digital para aerolinea, pasajeros y control aeroportuario.</h1>
            <p>Portal publico para pasajeros y visitantes, con acceso privado para personal autorizado, gestion operativa, check-in, equipaje y supervision de vuelos.</p>
            <div className="hero-actions">
              <a className="primary-link" href="#vuelos">Consultar vuelos</a>
              <button className="secondary-link" onClick={() => navigate("employee-access", "/employee-access")}>Acceso personal</button>
            </div>
          </div>
          <div className="hero-card">
            <div className="hero-card-title">Estado operativo</div>
            <div className="hero-stat"><strong>{publicSite?.featuredFlights.length ?? 0}</strong><span>Vuelos destacados</span></div>
            <div className="hero-stat"><strong>{publicSite?.airports.length ?? 3}</strong><span>Aeropuertos servidos</span></div>
            <div className="hero-stat"><strong>24/7</strong><span>Centro de control</span></div>
          </div>
        </section>

        <section id="vuelos" className="public-section">
          <div className="section-heading">
            <span>Vuelos</span>
            <h2>Salidas y operaciones destacadas</h2>
          </div>
          <div className="flight-card-grid">
            {publicSite?.featuredFlights.map((flight) => (
              <article key={flight.id} className="flight-card">
                <div className="flight-card-top">
                  <strong>{flight.flightNumber}</strong>
                  <span>{flight.status}</span>
                </div>
                <div className="flight-route">{flight.route}</div>
                <div className="flight-city-row">
                  <span>{flight.originCity}</span>
                  <span>{flight.destinationCity}</span>
                </div>
                <div className="flight-time">{formatDateTime(flight.scheduledAt)}</div>
              </article>
            ))}
          </div>
        </section>

        <section id="informacion" className="public-section split-section">
          <div>
            <div className="section-heading">
              <span>Informacion</span>
              <h2>Aerolinea y red aeroportuaria</h2>
            </div>
            <p>SkyBridge Atlantic combina operacion comercial, control de flota, trazabilidad de pasajeros y coordinacion de aeropuerto en una plataforma unificada preparada para despliegue en internet.</p>
          </div>
          <div className="info-list">
            {publicSite?.airports.map((airport) => (
              <div key={airport.code} className="info-card">
                <strong>{airport.code}</strong>
                <span>{airport.name}</span>
                <small>{airport.city}, {airport.country}</small>
              </div>
            ))}
          </div>
        </section>

        <section id="servicios" className="public-section">
          <div className="section-heading">
            <span>Servicios</span>
            <h2>Servicios para pasajeros y personal operativo</h2>
          </div>
          <div className="service-grid">
            {publicSite?.services.map((service) => (
              <article key={service.title} className="service-card">
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="contacto" className="public-section contact-section">
          <div className="section-heading">
            <span>Contacto</span>
            <h2>Atencion e informacion corporativa</h2>
          </div>
          <div className="contact-grid">
            <div className="contact-card"><strong>Atencion al pasajero</strong><span>support@aeropuertohaider.com</span></div>
            <div className="contact-card"><strong>Centro de operaciones</strong><span>ops@aeropuertohaider.com</span></div>
            <div className="contact-card"><strong>Dominio previsto</strong><span>https://aeropuertohaider.com</span></div>
          </div>
        </section>

        <footer className="public-footer">
          <span>{publicSite?.airline.commercialName ?? "SkyBridge Atlantic"}</span>
          <button className="footer-access" onClick={() => navigate("employee-access", "/employee-access")}>Acceso empleados</button>
        </footer>

        {view === "employee-access" && (
          <div className="employee-overlay">
            <div className="employee-dialog">
              <div className="employee-dialog-top">
                <h2>Acceso empleados</h2>
                <button onClick={() => navigate("public", "/")}>Cerrar</button>
              </div>
              <p>Acceso privado para personal de aerolinea, aeropuerto, supervisores y operaciones.</p>
              <label>Usuario</label>
              <input value={loginForm.username} onChange={(event) => setLoginForm({ ...loginForm, username: event.target.value })} />
              <label>Contrasena</label>
              <input type="password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} />
              <label>Puesto / terminal</label>
              <input value={loginForm.terminalId} onChange={(event) => setLoginForm({ ...loginForm, terminalId: event.target.value })} />
              <div className="employee-actions">
                <button onClick={login}>Entrar</button>
              </div>
              {error && <div className="alert-box modern">{error}</div>}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="desktop" style={{ ["--accent" as string]: airline?.colorPrimary ?? "#163455", ["--paper" as string]: airline?.colorAccent ?? "#d6d1c4" }}>
      <div className="top-frame">
        <div className="title-bar">SKYBRIDGE OPS / {airline?.commercialName.toUpperCase()} / {labels[screen]}</div>
        <div className="menu-bar">File | Operations | Airline | Fleet | Print | Security | Audit | Window | Help</div>
        <div className="status-strip">
          <span>USER: {user?.fullName.toUpperCase()}</span>
          <span>ROLE: {user?.role}</span>
          <span>TERMINAL: {user?.terminalId}</span>
          <span>STATUS: {statusMessage}</span>
          <button className="logout-button" onClick={() => { setUser(null); navigate("public", "/"); }}>PUBLIC SITE</button>
        </div>
      </div>

      <div className="workspace">
        <aside className="sidebar">
          <div className="brand-box">
            <img src="/branding/skybridge-logo.svg" alt="SkyBridge" className="sidebar-logo" />
            <div className="brand-title small">{airline?.commercialName}</div>
            <div className="brand-subtitle">{airline?.iataCode} / {airline?.icaoCode}</div>
          </div>
          {allowedScreens.map((item) => <button key={item} className={screen === item ? "nav-button active" : "nav-button"} onClick={() => setScreen(item)}>{labels[item]}</button>)}
        </aside>

        <main className="main-panel">
          {error && <div className="alert-box">{error}</div>}
          {screen === "dashboard" && dashboard && <div className="module-grid"><Window title="OPERATIVE INDICATORS"><div className="kpi-grid">{Object.entries(dashboard.summary).map(([key, value]) => <div key={key} className="kpi-card"><div className="kpi-label">{key.toUpperCase()}</div><div className="kpi-value">{value}</div></div>)}</div></Window><Window title="TODAY FLIGHT OCCUPANCY"><DenseTable columns={["FLT", "GATE", "STATUS", "LOAD"]} rows={dashboard.occupancyByFlight.map((flight) => [flight.flightNumber, flight.gate, flight.status, flight.occupancy])} /></Window><Window title="INCIDENT REGISTER"><DenseTable columns={["TYPE", "SEVERITY", "DESCRIPTION"]} rows={dashboard.incidents.map((incident) => [incident.type, incident.severity, incident.description])} /></Window><Window title="OPS MESSAGES"><ul className="message-list">{dashboard.notifications.map((note) => <li key={note}>{note}</li>)}</ul></Window></div>}
          {screen === "flights" && <div className="module-grid flights-grid"><Window title="FLIGHT MASTER LIST"><DenseTable columns={["FLT", "ROUTE", "STD", "ETD", "STATUS", "GATE", "A/C", "PAX"]} rows={flights.map((flight) => [flight.flightNumber, `${flight.origin.code}-${flight.destination.code}`, formatDateTime(flight.scheduledAt), formatDateTime(flight.estimatedAt), flight.status, flight.gate?.code ?? "TBD", flight.aircraft?.registration ?? "UNASSIGNED", `${flight.passengerCount}/${flight.occupancyLimit}`])} /></Window>{selectedFlight && <><Window title={`SEAT MAP / ${selectedFlight.flightNumber}`}>{seatMap && <SeatMapView seatMap={seatMap} onSeatSelect={(seatNumber) => { const booking = selectedFlight.bookings.find((item) => !item.seatNumber); if (booking) assignSeat(booking.id, seatNumber); }} />}</Window><Window title="BOOKING FLOW MONITOR"><DenseTable columns={["LOC", "PAX", "CLASS", "SEAT", "STATUS", "ACTION"]} rows={selectedFlight.bookings.map((booking) => [booking.locator, `${booking.passenger.firstName} ${booking.passenger.lastName}`, booking.cabinClass, booking.seatNumber ?? "UNASSIGNED", booking.ticketStatus, booking.seatNumber ? "READY" : "ASSIGN"])} /></Window></>}</div>}
          {screen === "passengers" && <div className="module-grid"><Window title="PASSENGER SEARCH"><div className="toolbar"><label>FILTER</label><input value={search} onChange={(event) => setSearch(event.target.value)} /></div><DenseTable columns={["NAME", "DOC", "NAT", "LATEST BOOKING", "BAGS", "NOTES"]} rows={filteredPassengers.map((passenger) => [`${passenger.firstName} ${passenger.lastName}`, passenger.documentNumber, passenger.nationality, passenger.bookings[0]?.locator ?? "NONE", String(passenger.baggageItems.length), passenger.operationalNotes ?? ""])} /></Window></div>}
          {screen === "checkin" && selectedFlight && <div className="module-grid flights-grid"><Window title={`CHECK-IN DESK / ${selectedFlight.flightNumber}`}><DenseTable columns={["LOC", "PAX", "DOC", "SEAT", "STATUS", "TASKS"]} rows={selectedFlight.bookings.map((booking) => [booking.locator, `${booking.passenger.firstName} ${booking.passenger.lastName}`, booking.passenger.documentNumber, booking.seatNumber ?? "REQ", booking.ticketStatus, "CHK-IN / BAG / PRINT"])} /><div className="action-row">{selectedFlight.bookings.map((booking) => <button key={booking.id} onClick={() => performCheckin(booking.id, booking.seatNumber ?? "9A")}>CHECK-IN {booking.locator}</button>)}</div><div className="action-row">{selectedFlight.bookings.map((booking) => <button key={booking.passenger.documentNumber} className="secondary" onClick={() => { const passenger = passengers.find((item) => item.documentNumber === booking.passenger.documentNumber); if (passenger) addBag(passenger.id); }}>BAG {booking.locator}</button>)}</div></Window><Window title="LIVE SEAT MAP">{seatMap && <SeatMapView seatMap={seatMap} onSeatSelect={(seatNumber) => { const pending = selectedFlight.bookings.find((booking) => !booking.seatNumber); if (pending) assignSeat(pending.id, seatNumber); }} />}</Window><Window title="THERMAL PRINT PREVIEW"><PrintPreviewPanel preview={printPreview} /></Window></div>}
          {screen === "boarding" && selectedFlight && <div className="module-grid"><Window title={`GATE CONTROL / ${selectedFlight.flightNumber}`}><DenseTable columns={["LOC", "PAX", "STATUS", "SEAT", "BOARD"]} rows={selectedFlight.bookings.map((booking) => [booking.locator, `${booking.passenger.firstName} ${booking.passenger.lastName}`, booking.ticketStatus, booking.seatNumber ?? "UNASSIGNED", booking.ticketStatus === "CHECKED_IN" ? "ALLOW" : "BLOCK"])} /><div className="action-row">{selectedFlight.bookings.map((booking) => <button key={booking.id} onClick={() => boardPassenger(booking.id)}>BOARD {booking.locator}</button>)}</div></Window></div>}
          {screen === "upgrades" && <div className="module-grid"><Window title="UPGRADES / OVERBOOKING HANDLER"><DenseTable columns={["LOC", "PAX", "FLT", "FROM", "TO", "SEAT", "REASON", "AGENT"]} rows={upgrades.map((upgrade) => [upgrade.booking.locator, `${upgrade.booking.passenger.firstName} ${upgrade.booking.passenger.lastName}`, upgrade.booking.flight.flightNumber, upgrade.fromClass, upgrade.toClass, upgrade.newSeat ?? "-", upgrade.reason, upgrade.employee.fullName])} />{flights[0] && <div className="action-row">{flights[0].bookings.map((booking) => <button key={booking.id} onClick={() => createUpgrade(booking.id)}>UPGRADE {booking.locator}</button>)}</div>}</Window></div>}
          {screen === "fleet" && <div className="module-grid"><Window title="AIRCRAFT REGISTRY"><DenseTable columns={["REG", "MODEL", "MAKER", "CAP", "STATUS", "ASSIGNED FLIGHTS"]} rows={fleet.map((item) => [item.registration, item.model, item.manufacturer, String(item.seatCapacity), item.status, item.flights.map((flight) => flight.flightNumber).join(", ")])} /></Window>{fleet[0] && <Window title={`CABIN CONFIG / ${fleet[0].registration}`}><pre className="config-json">{JSON.stringify(JSON.parse(fleet[0].cabinConfigJson), null, 2)}</pre></Window>}</div>}
          {screen === "audit" && <div className="module-grid"><Window title="EMPLOYEE AUDIT TRAIL"><DenseTable columns={["DATE", "EMPLOYEE", "ACTION", "ENTITY", "TERMINAL"]} rows={audit.map((item) => [formatDateTime(item.createdAt), item.user.employee?.fullName ?? "UNKNOWN", item.action, item.entityType, item.terminalId])} /></Window></div>}
          {screen === "settings" && settings && <div className="module-grid"><Window title="AIRLINE BRANDING / SETTINGS"><div className="settings-grid"><div><strong>Name:</strong> {settings.airline.commercialName}</div><div><strong>IATA:</strong> {settings.airline.iataCode}</div><div><strong>ICAO:</strong> {settings.airline.icaoCode}</div><div><strong>Ticket Prefix:</strong> {settings.airline.ticketPrefix}</div><div><strong>Baggage:</strong> {settings.airline.baggagePolicy}</div><div><strong>Upgrade:</strong> {settings.airline.upgradePolicy}</div></div></Window><Window title="PRINTER PROFILES"><DenseTable columns={["TERMINAL", "PRINTER", "DRIVER", "WIDTH"]} rows={settings.printerProfiles.map((profile) => [profile.terminalName, profile.printerName, profile.driverType, `${profile.paperWidth} mm`])} /></Window></div>}
        </main>
      </div>
    </div>
  );
}

function Window({ title, children }: { title: string; children: ReactNode }) {
  return <section className="window"><div className="window-title">{title}</div><div className="panel-content">{children}</div></section>;
}

function DenseTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return <table className="dense-table"><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.join("-")}-${index}`}>{row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody></table>;
}

function SeatMapView({ seatMap, onSeatSelect }: { seatMap: SeatMapResponse; onSeatSelect: (seatNumber: string) => void }) {
  return <div className="seat-map"><div className="seat-map-header"><div>{seatMap.aircraft?.registration}</div><div>{seatMap.aircraft?.model}</div></div><div className="seat-legend"><span className="legend free">FREE</span><span className="legend occupied">OCCUPIED</span><span className="legend exit">EXIT</span></div><div className="seat-grid">{groupSeats(seatMap.seatAssignments).map(([row, seats]) => <div key={row} className="seat-row"><div className="row-label">{row}</div>{seats.map((seat) => <button key={seat.id} className={`seat ${seat.state.toLowerCase()}`} onClick={() => onSeatSelect(seat.seatNumber)} disabled={seat.state === "OCCUPIED" || seat.state === "BLOCKED" || seat.state === "CREW"}>{seat.seatNumber}</button>)}</div>)}</div></div>;
}

function PrintPreviewPanel({ preview }: { preview: PrintPreview | null }) {
  return <div className="print-preview"><div className="print-preview-box"><pre>{preview?.escpos ?? "NO PRINT JOB GENERATED"}</pre></div></div>;
}

export default App;
