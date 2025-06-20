import type { Knex } from "knex";

const knexConfig: { [key: string]: Knex.Config } = {
  development: {
    client: "pg",
    connection: {
      host: process.env.DB_HOST || "postgres",
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