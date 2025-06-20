import * as types from "./types";

export interface UserResponse {
  user: types.User;
}

export interface UpdateUserRequest {
  username: string;
}

export interface PostUserRequest {
  username: string;
  password: string;
}

export type PostUserResponse =
  | {
      type: "user-created";
      id: number;
    }
  | {
      type: "user-already-exists";
    };

export interface UpdatePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface ResetPasswordRequest {
  resetCode: string;
  newPassword: string;
}

export interface UserFromResetCodeResponse {
  username: string;
}

// Notes

export interface GetNoteResponse {
  note: types.Note;
}

export interface PostNoteRequest {
  noteData: {
    title: string;
    body: string;
  };
}

export interface PostNoteResponse {
  note: types.Note;
}

export interface UpdateNoteRequest {
  update: {
    title?: string;
    body?: string;
  };
}

export interface UpdateNoteResponse {
  note: types.Note;
}

export interface ListNoteIdsResponse {
  noteIds: number[];
}

export interface PostOrderedNoteIdsRequest {
  noteIds: number[];
}
