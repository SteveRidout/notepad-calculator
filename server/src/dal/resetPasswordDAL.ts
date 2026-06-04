import { getKnex } from "../baseLib/database";
import { getUser } from "./userDAL";

interface ResetPasswordRow {
  code: string;
  user_id: number;
  creation_time?: Date;
}

const resetPasswordTableName = "reset_password";
const resetPasswordTable = () =>
  getKnex().table<ResetPasswordRow>(resetPasswordTableName);

const resetCodeMaxAgeMs = 24 * 60 * 60 * 1000;

export const getUserId = async (code: string): Promise<number | undefined> => {
  const rawRow = (await resetPasswordTable().select().where({
    code,
  }))[0];

  if (rawRow?.creation_time === undefined) {
    return undefined;
  }

  const creationTime = new Date(rawRow.creation_time).getTime();
  if (Number.isNaN(creationTime) || creationTime < Date.now() - resetCodeMaxAgeMs) {
    await deleteCode(code);
    return undefined;
  }

  return rawRow.user_id;
};

export const deleteCode = async (code: string) => {
  await resetPasswordTable().delete().where({ code });
};
