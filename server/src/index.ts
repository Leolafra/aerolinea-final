import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import { apiRouter } from "./routes/index.js";
import { errorHandler } from "./middleware/error.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? process.env.CLIENT_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const isProduction = process.env.NODE_ENV === "production";

app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use((req, res, next) => {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use(
  session({
    secret: process.env.SESSION_SECRET ?? "skybridge-local-secret",
    resave: false,
    saveUninitialized: false,
    name: process.env.SESSION_COOKIE_NAME ?? "skybridge.sid",
    proxy: true,
    cookie: {
      httpOnly: true,
      sameSite: (process.env.SESSION_SAME_SITE as "lax" | "strict" | "none" | undefined) ?? (isProduction ? "none" : "lax"),
      secure: process.env.SESSION_SECURE ? process.env.SESSION_SECURE === "true" : isProduction,
      domain: process.env.AUTH_COOKIE_DOMAIN || undefined,
      maxAge: 1000 * 60 * 60 * 8,
    },
  }),
);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use((req, res, next) => {
  const user = req.session.user;
  const passwordChangeAllowed =
    req.path === "/api/auth/change-password" ||
    req.path === "/api/auth/logout" ||
    req.path === "/api/auth/me" ||
    req.path === "/health";

  if (user?.forcePasswordChange && !passwordChangeAllowed) {
    return res.status(428).json({
      message: "Debe cambiar la contrasena antes de acceder al resto del sistema.",
      code: "PASSWORD_CHANGE_REQUIRED",
    });
  }

  next();
});

app.use("/api", apiRouter);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`SkyBridge OPS API listening on ${port}`);
});
