import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { recordAudit } from "../../lib/audit.js";
import { store } from "../../lib/store.js";

export const seatsRouter = Router();

seatsRouter.get("/:flightId", requireAuth, async (req, res) => {
  const flight = store.getSeatMap(String(req.params.flightId));
  res.json(flight);
});

seatsRouter.post("/assign", requireRole("ADMIN", "CHECKIN_AGENT", "SUPERVISOR", "CUSTOMER_SERVICE"), async (req, res) => {
  const { bookingId, flightId, seatNumber } = req.body as {
    bookingId: string;
    flightId: string;
    seatNumber: string;
  };

  const result = await store.assignSeat(bookingId, flightId, seatNumber);
  if ("error" in result) {
    return res.status(400).json({ message: result.error });
  }

  await recordAudit(req, "SEAT_ASSIGNED", "SeatAssignment", result.seat.id, null, result.seat);

  res.json(result.seat);
});

seatsRouter.post("/generate/:flightId", requireRole("ADMIN", "OPERATIONS", "FLEET_MANAGER"), async (req, res) => {
  const flight = store.getSeatMap(String(req.params.flightId));
  if (!flight?.aircraft) {
    return res.status(400).json({ message: "Vuelo sin aeronave asignada." });
  }
  res.json({ created: flight.seatAssignments.length });
});
