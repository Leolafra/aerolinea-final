import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireCustomerAuth, requirePermission } from "../../middleware/auth.js";
import { store } from "../../lib/store.js";
import { parseBody } from "../../lib/validation.js";

export const messagesRouter = Router();

const employeeMessageSchema = z.object({
  toEmployeeId: z.string().uuid("Empleado destino no valido."),
  subject: z.string().trim().min(4, "Debe indicar un asunto."),
  body: z.string().trim().min(8, "Debe indicar un mensaje."),
  priority: z.enum(["BAJA", "MEDIA", "ALTA"]).optional(),
});

messagesRouter.get("/employee", requireAuth, requirePermission("mensajeria.interna"), (req, res) => {
  res.json(store.getMessagesForEmployee(req.session.user!.employeeId));
});

messagesRouter.post("/employee", requireAuth, requirePermission("mensajeria.interna"), async (req, res) => {
  const payload = parseBody(employeeMessageSchema, req);
  const message = await store.sendInternalMessage(
    req.session.user!.employeeId,
    payload.toEmployeeId,
    payload.subject,
    payload.body,
    payload.priority ?? "MEDIA",
  );
  res.json(message);
});

messagesRouter.get("/customer", requireCustomerAuth, (req, res) => {
  res.json(store.getMessagesForCustomer(req.session.customer!.id));
});
