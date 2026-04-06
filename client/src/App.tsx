import { useEffect, useMemo, useState } from "react";
import { api } from "./api";
import { DenseTable, DocumentPreviewCard, FlightDetailPanel, SectionHeading, SeatMapView, Window } from "./components/legacy-ui";
import { formatDateTime, translateAuditAction, translateCabinClass, translateFlightStatus, translateRole, translateSummaryKey, translateTicketStatus } from "./formatters";
import type {
  Airline,
  Aircraft,
  AuditLog,
  AuthResponse,
  CustomerAccountAdmin,
  CustomerArea,
  CustomerSession,
  DashboardData,
  DocumentPayload,
  EmployeeMessage,
  Flight,
  FlightDetail,
  Incident,
  Passenger,
  PrintHistory,
  PublicPayload,
  SearchFlight,
  SessionUser,
  SettingsPayload,
} from "./types";

type ViewMode = "publico" | "acceso-clientes" | "area-cliente" | "acceso-empleados" | "portal-empleado" | "pantalla-puerta";
type EmployeeScreen =
  | "dashboard"
  | "vuelos"
  | "pasajeros"
  | "checkin"
  | "embarque"
  | "equipaje"
  | "upgrades"
  | "incidencias"
  | "mensajeria"
  | "clientes"
  | "flota"
  | "auditoria"
  | "ajustes";

const labels: Record<EmployeeScreen, string> = {
  dashboard: "Panel operativo",
  vuelos: "Vuelos",
  pasajeros: "Pasajeros",
  checkin: "Check-in",
  embarque: "Embarque",
  equipaje: "Equipaje",
  upgrades: "Upgrades",
  incidencias: "Incidencias",
  mensajeria: "Mensajería",
  clientes: "Clientes",
  flota: "Flota",
  auditoria: "Auditoría",
  ajustes: "Ajustes",
};

function resolveView(pathname: string): ViewMode {
  if (pathname.startsWith("/staff")) return "portal-empleado";
  if (pathname.startsWith("/employee-access")) return "acceso-empleados";
  if (pathname.startsWith("/mi-cuenta")) return "area-cliente";
  if (pathname.startsWith("/clientes/acceso")) return "acceso-clientes";
  if (pathname.startsWith("/pantalla-puerta")) return "pantalla-puerta";
  return "publico";
}

function App() {
  const [view, setView] = useState<ViewMode>(resolveView(window.location.pathname));
  const [publicData, setPublicData] = useState<PublicPayload | null>(null);
  const [employee, setEmployee] = useState<SessionUser | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [selectedFlightId, setSelectedFlightId] = useState<string>("");
  const [flightDetail, setFlightDetail] = useState<FlightDetail | null>(null);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [messages, setMessages] = useState<EmployeeMessage[]>([]);
  const [customerArea, setCustomerArea] = useState<CustomerArea | null>(null);
  const [customerFlightSearch, setCustomerFlightSearch] = useState<SearchFlight[]>([]);
  const [customerAccounts, setCustomerAccounts] = useState<CustomerAccountAdmin[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [fleet, setFleet] = useState<Aircraft[]>([]);
  const [audit, setAudit] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<SettingsPayload | null>(null);
  const [printHistory, setPrintHistory] = useState<PrintHistory[]>([]);
  const [documentPreview, setDocumentPreview] = useState<DocumentPayload | null>(null);
  const [screen, setScreen] = useState<EmployeeScreen>("dashboard");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("Sistema listo");
  const [employeeForm, setEmployeeForm] = useState({ username: "", password: "", terminalId: "MOSTRADOR-M101" });
  const [customerLoginForm, setCustomerLoginForm] = useState({ email: "", password: "" });
  const [customerRegisterForm, setCustomerRegisterForm] = useState({ fullName: "", email: "", password: "", documentNumber: "", phone: "", nationality: "ES" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", nextPassword: "" });
  const [flightSearch, setFlightSearch] = useState({ originCode: "MAD", destinationCode: "LHR", date: new Date().toISOString().slice(0, 10) });
  const [messageForm, setMessageForm] = useState({ toEmployeeId: "", subject: "", body: "" });
  const [customerSearch, setCustomerSearch] = useState("");
  const [passengerSearch, setPassengerSearch] = useState("");

  const selectedFlight = useMemo(() => flights.find((flight) => flight.id === selectedFlightId) ?? flights[0] ?? null, [flights, selectedFlightId]);

  function go(next: ViewMode, path: string) {
    window.history.pushState({}, "", path);
    setView(next);
  }

  async function loadPublic() {
    setPublicData(await api.get<PublicPayload>("/public/site", { cacheMs: 20_000 }));
  }

  async function loadEmployeeCore() {
    const [dashboardData, flightsData, passengersData] = await Promise.all([
      api.get<DashboardData>("/dashboard", { cacheMs: 5_000 }),
      api.get<Flight[]>("/flights"),
      api.get<Passenger[]>("/passengers"),
    ]);
    setDashboard(dashboardData);
    setFlights(flightsData);
    setPassengers(passengersData);
    if (!selectedFlightId && flightsData[0]) setSelectedFlightId(flightsData[0].id);
  }

  async function loadEmployeeScreen(targetScreen: EmployeeScreen, flightId?: string) {
    if (targetScreen === "mensajeria") setMessages(await api.get<EmployeeMessage[]>("/messages/employee"));
    if (targetScreen === "clientes") setCustomerAccounts(await api.get<CustomerAccountAdmin[]>("/customers/admin"));
    if (targetScreen === "incidencias") setIncidents(await api.get<Incident[]>("/incidents"));
    if (targetScreen === "flota") setFleet(await api.get<Aircraft[]>("/fleet"));
    if (targetScreen === "auditoria") setAudit(await api.get<AuditLog[]>("/audit"));
    if (targetScreen === "ajustes") setSettings(await api.get<SettingsPayload>("/settings", { cacheMs: 5_000 }));
    if (targetScreen === "equipaje") setPrintHistory(await api.get<PrintHistory[]>("/printing/history"));
    if (["vuelos", "checkin", "embarque", "upgrades"].includes(targetScreen) && (flightId || selectedFlight?.id)) {
      setFlightDetail(await api.get<FlightDetail>(`/flights/${flightId ?? selectedFlight!.id}`));
    }
  }

  async function loadCustomerArea() {
    setCustomerArea(await api.get<CustomerArea>("/customers/me"));
  }

  useEffect(() => {
    const onPopState = () => setView(resolveView(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await loadPublic();
        if (window.location.pathname.startsWith("/staff")) {
          const session = await api.get<{ user: SessionUser; airline: Airline }>("/auth/me");
          setEmployee(session.user);
          await loadEmployeeCore();
          go("portal-empleado", "/staff");
        } else if (window.location.pathname.startsWith("/mi-cuenta")) {
          const area = await api.get<CustomerArea>("/customers/me");
          setCustomerArea(area);
          go("area-cliente", "/mi-cuenta");
        }
      } catch {
        if (window.location.pathname.startsWith("/staff")) setView("acceso-empleados");
        if (window.location.pathname.startsWith("/mi-cuenta")) setView("acceso-clientes");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (employee && selectedFlight?.id) {
      loadEmployeeScreen(screen, selectedFlight.id).catch((loadError: Error) => setError(loadError.message));
    }
  }, [screen, employee, selectedFlightId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function employeeLogin() {
    try {
      setBusy(true);
      setError("");
      const session = await api.post<AuthResponse>("/auth/login", employeeForm);
      setEmployee(session.user);
      await loadEmployeeCore();
      setStatusMessage(`Sesión abierta para ${session.user.fullName}`);
      go("portal-empleado", "/staff");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "No se pudo iniciar sesión.");
    } finally {
      setBusy(false);
    }
  }

  async function changeEmployeePassword() {
    try {
      setBusy(true);
      await api.post("/auth/change-password", passwordForm);
      setEmployee((current) => (current ? { ...current, forcePasswordChange: false } : current));
      setPasswordForm({ currentPassword: "", nextPassword: "" });
      setStatusMessage("Contraseña actualizada correctamente");
    } catch (changeError) {
      setError(changeError instanceof Error ? changeError.message : "No fue posible cambiar la contraseña.");
    } finally {
      setBusy(false);
    }
  }

  async function customerRegister() {
    try {
      setBusy(true);
      await api.post("/customers/register", customerRegisterForm);
      setStatusMessage("Cuenta de cliente creada. Ya puede iniciar sesión.");
      go("acceso-clientes", "/clientes/acceso");
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : "No se pudo registrar la cuenta.");
    } finally {
      setBusy(false);
    }
  }

  async function customerLogin() {
    try {
      setBusy(true);
      setError("");
      await api.post<{ customer: CustomerSession }>("/customers/login", customerLoginForm);
      await loadCustomerArea();
      go("area-cliente", "/mi-cuenta");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "No se pudo iniciar sesión.");
    } finally {
      setBusy(false);
    }
  }

  async function customerSearchFlights() {
    try {
      setBusy(true);
      setCustomerFlightSearch(await api.get<SearchFlight[]>(`/customers/search-flights?originCode=${flightSearch.originCode}&destinationCode=${flightSearch.destinationCode}&date=${flightSearch.date}`));
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "No se pudieron cargar los vuelos.");
    } finally {
      setBusy(false);
    }
  }

  async function customerReserve(flightId: string) {
    try {
      setBusy(true);
      await api.post("/customers/reservations", { flightId, cabinClass: "ECONOMY", baggagePieces: 1, extras: ["Asiento estándar"] });
      await loadCustomerArea();
      setStatusMessage("Reserva confirmada");
    } catch (reservationError) {
      setError(reservationError instanceof Error ? reservationError.message : "No se pudo crear la reserva.");
    } finally {
      setBusy(false);
    }
  }

  async function customerCheckin(bookingId: string) {
    try {
      setBusy(true);
      await api.post(`/customers/checkin/${bookingId}`, {});
      setDocumentPreview(await api.get<DocumentPayload>(`/documents/customer/booking/${bookingId}`));
      await loadCustomerArea();
      setStatusMessage("Check-in online completado");
    } catch (checkinError) {
      setError(checkinError instanceof Error ? checkinError.message : "No se pudo completar el check-in.");
    } finally {
      setBusy(false);
    }
  }

  async function assignSeat(bookingId: string, seatNumber: string) {
    if (!selectedFlight) return;
    try {
      setBusy(true);
      await api.post("/seats/assign", { bookingId, flightId: selectedFlight.id, seatNumber });
      await loadEmployeeCore();
      setFlightDetail(await api.get<FlightDetail>(`/flights/${selectedFlight.id}`));
      setStatusMessage(`Asiento ${seatNumber} asignado`);
    } catch (seatError) {
      setError(seatError instanceof Error ? seatError.message : "No se pudo asignar el asiento.");
    } finally {
      setBusy(false);
    }
  }

  async function performCheckin(bookingId: string, seatNumber: string) {
    try {
      setBusy(true);
      await api.post("/checkin", { bookingId, seatNumber });
      setDocumentPreview(await api.get<DocumentPayload>(`/documents/booking/${bookingId}`));
      await loadEmployeeCore();
      if (selectedFlight) setFlightDetail(await api.get<FlightDetail>(`/flights/${selectedFlight.id}`));
      setStatusMessage("Check-in completado");
    } catch (checkinError) {
      setError(checkinError instanceof Error ? checkinError.message : "No se pudo completar el check-in.");
    } finally {
      setBusy(false);
    }
  }

  async function addBag(passengerId: string) {
    if (!selectedFlight) return;
    try {
      setBusy(true);
      await api.post("/baggage", { passengerId, flightId: selectedFlight.id, pieces: 1, totalWeightKg: 25 });
      setPrintHistory(await api.get<PrintHistory[]>("/printing/history"));
      setStatusMessage("Equipaje facturado y resguardo preparado");
    } catch (bagError) {
      setError(bagError instanceof Error ? bagError.message : "No se pudo facturar el equipaje.");
    } finally {
      setBusy(false);
    }
  }

  async function boardPassenger(bookingId: string) {
    try {
      setBusy(true);
      await api.post("/boarding", { bookingId });
      await loadEmployeeCore();
      if (selectedFlight) setFlightDetail(await api.get<FlightDetail>(`/flights/${selectedFlight.id}`));
      setStatusMessage("Embarque registrado");
    } catch (boardingError) {
      setError(boardingError instanceof Error ? boardingError.message : "No se pudo registrar el embarque.");
    } finally {
      setBusy(false);
    }
  }

  async function createUpgrade(bookingId: string) {
    try {
      setBusy(true);
      await api.post("/upgrades", { bookingId, toClass: "BUSINESS", newSeat: "2A", reason: "Reubicación por sobreventa", price: 0 });
      if (selectedFlight) setFlightDetail(await api.get<FlightDetail>(`/flights/${selectedFlight.id}`));
      setStatusMessage("Upgrade procesado");
    } catch (upgradeError) {
      setError(upgradeError instanceof Error ? upgradeError.message : "No se pudo aplicar el upgrade.");
    } finally {
      setBusy(false);
    }
  }

  async function simulateTick() {
    try {
      setBusy(true);
      await api.post("/simulation/tick", {});
      await loadEmployeeCore();
      setStatusMessage("Simulación operativa actualizada");
    } catch (simulationError) {
      setError(simulationError instanceof Error ? simulationError.message : "No se pudo ejecutar la simulación.");
    } finally {
      setBusy(false);
    }
  }

  async function sendMessage() {
    try {
      setBusy(true);
      await api.post("/messages/employee", { ...messageForm, priority: "MEDIA" });
      setMessages(await api.get<EmployeeMessage[]>("/messages/employee"));
      setMessageForm({ toEmployeeId: "", subject: "", body: "" });
      setStatusMessage("Mensaje enviado");
    } catch (messageError) {
      setError(messageError instanceof Error ? messageError.message : "No se pudo enviar el mensaje.");
    } finally {
      setBusy(false);
    }
  }

  const filteredPassengers = useMemo(
    () =>
      passengers.filter((passenger) =>
        `${passenger.firstName} ${passenger.lastName} ${passenger.documentNumber}`.toLowerCase().includes(passengerSearch.toLowerCase()),
      ),
    [passengers, passengerSearch],
  );

  const filteredCustomers = useMemo(
    () =>
      customerAccounts.filter((account) => `${account.fullName} ${account.email}`.toLowerCase().includes(customerSearch.toLowerCase())),
    [customerAccounts, customerSearch],
  );

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /><p>Cargando plataforma aeroportuaria...</p></div>;
  }

  return (
    <>
      {view === "publico" || view === "acceso-clientes" || view === "acceso-empleados" ? (
        <PublicPortal
          data={publicData}
          view={view}
          error={error}
          busy={busy}
          customerLoginForm={customerLoginForm}
          setCustomerLoginForm={setCustomerLoginForm}
          customerRegisterForm={customerRegisterForm}
          setCustomerRegisterForm={setCustomerRegisterForm}
          employeeForm={employeeForm}
          setEmployeeForm={setEmployeeForm}
          onCustomerLogin={customerLogin}
          onCustomerRegister={customerRegister}
          onEmployeeLogin={employeeLogin}
          onOpenCustomer={() => go("acceso-clientes", "/clientes/acceso")}
          onOpenEmployee={() => go("acceso-empleados", "/employee-access")}
          onCloseOverlay={() => go("publico", "/")}
        />
      ) : null}

      {view === "area-cliente" && customerArea ? (
        <CustomerPortal
          area={customerArea}
          searchResults={customerFlightSearch}
          search={flightSearch}
          setSearch={setFlightSearch}
          statusMessage={statusMessage}
          busy={busy}
          documentPreview={documentPreview}
          onSearchFlights={customerSearchFlights}
          onReserve={customerReserve}
          onCheckin={customerCheckin}
          onLogout={async () => {
            await api.post("/customers/logout", {});
            setCustomerArea(null);
            go("publico", "/");
          }}
        />
      ) : null}

      {view === "portal-empleado" && employee ? (
        <EmployeePortal
          employee={employee}
          screen={screen}
          setScreen={setScreen}
          statusMessage={statusMessage}
          dashboard={dashboard}
          flights={flights}
          selectedFlight={selectedFlight}
          setSelectedFlightId={setSelectedFlightId}
          flightDetail={flightDetail}
          passengers={filteredPassengers}
          passengerSearch={passengerSearch}
          setPassengerSearch={setPassengerSearch}
          incidents={incidents}
          messages={messages}
          customerAccounts={filteredCustomers}
          customerSearch={customerSearch}
          setCustomerSearch={setCustomerSearch}
          fleet={fleet}
          audit={audit}
          settings={settings}
          printHistory={printHistory}
          documentPreview={documentPreview}
          busy={busy}
          onAssignSeat={assignSeat}
          onCheckin={performCheckin}
          onAddBag={addBag}
          onBoardPassenger={boardPassenger}
          onUpgrade={createUpgrade}
          onSimulateTick={simulateTick}
          messageForm={messageForm}
          setMessageForm={setMessageForm}
          onSendMessage={sendMessage}
          onLogout={async () => {
            await api.post("/auth/logout", {});
            setEmployee(null);
            go("publico", "/");
          }}
        />
      ) : null}

      {employee?.forcePasswordChange && view === "portal-empleado" ? (
        <div className="security-overlay">
          <div className="security-dialog">
            <h2>Cambio obligatorio de contraseña</h2>
            <p>Por seguridad, debe establecer una nueva contraseña antes de continuar. Esta regla aplica al primer acceso de todos los usuarios creados y también a Leo Lafragueta.</p>
            <label>Contraseña actual</label>
            <input type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })} />
            <label>Nueva contraseña</label>
            <input type="password" value={passwordForm.nextPassword} onChange={(event) => setPasswordForm({ ...passwordForm, nextPassword: event.target.value })} />
            <button onClick={changeEmployeePassword} disabled={busy}>Actualizar contraseña</button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function PublicPortal(props: {
  data: PublicPayload | null;
  view: ViewMode;
  error: string;
  busy: boolean;
  customerLoginForm: { email: string; password: string };
  setCustomerLoginForm: (value: { email: string; password: string }) => void;
  customerRegisterForm: { fullName: string; email: string; password: string; documentNumber: string; phone: string; nationality: string };
  setCustomerRegisterForm: (value: { fullName: string; email: string; password: string; documentNumber: string; phone: string; nationality: string }) => void;
  employeeForm: { username: string; password: string; terminalId: string };
  setEmployeeForm: (value: { username: string; password: string; terminalId: string }) => void;
  onCustomerLogin: () => void;
  onCustomerRegister: () => void;
  onEmployeeLogin: () => void;
  onOpenCustomer: () => void;
  onOpenEmployee: () => void;
  onCloseOverlay: () => void;
}) {
  const { data, view, error, busy } = props;
  return (
    <div className="public-site">
      <header className="public-header">
        <div className="public-brand">
          <img src="/branding/skybridge-logo.svg" alt="Aeropuerto Haider" className="public-logo" />
          <div>
            <div className="public-brand-name">{data?.airportName ?? "Aeropuerto Haider"}</div>
            <div className="public-brand-sub">Plataforma pública, clientes y operación aeroportuaria profesional</div>
          </div>
        </div>
        <nav className="public-nav">
          <a href="#inicio">Inicio</a>
          <a href="#vuelos">Vuelos</a>
          <a href="#destinos">Destinos</a>
          <a href="#servicios">Servicios</a>
          <a href="#noticias">Noticias</a>
          <a href="#faq">Preguntas frecuentes</a>
          <button className="secondary-link" onClick={props.onOpenCustomer}>Área privada clientes</button>
          <button className="employee-access-button" onClick={props.onOpenEmployee}>Acceso empleados</button>
        </nav>
      </header>

      <section id="inicio" className="hero">
        <div className="hero-copy">
          <span className="hero-kicker">Aeropuerto y aerolínea en una sola plataforma</span>
          <h1>Operativa pública y privada con reservas, check-in, control de vuelos y experiencia corporativa real.</h1>
          <p>El portal integra servicios al pasajero, área privada de clientes, operación de aeropuerto, control de vuelos, check-in, equipaje, mensajería interna y documentación operativa.</p>
          <div className="hero-actions">
            <button className="primary-link" onClick={props.onOpenCustomer}>Entrar como cliente</button>
            <button className="secondary-link" onClick={props.onOpenEmployee}>Entrar como empleado</button>
          </div>
        </div>
        <div className="hero-card">
          <div className="hero-card-title">Resumen del día</div>
          <div className="hero-stat"><strong>{data?.stats.vuelosHoy ?? 0}</strong><span>Vuelos programados</span></div>
          <div className="hero-stat"><strong>{data?.stats.aerolineasActivas ?? 0}</strong><span>Aerolíneas activas</span></div>
          <div className="hero-stat"><strong>{data?.stats.puertasOperativas ?? 0}</strong><span>Puertas operativas</span></div>
        </div>
      </section>

      <section className="public-section notice-strip">
        {data?.notices.map((notice) => <div key={notice.id} className={`notice-chip ${notice.severity.toLowerCase()}`}>{notice.severity}: {notice.title}</div>)}
      </section>

      <section id="vuelos" className="public-section">
        <SectionHeading eyebrow="Estado de vuelos" title="Salidas destacadas y operativa visible al pasajero" />
          <div className="flight-card-grid">
          {data?.featuredFlights.map((flight) => (
            <article key={flight.id} className="flight-card">
              <div className="flight-card-top"><strong>{flight.flightNumber}</strong><span>{translateFlightStatus(flight.status)}</span></div>
              <div className="flight-route">{flight.route}</div>
              <div className="flight-city-row"><span>{flight.originCity}</span><span>{flight.destinationCity}</span></div>
              <div className="flight-time">{formatDateTime(flight.scheduledAt)}</div>
              <div className="flight-meta">Terminal {flight.terminal ?? "Pendiente"} · Puerta {flight.gate ?? "Pendiente"}</div>
            </article>
          ))}
        </div>
      </section>

      <section id="destinos" className="public-section split-section">
        <div>
          <SectionHeading eyebrow="Destinos" title="Red de rutas y aerolíneas activas" />
          <p>La plataforma actual soporta multi-aerolínea, estaciones por terminal, rutas regionales e internacionales y una operativa unificada para cliente y personal interno.</p>
        </div>
        <div className="info-list">
          {data?.destinations.map((airport) => (
            <div key={airport.code} className="info-card">
              <strong>{airport.code}</strong>
              <span>{airport.name}</span>
              <small>{airport.city}, {airport.country}</small>
            </div>
          ))}
        </div>
      </section>

      <section id="servicios" className="public-section">
        <SectionHeading eyebrow="Servicios" title="Servicios digitales y operativos para pasajeros y aerolíneas" />
        <div className="service-grid">
          {data?.services.map((service) => (
            <article key={service.title} className="service-card">
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="noticias" className="public-section">
        <SectionHeading eyebrow="Noticias y avisos" title="Actualidad corporativa y avisos operativos" />
        <div className="service-grid">
          {data?.news.map((news) => (
            <article key={news.id} className="service-card">
              <h3>{news.title}</h3>
              <p>{news.excerpt}</p>
              <small>{formatDateTime(news.createdAt)}</small>
            </article>
          ))}
        </div>
      </section>

      <section id="faq" className="public-section">
        <SectionHeading eyebrow="Ayuda" title="Preguntas frecuentes" />
        <div className="faq-list">
          {data?.faqs.map((faq) => (
            <div key={faq.id} className="faq-item">
              <strong>{faq.question}</strong>
              <p>{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="public-footer">
        <span>{data?.airline.commercialName ?? "SkyBridge Atlantic"} · Contacto corporativo y operación unificada</span>
        <div className="footer-links">
          <button className="secondary-link" onClick={props.onOpenCustomer}>Clientes</button>
          <button className="employee-access-button" onClick={props.onOpenEmployee}>Empleados</button>
        </div>
      </footer>

      {(view === "acceso-clientes" || view === "acceso-empleados") && (
        <div className="employee-overlay">
          <div className="employee-dialog wide">
            <div className="employee-dialog-top">
              <h2>{view === "acceso-clientes" ? "Área privada de clientes" : "Acceso privado de empleados"}</h2>
              <button onClick={props.onCloseOverlay}>Cerrar</button>
            </div>
            {view === "acceso-clientes" ? (
              <div className="auth-grid">
                <div>
                  <h3>Iniciar sesión</h3>
                  <label>Correo electrónico</label>
                  <input value={props.customerLoginForm.email} onChange={(event) => props.setCustomerLoginForm({ ...props.customerLoginForm, email: event.target.value })} />
                  <label>Contraseña</label>
                  <input type="password" value={props.customerLoginForm.password} onChange={(event) => props.setCustomerLoginForm({ ...props.customerLoginForm, password: event.target.value })} />
                  <button onClick={props.onCustomerLogin} disabled={busy}>Entrar</button>
                </div>
                <div>
                  <h3>Registro de clientes</h3>
                  <label>Nombre completo</label>
                  <input value={props.customerRegisterForm.fullName} onChange={(event) => props.setCustomerRegisterForm({ ...props.customerRegisterForm, fullName: event.target.value })} />
                  <label>Correo electrónico</label>
                  <input value={props.customerRegisterForm.email} onChange={(event) => props.setCustomerRegisterForm({ ...props.customerRegisterForm, email: event.target.value })} />
                  <label>Contraseña</label>
                  <input type="password" value={props.customerRegisterForm.password} onChange={(event) => props.setCustomerRegisterForm({ ...props.customerRegisterForm, password: event.target.value })} />
                  <label>Documento</label>
                  <input value={props.customerRegisterForm.documentNumber} onChange={(event) => props.setCustomerRegisterForm({ ...props.customerRegisterForm, documentNumber: event.target.value })} />
                  <label>Teléfono</label>
                  <input value={props.customerRegisterForm.phone} onChange={(event) => props.setCustomerRegisterForm({ ...props.customerRegisterForm, phone: event.target.value })} />
                  <button onClick={props.onCustomerRegister} disabled={busy}>Crear cuenta</button>
                </div>
              </div>
            ) : (
              <div className="employee-login-full">
                <p>Acceso reservado para personal de aeropuerto, aerolínea, supervisión, control, seguridad y backoffice. Las credenciales no se muestran en pantalla y la contraseña debe cambiarse en el primer acceso.</p>
                <label>Usuario</label>
                <input value={props.employeeForm.username} onChange={(event) => props.setEmployeeForm({ ...props.employeeForm, username: event.target.value })} />
                <label>Contraseña</label>
                <input type="password" value={props.employeeForm.password} onChange={(event) => props.setEmployeeForm({ ...props.employeeForm, password: event.target.value })} />
                <label>Puesto o terminal</label>
                <input value={props.employeeForm.terminalId} onChange={(event) => props.setEmployeeForm({ ...props.employeeForm, terminalId: event.target.value })} />
                <button onClick={props.onEmployeeLogin} disabled={busy}>Abrir sesión corporativa</button>
              </div>
            )}
            {error && <div className="alert-box modern">{error}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function CustomerPortal(props: {
  area: CustomerArea;
  searchResults: SearchFlight[];
  search: { originCode: string; destinationCode: string; date: string };
  setSearch: (value: { originCode: string; destinationCode: string; date: string }) => void;
  statusMessage: string;
  busy: boolean;
  documentPreview: DocumentPayload | null;
  onSearchFlights: () => void;
  onReserve: (flightId: string) => void;
  onCheckin: (bookingId: string) => void;
  onLogout: () => void;
}) {
  return (
    <div className="customer-shell">
      <header className="customer-header">
        <div>
          <div className="public-brand-name">Área privada de clientes</div>
          <div className="public-brand-sub">{props.area.account.fullName} · Nivel {props.area.account.loyaltyLevel}</div>
        </div>
        <div className="customer-header-actions">
          <span className="status-pill">{props.statusMessage}</span>
          <button onClick={props.onLogout}>Cerrar sesión</button>
        </div>
      </header>

      <div className="customer-grid">
        <section className="customer-card">
          <h3>Próximos vuelos</h3>
          <DenseTable columns={["Localizador", "Vuelo", "Salida", "Estado", "Acción"]} rows={props.area.upcoming.map((booking) => [booking.locator, booking.flight.flightNumber, formatDateTime(booking.flight.scheduledDeparture), translateTicketStatus(booking.ticketStatus), booking.ticketStatus === "CHECKED_IN" ? "Tarjeta lista" : "Pendiente"])} />
          <div className="action-row">
            {props.area.upcoming.map((booking) => (
              <button key={booking.id} onClick={() => props.onCheckin(booking.id)} disabled={props.busy}>
                Check-in {booking.locator}
              </button>
            ))}
          </div>
        </section>

        <section className="customer-card">
          <h3>Buscar y reservar vuelos</h3>
          <div className="search-grid">
            <input value={props.search.originCode} onChange={(event) => props.setSearch({ ...props.search, originCode: event.target.value.toUpperCase() })} placeholder="Origen" />
            <input value={props.search.destinationCode} onChange={(event) => props.setSearch({ ...props.search, destinationCode: event.target.value.toUpperCase() })} placeholder="Destino" />
            <input type="date" value={props.search.date} onChange={(event) => props.setSearch({ ...props.search, date: event.target.value })} />
            <button onClick={props.onSearchFlights}>Buscar</button>
          </div>
          <DenseTable columns={["Vuelo", "Ruta", "Salida", "Disponibles", "Precio"]} rows={props.searchResults.map((flight) => [flight.flightNumber, `${flight.origin}-${flight.destination}`, formatDateTime(flight.salida), String(flight.disponible), `${flight.precioBase} EUR`])} />
          <div className="action-row">
            {props.searchResults.slice(0, 6).map((flight) => <button key={flight.id} onClick={() => props.onReserve(flight.id)}>Reservar {flight.flightNumber}</button>)}
          </div>
        </section>

        <section className="customer-card">
          <h3>Mensajes y notificaciones</h3>
          <div className="message-stack">
            {props.area.messages.map((message) => (
              <div key={message.id} className="message-panel">
                <strong>{message.subject}</strong>
                <span>{message.body}</span>
                <small>{formatDateTime(message.createdAt)}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="customer-card">
          <h3>Tarjeta de embarque digital</h3>
          {props.documentPreview ? (
            <DocumentPreviewCard documentPreview={props.documentPreview} />
          ) : (
            <div className="empty-state">Complete el check-in online para visualizar la tarjeta de embarque con QR y código de barras.</div>
          )}
        </section>
      </div>
    </div>
  );
}

function EmployeePortal(props: {
  employee: SessionUser;
  screen: EmployeeScreen;
  setScreen: (value: EmployeeScreen) => void;
  statusMessage: string;
  dashboard: DashboardData | null;
  flights: Flight[];
  selectedFlight: Flight | null;
  setSelectedFlightId: (value: string) => void;
  flightDetail: FlightDetail | null;
  passengers: Passenger[];
  passengerSearch: string;
  setPassengerSearch: (value: string) => void;
  incidents: Incident[];
  messages: EmployeeMessage[];
  customerAccounts: CustomerAccountAdmin[];
  customerSearch: string;
  setCustomerSearch: (value: string) => void;
  fleet: Aircraft[];
  audit: AuditLog[];
  settings: SettingsPayload | null;
  printHistory: PrintHistory[];
  documentPreview: DocumentPayload | null;
  busy: boolean;
  onAssignSeat: (bookingId: string, seatNumber: string) => void;
  onCheckin: (bookingId: string, seatNumber: string) => void;
  onAddBag: (passengerId: string) => void;
  onBoardPassenger: (bookingId: string) => void;
  onUpgrade: (bookingId: string) => void;
  onSimulateTick: () => void;
  messageForm: { toEmployeeId: string; subject: string; body: string };
  setMessageForm: (value: { toEmployeeId: string; subject: string; body: string }) => void;
  onSendMessage: () => void;
  onLogout: () => void;
}) {
  const screens = useMemo<EmployeeScreen[]>(() => {
    const items: EmployeeScreen[] = ["dashboard", "vuelos", "pasajeros"];
    if (props.employee.permissions.includes("checkin.ejecutar")) items.push("checkin");
    if (props.employee.permissions.includes("embarque.gestionar")) items.push("embarque");
    if (props.employee.permissions.includes("equipaje.gestionar")) items.push("equipaje");
    if (props.employee.permissions.includes("upgrades.gestionar")) items.push("upgrades");
    items.push("incidencias", "mensajeria", "clientes");
    if (props.employee.permissions.includes("ajustes.ver")) items.push("flota", "auditoria", "ajustes");
    return items;
  }, [props.employee.permissions]);

  return (
    <div className="desktop">
      <div className="top-frame">
        <div className="title-bar">Centro operativo aeroportuario · Portal interno</div>
        <div className="menu-bar">Archivo | Operativa | Facturación | Puerta | Incidencias | Documentos | Seguridad | Ayuda</div>
        <div className="status-strip">
          <span>Usuario: {props.employee.fullName}</span>
          <span>Perfil: {props.employee.role}</span>
          <span>Puesto: {props.employee.terminalId}</span>
          <span>Estado: {props.statusMessage}</span>
          <button className="logout-button" onClick={props.onSimulateTick} disabled={props.busy}>Simulación viva</button>
          <button className="logout-button" onClick={props.onLogout}>Salir</button>
        </div>
      </div>

      <div className="workspace">
        <aside className="sidebar">
          <div className="brand-box">
            <img src="/branding/skybridge-logo.svg" alt="Operativa" className="sidebar-logo" />
            <div className="brand-title small">Operativa interna</div>
            <div className="brand-subtitle">Control de aeropuerto y aerolínea</div>
          </div>
          {screens.map((item) => (
            <button key={item} className={props.screen === item ? "nav-button active" : "nav-button"} onClick={() => props.setScreen(item)}>
              {labels[item]}
            </button>
          ))}
        </aside>

        <main className="main-panel">
          {props.screen === "dashboard" && props.dashboard && (
            <div className="module-grid">
              <Window title="KPIs operativos">
                <div className="kpi-grid">
                  {Object.entries(props.dashboard.summary).map(([key, value]) => (
                    <div key={key} className="kpi-card">
                      <div className="kpi-label">{translateSummaryKey(key)}</div>
                      <div className="kpi-value">{value}</div>
                    </div>
                  ))}
                </div>
              </Window>
              <Window title="Actividad reciente">
                <DenseTable columns={["Acción", "Hora"]} rows={(props.dashboard.actividadReciente ?? []).map((item) => [translateAuditAction(item.action), formatDateTime(item.createdAt)])} />
              </Window>
              <Window title="Ocupación y carga">
                <DenseTable columns={["Vuelo", "Puerta", "Estado", "Ocupación"]} rows={props.dashboard.occupancyByFlight.map((item) => [item.flightNumber, item.gate, translateFlightStatus(item.status), item.occupancy])} />
              </Window>
              <Window title="Alertas del sistema">
                <ul className="message-list">{props.dashboard.notifications.map((note) => <li key={note}>{note}</li>)}</ul>
              </Window>
            </div>
          )}

          {props.screen === "vuelos" && (
            <div className="module-grid flights-grid">
              <Window title="Listado de vuelos">
                <DenseTable columns={["Vuelo", "Ruta", "STD", "ETD", "Estado", "Pax", "Bags"]} rows={props.flights.map((flight) => [flight.flightNumber, `${flight.origin?.code}-${flight.destination?.code}`, formatDateTime(flight.scheduledDeparture), formatDateTime(flight.estimatedDeparture), translateFlightStatus(flight.status), String(flight.passengerCount), String(flight.baggageCount)])} />
                <div className="action-row">{props.flights.slice(0, 8).map((flight) => <button key={flight.id} onClick={() => props.setSelectedFlightId(flight.id)}>{flight.flightNumber}</button>)}</div>
              </Window>
              <Window title="Detalle del vuelo">
                {props.flightDetail ? <FlightDetailPanel flight={props.flightDetail} /> : <div className="empty-state">Seleccione un vuelo.</div>}
              </Window>
            </div>
          )}

          {props.screen === "pasajeros" && (
            <div className="module-grid">
              <Window title="Ficha de pasajeros">
                <div className="toolbar">
                  <label>Buscar</label>
                  <input value={props.passengerSearch} onChange={(event) => props.setPassengerSearch(event.target.value)} placeholder="Nombre, apellidos o documento" />
                </div>
                <DenseTable columns={["Nombre", "Documento", "Tipo", "Verificado", "Asistencia", "Reserva"]} rows={props.passengers.map((passenger) => [`${passenger.firstName} ${passenger.lastName}`, passenger.documentNumber, passenger.type, passenger.documentVerified ? "Sí" : "No", passenger.assistanceRequired ? "Sí" : "No", passenger.bookings[0]?.locator ?? "-"])} />
              </Window>
            </div>
          )}

          {props.screen === "checkin" && props.selectedFlight && (
            <div className="module-grid flights-grid">
              <Window title={`Check-in mostrador · ${props.selectedFlight.flightNumber}`}>
                <DenseTable columns={["Localizador", "Pasajero", "Asiento", "Estado", "Acción"]} rows={props.selectedFlight.bookings.map((booking) => [booking.locator, `${booking.passenger.firstName} ${booking.passenger.lastName}`, booking.seatNumber ?? "Por asignar", translateTicketStatus(booking.ticketStatus), translateTicketStatus(booking.ticketStatus)])} />
                <div className="action-row">{props.selectedFlight.bookings.slice(0, 8).map((booking) => <button key={booking.id} onClick={() => props.onCheckin(booking.id, booking.seatNumber ?? "10A")}>Facturar {booking.locator}</button>)}</div>
              </Window>
              <Window title="Mapa visual de asientos">
                {props.flightDetail ? <SeatMapView detail={props.flightDetail} onAssignSeat={props.onAssignSeat} /> : <div className="empty-state">Cargando cabina...</div>}
              </Window>
            </div>
          )}

          {props.screen === "embarque" && props.selectedFlight && (
            <div className="module-grid">
              <Window title={`Puerta de embarque · ${props.selectedFlight.flightNumber}`}>
                <DenseTable columns={["Localizador", "Pasajero", "Estado", "Grupo", "Asiento"]} rows={props.selectedFlight.bookings.map((booking) => [booking.locator, `${booking.passenger.firstName} ${booking.passenger.lastName}`, translateTicketStatus(booking.ticketStatus), "Operativo", booking.seatNumber ?? "-"])} />
                <div className="action-row">{props.selectedFlight.bookings.slice(0, 8).map((booking) => <button key={booking.id} onClick={() => props.onBoardPassenger(booking.id)}>Embarcar {booking.locator}</button>)}</div>
              </Window>
            </div>
          )}

          {props.screen === "equipaje" && (
            <div className="module-grid">
              <Window title="Impresiones y equipaje">
                {props.selectedFlight && <div className="action-row">{props.selectedFlight.bookings.slice(0, 8).map((booking) => <button key={booking.id} onClick={() => props.onAddBag(booking.passenger.id)}>Maleta {booking.locator}</button>)}</div>}
                <DenseTable columns={["Tipo", "Modo", "Copias", "Fecha", "Usuario"]} rows={props.printHistory.map((item) => [item.type, item.mode, String(item.copies), formatDateTime(item.createdAt), item.user?.username ?? "Sistema"])} />
              </Window>
              <Window title="Vista previa de documento">
                {props.documentPreview ? (
                  <DocumentPreviewCard documentPreview={props.documentPreview} />
                ) : <div className="empty-state">Genere un check-in o una reimpresión para visualizar el documento.</div>}
              </Window>
            </div>
          )}

          {props.screen === "upgrades" && props.selectedFlight && (
            <div className="module-grid">
              <Window title="Control comercial y sobreventa">
                <DenseTable columns={["Localizador", "Pasajero", "Cabina", "Estado", "Upgrade"]} rows={props.selectedFlight.bookings.map((booking) => [booking.locator, `${booking.passenger.firstName} ${booking.passenger.lastName}`, translateCabinClass(booking.cabinClass), translateTicketStatus(booking.ticketStatus), translateTicketStatus(booking.ticketStatus)])} />
                <div className="action-row">{props.selectedFlight.bookings.slice(0, 6).map((booking) => <button key={booking.id} onClick={() => props.onUpgrade(booking.id)}>Upgrade {booking.locator}</button>)}</div>
              </Window>
            </div>
          )}

          {props.screen === "incidencias" && (
            <div className="module-grid">
              <Window title="Registro de incidencias">
                <DenseTable columns={["Ámbito", "Tipo", "Prioridad", "Estado", "Descripción"]} rows={props.incidents.map((incident) => [incident.scope, incident.type, incident.severity, incident.status, incident.description])} />
              </Window>
            </div>
          )}

          {props.screen === "mensajeria" && (
            <div className="module-grid">
              <Window title="Mensajería interna">
                <DenseTable columns={["Asunto", "Prioridad", "Canal", "Fecha"]} rows={props.messages.map((message) => [message.subject, message.priority, message.channel, formatDateTime(message.createdAt)])} />
              </Window>
              <Window title="Redactar mensaje">
                <label>ID empleado destino</label>
                <input value={props.messageForm.toEmployeeId} onChange={(event) => props.setMessageForm({ ...props.messageForm, toEmployeeId: event.target.value })} />
                <label>Asunto</label>
                <input value={props.messageForm.subject} onChange={(event) => props.setMessageForm({ ...props.messageForm, subject: event.target.value })} />
                <label>Mensaje</label>
                <textarea className="editor-box" value={props.messageForm.body} onChange={(event) => props.setMessageForm({ ...props.messageForm, body: event.target.value })} />
                <button onClick={props.onSendMessage}>Enviar mensaje</button>
              </Window>
            </div>
          )}

          {props.screen === "clientes" && (
            <div className="module-grid">
              <Window title="Clientes registrados">
                <div className="toolbar">
                  <label>Buscar</label>
                  <input value={props.customerSearch} onChange={(event) => props.setCustomerSearch(event.target.value)} placeholder="Cliente o correo" />
                </div>
                <DenseTable columns={["Cliente", "Correo", "Nacionalidad", "Nivel", "Mensajes"]} rows={props.customerAccounts.map((account) => [account.fullName, account.email, account.nationality, account.profile?.loyaltyLevel ?? "BÁSICO", String(account.messagesUnread)])} />
              </Window>
            </div>
          )}

          {props.screen === "flota" && (
            <div className="module-grid">
              <Window title="Flota y cabinas">
                <DenseTable columns={["Matrícula", "Modelo", "Fabricante", "Capacidad", "Estado", "Vuelos"]} rows={props.fleet.map((item) => [item.registration, item.model, item.manufacturer, String(item.seatCapacity), item.status, item.flights.map((flight) => flight.flightNumber).join(", ")])} />
              </Window>
            </div>
          )}

          {props.screen === "auditoria" && (
            <div className="module-grid">
              <Window title="Auditoría de actividad">
                <DenseTable columns={["Fecha", "Empleado", "Acción", "Entidad", "Terminal", "Crítico"]} rows={props.audit.map((item) => [formatDateTime(item.createdAt), item.user.employee?.fullName ?? "Sistema", translateAuditAction(item.action), item.entityType, item.terminalId, item.critical ? "Sí" : "No"])} />
              </Window>
            </div>
          )}

          {props.screen === "ajustes" && props.settings && (
            <div className="module-grid">
              <Window title="Administración general">
                <DenseTable columns={["Aeropuerto", "Terminales", "Puertas", "Mostradores", "Sesiones"]} rows={[[props.settings.airports[0]?.name ?? "-", String(props.settings.terminals.length), String(props.settings.gates.length), String(props.settings.counters.length), props.settings.security.sesionesActivas.toString()]]} />
                <DenseTable columns={["Usuario", "Cargo", "Rol", "Estado", "Cambio obligatorio"]} rows={props.settings.users.map((item) => [item.fullName, item.title, translateRole(item.user.role), translateRole(item.user.status), item.user.forcePasswordChange ? "Sí" : "No"])} />
              </Window>
              <Window title="Impresoras y seguridad">
                <DenseTable columns={["Terminal", "Impresora", "Simulación"]} rows={props.settings.printerProfiles.map((item) => [item.terminalName, item.printerName, item.simulationMode ? "Sí" : "No"])} />
              </Window>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
