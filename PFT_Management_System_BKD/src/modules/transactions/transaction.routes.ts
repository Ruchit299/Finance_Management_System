import { Router } from "express";
import { verifyToken } from "../../helper/middlewares/auth.middleware.ts";
import {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
} from "./transaction.controller.ts";

const router = Router();

// Secure all transaction routes with JWT authentication
router.use(verifyToken);

router.post("/", createTransaction);
router.get("/", getTransactions);
router.put("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);

export default router;
