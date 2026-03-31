import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, wasteSubmissionsTable } from "@workspace/db/schema";
import { eq, desc, count, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";
import { submitWasteSchema } from "@workspace/db/schema";
import crypto from "crypto";

const router: IRouter = Router();

const TOKENS_PER_KG = 10;

function generateTxHash(): string {
  return "0x" + crypto.randomBytes(32).toString("hex");
}

router.post("/submit", requireAuth, async (req: AuthRequest, res) => {
  const result = submitWasteSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: "Bad request", message: "Invalid input" });
  }

  const { wasteType, weightKg, recyclingCenterId, photoUrl, notes } = result.data;
  const userId = req.user!.id;

  const [submission] = await db
    .insert(wasteSubmissionsTable)
    .values({
      userId,
      wasteType,
      weightKg,
      recyclingCenterId,
      photoUrl: photoUrl ?? null,
      notes: notes ?? null,
      status: "pending",
    })
    .returning();

  const user = req.user!;

  // Auto-approve after 4.5 seconds to simulate blockchain confirmation
  setTimeout(async () => {
    try {
      const tokensAwarded = weightKg * ETH_PER_KG;
      const txHash = generateTxHash();
      const blockchainTimestamp = new Date().toISOString();

      await db
        .update(wasteSubmissionsTable)
        .set({
          status: "approved",
          tokensAwarded,
          transactionHash: txHash,
          blockchainTimestamp,
          updatedAt: new Date(),
        })
        .where(eq(wasteSubmissionsTable.id, submission.id));

      await db
        .update(usersTable)
        .set({
          tokenBalance: sql`${usersTable.tokenBalance} + ${tokensAwarded}`,
          totalWasteKg: sql`${usersTable.totalWasteKg} + ${weightKg}`,
          updatedAt: new Date(),
        })
        .where(eq(usersTable.id, userId));
    } catch (err) {
      console.error("Auto-approve failed for submission", submission.id, err);
    }
  }, 4500);

  return res.status(201).json({
    id: submission.id,
    userId: submission.userId,
    userName: user.name,
    wasteType: submission.wasteType,
    weightKg: submission.weightKg,
    recyclingCenterId: submission.recyclingCenterId,
    photoUrl: submission.photoUrl,
    status: submission.status,
    tokensAwarded: null,
    transactionHash: null,
    blockchainTimestamp: null,
    notes: submission.notes,
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
  });
});

router.get("/submissions", requireAuth, async (req: AuthRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;
  const userId = req.user!.id;

  const [{ total }] = await db
    .select({ total: count() })
    .from(wasteSubmissionsTable)
    .where(eq(wasteSubmissionsTable.userId, userId));

  const submissions = await db
    .select()
    .from(wasteSubmissionsTable)
    .where(eq(wasteSubmissionsTable.userId, userId))
    .orderBy(desc(wasteSubmissionsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const user = req.user!;

  return res.json({
    submissions: submissions.map((s) => ({
      id: s.id,
      userId: s.userId,
      userName: user.name,
      wasteType: s.wasteType,
      weightKg: s.weightKg,
      recyclingCenterId: s.recyclingCenterId,
      photoUrl: s.photoUrl,
      status: s.status,
      tokensAwarded: s.tokensAwarded,
      transactionHash: s.transactionHash,
      blockchainTimestamp: s.blockchainTimestamp,
      notes: s.notes,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    })),
    total: Number(total),
    page,
    limit,
  });
});

export default router;
