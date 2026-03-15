import { Router } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import usersRouter from "./users.js";
import wasteRouter from "./waste.js";
import adminRouter from "./admin.js";
import statsRouter from "./stats.js";
import leaderboardRouter from "./leaderboard.js";

const router = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/waste", wasteRouter);
router.use("/admin", adminRouter);
router.use("/stats", statsRouter);
router.use("/leaderboard", leaderboardRouter);

export default router;
