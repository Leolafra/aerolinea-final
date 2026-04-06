import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { store } from "../../lib/store.js";

export const simulationRouter = Router();

simulationRouter.post("/tick", requireAuth, (_req, res) => {
  res.json(store.simulateLiveTick());
});
