import { Router } from "express";
import { z } from "zod";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
import { recordAudit } from "../../lib/audit.js";
import { store } from "../../lib/store.js";
import { parseBody } from "../../lib/validation.js";

export const boardingRouter = Router();

const boardingSchema = z.object({
  bookingId: z.string().uuid("Reserva no valida."),
  manualOverride: z.boolean().optional(),
});

boardingRouter.post("/", requireAuth, requirePermission("embarque.gestionar"), async (req, res) => {
  const { bookingId, manualOverride = false } = parseBody(boardingSchema, req);

  const result = await store.board(bookingId, req.session.user!.employeeId, manualOverride);
  if ("error" in result) {
    return res.status(result.error === "Reserva no encontrada." ? 404 : 400).json({ message: result.error });
  }
  await recordAudit(req, "BOARDING_COMPLETED", "Boarding", result.boarding.id, null, result.boarding);
  res.json(result.boarding);
});
