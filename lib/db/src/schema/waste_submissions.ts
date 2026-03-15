import { pgTable, serial, text, timestamp, integer, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const wasteTypeEnum = pgEnum("waste_type", ["Plastic", "Paper", "Metal", "Glass", "E-waste"]);
export const submissionStatusEnum = pgEnum("submission_status", ["pending", "approved", "rejected"]);

export const wasteSubmissionsTable = pgTable("waste_submissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  wasteType: wasteTypeEnum("waste_type").notNull(),
  weightKg: real("weight_kg").notNull(),
  recyclingCenterId: text("recycling_center_id").notNull(),
  photoUrl: text("photo_url"),
  status: submissionStatusEnum("status").notNull().default("pending"),
  tokensAwarded: real("tokens_awarded"),
  transactionHash: text("transaction_hash"),
  blockchainTimestamp: text("blockchain_timestamp"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSubmissionSchema = createInsertSchema(wasteSubmissionsTable).omit({
  id: true,
  status: true,
  tokensAwarded: true,
  transactionHash: true,
  blockchainTimestamp: true,
  createdAt: true,
  updatedAt: true,
});

export const submitWasteSchema = z.object({
  wasteType: z.enum(["Plastic", "Paper", "Metal", "Glass", "E-waste"]),
  weightKg: z.number().min(0.1),
  recyclingCenterId: z.string().min(1),
  photoUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type WasteSubmission = typeof wasteSubmissionsTable.$inferSelect;
