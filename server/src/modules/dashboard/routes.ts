import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { store } from "../../lib/store.js";

export const dashboardRouter = Router();

dashboardRouter.get("/", requireAuth, async (_req, res) => {
  res.json(store.getDashboard());
});
