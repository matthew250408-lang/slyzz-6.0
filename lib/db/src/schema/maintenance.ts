import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export type MaintenanceService = "support" | "recrutement" | "notice";
export type MaintenanceReason =
  | "mise-a-jour"
  | "incident-technique"
  | "maintenance-preventive"
  | "autre";

export const maintenanceTable = pgTable("service_maintenance", {
  service: varchar("service", { length: 20 })
    .$type<MaintenanceService>()
    .primaryKey(),
  message: text("message").notNull(),
  reason: varchar("reason", { length: 32 })
    .$type<MaintenanceReason>()
    .default("autre")
    .notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  updatedByUserId: varchar("updated_by_user_id", { length: 32 }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
