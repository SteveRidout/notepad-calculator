import { Component, h } from "preact";

import style from "../styles/AuthPage.module.scss";
import { User } from "../../../shared/types";
import * as api from "../api";
import localNoteStorage from "../localNoteStorage";
import { remoteNoteStorage } from "../api";

interface Props {
  user: User | undefined;
  type: "login" | "signUp";
}

interface State {
  username: string;
  password: string;
  migrate: boolean;

  awaitingResponse: boolean;
  errorMessage?: string;

  localNotesAreDirty: boolean;
}

const minPasswordLength = 4;

class SignUpPage extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      username: "",
      password: "",
      migrate: true,

      awaitingResponse: false,

      localNotesAreDirty: false,
    };

    this.setIsDirty();
  }

  async setIsDirty() {
    this.setState({
      ...this.state,
      localNotesAreDirty: await localNoteStorage.isDirty?.(),
    });
  }

  async migrateLocalNotesToRemote() {
    const noteIds = await localNoteStorage.listNoteIds();

    for (const noteId of noteIds) {
      const note = await localNoteStorage.getNote(noteId);
      if (!note) {
        continue;
      }

      // Save to server
      await remoteNoteStorage.saveNote({ title: note.title, body: note.body });
    }
  }

  async signUp() {
    const { username, password } = this.state;

    this.setState({ ...this.state, awaitingResponse: true });
    const response = await api.signUp(username, password);

    switch (response.type) {
      case "user-created":
        await this.migrateLocalNotesToRemote();
        await localNoteStorage.clear?.();
        this.loggedIn();
        break;

      case "user-already-exists":
        this.setState({
          ...this.state,
          awaitingResponse: false,
          errorMessage: "This username already exists",
        });
        break;
    }
  }

  async login() {
    console.log("login");
    const { username, password } = this.state;

    this.setState({ ...this.state, awaitingResponse: true });
    const success = await api.login(username, password);

    if (success) {
      this.loggedIn();
    } else {
      this.setState({
        ...this.state,
        awaitingResponse: false,
        errorMessage: "Username or password not recognized",
      });
    }
  }

  async loggedIn() {
    // Copy across notes to server if required
    if (this.state.localNotesAreDirty && this.state.migrate) {
      await this.migrateLocalNotesToRemote();
    }

    // Delete any locally stored notes
    await localNoteStorage.clear?.();

    window.location.href = "/";
  }

  isValid(): boolean {
    const { username, password } = this.state;

    switch (this.props.type) {
      case "signUp":
        return username.length >= 1 && password.length >= minPasswordLength;

      case "login":
        return username.length >= 1 && password.length >= minPasswordLength;
    }
  }

  render() {
    const { type } = this.props;
    const {
      username,
      password,
      migrate,
      errorMessage,
      localNotesAreDirty,
      awaitingResponse,
    } = this.state;

    // console.log("local note dirty:", localNotesDirty);

    return (
      <div className={style["auth-page-main-content"]}>
        <h2>{type === "signUp" ? "Sign Up" : "Login"}</h2>
        {type === "signUp" ? (
          <p>
            Sign up for free cloud syncing of your notes and edit them on any
            device!
          </p>
        ) : null}

        <div className={style["auth-form"]}>
          <table>
            <tr>
              <td>
                <label for="username">Username</label>
              </td>
              <td>
                <input
                  id="username"
                  placeholder="Type username"
                  type="text"
                  onInput={(event) => {
                    this.setState({
                      ...this.state,
                      username: event.currentTarget.value,
                      errorMessage: undefined,
                    });
                  }}
                  value={username}
                />
              </td>
            </tr>
            <tr>
              <td>
                <label for="password">Password</label>
              </td>
              <td>
                <input
                  id="password"
                  placeholder="Type password"
                  type="password"
                  onInput={(event) => {
                    this.setState({
                      ...this.state,
                      password: event.currentTarget.value,
                      errorMessage: undefined,
                    });
                  }}
                  value={password}
                />
              </td>
            </tr>
            {localNotesAreDirty ? (
              <tr>
                <td>
                  <label for="migrate">
                    Copy your current notes to the cloud?
                  </label>
                </td>
                <td>
                  <input
                    id="migrate"
                    type="checkbox"
                    onInput={(event) => {
                      console.log("checkbox input: ", event);
                      this.setState({
                        ...this.state,
                        migrate: event.currentTarget.checked,
                      });
                    }}
                    checked={migrate}
                  />
                </td>
              </tr>
            ) : null}
          </table>
          {localNotesAreDirty && !migrate ? (
            <p className={style["error-message"]}>
              WARNING: your current notes will be lost upon{" "}
              {type === "signUp" ? "sign-up" : "login"}!
            </p>
          ) : null}
          <p>
            {type === "signUp" ? (
              <button
                onClick={() => this.signUp()}
                disabled={!this.isValid() || awaitingResponse}
              >
                {awaitingResponse ? "Signing Up" : "Sign Me Up"}
              </button>
            ) : (
              <button
                onClick={() => this.login()}
                disabled={!this.isValid() || awaitingResponse}
              >
                {awaitingResponse ? "Logging In" : "Login"}
              </button>
            )}
          </p>
          {errorMessage ? (
            <p className={style["error-message"]}>{errorMessage}</p>
          ) : null}
          {type === "login" ? (
            <p>
              <small>
                Forgot password? Email me at{" "}
                <a href="mailto:steveridout@gmail.com">steveridout@gmail.com</a>
                .
              </small>
            </p>
          ) : null}
        </div>
      </div>
    );
  }
}

export default SignUpPage;
