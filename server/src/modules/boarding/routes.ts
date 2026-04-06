import { Router } from "express";
import { requireRole } from "../../middleware/auth.js";
import { recordAudit } from "../../lib/audit.js";
import { store } from "../../lib/store.js";

export const boardingRouter = Router();

boardingRouter.post("/", requireRole("ADMIN", "GATE_AGENT", "SUPERVISOR"), async (req, res) => {
  const { bookingId, manualOverride = false } = req.body as {
    bookingId: string;
    manualOverride?: boolean;
  };

  const result = await store.board(bookingId, req.session.user!.employeeId, manualOverride);
  if ("error" in result) {
    return res.status(result.error === "Reserva no encontrada." ? 404 : 400).json({ message: result.error });
  }
  await recordAudit(req, "BOARDING_COMPLETED", "Boarding", result.boarding.id, null, result.boarding);
  res.json(result.boarding);
});
