import { Router } from "express";
import { verifyToken } from "../../helper/middlewares/auth.middleware.ts";
import {
  createSavingsGoal,
  getSavingsGoals,
  updateSavingsGoal,
  addSavings,
  deleteSavingsGoal,
} from "./savings-goals.controller.ts";

const router = Router();

router.use(verifyToken);

router.post("/", createSavingsGoal);
router.get("/", getSavingsGoals);
router.put("/:id", updateSavingsGoal);
router.post("/:id/add-savings", addSavings);
router.delete("/:id", deleteSavingsGoal);

export default router;
