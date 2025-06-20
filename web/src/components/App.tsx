import { Component, h } from "preact";
import { Router } from "preact-router";

import { User } from "../../../shared/types";

import AboutPage from "../pages/AboutPage";
import AuthPage from "../pages/AuthPage";
import HomePage from "../pages/HomePage";
import NotFoundPage from "../pages/NotFoundPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import Redirect from "./Redirect";
import NavBar from "./NavBar";
import * as api from "../api";
import style from "../styles/App.module.scss";
import * as config from "../config";
import * as localSettings from "../localSettings";

interface Props {}

interface State {
  user: User | undefined;
  loading: boolean;
  windowWidth: number;
}

class App extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      loading: true,
      user: undefined,
      windowWidth: window.innerWidth,
    };

    this.fetchUser();
  }

  async fetchUser() {
    let user: User | undefined;

    try {
      user = (await api.getUser()).user;
    } catch (error) {
      user = undefined;
    }

    this.setState({
      ...this.state,
      user,
      loading: false,
    });
  }

  loggedOut() {
    this.setState({ ...this.state, user: undefined });
  }

  render() {
    const { user, loading } = this.state;

    const isMobile = this.state.windowWidth <= config.maxMobileWidth;

    if (loading) {
      return (
        <div
          className={[
            style["page"],
            localSettings.darkMode() ? style["dark-mode"] : "",
          ].join(" ")}
        >
          <NavBar user={user} loading={true} isMobile={isMobile} />
        </div>
      );
    }

    if (user === undefined) {
      return (
        <div
          className={[
            style["page"],
            localSettings.darkMode() ? style["dark-mode"] : "",
          ].join(" ")}
        >
          <NavBar user={user} isMobile={isMobile} />
          <Router>
            <HomePage path="/" user={user} isMobile={isMobile} />
            <Redirect path="/notes/:noteId" to="/" />
            <AuthPage path="/login" user={user} type="login" key="login" />
            <AuthPage path="/signUp" user={user} type="signUp" key="signUp" />
            <AboutPage path="/about" user={user} />
            <NotFoundPage path="/:catchAll" />
            <ResetPasswordPage path="/resetPassword/:resetCode" />
          </Router>
        </div>
      );
    }

    return (
      <div
        className={[
          style["page"],
          localSettings.darkMode() ? style["dark-mode"] : "",
        ].join(" ")}
      >
        <NavBar user={user} isMobile={isMobile} />
        <Router>
          <HomePage path="/" user={user} isMobile={isMobile} />
          <HomePage path="/notes/:noteId" user={user} isMobile={isMobile} />
          <AuthPage path="/login" user={user} type="login" key="login" />
          <AuthPage path="/signUp" user={user} type="signUp" key="signUp" />
          <AboutPage path="/about" user={user} />
          <NotFoundPage path="/:catchAll" />
          <ResetPasswordPage path="/resetPassword/:resetCode" />
        </Router>
      </div>
    );
  }

  onWindowResize = () => {
    this.setState({ windowWidth: window.innerWidth });
  };

  componentDidMount(): void {
    window.addEventListener("resize", this.onWindowResize);
  }

  componentWillUnmount(): void {
    window.removeEventListener("resize", this.onWindowResize);
  }
}

export default App;
