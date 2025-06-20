import { FunctionalComponent, h } from "preact";

import style from "../styles/NoteList.module.scss";
import { Note } from "../../../shared/types";
import * as localSettings from "../localSettings";

export interface Props {
  noteIds: number[];
  selectedNoteId: number;
  notes: { [id: number]: Note };
  selectNote: (noteId: number) => void;
  addNote: () => void;
}

const NoteList: FunctionalComponent<Props> = ({
  noteIds,
  selectedNoteId,
  notes,
  selectNote,
  addNote,
}) => {
  return (
    <ul
      className={[
        style["note-list"],
        localSettings.darkMode() ? style["dark-mode"] : "",
      ].join(" ")}
    >
      <li>
        <a
          className={style["new-note-button"]}
          onClick={() => {
            addNote();
          }}
        >
          + New Note
        </a>
      </li>
      {noteIds.length > 0 ? <li>&nbsp;</li> : null}
      {[...noteIds].reverse().map((noteId) => (
        <li
          className={[
            noteId === selectedNoteId ? style["selected-note"] : "",
            style["note"],
          ].join(" ")}
          onClick={() => selectNote(noteId)}
        >
          {notes[noteId].title.length > 0 ? notes[noteId].title : "New Note"}
        </li>
      ))}
    </ul>
  );
};

export default NoteList;
