import { Router } from "express";
import { requireRole } from "../../middleware/auth.js";
import { store } from "../../lib/store.js";

export const fleetRouter = Router();

fleetRouter.get("/", requireRole("ADMIN", "FLEET_MANAGER", "OPERATIONS", "SUPERVISOR"), async (_req, res) => {
  res.json(store.getFleet());
});
