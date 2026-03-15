import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, wasteSubmissionsTable } from "@workspace/db/schema";
import { eq, count, sql, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/overview", async (req, res) => {
  const [userCount] = await db.select({ total: count() }).from(usersTable);
  const [submissionStats] = await db
    .select({
      total: count(),
      totalKg: sql<number>`coalesce(sum(case when ${wasteSubmissionsTable.status} = 'approved' then ${wasteSubmissionsTable.weightKg} else 0 end), 0)`,
      totalTokens: sql<number>`coalesce(sum(case when ${wasteSubmissionsTable.status} = 'approved' then ${wasteSubmissionsTable.tokensAwarded} else 0 end), 0)`,
    })
    .from(wasteSubmissionsTable);

  return res.json({
    totalWasteKg: Number(submissionStats?.totalKg ?? 0),
    totalTokensIssued: Number(submissionStats?.totalTokens ?? 0),
    totalUsers: Number(userCount?.total ?? 0),
    totalSubmissions: Number(submissionStats?.total ?? 0),
  });
});

router.get("/waste-types", async (req, res) => {
  const result = await db
    .select({
      wasteType: wasteSubmissionsTable.wasteType,
      totalKg: sql<number>`coalesce(sum(${wasteSubmissionsTable.weightKg}), 0)`,
      count: count(),
    })
    .from(wasteSubmissionsTable)
    .where(eq(wasteSubmissionsTable.status, "approved"))
    .groupBy(wasteSubmissionsTable.wasteType);

  return res.json(
    result.map((r) => ({
      wasteType: r.wasteType,
      totalKg: Number(r.totalKg),
      count: Number(r.count),
    }))
  );
});

router.get("/monthly", async (req, res) => {
  const result = await db
    .select({
      month: sql<string>`to_char(${wasteSubmissionsTable.createdAt}, 'YYYY-MM')`,
      totalKg: sql<number>`coalesce(sum(${wasteSubmissionsTable.weightKg}), 0)`,
      totalTokens: sql<number>`coalesce(sum(${wasteSubmissionsTable.tokensAwarded}), 0)`,
      submissions: count(),
    })
    .from(wasteSubmissionsTable)
    .where(eq(wasteSubmissionsTable.status, "approved"))
    .groupBy(sql`to_char(${wasteSubmissionsTable.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${wasteSubmissionsTable.createdAt}, 'YYYY-MM')`);

  return res.json(
    result.map((r) => ({
      month: r.month,
      totalKg: Number(r.totalKg),
      totalTokens: Number(r.totalTokens),
      submissions: Number(r.submissions),
    }))
  );
});

export default router;
