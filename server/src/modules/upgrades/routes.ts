import { Router } from "express";
import { z } from "zod";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
import { recordAudit } from "../../lib/audit.js";
import { store } from "../../lib/store.js";
import { parseBody } from "../../lib/validation.js";

export const upgradesRouter = Router();

const upgradeSchema = z.object({
  bookingId: z.string().uuid("Reserva no valida."),
  toClass: z.enum(["BUSINESS", "PREMIUM_ECONOMY", "ECONOMY"]),
  newSeat: z.string().trim().optional(),
  reason: z.string().trim().min(5, "Debe indicar un motivo."),
  price: z.number().min(0).optional(),
});

upgradesRouter.get("/", requireAuth, requirePermission("upgrades.gestionar"), async (_req, res) => {
  res.json(store.getUpgrades());
});

upgradesRouter.post("/", requireAuth, requirePermission("upgrades.gestionar"), async (req, res) => {
  const { bookingId, toClass, newSeat, reason, price = 0 } = parseBody(upgradeSchema, req);

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
