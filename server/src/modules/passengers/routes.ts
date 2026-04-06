import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { store } from "../../lib/store.js";

export const passengersRouter = Router();

passengersRouter.get("/", requireAuth, async (_req, res) => {
  res.json(store.getPassengers());
});
