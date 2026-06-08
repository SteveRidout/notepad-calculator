import { Knex } from "knex";

export const up = async (knex: Knex): Promise<void> => {
  if (await knex.schema.hasColumn("reset_password", "creation_time")) {
    return;
  }

  await knex.schema.alterTable("reset_password", (table) => {
    table.datetime("creation_time");
  });
};

export const down = async (knex: Knex): Promise<void> => {
  if (!(await knex.schema.hasColumn("reset_password", "creation_time"))) {
    return;
  }

  await knex.schema.alterTable("reset_password", (table) => {
    table.dropColumn("creation_time");
  });
};
