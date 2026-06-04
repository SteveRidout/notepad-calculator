import { FunctionalComponent, h } from "preact";
import { useState } from "preact/hooks";

import { PublicUser } from "../../../shared/types";
import * as api from "../api";
import style from "../styles/AccountPage.module.scss";

interface Props {
  path?: string;
  user: PublicUser;
}

const minPasswordLength = 10;

const getErrorMessage = (error: unknown): string => {
  const responseData = (error as { response?: { data?: unknown } }).response
    ?.data;

  if (typeof responseData === "string") {
    return responseData;
  }

  return "Password change failed. Please try again.";
};

const AccountPage: FunctionalComponent<Props> = ({ user }) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatedPassword, setRepeatedPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [successMessage, setSuccessMessage] = useState<string | undefined>();

  const changePassword = async () => {
    setErrorMessage(undefined);
    setSuccessMessage(undefined);

    if (newPassword.length < minPasswordLength) {
      setErrorMessage(
        `Your new password must have at least ${minPasswordLength} characters.`
      );
      return;
    }

    if (newPassword !== repeatedPassword) {
      setErrorMessage("Your repeated password doesn't match.");
      return;
    }

    setSubmitting(true);
    try {
      await api.updatePassword(oldPassword, newPassword);
      setOldPassword("");
      setNewPassword("");
      setRepeatedPassword("");
      setSuccessMessage("Password changed successfully.");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={style["account-page-main-content"]}>
      <h2>Account</h2>

      <div className={style["account-section"]}>
        <h3>User</h3>
        <table className={style["account-table"]}>
          <tr>
            <td>Username</td>
            <td>{user.username}</td>
          </tr>
        </table>
      </div>

      <div className={style["account-section"]}>
        <h3>Change Password</h3>
        <table className={style["account-table"]}>
          <tr>
            <td>
              <label for="old-password">Current password</label>
            </td>
            <td>
              <input
                id="old-password"
                type="password"
                value={oldPassword}
                onInput={(event) => {
                  setOldPassword(event.currentTarget.value);
                  setErrorMessage(undefined);
                  setSuccessMessage(undefined);
                }}
              />
            </td>
          </tr>
          <tr>
            <td>
              <label for="new-password">New password</label>
            </td>
            <td>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onInput={(event) => {
                  setNewPassword(event.currentTarget.value);
                  setErrorMessage(undefined);
                  setSuccessMessage(undefined);
                }}
              />
            </td>
          </tr>
          <tr>
            <td>
              <label for="repeated-password">Repeat new password</label>
            </td>
            <td>
              <input
                id="repeated-password"
                type="password"
                value={repeatedPassword}
                onInput={(event) => {
                  setRepeatedPassword(event.currentTarget.value);
                  setErrorMessage(undefined);
                  setSuccessMessage(undefined);
                }}
              />
            </td>
          </tr>
        </table>

        {errorMessage ? (
          <p className={style["error-message"]}>{errorMessage}</p>
        ) : null}
        {successMessage ? (
          <p className={style["success-message"]}>{successMessage}</p>
        ) : null}

        <button
          disabled={
            submitting ||
            oldPassword.length === 0 ||
            newPassword.length === 0 ||
            repeatedPassword.length === 0
          }
          onClick={changePassword}
        >
          {submitting ? "Changing Password" : "Change Password"}
        </button>
      </div>
    </div>
  );
};

export default AccountPage;
