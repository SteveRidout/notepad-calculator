import express from "express";
import * as _ from "lodash";

import * as apiTypes from "../../../shared/apiTypes";
import * as userDAL from "../dal/userDAL";
import * as resetPasswordDAL from "../dal/resetPasswordDAL";

import * as auth from "../baseLib/auth";

const router = express.Router();

router.post<{}, {}, apiTypes.ResetPasswordRequest>(
  "/newPassword",
  express.json(),
  async (req, res) => {
    const userId = await resetPasswordDAL.getUserId(req.body.resetCode);

    if (userId === undefined) {
      res.status(404).send("Reset code not valid");
      return;
    }

    const user = await userDAL.getUser({ id: userId });
    if (!user) {
      res.status(404).send("User not found");
      return;
    }

    if (req.body.newPassword.length < 6) {
      res.status(400).send("New password is too short");
      return;
    }

    const hashedPassword = await auth.createPasswordHash(req.body.newPassword);

    await userDAL.updateHashedPassword(userId, hashedPassword);
    await resetPasswordDAL.deleteCode(req.body.resetCode);

    res.send({});
  }
);

router.get<
  "/user/:resetCode",
  { resetCode: string },
  { username: string } | string
>("/user/:resetCode", async (req, res) => {
  const userId = await resetPasswordDAL.getUserId(req.params.resetCode);

  if (userId === undefined) {
    res.status(404).send("Reset code not found");
    return;
  }

  const user = await userDAL.getUser({ id: userId });

  if (user === undefined) {
    res.status(404).send("User not found");
    return;
  }

  res.json({
    username: user?.username,
  });
});

export default router;
