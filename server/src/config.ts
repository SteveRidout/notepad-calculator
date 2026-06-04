export default {
  dbName: process.env.DB_NAME ?? "notepadcalculator",
  dbHost: process.env.DB_HOST ?? "127.0.0.1",
  dbPort: parseInt(process.env.DB_PORT ?? "5433", 10),
  dbPassword: process.env.DB_PASSWORD ?? "localdevpassword",
  dbUser: process.env.DB_USER ?? "notepadcalculator",
};
