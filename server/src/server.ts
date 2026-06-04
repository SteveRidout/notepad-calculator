import express from "express";
import cookieSession from "cookie-session";
import passport from "passport";
import path from "path";
import { URL } from "url";

import { auth } from "./baseLib/auth";
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

const rejectCrossSiteMutations: express.RequestHandler = (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  if (req.get("sec-fetch-site") === "cross-site") {
    res.status(403).send("Cross-site request rejected");
    return;
  }

  const origin = req.get("origin");
  if (origin !== undefined && allowedOrigin !== undefined && origin !== allowedOrigin) {
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
  })
);

const slowMode = process.env.NODE_ENV === "development";

// Set up passport and session handling.
app.use(passport.initialize());
app.use(passport.session());
app.use(rejectCrossSiteMutations);

app.use("/auth", authRouter);
app.use(
  "/api",
  isAuthenticated,
  (_req, _res, next) => {
    if (!slowMode) {
      next();
      return;
    }

    setTimeout(() => {
      next();
    }, 500);
  },
  apiRouter
);
app.use("/passwordReset", passwordResetRouter);
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
