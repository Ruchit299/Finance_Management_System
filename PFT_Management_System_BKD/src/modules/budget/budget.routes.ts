import { Router } from "express";
import { verifyToken } from "../../helper/middlewares/auth.middleware.ts";
import {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
} from "./budget.controller.ts";

const router = Router();

// Secure all budget routes with JWT authentication
router.use(verifyToken);

router.post("/", createBudget);
router.get("/", getBudgets);
router.put("/:id", updateBudget);
router.delete("/:id", deleteBudget);

export default router;
