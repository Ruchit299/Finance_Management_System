import { Router } from "express";
import { verifyToken } from "../../helper/middlewares/auth.middleware.ts";
import { getDashboardSummary } from "./dashboard.controller.ts";

const router = Router();

router.use(verifyToken);

router.get("/summary", getDashboardSummary);

export default router;
