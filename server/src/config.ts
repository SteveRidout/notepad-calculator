export default {
  dbName: process.env.DB_NAME ?? "notepadcalculator",
  dbHost: process.env.DB_HOST ?? "postgres",
  dbPassword: process.env.DB_PASSWORD ?? "localdevpassword",
  dbUser: process.env.DB_USER ?? "notepadcalculator",
};
