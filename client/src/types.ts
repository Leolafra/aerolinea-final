export type Role =
  | "ADMIN"
  | "CHECKIN_AGENT"
  | "GATE_AGENT"
  | "SUPERVISOR"
  | "OPERATIONS"
  | "FLEET_MANAGER"
  | "CUSTOMER_SERVICE";

export type SessionUser = {
  id: string;
  username: string;
  role: Role;
  employeeId: string;
  fullName: string;
  terminalId: string;
};

export type Airline = {
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
};
