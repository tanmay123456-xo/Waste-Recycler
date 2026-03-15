import { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { sessionsTable, usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

export interface AuthRequest extends Request {
  user?: typeof usersTable.$inferSelect;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.session;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized", message: "Not logged in" });
  }
  const session = await db.query.sessionsTable.findFirst({
    where: eq(sessionsTable.token, token),
    with: { user: true },
  });
  if (!session || session.expiresAt < new Date()) {
    return res.status(401).json({ error: "Unauthorized", message: "Session expired" });
  }
  req.user = (session as any).user;
  next();
}

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  await requireAuth(req, res, async () => {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden", message: "Admin access required" });
    }
    next();
  });
}
