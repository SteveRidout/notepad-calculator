import { Knex } from "knex";

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.createTable("user", (table) => {
    table.increments("id");
    table.text("username").unique();
    table.text("hashed_password");
    table.datetime("creation_time");
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTable("user");
};
