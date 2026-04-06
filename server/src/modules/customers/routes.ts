import { Router } from "express";
import { z } from "zod";
import { requireCustomerAuth } from "../../middleware/auth.js";
import {
  clearCustomerAuthFailures,
  getCustomerAuthBlock,
  registerCustomerAuthFailure,
  validateStrongPassword,
} from "../../lib/security.js";
import { store } from "../../lib/store.js";
import { parseBody } from "../../lib/validation.js";

export const customersRouter = Router();

const registerSchema = z.object({
  fullName: z.string().trim().min(5, "Debe indicar el nombre completo."),
  email: z.string().trim().email("Debe indicar un correo valido."),
  password: z.string().min(12, "La contrasena debe tener al menos 12 caracteres."),
  documentNumber: z.string().trim().min(5, "Debe indicar un documento valido."),
  phone: z.string().trim().min(6, "Debe indicar un telefono valido."),
  nationality: z.string().trim().min(2, "Debe indicar una nacionalidad."),
});

const loginSchema = z.object({
  email: z.string().trim().email("Debe indicar un correo valido."),
  password: z.string().min(1, "Debe indicar una contrasena."),
});

const reservationSchema = z.object({
  flightId: z.string().uuid("Vuelo no valido."),
  cabinClass: z.enum(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS"]),
  seatNumber: z.string().trim().optional(),
  baggagePieces: z.number().int().min(0).max(4),
  extras: z.array(z.string()).max(10),
});

customersRouter.post("/register", async (req, res) => {
  const payload = parseBody(registerSchema, req);
  if (!validateStrongPassword(payload.password)) {
    return res.status(400).json({ message: "La contrasena debe tener al menos 12 caracteres, mayusculas, minusculas y numeros." });
  }
  const result = await store.registerCustomer(payload);
  if ("error" in result) {
    return res.status(400).json({ message: result.error });
  }
  res.status(201).json({ ok: true });
});

customersRouter.post("/login", async (req, res) => {
  const { email, password } = parseBody(loginSchema, req);
  const sourceKey = `${req.ip}:${email.toLowerCase()}`;
  const blockedMessage = getCustomerAuthBlock(sourceKey);
  if (blockedMessage) {
    return res.status(429).json({ message: blockedMessage });
  }
  const result = await store.authenticateCustomer(email, password);
  if ("error" in result) {
    registerCustomerAuthFailure(sourceKey);
    return res.status(401).json({ message: result.error });
  }
  clearCustomerAuthFailures(sourceKey);
  await new Promise<void>((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) {
        reject(error);
        return;
      }
      req.session.customer = {
        id: result.account.id,
        email: result.account.email,
        fullName: result.account.fullName,
      };
      resolve();
    });
  });
  res.json({ customer: req.session.customer });
});

customersRouter.post("/logout", requireCustomerAuth, (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      res.status(500).json({ message: "No se pudo cerrar la sesion." });
      return;
    }
    res.clearCookie(process.env.SESSION_COOKIE_NAME ?? "skybridge.sid");
    res.json({ ok: true });
  });
});

customersRouter.get("/me", requireCustomerAuth, (req, res) => {
  const area = store.getCustomerArea(req.session.customer!.id);
  res.json(area);
});

customersRouter.get("/search-flights", async (req, res) => {
  const { originCode, destinationCode, date, airlineId } = req.query as Record<string, string | undefined>;
  res.json(store.searchFlightsForCustomers({ originCode, destinationCode, date, airlineId }));
});

customersRouter.get("/admin", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Sesion requerida." });
  }
  res.json(store.db.customerAccounts.map((account) => ({
    ...account,
    profile: store.db.customerProfiles.find((profile) => profile.accountId === account.id),
  })));
});

customersRouter.post("/reservations", requireCustomerAuth, async (req, res) => {
  const payload = parseBody(reservationSchema, {
    body: {
      baggagePieces: 1,
      extras: [],
      ...(req.body as Record<string, unknown>),
    },
  });
  const result = await store.createReservation({
    accountId: req.session.customer!.id,
    ...payload,
  });
  if ("error" in result) {
    return res.status(400).json({ message: result.error });
  }
  res.json(result);
});

customersRouter.post("/checkin/:bookingId", requireCustomerAuth, async (req, res) => {
  const result = await store.customerCheckin(String(req.params.bookingId));
  if ("error" in result) {
    return res.status(400).json({ message: result.error });
  }
  res.json(result);
});
