/** localStorage based settings flags */

/** Should be a locale supported as an argument to Number.prototype.toLocaleString() */
export const locale = () => localStorage["locale"];

export const isLocaleValid = (value: string | undefined) => {
  const testNumber = 0;
  try {
    // This will throw an error if value is not a valid locale:
    testNumber.toLocaleString(value);
    return true;
  } catch (_error) {
    return false;
  }
}

/** This will throw an error if @param value is not a valid locale */
export const setLocale = (value: string) => {
  if (value === "") {
    localStorage.removeItem("locale");
    return;
  }

  if (isLocaleValid(value)) {
    localStorage.setItem("locale", value);
  }
}

export const toggleDarkMode = () => {
  localStorage["darkMode"] = JSON.stringify(darkMode() ? false : true);
}

/** Should be true or false */
export const darkMode = () => {
  try {
    return JSON.parse(localStorage["darkMode"]);
  } catch {
    return false;
  }
};
