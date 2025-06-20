import { Knex } from "knex";

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.createTable("reset_password", (table) => {
    table.text("code").primary();
    table.integer("user_id").references("user.id");
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTable("reset_password");
};
