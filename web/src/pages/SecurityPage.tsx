import { FunctionalComponent, h } from "preact";

import style from "../styles/HomePage.module.scss";

const SecurityPage: FunctionalComponent = () => {
  return (
    <div className={style["about-page-main-content"]}>
      <h2>Security Incident</h2>
      <p>
        <strong>Incident date:</strong> June 2, 2026
      </p>
      <p>
        Notepad Calculator recently had a security incident involving user
        accounts and notes. I am sorry this happened.
      </p>

      <h3>What happened?</h3>
      <p>
        A security key used by the app was accidentally included in the public
        source code. This key could allow someone to access accounts without
        knowing the account password.
      </p>
      <p>
        On June 2, 2026, an attacker used this weakness to replace notes in many
        accounts with a message containing a cryptocurrency wallet seed phrase.
        That message was a scam. Do not import or use that wallet seed phrase.
      </p>

      <h3>What information may have been affected?</h3>
      <p>
        Notes stored in Notepad Calculator accounts may have been accessed. For
        affected accounts, one note may also have been changed or erased by the
        attacker.
      </p>
      <p>
        Account passwords are stored as password hashes, not plain text.
        However, as a precaution, you should change your Notepad Calculator
        password, especially if it was short or reused on another website.
      </p>

      <h3>What has been fixed?</h3>
      <p>
        The exposed key has been replaced, old sessions have been invalidated,
        and everyone has been logged out. I have also added protections to
        reduce the risk of this kind of account access happening again.
      </p>
      <p>
        The scam message has been removed from affected notes. I am working on
        restoring original note contents from backups where possible.
      </p>

      <h3>What should I do?</h3>
      <ul>
        <li>Log in again and check your notes.</li>
        <li>
          <a href="/account">Change your Notepad Calculator password.</a>
        </li>
        <li>
          If you reused that password anywhere else, change it on those sites
          too.
        </li>
        <li>
          If your notes contained sensitive information, treat that information
          as potentially seen by someone else.
        </li>
        <li>
          Do not use any cryptocurrency wallet seed phrase that appeared in a
          note.
        </li>
      </ul>

    </div>
  );
};

export default SecurityPage;
