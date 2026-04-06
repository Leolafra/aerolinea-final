import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { store } from "../../lib/store.js";

export const incidentsRouter = Router();

incidentsRouter.get("/", requireAuth, (_req, res) => {
  res.json(store.db.incidents);
});
