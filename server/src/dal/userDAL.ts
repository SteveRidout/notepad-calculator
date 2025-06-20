import { User } from "../../../shared/types";
import { PostUserResponse } from "../../../shared/apiTypes";

import { getKnex } from "../baseLib/database";

interface UserRow {
  id: number;
  username: string;
  hashed_password: string;
  creation_time: Date;
}

const userTableName = "user";
const userTable = () => getKnex().table<UserRow>(userTableName);

const parseUser = (userRow: UserRow): User => ({
  id: userRow.id,
  username: userRow.username,
  hashedPassword: userRow.hashed_password,
  creationTime: userRow.creation_time,
});

export const getUser = async (
  query: { id: number } | { username: string }
): Promise<User | undefined> => {
  const userRow = (await userTable().select().where(query))[0] as UserRow;
  return userRow === undefined ? userRow : parseUser(userRow);
};

export const getUsers = async (ids: number[]): Promise<User[]> => {
  const userRows = (await userTable().select().whereIn("id", ids)) as UserRow[];
  return userRows.map((userRow) => parseUser(userRow));
};

export const addUser = async (
  user: Omit<User, "id">
): Promise<PostUserResponse> => {
  let id: number;
  try {
    id = (
      (await userTable()
        .insert({
          username: user.username,
          hashed_password: user.hashedPassword,
          creation_time: user.creationTime,
        })
        .returning("id")) as { id: number }[]
    )[0].id;
  } catch (error) {
    console.error("ERROR: ", error);

    const postgresUniqueViolationErrorCode = 23505;

    if (
      parseInt((error as any)?.code, 10) === postgresUniqueViolationErrorCode
    ) {
      console.log("User already exists");
      return {
        type: "user-already-exists",
      };
    }

    throw error;
  }

  return {
    type: "user-created",
    id,
  };
};

export const updateUser = async (
  id: number,
  user: { username: string }
): Promise<void> => {
  await userTable()
    .update({
      username: user.username,
    })
    .where({ id });
};

export const updateHashedPassword = async (
  id: number,
  hashedPassword: string
): Promise<void> => {
  await userTable()
    .update({
      hashed_password: hashedPassword,
    })
    .where({ id });
};
