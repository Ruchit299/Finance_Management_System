import { Router } from "express";
import { verifyToken } from "../../helper/middlewares/auth.middleware.ts";
import {
  createRecurringTransaction,
  getRecurringTransactions,
  updateRecurringTransaction,
  toggleRecurringTransaction,
  deleteRecurringTransaction,
} from "./recurring-transactions.controller.ts";

const router = Router();

router.use(verifyToken);

router.post("/", createRecurringTransaction);
router.get("/", getRecurringTransactions);
router.put("/:id", updateRecurringTransaction);
router.patch("/:id/toggle", toggleRecurringTransaction);
router.delete("/:id", deleteRecurringTransaction);

export default router;
