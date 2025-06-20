import { Note } from "../../../shared/types";

import { getKnex } from "../baseLib/database";

interface NoteRow {
  id: number;
  user_id: number;
  title: string;
  body: string;
  creation_time: Date;
  last_modified_time: Date;
}

const noteTableName = "note";
const noteTable = () => getKnex().table<NoteRow>(noteTableName);

interface NoteIdsRow {
  user_id: number;
  note_ids: number[];
}

const noteOrderTableName = "note_order";
const noteOrderTable = () => getKnex().table<NoteIdsRow>(noteOrderTableName);

const parseNote = (noteRow: NoteRow): Note & { userId: number } => ({
  id: noteRow.id,
  userId: noteRow.user_id,
  title: noteRow.title,
  body: noteRow.body,
  creationTime: noteRow.creation_time,
  lastModifiedTime: noteRow.last_modified_time,
});

export const getNote = async (
  userId: number,
  noteId: number
): Promise<Note | undefined> => {
  const rawNote = (
    await noteTable().select().where({
      user_id: userId,
      id: noteId,
    })
  )[0] as NoteRow | undefined;

  if (rawNote === undefined) {
    return undefined;
  }

  return parseNote(rawNote);
};

export const saveNote = async (
  userId: number,
  noteData: {
    title: string;
    body: string;
  }
): Promise<Note> => {
  const currentTime = new Date();

  const insertResult = (await noteTable()
    .insert({
      user_id: userId,
      ...noteData,
      creation_time: currentTime,
      last_modified_time: currentTime,
    })
    .returning("id")) as { id: number }[];

  const note = await getNote(userId, insertResult[0].id);

  if (note === undefined) {
    throw Error("Note not defined");
  }

  return note;
};

export const updateNote = async (
  userId: number,
  noteId: number,
  update: { title?: string; body?: string }
): Promise<Note> => {
  const currentTime = new Date();

  await noteTable()
    .update({
      ...update,
      last_modified_time: currentTime,
    })
    // Redundant fields here, but doesn't do any harm
    .where({ user_id: userId, id: noteId });

  const note = await getNote(userId, noteId);

  if (note === undefined) {
    throw Error("Note not found");
  }

  return note;
};

export const deleteNote = async (userId: number, noteId: number) => {
  await noteTable().delete().where({ user_id: userId, id: noteId });
};

export const renameNote = async (
  userId: number,
  oldTitle: string,
  newTitle: string
) => {
  await noteTable()
    .update({ title: newTitle })
    .where({ user_id: userId, title: oldTitle });
};

export const listNoteIds = async (
  userId: number
): Promise<number[] | undefined> => {
  const rawList = (
    await noteOrderTable().select().limit(1).where({ user_id: userId })
  )[0] as NoteIdsRow;

  return rawList?.note_ids;
};

export const saveNoteIds = async (
  userId: number,
  noteIds: number[]
): Promise<void> => {
  await noteOrderTable()
    .insert({
      user_id: userId,
      note_ids: noteIds,
    })
    .onConflict("user_id")
    .merge();
};
