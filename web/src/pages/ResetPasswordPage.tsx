import { FunctionalComponent, h } from "preact";
import { useState } from "preact/hooks";

import style from "../styles/HomePage.module.scss";
import * as api from "../api";

interface Props {
  resetCode?: string;
}

const ResetPasswordPage: FunctionalComponent<Props> = ({ resetCode }) => {
  const [username, setUsername] = useState<undefined | string>();
  const [errorMessage, setErrorMessage] = useState<undefined | string>();
  const [password1, setPassword1] = useState<string>("");
  const [password2, setPassword2] = useState<string>("");

  if (resetCode === undefined) {
    return <div>ERROR: no reset code</div>;
  }

  if (username === undefined) {
    api
      .getUsernameFromResetCode(resetCode)
      .then((username) => {
        setUsername(username);
      })
      .catch(() => {
        setErrorMessage("Reset code not valid");
      });
  }

  if (errorMessage) {
    return (
      <div className={style["main-container"]}>
        ERROR: this reset password link has expired
      </div>
    );
  }

  if (username === undefined) {
    return <div className={style["main-container"]}>Loading...</div>;
  }

  return (
    <div className={style["main-container"]}>
      <div>
        <h2>Reset password for user "{username}"</h2>
        <table className={style["reset-password-table"]}>
          <tr>
            <td>Password:</td>
            <td>
              <input
                type="password"
                placeholder="Enter password here"
                onInput={(event) => setPassword1(event.currentTarget.value)}
                value={password1}
                autoFocus={true}
              ></input>
            </td>
          </tr>
          <tr>
            <td>Repeat Password:</td>
            <td>
              <input
                type="password"
                placeholder="Repeat password here"
                onInput={(event) => setPassword2(event.currentTarget.value)}
                value={password2}
              ></input>
            </td>
          </tr>
          <tr>
            <td></td>
            <td>
              <button
                onClick={async () => {
                  if (password1.length < 6) {
                    alert("Your password must have at least 6 characters");
                    return;
                  }
                  if (password1 !== password2) {
                    alert("Your repeated password doesn't match");
                    return;
                  }
                  const { succeeded } = await api.resetPassword(
                    resetCode,
                    password1
                  );
                  if (!succeeded) {
                    alert(
                      "ERROR: Password change failed. Please try again and if it continues " +
                        "not to work, please email me at steveridout@gmail.com"
                    );
                  }
                  alert("Password changed successfully. Please login now.");
                  window.location.href = "/login";
                  return;
                }}
              >
                Submit
              </button>
            </td>
          </tr>
        </table>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
