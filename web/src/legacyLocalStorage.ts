/**
 * This is responsible for migrating data created with the old version of Notepad Calculator to the
 * new version
 */

const oldNoteKey = "notePadValue";

/** Returns the value of the notepad stored by the old legacy version of the webapp */
export const getValue = () => {
  return localStorage[oldNoteKey];
};

/** Clears the value of the notepad stored by the old legacy version of the webapp */
export const clear = async () => {
  localStorage.removeItem(oldNoteKey);
};
