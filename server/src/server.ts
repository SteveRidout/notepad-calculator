import express from "express";
import cookieSession from "cookie-session";
import passport from "passport";
import path from "path";

import { auth } from "./baseLib/auth";
import apiRouter from "./routes/api";
import authRouter from "./routes/auth";
import passwordResetRouter from "./routes/passwordReset";

console.log("process.env.NODE_ENV: ", process.env.NODE_ENV);
console.log("process.env.HOST: ", process.env.HOST);

const app = express();

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
    /* cspell: disable-next-line */
    keys: ["j8ZHQy7CYQkYkNYAjUg8E7Ld"],
    maxAge: 2 * 365 * 24 * 60 * 60 * 1000, // 2 years
  })
);

const slowMode = process.env.NODE_ENV === "development";

// Set up passport and session handling.
app.use(passport.initialize());
app.use(passport.session());

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
