import { h, render } from "preact";

import style from "./styles/index.scss";
import App from "./components/App";
import * as localSettings from "./localSettings";

const rootElement = document.getElementById("root");

if (localSettings.darkMode()) {
  document.body.classList.add(style["dark-mode"]);
}

if (rootElement) {
  render(<App />, rootElement);
} else {
  console.error("No root element");
}
