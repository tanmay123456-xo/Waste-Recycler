import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, wasteSubmissionsTable } from "@workspace/db/schema";
import { eq, sql, count, sum } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";
import { z } from "zod/v4";

const router: IRouter = Router();

router.get("/profile", requireAuth, async (req: AuthRequest, res) => {
  const user = req.user!;

  const [stats] = await db
    .select({
      totalSubmissions: count(wasteSubmissionsTable.id),
      approvedSubmissions: sql<number>`count(case when ${wasteSubmissionsTable.status} = 'approved' then 1 end)`,
    })
    .from(wasteSubmissionsTable)
    .where(eq(wasteSubmissionsTable.userId, user.id));

  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    walletAddress: user.walletAddress,
    role: user.role,
    tokenBalance: user.tokenBalance,
    totalWasteKg: user.totalWasteKg,
    totalSubmissions: Number(stats?.totalSubmissions ?? 0),
    approvedSubmissions: Number(stats?.approvedSubmissions ?? 0),
    createdAt: user.createdAt,
  });
});

router.put("/wallet", requireAuth, async (req: AuthRequest, res) => {
  const schema = z.object({ walletAddress: z.string().min(1) });
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: "Bad request", message: "Invalid wallet address" });
  }

  const [updated] = await db
    .update(usersTable)
    .set({ walletAddress: result.data.walletAddress, updatedAt: new Date() })
    .where(eq(usersTable.id, req.user!.id))
    .returning();

  return res.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    walletAddress: updated.walletAddress,
    role: updated.role,
    createdAt: updated.createdAt,
  });
});

export default router;
