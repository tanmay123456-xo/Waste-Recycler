import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, wasteSubmissionsTable } from "@workspace/db/schema";
import { eq, desc, count, sum, sql } from "drizzle-orm";
import { requireAdmin, type AuthRequest } from "../middlewares/auth.js";
import crypto from "crypto";

const router: IRouter = Router();

const TOKENS_PER_KG = 10;

function generateTxHash(): string {
  return "0x" + crypto.randomBytes(32).toString("hex");
}

router.get("/submissions", requireAdmin, async (req: AuthRequest, res) => {
  const status = req.query.status as string | undefined;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  let query = db
    .select({
      submission: wasteSubmissionsTable,
      userName: usersTable.name,
    })
    .from(wasteSubmissionsTable)
    .innerJoin(usersTable, eq(wasteSubmissionsTable.userId, usersTable.id))
    .$dynamic();

  if (status && ["pending", "approved", "rejected"].includes(status)) {
    query = query.where(eq(wasteSubmissionsTable.status, status as any));
  }

  const allItems = await query.orderBy(desc(wasteSubmissionsTable.createdAt));
  const total = allItems.length;
  const paginated = allItems.slice(offset, offset + limit);

  return res.json({
    submissions: paginated.map(({ submission: s, userName }) => ({
      id: s.id,
      userId: s.userId,
      userName,
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
    total,
    page,
    limit,
  });
});

router.post("/submissions/:id/approve", requireAdmin, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Bad request", message: "Invalid ID" });
  }

  const [existing] = await db
    .select()
    .from(wasteSubmissionsTable)
    .where(eq(wasteSubmissionsTable.id, id));

  if (!existing) {
    return res.status(404).json({ error: "Not found", message: "Submission not found" });
  }

  const tokensAwarded = existing.weightKg * TOKENS_PER_KG;
  const txHash = generateTxHash();
  const blockchainTimestamp = new Date().toISOString();

  const [updated] = await db
    .update(wasteSubmissionsTable)
    .set({
      status: "approved",
      tokensAwarded,
      transactionHash: txHash,
      blockchainTimestamp,
      updatedAt: new Date(),
    })
    .where(eq(wasteSubmissionsTable.id, id))
    .returning();

  // Update user token balance and waste totals
  await db
    .update(usersTable)
    .set({
      tokenBalance: sql`${usersTable.tokenBalance} + ${tokensAwarded}`,
      totalWasteKg: sql`${usersTable.totalWasteKg} + ${existing.weightKg}`,
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, existing.userId));

  // Get user name
  const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, existing.userId));

  return res.json({
    id: updated.id,
    userId: updated.userId,
    userName: user?.name ?? "",
    wasteType: updated.wasteType,
    weightKg: updated.weightKg,
    recyclingCenterId: updated.recyclingCenterId,
    photoUrl: updated.photoUrl,
    status: updated.status,
    tokensAwarded: updated.tokensAwarded,
    transactionHash: updated.transactionHash,
    blockchainTimestamp: updated.blockchainTimestamp,
    notes: updated.notes,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  });
});

router.post("/submissions/:id/reject", requireAdmin, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Bad request", message: "Invalid ID" });
  }

  const [existing] = await db
    .select()
    .from(wasteSubmissionsTable)
    .where(eq(wasteSubmissionsTable.id, id));

  if (!existing) {
    return res.status(404).json({ error: "Not found", message: "Submission not found" });
  }

  const [updated] = await db
    .update(wasteSubmissionsTable)
    .set({ status: "rejected", updatedAt: new Date() })
    .where(eq(wasteSubmissionsTable.id, id))
    .returning();

  const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, existing.userId));

  return res.json({
    id: updated.id,
    userId: updated.userId,
    userName: user?.name ?? "",
    wasteType: updated.wasteType,
    weightKg: updated.weightKg,
    recyclingCenterId: updated.recyclingCenterId,
    photoUrl: updated.photoUrl,
    status: updated.status,
    tokensAwarded: updated.tokensAwarded,
    transactionHash: updated.transactionHash,
    blockchainTimestamp: updated.blockchainTimestamp,
    notes: updated.notes,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  });
});

router.get("/users", requireAdmin, async (req: AuthRequest, res) => {
  const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));

  const result = await Promise.all(
    users.map(async (u) => {
      const [stats] = await db
        .select({
          totalSubmissions: count(wasteSubmissionsTable.id),
          approvedSubmissions: sql<number>`count(case when ${wasteSubmissionsTable.status} = 'approved' then 1 end)`,
        })
        .from(wasteSubmissionsTable)
        .where(eq(wasteSubmissionsTable.userId, u.id));

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        walletAddress: u.walletAddress,
        role: u.role,
        tokenBalance: u.tokenBalance,
        totalWasteKg: u.totalWasteKg,
        totalSubmissions: Number(stats?.totalSubmissions ?? 0),
        approvedSubmissions: Number(stats?.approvedSubmissions ?? 0),
        createdAt: u.createdAt,
      };
    })
  );

  return res.json(result);
});

router.get("/stats", requireAdmin, async (req: AuthRequest, res) => {
  const [userCount] = await db.select({ total: count() }).from(usersTable);
  const [submissionStats] = await db
    .select({
      total: count(),
      pending: sql<number>`count(case when ${wasteSubmissionsTable.status} = 'pending' then 1 end)`,
      approved: sql<number>`count(case when ${wasteSubmissionsTable.status} = 'approved' then 1 end)`,
      rejected: sql<number>`count(case when ${wasteSubmissionsTable.status} = 'rejected' then 1 end)`,
      totalKg: sql<number>`coalesce(sum(case when ${wasteSubmissionsTable.status} = 'approved' then ${wasteSubmissionsTable.weightKg} else 0 end), 0)`,
      totalTokens: sql<number>`coalesce(sum(case when ${wasteSubmissionsTable.status} = 'approved' then ${wasteSubmissionsTable.tokensAwarded} else 0 end), 0)`,
    })
    .from(wasteSubmissionsTable);

  const wasteByType = await db
    .select({
      wasteType: wasteSubmissionsTable.wasteType,
      totalKg: sql<number>`coalesce(sum(${wasteSubmissionsTable.weightKg}), 0)`,
      count: count(),
    })
    .from(wasteSubmissionsTable)
    .where(eq(wasteSubmissionsTable.status, "approved"))
    .groupBy(wasteSubmissionsTable.wasteType);

  return res.json({
    totalUsers: Number(userCount?.total ?? 0),
    totalSubmissions: Number(submissionStats?.total ?? 0),
    pendingSubmissions: Number(submissionStats?.pending ?? 0),
    approvedSubmissions: Number(submissionStats?.approved ?? 0),
    rejectedSubmissions: Number(submissionStats?.rejected ?? 0),
    totalWasteKg: Number(submissionStats?.totalKg ?? 0),
    totalTokensIssued: Number(submissionStats?.totalTokens ?? 0),
    wasteByType: wasteByType.map((w) => ({
      wasteType: w.wasteType,
      totalKg: Number(w.totalKg),
      count: Number(w.count),
    })),
  });
});

export default router;
