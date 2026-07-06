import { Router } from "express";
import { verifyToken } from "../../helper/middlewares/auth.middleware.ts";
import {
  createInvestment,
  getInvestments,
  updateInvestment,
  deleteInvestment,
  recordContribution,
} from "./investment.controller.ts";

const router = Router();

// Secure all investment routes with JWT
router.use(verifyToken);

router.post("/", createInvestment);
router.get("/", getInvestments);
router.put("/:id", updateInvestment);
router.delete("/:id", deleteInvestment);
router.post("/:id/contribute", recordContribution);

export default router;
