import { Router } from "express";
import { z } from "zod";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
import { printService } from "../../lib/print-service.js";
import { recordAudit } from "../../lib/audit.js";
import { store } from "../../lib/store.js";
import { parseBody } from "../../lib/validation.js";

export const baggageRouter = Router();

const baggageSchema = z.object({
  passengerId: z.string().uuid("Pasajero no valido."),
  flightId: z.string().uuid("Vuelo no valido."),
  pieces: z.number().int().min(1).max(6),
  totalWeightKg: z.number().positive().max(80),
});

baggageRouter.get("/", requireAuth, requirePermission("equipaje.gestionar"), async (_req, res) => {
  res.json(store.db.baggage.map((item) => ({
    ...item,
    passenger: store.db.passengers.find((passenger) => passenger.id === item.passengerId),
    flight: store.db.flights.find((flight) => flight.id === item.flightId),
  })));
});

baggageRouter.post("/", requireAuth, requirePermission("equipaje.gestionar"), async (req, res) => {
  const { passengerId, flightId, pieces, totalWeightKg } = parseBody(baggageSchema, req);

  const result = await store.addBaggage(passengerId, flightId, req.session.user!.employeeId, pieces, totalWeightKg);
  if ("error" in result) {
    return res.status(404).json({ message: result.error });
  }
  const { baggage, passenger, flight } = result;
  await store.registerPrint(req.session.user!.id, "BAGGAGE_RECEIPT", baggage.id, 1, "SIMULACION");
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
