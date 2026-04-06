import { Router } from "express";
import { store } from "../../lib/store.js";

export const publicRouter = Router();

publicRouter.get("/site", (_req, res) => {
  res.json(store.getPublicSite());
});

publicRouter.get("/flights", (_req, res) => {
  res.json(store.getPublicSite().featuredFlights);
});
