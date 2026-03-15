import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, wasteSubmissionsTable } from "@workspace/db/schema";
import { eq, desc, count, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 10;

  const users = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      tokenBalance: usersTable.tokenBalance,
      totalWasteKg: usersTable.totalWasteKg,
    })
    .from(usersTable)
    .orderBy(desc(usersTable.tokenBalance))
    .limit(limit);

  const result = await Promise.all(
    users.map(async (u, index) => {
      const [stats] = await db
        .select({ totalSubmissions: count() })
        .from(wasteSubmissionsTable)
        .where(eq(wasteSubmissionsTable.userId, u.id));

      return {
        rank: index + 1,
        userId: u.id,
        name: u.name,
        tokenBalance: u.tokenBalance,
        totalWasteKg: u.totalWasteKg,
        totalSubmissions: Number(stats?.totalSubmissions ?? 0),
      };
    })
  );

  return res.json(result);
});

export default router;
