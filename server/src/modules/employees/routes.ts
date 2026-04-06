import { Router } from "express";
import { requireRole } from "../../middleware/auth.js";
import { store } from "../../lib/store.js";

export const employeesRouter = Router();

employeesRouter.get("/", requireRole("ADMIN", "SUPERVISOR"), async (_req, res) => {
  res.json(store.getEmployees());
});
