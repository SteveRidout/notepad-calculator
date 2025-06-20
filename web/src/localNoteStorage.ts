/** This stores the notes either via browser local storage or (eventually TODO!) via the JSON API */
import { NoteStorageAPI } from "./types";
import { Note } from "../../shared/types";

/** Like Note but stores dates as integers for storing in localStorage */
interface RawNote {
  id: number;
  title: string;
  body: string;

  /** Milliseconds since epoch */
  creationTime: number;

  /** Milliseconds since epoch */
  lastModifiedTime: number;
}

const parseNote = (rawNote: RawNote): Note => ({
  id: rawNote.id,
  title: rawNote.title,
  body: rawNote.body,
  creationTime: new Date(rawNote.creationTime),
  lastModifiedTime: new Date(rawNote.creationTime),
});

/** Local storage key for the note data */
const noteKey = (id: number) => `notes/${id}`;

/** Local storage key for the ordered list of note IDs */
const noteListKey = "noteList";

/** Local storage key for the next auto-incrementing note ID */
const nextNoteIdKey = "nextNodeId";

/**
 * This is set to true if the user has made any edit to a note, used to determine whether to show
 * the "upload notes to cloud" option at sign up.
 */
const localNotesDirtyKey = "notesDirty";

/** Returns the next node ID and auto-increments the value */
const getNextNodeIdKeyAndIncrement = async () => {
  const rawId = localStorage[nextNoteIdKey];
  const id = rawId === undefined ? 0 : parseInt(rawId, 10);

  localStorage[nextNoteIdKey] = id + 1;

  return id;
};

const localNotesStorage: NoteStorageAPI = {
  getNote: async (id: number): Promise<Note | undefined> => {
    const rawData = localStorage[noteKey(id)];
    return rawData ? parseNote(JSON.parse(rawData)) : undefined;
  },

  listNoteIds: async (): Promise<number[]> => {
    const rawData = localStorage[noteListKey];
    return rawData ? JSON.parse(rawData) : [];
  },

  saveNote: async ({
    title,
    body,
  }: {
    title: string;
    body: string;
  }): Promise<Note> => {
    const currentTime = new Date().getTime();

    const rawNote: RawNote = {
      id: await getNextNodeIdKeyAndIncrement(),
      title,
      body,
      creationTime: currentTime,
      lastModifiedTime: currentTime,
    };

    localStorage[noteKey(rawNote.id)] = JSON.stringify(rawNote);
    const noteIds = await localNotesStorage.listNoteIds();
    await localNotesStorage.saveNoteIds([...(noteIds ?? []), rawNote.id]);

    localStorage[localNotesDirtyKey] = JSON.stringify(true);

    localNotesStorage.setDirty?.(true);

    return parseNote(rawNote);
  },

  saveNoteIds: async (ids: number[]) => {
    localStorage[noteListKey] = JSON.stringify(ids);
  },

  deleteNote: async (id: number) => {
    localStorage.removeItem(noteKey(id));
    const noteIds = await localNotesStorage.listNoteIds();

    await localNotesStorage.saveNoteIds(
      noteIds.filter((thisId) => thisId !== id)
    );
  },

  updateNote: async (id: number, update: { title?: string; body?: string }) => {
    const note = await localNotesStorage.getNote(id);
    if (note === undefined) {
      throw Error("Note not found");
    }
    const updatedNote: Note = {
      ...note,
      ...update,
    };

    const updatedRawNote: RawNote = {
      id,
      title: updatedNote.title,
      body: updatedNote.body,
      lastModifiedTime: new Date().getTime(),
      creationTime: updatedNote.creationTime?.getTime(),
    };

    localStorage[noteKey(id)] = JSON.stringify(updatedRawNote);

    localNotesStorage.setDirty?.(true);
  },

  setDirty: async (dirty: boolean) => {
    localStorage[localNotesDirtyKey] = JSON.stringify(dirty);
  },

  isDirty: async () => {
    const rawDirty = localStorage[localNotesDirtyKey];
    return rawDirty !== undefined && JSON.parse(rawDirty);
  },

  clear: async () => {
    localStorage.clear();
  },
};

export default localNotesStorage;
