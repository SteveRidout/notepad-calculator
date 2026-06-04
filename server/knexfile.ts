import type { Knex } from "knex";

const knexConfig: { [key: string]: Knex.Config } = {
  development: {
    client: "pg",
    connection: {
      host: process.env.DB_HOST || "127.0.0.1",
      port: parseInt(process.env.DB_PORT || "5433", 10),
      database: process.env.DB_NAME || "notepadcalculator",
      user: process.env.DB_USER || "notepadcalculator",
      password: process.env.DB_PASSWORD || "localdevpassword",
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: "knex_migrations",
    },
  },
};

module.exports = knexConfig;
