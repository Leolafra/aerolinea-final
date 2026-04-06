import { Router } from "express";
import { requireRole } from "../../middleware/auth.js";
import { store } from "../../lib/store.js";

export const auditRouter = Router();

auditRouter.get("/", requireRole("ADMIN_GENERAL", "ADMIN", "SUPERVISOR_AEROPUERTO", "SUPERVISOR", "SEGURIDAD_AUDITORIA"), async (_req, res) => {
  res.json(store.getAudit());
});
