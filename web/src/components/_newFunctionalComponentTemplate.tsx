import { FunctionalComponent, h } from "preact";

import style from "../styles/Xxx.module.scss";

interface Props {}

const Xxx: FunctionalComponent<Props> = ({ children }) => {
  return <div class={style.whiteCard}>{children}</div>;
};

export default Xxx;
