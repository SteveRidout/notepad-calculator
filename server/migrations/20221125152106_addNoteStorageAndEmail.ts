import { Knex } from "knex";

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.createTable("note", (table) => {
    table.increments("id");
    table.integer("user_id").references("user.id");
    table.text("title");
    table.text("body");
    table.datetime("creation_time");
    table.datetime("last_modified_time");

    table.index(["user_id", "title"]);
  });

  await knex.schema.createTable("note_order", (table) => {
    table.integer("user_id").references("user.id").primary();
    table.specificType("note_ids", "integer ARRAY");
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTable("note_order");
  await knex.schema.dropTable("note");
};
