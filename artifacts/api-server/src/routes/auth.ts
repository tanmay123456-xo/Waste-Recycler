import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable, sessionsTable } from "@workspace/db/schema";
import { registerUserSchema, loginSchema } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const router: IRouter = Router();

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

router.get("/me", async (req, res) => {
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
  const { passwordHash: _, ...user } = session.user;
  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    walletAddress: user.walletAddress,
    role: user.role,
    createdAt: user.createdAt,
  });
});

router.post("/register", async (req, res) => {
  const result = registerUserSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: "Bad request", message: "Invalid input" });
  }
  const { name, email, password, walletAddress } = result.data;

  const existing = await db.query.usersTable.findFirst({
    where: eq(usersTable.email, email),
  });
  if (existing) {
    return res.status(400).json({ error: "Bad request", message: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(usersTable)
    .values({
      name,
      email,
      passwordHash,
      walletAddress: walletAddress ?? null,
      role: "user",
    })
    .returning();

  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    walletAddress: user.walletAddress,
    role: user.role,
    createdAt: user.createdAt,
  });
});

router.post("/login", async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: "Bad request", message: "Invalid input" });
  }
  const { email, password } = result.data;

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.email, email),
  });
  if (!user) {
    return res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.insert(sessionsTable).values({ userId: user.id, token, expiresAt });

  res.cookie("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
  });

  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      walletAddress: user.walletAddress,
      role: user.role,
      createdAt: user.createdAt,
    },
    message: "Logged in successfully",
  });
});

router.post("/logout", async (req, res) => {
  const token = req.cookies?.session;
  if (token) {
    await db.delete(sessionsTable).where(eq(sessionsTable.token, token));
    res.clearCookie("session");
  }
  return res.json({ message: "Logged out" });
});

export default router;
