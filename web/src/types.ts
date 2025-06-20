import * as mathjs from "mathjs";

import { Note } from "../../shared/types";

/** Interface for storing notes, to be extended by concrete local and remote implementations */
export interface NoteStorageAPI {
  getNote: (id: number) => Promise<Note | undefined>;

  saveNote: (note: { title: string; body: string }) => Promise<Note>;

  updateNote: (id: number, update: { title?: string; body?: string }) => void;

  deleteNote: (id: number) => void;

  listNoteIds: () => Promise<number[]>;

  saveNoteIds: (ids: number[]) => void;

  /** Set to true if the user has edited these notes. */
  setDirty?: (dirty: boolean) => void;

  /** Returns true if the user has edited these notes. */
  isDirty?: () => Promise<boolean>;

  clear?: () => void;
}

export type MathValue = number | mathjs.Unit;
export type Scope = { [variableName: string]: MathValue | MathValue[] | mathjs.Matrix};
