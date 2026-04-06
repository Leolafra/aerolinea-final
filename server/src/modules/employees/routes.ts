import { Router } from "express";
import { requireRole } from "../../middleware/auth.js";
import { store } from "../../lib/store.js";

export const employeesRouter = Router();

employeesRouter.get("/", requireRole("ADMIN_GENERAL", "ADMIN", "SUPERVISOR_AEROPUERTO", "SUPERVISOR"), async (_req, res) => {
  res.json(store.getEmployees());
});
