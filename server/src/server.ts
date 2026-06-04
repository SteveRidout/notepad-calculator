import express from "express";
import cookieSession from "cookie-session";
import passport from "passport";
import path from "path";
import { URL } from "url";

import { auth } from "./baseLib/auth";
import { rateLimit } from "./baseLib/rateLimit";
import apiRouter from "./routes/api";
import authRouter from "./routes/auth";
import passwordResetRouter from "./routes/passwordReset";

console.log("process.env.NODE_ENV: ", process.env.NODE_ENV);
console.log("process.env.HOST: ", process.env.HOST);

const app = express();

const isProduction = process.env.NODE_ENV === "production";
const sessionKeys = process.env.SESSION_KEYS?.split(",")
  .map((key) => key.trim())
  .filter((key) => key.length > 0);

if (isProduction && (sessionKeys === undefined || sessionKeys.length === 0)) {
  throw Error("SESSION_KEYS must be set in production");
}

const getAllowedOrigin = () => {
  if (!process.env.HOST) {
    return undefined;
  }

  try {
    return new URL(process.env.HOST).origin;
  } catch {
    throw Error("HOST must be a valid URL");
  }
};

const allowedOrigin = getAllowedOrigin();
const safeMethods = ["GET", "HEAD", "OPTIONS"];

const securityHeaders: express.RequestHandler = (_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data:",
      "connect-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
    ].join("; "),
  );

  if (isProduction) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000");
  }

  next();
};

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  maxRequests: 30,
  keyPrefix: "auth",
});

const apiWriteIpRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000,
  maxRequests: 600,
  keyPrefix: "api-write-ip",
  skip: (req) => safeMethods.includes(req.method),
});

const apiWriteUserRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000,
  maxRequests: 300,
  keyPrefix: "api-write-user",
  key: (req) => req.user?.id?.toString() ?? req.ip ?? "unknown",
  skip: (req) => safeMethods.includes(req.method),
});

const rejectCrossSiteMutations: express.RequestHandler = (req, res, next) => {
  if (safeMethods.includes(req.method)) {
    return next();
  }

  if (req.get("sec-fetch-site") === "cross-site") {
    res.status(403).send("Cross-site request rejected");
    return;
  }

  const origin = req.get("origin");
  if (
    origin !== undefined &&
    allowedOrigin !== undefined &&
    origin !== allowedOrigin
  ) {
    res.status(403).send("Cross-origin request rejected");
    return;
  }

  next();
};

app.set("trust proxy", 1);

// Set up OAuth 2.0 authentication through the passport.js library.
auth();

const isAuthenticated: express.RequestHandler = (req, res, next) => {
  if (req.user?.id !== undefined) {
    return next();
  }

  res.status(401).send("Not authenticated");
};

app.use(
  cookieSession({
    name: "session",
    keys: sessionKeys ?? ["local-dev-session-key"],
    maxAge: 2 * 365 * 24 * 60 * 60 * 1000, // 2 years
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
  }),
);

const slowMode = process.env.NODE_ENV === "development";

// Set up passport and session handling.
app.use(passport.initialize());
app.use(passport.session());
app.use(securityHeaders);
app.use(rejectCrossSiteMutations);

app.use("/auth", authRateLimit, authRouter);
app.use(
  "/api",
  isAuthenticated,
  apiWriteIpRateLimit,
  apiWriteUserRateLimit,
  (_req, _res, next) => {
    if (!slowMode) {
      next();
      return;
    }

    setTimeout(() => {
      next();
    }, 500);
  },
  apiRouter,
);
app.use("/passwordReset", authRateLimit, passwordResetRouter);
app.use(express.static("../web/dist/"));

const port = process.env["NODE_PORT"] ?? 4002;

app.get("*", (_req, res) => {
  res.sendFile("index.html", {
    root: path.resolve(__dirname, "../../web/dist"),
  });
});

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
