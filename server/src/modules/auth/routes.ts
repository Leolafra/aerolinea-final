import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { store } from "../../lib/store.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const { username, password, terminalId = "COUNTER-01" } = req.body as {
    username: string;
    password: string;
    terminalId?: string;
  };

  const result = await store.authenticate(username, password);
  if (!result) {
    return res.status(401).json({ message: "Credenciales invalidas." });
  }
  const { user, employee } = result;
  await store.recordAccess(user.id, terminalId, req.ip);

  req.session.user = {
    id: user.id,
    username: user.username,
    role: user.role,
    employeeId: employee.id,
    fullName: employee.fullName,
    terminalId,
  };

  res.json({
    user: req.session.user,
  });
});

authRouter.post("/logout", requireAuth, (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  res.json({
    user: req.session.user,
    airline: store.getAirline(),
  });
});
