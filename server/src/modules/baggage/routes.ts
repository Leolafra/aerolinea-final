import { Router } from "express";
import { requireRole } from "../../middleware/auth.js";
import { printService } from "../../lib/print-service.js";
import { recordAudit } from "../../lib/audit.js";
import { store } from "../../lib/store.js";

export const baggageRouter = Router();

baggageRouter.get("/", requireRole("ADMIN", "CHECKIN_AGENT", "SUPERVISOR", "OPERATIONS"), async (_req, res) => {
  res.json(store.db.baggage.map((item) => ({
    ...item,
    passenger: store.db.passengers.find((passenger) => passenger.id === item.passengerId),
    flight: store.db.flights.find((flight) => flight.id === item.flightId),
  })));
});

baggageRouter.post("/", requireRole("ADMIN", "CHECKIN_AGENT", "SUPERVISOR"), async (req, res) => {
  const { passengerId, flightId, pieces, totalWeightKg } = req.body as {
    passengerId: string;
    flightId: string;
    pieces: number;
    totalWeightKg: number;
  };

  const result = await store.addBaggage(passengerId, flightId, req.session.user!.employeeId, pieces, totalWeightKg);
  if ("error" in result) {
    return res.status(404).json({ message: result.error });
  }
  const { baggage, passenger, flight } = result;
  await recordAudit(req, "BAGGAGE_CHECKED", "Baggage", baggage.id, null, baggage);

  res.json({
    baggage,
    printPreview: printService.preview("baggage-receipt", {
      passenger: `${passenger.firstName} ${passenger.lastName}`,
      flightNumber: flight.flightNumber,
      bagTag: baggage.bagTag,
      pieces,
      weight: totalWeightKg,
      excessFee: baggage.excessFee,
      barcode: baggage.barcode,
    }),
  });
});
