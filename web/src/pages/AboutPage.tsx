import { FunctionalComponent, h } from "preact";
import { useState } from "preact/hooks";

import style from "../styles/HomePage.module.scss";
import { User } from "../../../shared/types";
import * as localSettings from "../localSettings";

interface Props {
  user: User | undefined;
}

const AboutPage: FunctionalComponent<Props> = ({ user }) => {
  const [locale, setLocale] = useState<undefined | string>(
    localSettings.locale()
  );

  return (
    <div className={style["about-page-main-content"]}>
      <h2>About Notepad Calculator</h2>
      <p>
        Notepad Calculator is an open source web app that allows you to mix
        plain text notes with calculations.
      </p>

      <p>
        I often find myself wanting to jot down some back-of-the-envelope style
        calculations for which a typical calculator is too limited, and a
        spreadsheet is overkill. Back in 2015 I heard about an iOS app called
        Soulver which looked great, but since I wasn't an iOS user at the time
        and there was no web version available, I created my own tool here using
        the <a href="https://mathjs.org/">mathjs</a> library for its math
        engine.
      </p>

      <p>
        I've used and improved it over the years, but it remains a simple tool.
      </p>

      <p>
        <a href="https://github.com/SteveRidout/notepad-calculator">
          GitHub repo link
        </a>
      </p>

      <p>
        I hope you find it useful. If you have any feedback or suggestions,
        please reach out to me at{" "}
        <a href="mailto:steveridout@gmail.com">steveridout@gmail.com</a>.
      </p>

      <p>
        Steve Ridout
        <br />
        <a href="https://steveridout.com">https://steveridout.com</a>
      </p>

      <h2>Usage</h2>

      <p>
        Type calculations in the left hand column and see the result in the
        right hand column.
      </p>

      <p>Intersperse your calculations with comments and notes.</p>

      <p>
        Spread out long calculations over multiple lines by:
        <ul>
          <li>
            Starting lines with a basic operator (<b>+</b>, <b>-</b>, <b>*</b>,
            or <b>/</b>) to carry on from the previous line.
          </li>
          <li>
            Use variables to include the result of a previous calculation.
          </li>
          <li>
            Use the special <b>ans</b> variable to refer to the previous answer.
          </li>
          <li>
            Use the special <b>above</b> variable to refer to the previous list.
          </li>
        </ul>
      </p>

      <p>
        Use functions like <b>sqrt()</b>, <b>abs()</b>, and more. (I don't have
        a comprehensive list of supported functions, but under the hood it uses{" "}
        mathjs so most of the functions listed here should work:{" "}
        <a href="https://mathjs.org/docs/reference/functions.html">
          mathjs functions
        </a>
        .)
      </p>

      <h2>FAQ</h2>
      <h3>Where are my notes stored?</h3>
      <p>
        If you are not signed in, all notes are stored locally within your
        browser using localStorage.
      </p>
      <p>
        If you have created an account and are logged in, your notes are stored
        on the server. No other user may access these notes but be aware that
        they are stored in plain-text on my database. (If you would be
        interested in encrypted notes as a premium feature, please{" "}
        <a href="mailto:steveridout@gmail.com">email me</a> to let me know since
        I would consider adding this if there was enough interest.)
      </p>

      <h2>Settings</h2>
      <p>
        <label>
          Dark Mode:{" "}
          <input
            type="checkbox"
            checked={localSettings.darkMode()}
            onClick={() => {
              localSettings.toggleDarkMode();
              window.location.reload();
            }}
          ></input>
        </label>
      </p>
      <p>
        <label>
          Locale:{" "}
          <input
            className={[
              localSettings.isLocaleValid(locale) ? "" : style["invalid"],
              style["locale-input"],
              localSettings.darkMode() ? style["dark-mode"] : "",
            ].join(" ")}
            type="text"
            onInput={(event) => {
              // Set locale within local state
              setLocale(event.currentTarget.value);
              try {
                localSettings.setLocale(event.currentTarget.value);
              } catch (_error) {}
            }}
            value={locale ?? navigator.language}
          ></input>
        </label>
        <br />
        <small>
          (This affects the formatting of numbers in the right hand column.)
        </small>
      </p>
    </div>
  );
};

export default AboutPage;
