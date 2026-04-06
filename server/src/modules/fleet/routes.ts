import { Router } from "express";
import { requireRole } from "../../middleware/auth.js";
import { store } from "../../lib/store.js";

export const fleetRouter = Router();

fleetRouter.get("/", requireRole("ADMIN_GENERAL", "ADMIN", "FLOTA", "FLEET_MANAGER", "OPERACIONES", "OPERATIONS", "SUPERVISOR_AEROPUERTO", "SUPERVISOR_TURNO", "SUPERVISOR"), async (_req, res) => {
  res.json(store.getFleet());
});
