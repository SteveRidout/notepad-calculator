import axios, { AxiosResponse } from "axios";
import * as _ from "lodash";

import * as apiTypes from "../../shared/apiTypes";
import { Note } from "../../shared/types";
import { NoteStorageAPI } from "./types";

// === Start Auth ===

/** Returns true for success or false for failure. */
export const login = async (
  username: string,
  password: string
): Promise<boolean> => {
  let result;
  try {
    result = await axios.post("/auth/login", {
      username,
      password,
    });
  } catch (error) {
    console.log("caught error: ", error);
    return false;
  }

  return result.status === 200;
};

export const signUp = async (
  username: string,
  password: string
): Promise<apiTypes.PostUserResponse> => {
  return (
    await axios.post<apiTypes.PostUserResponse>("/auth/user", {
      username,
      password,
    })
  ).data;
};

export const logout = async () => await axios.post("/auth/logout");

// === End Auth ===

// === Start User ===

export const getUser = async () => {
  return (await axios.get("/api/user")).data as apiTypes.UserResponse;
};

export const updateUser = async (update: { username: string }) => {
  await axios.post<{}, {}, apiTypes.UpdateUserRequest>(
    "/api/user/update",
    update
  );
};

export const updatePassword = async (
  oldPassword: string,
  newPassword: string
) => {
  await axios.post<{}, {}, apiTypes.UpdatePasswordRequest>(
    "/api/user/updatePassword",
    {
      oldPassword,
      newPassword,
    }
  );
};

// === End User ===

// === Password reset ===

export const getUsernameFromResetCode = async (
  resetCode: string
): Promise<string> => {
  const responseBody = (await axios.get(`/passwordReset/user/${resetCode}`))
    .data as apiTypes.UserFromResetCodeResponse;

  return responseBody.username;
};

export const resetPassword = async (
  resetCode: string,
  newPassword: string
): Promise<{ succeeded: boolean }> => {
  const body: apiTypes.ResetPasswordRequest = { resetCode, newPassword };
  const response = await axios.post(`/passwordReset/newPassword`, body);

  return { succeeded: response.status === 200 };
};

// === End Password reset ===

// === Start Notes ===

export const remoteNoteStorage: NoteStorageAPI = {
  getNote: async (id: number) => {
    const { note } = (
      await axios.get<apiTypes.GetNoteResponse>(`/api/note/${id}`)
    ).data;
    return note;
  },

  updateNote: async (
    id: number,
    update: {
      title?: string;
      body?: string;
    }
  ) => {
    await axios.post<
      apiTypes.UpdateNoteResponse,
      AxiosResponse<apiTypes.UpdateNoteResponse>,
      apiTypes.UpdateNoteRequest
    >(`/api/note/${id}/update`, { update });
  },

  saveNote: async (noteData: {
    title: string;
    body: string;
  }): Promise<Note> => {
    const { note } = (
      await axios.post<
        apiTypes.PostNoteResponse,
        AxiosResponse<apiTypes.PostNoteResponse>,
        apiTypes.PostNoteRequest
      >(`/api/note`, { noteData })
    ).data;

    return note;
  },

  deleteNote: async (id: number) => {
    await axios.post(`/api/note/${id}/delete`);
  },

  listNoteIds: async (): Promise<number[]> => {
    const { noteIds } = (
      await axios.get<apiTypes.ListNoteIdsResponse>("/api/noteIds")
    ).data;
    return noteIds;
  },

  saveNoteIds: async (noteIds: number[]) => {
    await axios.post(`/api/noteIds`, { noteIds });
  },
};

// === End Notes ===
