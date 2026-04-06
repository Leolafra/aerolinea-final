import { Router } from "express";
import { requireRole } from "../../middleware/auth.js";
import { recordAudit } from "../../lib/audit.js";
import { store } from "../../lib/store.js";

export const checkinRouter = Router();

checkinRouter.post("/", requireRole("ADMIN", "CHECKIN_AGENT", "SUPERVISOR"), async (req, res) => {
  const { bookingId, seatNumber, documentAlert } = req.body as {
    bookingId: string;
    seatNumber: string;
    documentAlert?: string;
  };

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
