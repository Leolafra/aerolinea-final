import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { store } from "../../lib/store.js";

export const flightsRouter = Router();

flightsRouter.get("/", requireAuth, async (_req, res) => {
  res.json(store.getFlights());
});

flightsRouter.get("/:id", requireAuth, async (req, res) => {
  const flight = store.getFlightDetail(String(req.params.id));
  if (!flight) {
    return res.status(404).json({ message: "Vuelo no encontrado." });
  }
  res.json(flight);
});

flightsRouter.patch("/:id/status", requireRole("ADMIN_GENERAL", "ADMIN", "OPERACIONES", "OPERATIONS", "SUPERVISOR_AEROPUERTO", "SUPERVISOR_TURNO", "SUPERVISOR"), async (req, res) => {
  const flight = await store.updateFlightStatus(String(req.params.id), req.body.status, req.body.operationalNotes);
  if (!flight) {
    return res.status(404).json({ message: "Vuelo no encontrado." });
  }
  res.json(flight);
});
