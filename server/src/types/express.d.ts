import "express-session";
import type { Role } from "../lib/store.js";

declare module "express-session" {
  interface SessionData {
    user?: {
      id: string;
      username: string;
      role: Role;
      employeeId: string;
      fullName: string;
      terminalId: string;
      permissions: string[];
      forcePasswordChange: boolean;
    };
    customer?: {
      id: string;
      email: string;
      fullName: string;
    };
  }
}
