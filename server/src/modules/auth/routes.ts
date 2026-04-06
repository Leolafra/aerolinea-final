import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.js";
import {
  clearEmployeeAuthFailures,
  getEmployeeAuthBlock,
  registerEmployeeAuthFailure,
  validateStrongPassword,
} from "../../lib/security.js";
import { store } from "../../lib/store.js";
import { parseBody } from "../../lib/validation.js";

export const authRouter = Router();

const employeeLoginSchema = z.object({
  username: z.string().trim().min(3, "Debe indicar un usuario valido."),
  password: z.string().min(1, "Debe indicar una contrasena."),
  terminalId: z.string().trim().min(3, "Debe indicar el puesto o terminal."),
});

const passwordChangeSchema = z.object({
  currentPassword: z.string().optional(),
  nextPassword: z.string().min(12, "La nueva contrasena debe tener al menos 12 caracteres."),
});

authRouter.post("/login", async (req, res) => {
  const { username, password, terminalId } = parseBody(employeeLoginSchema, {
    body: {
      terminalId: "COUNTER-01",
      ...(req.body as Record<string, unknown>),
    },
  });
  const sourceKey = `${req.ip}:${username.toLowerCase()}`;
  const blockedMessage = getEmployeeAuthBlock(sourceKey);
  if (blockedMessage) {
    return res.status(429).json({ message: blockedMessage });
  }

  const result = await store.authenticate(username, password);
  if (!result || "error" in result) {
    registerEmployeeAuthFailure(sourceKey);
    return res.status(401).json({ message: result?.error ?? "Credenciales invalidas." });
  }
  clearEmployeeAuthFailures(sourceKey);
  const { user, employee } = result;
  await store.recordAccess(user.id, terminalId, req.ip);
  await new Promise<void>((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) {
        reject(error);
        return;
      }
      req.session.user = {
        id: user.id,
        username: user.username,
        role: user.role,
        employeeId: employee.id,
        fullName: employee.fullName,
        terminalId,
        permissions: user.permissions,
        forcePasswordChange: user.forcePasswordChange,
      };
      resolve();
    });
  });

  res.json({ user: req.session.user });
});

authRouter.post("/change-password", requireAuth, async (req, res) => {
  const { currentPassword, nextPassword } = parseBody(passwordChangeSchema, req);
  if (!validateStrongPassword(nextPassword)) {
    return res.status(400).json({ message: "La nueva contrasena debe tener al menos 12 caracteres, mayusculas, minusculas y numeros." });
  }

  const result = req.session.user?.forcePasswordChange
    ? await store.forceChangeEmployeePassword(req.session.user.id, nextPassword)
    : await store.changeEmployeePassword(req.session.user!.id, currentPassword ?? "", nextPassword);

  if ("error" in result) {
    return res.status(400).json({ message: result.error });
  }

  req.session.user = {
    ...req.session.user!,
    forcePasswordChange: false,
  };

  res.json({ ok: true });
});

authRouter.post("/logout", requireAuth, (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      res.status(500).json({ message: "No se pudo cerrar la sesion." });
      return;
    }
    res.clearCookie(process.env.SESSION_COOKIE_NAME ?? "skybridge.sid");
    res.json({ ok: true });
  });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  res.json({
    user: req.session.user,
    airline: store.getAirline(),
  });
});
