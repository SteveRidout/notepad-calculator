import { getKnex } from "../baseLib/database";
import { getUser } from "./userDAL";

interface ResetPasswordRow {
  code: string;
  user_id: number;
}

const resetPasswordTableName = "reset_password";
const resetPasswordTable = () =>
  getKnex().table<ResetPasswordRow>(resetPasswordTableName);

export const getUserId = async (code: string): Promise<number | undefined> => {
  const rawRows = await resetPasswordTable().select().where({
    code,
  });

  return rawRows[0]?.user_id;
};

export const deleteCode = async (code: string) => {
  await resetPasswordTable().delete().where({ code });
};
