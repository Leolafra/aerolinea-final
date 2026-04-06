import { Router } from "express";
import { requireRole } from "../../middleware/auth.js";
import { recordAudit } from "../../lib/audit.js";
import { store } from "../../lib/store.js";

export const settingsRouter = Router();

settingsRouter.get("/", requireRole("ADMIN", "SUPERVISOR"), async (_req, res) => {
  res.json(store.getSettings());
});

settingsRouter.patch("/airline", requireRole("ADMIN"), async (req, res) => {
  const airline = store.getAirline();
  const updated = await store.updateAirlineSettings(req.body);
  await recordAudit(req, "AIRLINE_SETTINGS_UPDATED", "Airline", updated.id, airline, updated);

  res.json(updated);
});
