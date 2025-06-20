import { FunctionalComponent, h } from "preact";

import * as api from "../api";
import style from "../styles/NavBar.module.scss";
import { User } from "../../../shared/types";
import * as localSettings from "../localSettings";

interface Props {
  user: User | undefined;
  loading?: boolean;
  isMobile: boolean;
}

interface LinkProps {
  pathname: string;
  targetBlank?: boolean;
}

const Link: FunctionalComponent<LinkProps> = ({
  pathname,
  targetBlank = false,
  children,
}) => {
  return (
    <a
      className={[
        style["visible-link"],
        "/" === pathname ? style["logo"] : "",
      ].join(" ")}
      href={pathname}
      target={targetBlank ? "_blank" : ""}
    >
      {children}
    </a>
  );
};

const NavBar: FunctionalComponent<Props> = ({ loading, user, isMobile }) => {
  return (
    <div
      className={[
        style["nav-bar"],
        localSettings.darkMode() ? style["dark-mode"] : "",
      ].join(" ")}
    >
      <div className={style["nav-bar-group"]}>
        <Link pathname="/">Notepad Calculator</Link>
        {!isMobile ? <span> &nbsp; | &nbsp; </span> : null}
        {!isMobile ? <Link pathname="/about">About</Link> : null}
        {user && !isMobile ? <span> &nbsp; | &nbsp; </span> : null}
        {user && !isMobile ? (
          <Link pathname="/api/exportNotes" targetBlank={true}>
            Export
          </Link>
        ) : null}
      </div>
      {loading ? (
        <div className={style["nav-bar-group"]}>Loading...</div>
      ) : (
        <div className={style["nav-bar-group"]}>
          {user ? (
            <span style={style["nav-bar-item"]}>{user.username}</span>
          ) : (
            <a style={style["nav-bar-item"]} href="/login">
              Login
            </a>
          )}
          &nbsp; | &nbsp;
          {user ? (
            <a
              style={style["nav-bar-item"]}
              onClick={async () => {
                await api.logout();
                window.location.reload();
              }}
            >
              Logout
            </a>
          ) : (
            <a
              style={style["nav-bar-item"]}
              className={style["sign-up"]}
              href="/signUp"
            >
              Sign&nbsp;up{!isMobile ? " for free" : null}
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default NavBar;
