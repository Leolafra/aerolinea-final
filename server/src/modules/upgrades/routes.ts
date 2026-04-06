import { Router } from "express";
import { requireRole } from "../../middleware/auth.js";
import { recordAudit } from "../../lib/audit.js";
import { store } from "../../lib/store.js";

export const upgradesRouter = Router();

upgradesRouter.get("/", requireRole("ADMIN", "SUPERVISOR", "CUSTOMER_SERVICE", "OPERATIONS"), async (_req, res) => {
  res.json(store.getUpgrades());
});

upgradesRouter.post("/", requireRole("ADMIN", "SUPERVISOR", "CUSTOMER_SERVICE", "OPERATIONS"), async (req, res) => {
  const { bookingId, toClass, newSeat, reason, price = 0 } = req.body as {
    bookingId: string;
    toClass: "BUSINESS" | "PREMIUM_ECONOMY" | "ECONOMY";
    newSeat?: string;
    reason: string;
    price?: number;
  };

  const result = await store.createUpgrade(bookingId, req.session.user!.employeeId, toClass, newSeat, reason, price);
  if ("error" in result) {
    return res.status(result.error === "Reserva no encontrada." ? 404 : 400).json({ message: result.error });
  }
  if (!("upgrade" in result)) {
    return res.status(400).json({ message: "Upgrade no disponible." });
  }
  await recordAudit(req, "UPGRADE_APPLIED", "Upgrade", result.upgrade.id, null, result.upgrade);
  res.json(result.upgrade);
});
