const googleIdPrefix = "G:";

export const getUserId = (googleId: string) => `${googleIdPrefix}${googleId}`;

export const getGoogleId = (userId: string) => {
  if (!userId.startsWith(googleIdPrefix)) {
    throw Error("This user ID doesn't contain a google user ID");
  }
  return userId.slice(2);
};
