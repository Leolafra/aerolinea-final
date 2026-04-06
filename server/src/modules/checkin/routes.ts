import { Router } from "express";
import { z } from "zod";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
import { recordAudit } from "../../lib/audit.js";
import { store } from "../../lib/store.js";
import { parseBody } from "../../lib/validation.js";

export const checkinRouter = Router();

const checkinSchema = z.object({
  bookingId: z.string().uuid("Reserva no valida."),
  seatNumber: z.string().trim().min(2, "Debe indicar un asiento."),
  documentAlert: z.string().trim().max(160).optional(),
});

checkinRouter.post("/", requireAuth, requirePermission("checkin.ejecutar"), async (req, res) => {
  const { bookingId, seatNumber, documentAlert } = parseBody(checkinSchema, req);

  const result = await store.checkin(bookingId, req.session.user!.employeeId, seatNumber, documentAlert);
  if ("error" in result) {
    return res.status(result.error === "Reserva no encontrada." ? 404 : 400).json({ message: result.error });
  }
  if (!("checkin" in result)) {
    return res.status(400).json({ message: "Operacion de check-in no valida." });
  }
  await recordAudit(req, "CHECKIN_COMPLETED", "Booking", bookingId, null, { status: "CHECKED_IN", seatNumber });
  res.json(result.checkin);
});
