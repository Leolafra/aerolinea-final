import type { NextFunction, Request, Response } from "express";
import type { Role } from "../lib/store.js";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user) {
    return res.status(401).json({ message: "Sesion requerida." });
  }

  next();
}

export function requireCustomerAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.customer) {
    return res.status(401).json({ message: "Sesion de cliente requerida." });
  }

  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Sesion requerida." });
    }

    if (!roles.includes(req.session.user.role)) {
      return res.status(403).json({ message: "Acceso restringido por rol." });
    }

    next();
  };
}

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Sesion requerida." });
    }
    if (!req.session.user.permissions.includes(permission)) {
      return res.status(403).json({ message: "Accion no permitida para este perfil." });
    }
    next();
  };
}
