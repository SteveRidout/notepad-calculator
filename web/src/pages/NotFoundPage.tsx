import { FunctionalComponent, h } from "preact";

import style from "../styles/HomePage.module.scss";

const NotFoundPage: FunctionalComponent = () => {
  return (
    <div className={style["about-page-main-content"]}>
      <h2>Page Not Found</h2>
      <p>
        <a href="/">Return Home</a>
      </p>
    </div>
  );
};

export default NotFoundPage;
