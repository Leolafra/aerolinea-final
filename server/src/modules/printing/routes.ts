import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { printService } from "../../lib/print-service.js";
import { store } from "../../lib/store.js";

export const printingRouter = Router();

printingRouter.post("/preview", requireAuth, (req, res) => {
  const { type, payload } = req.body as {
    type: "boarding-pass" | "baggage-receipt";
    payload: Record<string, string | number>;
  };

  res.json(printService.preview(type, payload));
});

printingRouter.get("/history", requireAuth, (_req, res) => {
  res.json(store.getPrintHistory());
});
