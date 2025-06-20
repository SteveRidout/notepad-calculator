import express from "express";
import passport from "passport";

import { PostUserResponse, PostUserRequest } from "../../../shared/apiTypes";

import * as auth from "../baseLib/auth";

const router = express.Router();

router.post<"/user", {}, PostUserResponse, PostUserRequest>(
  "/user",
  express.json(),
  async (req, res) => {
    const { username, password } = req.body;
    const addUserReturnValue /*: PostUserResponse*/ = await auth.addUser(
      username,
      password
    );

    switch (addUserReturnValue.type) {
      case "user-already-exists":
        res.json(addUserReturnValue);
        return;

      case "user-created":
        req.login({ id: addUserReturnValue.id }, () => {
          res.json(addUserReturnValue);
        });
        return;

      default:
        throw Error("Unexpected error");
    }
  }
);

router.post(
  "/login",
  express.json(),
  passport.authenticate("local"),
  function (_req, res) {
    res.send("Login successful");
  }
);

router.post("/logout", async (req, res) => {
  req.logout();
  res.send();
});

export default router;
