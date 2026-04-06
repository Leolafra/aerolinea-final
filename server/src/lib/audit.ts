import type { Request } from "express";
import { store } from "./store.js";

export async function recordAudit(
  req: Request,
  action: string,
  entityType: string,
  entityId: string,
  previousData?: unknown,
  nextData?: unknown,
) {
  if (!req.session.user) {
    return;
  }
  await store.addAudit(req.session.user.id, action, entityType, entityId, req.session.user.terminalId, previousData, nextData);
}
