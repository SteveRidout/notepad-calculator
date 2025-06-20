/**
 * @file Allows access to the Postgres DB.
 */

import { Knex, knex } from "knex";

import config from "../config";

let knexInstance: Knex | undefined;

export const getKnex = (): Knex => {
  if (knexInstance) {
    return knexInstance;
  }
  knexInstance = knex({
    client: "pg",
    connection: {
      host: config.dbHost,
      database: config.dbName,
      user: config.dbUser,
      password: config.dbPassword,
    },
  });
  return knexInstance;
};
