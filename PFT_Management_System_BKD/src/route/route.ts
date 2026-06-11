import express, { type Request, type Response, type NextFunction } from "express";
import authRouter from "../modules/auth/auth.routes.ts";
import userRouter from "../modules/user/user.routes.ts";
import transactionRouter from "../modules/transactions/transaction.routes.ts";
import budgetRouter from "../modules/budget/budget.routes.ts";

const router = express.Router();

router.get("/greet", (req: Request, res: Response) => {
  res.json({ Greet: "Hello.........." });
});

router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/transactions", transactionRouter);
router.use("/budgets", budgetRouter);

export default router;