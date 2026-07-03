import express, { type Request, type Response, type NextFunction } from "express";
import authRouter from "../modules/auth/auth.routes.ts";
import userRouter from "../modules/user/user.routes.ts";
import transactionRouter from "../modules/transactions/transaction.routes.ts";
import budgetRouter from "../modules/budget/budget.routes.ts";
import savingsGoalsRouter from "../modules/savings-goals/savings-goals.routes.ts";
import recurringTransactionsRouter from "../modules/recurring-transactions/recurring-transactions.routes.ts";
import billRemindersRouter from "../modules/bill-reminders/bill-reminders.routes.ts";
import dashboardRouter from "../modules/dashboard/dashboard.routes.ts";
import categoryRouter from "../modules/category/category.routes.ts";

const router = express.Router();

router.get("/greet", (req: Request, res: Response) => {
  res.json({ Greet: "Hello.........." });
});

router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/transactions", transactionRouter);
router.use("/budgets", budgetRouter);
router.use("/savings-goals", savingsGoalsRouter);
router.use("/recurring-transactions", recurringTransactionsRouter);
router.use("/bill-reminders", billRemindersRouter);
router.use("/dashboard", dashboardRouter);
router.use("/categories", categoryRouter);

export default router;
