import * as bcrypt from "bcrypt";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

import * as apiTypes from "../../../shared/apiTypes";

import * as userDAL from "../dal/userDAL";

export const minPasswordLength = 10;
const maxPasswordLength = 200;

export const auth = () => {
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user: any, done) => done(null, user));

  passport.use(
    "local",
    new LocalStrategy(
      {
        usernameField: "username",
        passwordField: "password",
      },
      async (username, password, done) => {
        const user = await userDAL.getUser({ username });
        const correct =
          user && (await checkPassword(password, user.hashedPassword));

        if (correct) {
          done(null, { id: user.id });
        } else {
          done(null, false);
        }
      }
    )
  );
};

export const addUser = async (
  username: string,
  password: string
): Promise<apiTypes.PostUserResponse> => {
  const passwordError = validatePassword(password);
  if (passwordError) {
    throw Error(passwordError);
  }

  const hashedPassword = await createPasswordHash(password);

  return await userDAL.addUser({
    username,
    hashedPassword,
    creationTime: new Date(),
  });
};

export const validatePassword = (password: string): string | undefined => {
  if (password.length < minPasswordLength) {
    return `Password must be at least ${minPasswordLength} characters`;
  }

  if (password.length > maxPasswordLength) {
    return `Password must be ${maxPasswordLength} characters or fewer`;
  }

  if (password.trim().length === 0) {
    return "Password cannot be blank";
  }
};

/** Create salted password hash. */
export const createPasswordHash = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  return hash;
};

/** Check if password is correct. */
export const checkPassword = async (password: string, hash: string) => {
  return await bcrypt.compare(password, hash);
};
