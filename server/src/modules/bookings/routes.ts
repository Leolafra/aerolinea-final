import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { store } from "../../lib/store.js";

export const bookingsRouter = Router();

bookingsRouter.get("/", requireAuth, async (_req, res) => {
  res.json(store.getBookings());
});
