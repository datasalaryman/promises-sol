// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm";
import {
  bigint,
  index,
  mysqlTableCreator,
  timestamp,
  tinytext,
  varchar,
} from "drizzle-orm/mysql-core";
import { BugIcon } from "lucide-react";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = mysqlTableCreator((name) => `promises-sol_${name}`);

export const promisesSelf = createTable("promises_self", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at").onUpdateNow(),
  promiseContent: tinytext("promise_content"),
  promiseEpoch: bigint("promise_epoch", { mode: "bigint", unsigned: true }),
  promiseLamports: bigint("promise_lamports", {
    mode: "bigint",
    unsigned: true,
  }),
  promiseWallet: tinytext("promise_wallet"),
});
