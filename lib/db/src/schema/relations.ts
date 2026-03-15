import { relations } from "drizzle-orm";
import { usersTable } from "./users";
import { wasteSubmissionsTable } from "./waste_submissions";
import { sessionsTable } from "./sessions";

export const usersRelations = relations(usersTable, ({ many }) => ({
  submissions: many(wasteSubmissionsTable),
  sessions: many(sessionsTable),
}));

export const wasteSubmissionsRelations = relations(wasteSubmissionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [wasteSubmissionsTable.userId],
    references: [usersTable.id],
  }),
}));

export const sessionsRelations = relations(sessionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [sessionsTable.userId],
    references: [usersTable.id],
  }),
}));
