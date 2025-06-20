import express from "express";
import * as _ from "lodash";

import * as apiTypes from "../../../shared/apiTypes";
import * as userDAL from "../dal/userDAL";
import * as noteDAL from "../dal/noteDAL";
import * as resetPasswordDAL from "../dal/resetPasswordDAL";
import archiver from "archiver";

import * as auth from "../baseLib/auth";

const router = express.Router();

const isAuthenticated: express.RequestHandler = (req, res, next) => {
  if (req.user?.id !== undefined) {
    return next();
  }

  res.status(401).send("Not authenticated");
};

// === Start User ===

router.post("/user", express.json(), function (req, res) {
  // XXX TODO create user
});

router.get("/user", isAuthenticated, async (req, res) => {
  if (req.user === undefined) {
    throw Error("Not authenticated");
  }

  const user = await userDAL.getUser({ id: req.user.id });
  res.json({
    user,
  });
});

router.post<{}, {}, apiTypes.UpdatePasswordRequest>(
  "/user/updatePassword",
  express.json(),
  async (req, res) => {
    if (req.user === undefined) {
      throw Error("Not authenticated");
    }

    const user = await userDAL.getUser({ id: req.user.id });
    if (!user) {
      res.status(404).send("User not found");
      return;
    }

    if (
      !(await auth.checkPassword(req.body.oldPassword, user.hashedPassword))
    ) {
      res.status(400).send("Old password is incorrect");
      return;
    }

    if (req.body.newPassword.length < 6) {
      res.status(400).send("New password is too short");
      return;
    }

    const hashedPassword = await auth.createPasswordHash(req.body.newPassword);

    await userDAL.updateHashedPassword(req.user.id, hashedPassword);
    res.send({});
  }
);

// === End user ===

// === Start notes ===

router.get<{ id: string }, apiTypes.GetNoteResponse, {}, {}, {}>(
  "/note/:id",
  async (req, res) => {
    if (req.user === undefined) {
      res.status(403).send("Not authenticated" as any);
      return;
    }

    const noteId = parseInt(req.params.id, 10);
    const note = await noteDAL.getNote(req.user.id, noteId);

    if (note === undefined) {
      res.status(404).send("Note not found" as any);
      return;
    }

    res.json({ note });
  }
);

router.post<
  { id: string },
  apiTypes.UpdateNoteResponse,
  apiTypes.UpdateNoteRequest,
  {},
  {}
>("/note/:id/update", express.json(), async (req, res) => {
  if (req.user === undefined) {
    res.status(403).send("Not authenticated" as any);
    return;
  }

  const noteId = parseInt(req.params.id, 10);
  const note = await noteDAL.updateNote(req.user.id, noteId, req.body.update);

  res.json({ note });
});

router.post<
  "/note",
  {},
  apiTypes.PostNoteResponse,
  apiTypes.PostNoteRequest,
  {},
  {}
>("/note", express.json(), async (req, res) => {
  if (req.user === undefined) {
    res.status(403).send("Not authenticated" as any);
    return;
  }

  const note = await noteDAL.saveNote(req.user.id, req.body.noteData);

  const noteIds = await noteDAL.listNoteIds(req.user.id);
  await noteDAL.saveNoteIds(req.user.id, [...(noteIds ?? []), note.id]);

  res.json({ note });
});

router.post<{ id: string }, {}, {}, {}, {}>(
  "/note/:id/delete",
  express.json(),
  async (req, res) => {
    if (req.user === undefined) {
      res.status(403).send("Not authenticated" as any);
      return;
    }

    const noteId = parseInt(req.params.id, 10);
    await noteDAL.deleteNote(req.user.id, noteId);

    const noteIds = await noteDAL.listNoteIds(req.user.id);
    if (noteIds) {
      await noteDAL.saveNoteIds(
        req.user.id,
        noteIds.filter((thisNoteId) => thisNoteId !== noteId)
      );
    }

    res.json();
  }
);

router.get<{ id: string }, apiTypes.ListNoteIdsResponse, {}, {}, {}>(
  "/noteIds",
  async (req, res) => {
    if (req.user === undefined) {
      res.status(403).send("Not authenticated" as any);
      return;
    }
    const noteIds = await noteDAL.listNoteIds(req.user.id);
    // if (noteIds === undefined) {
    //   res.status(404).send("Note IDs not found" as any);
    //   return;
    // }

    res.json({ noteIds: noteIds ?? [] });
  }
);

router.post<{ id: string }, {}, apiTypes.PostOrderedNoteIdsRequest, {}, {}>(
  "/noteIds",
  express.json(),
  async (req, res) => {
    if (req.user === undefined) {
      res.status(403).send("Not authenticated" as any);
      return;
    }

    await noteDAL.saveNoteIds(req.user.id, req.body.noteIds);

    res.json();
  }
);

// Exports all the users notes in a .zip file
router.get("/exportNotes", async (req, res) => {
  if (req.user === undefined) {
    res.status(403).send("Not authenticated" as any);
    return;
  }

  const noteIds = await noteDAL.listNoteIds(req.user.id);

  if (noteIds === undefined) {
    res.status(404).send("No notes found");
    return;
  }

  const archive = archiver("zip", {
    zlib: { level: 9 }, // Compression level
  });

  archive.on("error", function (err) {
    throw err;
  });

  // Set the archive name
  res.attachment("allNotes.zip");

  // Pipe the zip to the response
  archive.pipe(res);

  for (const noteId of noteIds) {
    const note = await noteDAL.getNote(req.user.id, noteId);

    if (note === undefined) {
      continue;
    }

    // Append files to the zip
    archive.append(note.body, { name: `${note.title}.txt` });
  }

  // Finalize the archive
  archive.finalize();
});

// === End notes ===

export default router;
