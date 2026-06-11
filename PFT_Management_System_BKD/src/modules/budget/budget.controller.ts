import { Op } from "sequelize";
import type { Request, Response } from "express";
import { Budget } from "./budget.model.ts";
import { Transaction } from "../transactions/transaction.model.ts";
import { validateCreateBudget, validateUpdateBudget } from "./budget.validation.ts";
import ResponseBuilder from "../../helper/responce-builder/responseBuilder.ts";

// Create Budget
export const createBudget = async (req: Request, res: Response): Promise<Response | void> => {
  const { error, validatedData } = validateCreateBudget(req.body);
  if (error) {
    return ResponseBuilder.error(res, 400, "Validation error", error.details[0].message);
  }

  const userId = req.user?.id;
  if (!userId) {
    return ResponseBuilder.error(res, 401, "User is not authenticated");
  }

  const { category, amount, month } = validatedData!;

  try {
    const existingBudget = await Budget.findOne({
      where: { userId, category, month, deleted: 0 },
    });

    if (existingBudget) {
      return ResponseBuilder.error(res, 400, "Budget already exists for this category in this month");
    }

    const budget = await Budget.create({
      userId,
      category,
      amount,
      month,
      deleted: 0,
    });

    return ResponseBuilder.success(res, 201, "Budget created successfully", budget);
  } catch (err: any) {
    return ResponseBuilder.error(res, 500, "Server error", err.message || String(err));
  }
};

// Update Budget
export const updateBudget = async (req: Request, res: Response): Promise<Response | void> => {
  const budgetId = Number(req.params.id);
  if (isNaN(budgetId)) {
    return ResponseBuilder.error(res, 400, "Invalid budget ID");
  }

  const { error, validatedData } = validateUpdateBudget(req.body);
  if (error) {
    return ResponseBuilder.error(res, 400, "Validation error", error.details[0].message);
  }

  const userId = req.user?.id;
  if (!userId) {
    return ResponseBuilder.error(res, 401, "User is not authenticated");
  }

  try {
    const budget = await Budget.findOne({
      where: { id: budgetId, userId, deleted: 0 },
    });

    if (!budget) {
      return ResponseBuilder.error(res, 404, "Budget not found");
    }

    await budget.update({
      amount: validatedData!.amount,
    });

    return ResponseBuilder.success(res, 200, "Budget updated successfully", budget);
  } catch (err: any) {
    return ResponseBuilder.error(res, 500, "Server error", err.message || String(err));
  }
};

// Delete Budget
export const deleteBudget = async (req: Request, res: Response): Promise<Response | void> => {
  const budgetId = Number(req.params.id);
  if (isNaN(budgetId)) {
    return ResponseBuilder.error(res, 400, "Invalid budget ID");
  }

  const userId = req.user?.id;
  if (!userId) {
    return ResponseBuilder.error(res, 401, "User is not authenticated");
  }

  try {
    const budget = await Budget.findOne({
      where: { id: budgetId, userId, deleted: 0 },
    });

    if (!budget) {
      return ResponseBuilder.error(res, 404, "Budget not found");
    }

    await budget.update({
      deleted: 1,
      deletedAt: new Date(),
    });

    return ResponseBuilder.success(res, 200, "Budget deleted successfully");
  } catch (err: any) {
    return ResponseBuilder.error(res, 500, "Server error", err.message || String(err));
  }
};

// Get Budgets (along with real-time tracked utilization)
export const getBudgets = async (req: Request, res: Response): Promise<Response | void> => {
  const userId = req.user?.id;
  if (!userId) {
    return ResponseBuilder.error(res, 401, "User is not authenticated");
  }

  // Default to current month (YYYY-MM) if not specified
  let month = req.query.month as string;
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    const now = new Date();
    month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  try {
    // 1. Fetch all active budgets for the user in the given month
    const budgets = await Budget.findAll({
      where: { userId, month, deleted: 0 },
    });

    // 2. Fetch all expense transactions for the user in the given month to calculate spent sums
    const transactions = await Transaction.findAll({
      where: {
        userId,
        type: "expense",
        deleted: 0,
        date: {
          [Op.like]: `${month}-%`,
        },
      },
    });

    // 3. Aggregate spending by category
    const categorySpending: { [key: string]: number } = {};
    transactions.forEach((tx) => {
      categorySpending[tx.category] = (categorySpending[tx.category] || 0) + Number(tx.amount);
    });

    // 4. Map budgets to include utilization details
    const result = budgets.map((b) => {
      const spent = categorySpending[b.category] || 0;
      const percent = b.amount > 0 ? Number(((spent / b.amount) * 100).toFixed(1)) : 0;
      return {
        id: b.id,
        category: b.category,
        amount: Number(b.amount),
        month: b.month,
        spent,
        percent,
        isExceeded: spent > b.amount,
      };
    });

    return ResponseBuilder.success(res, 200, "Budgets retrieved successfully", { result });
  } catch (err: any) {
    return ResponseBuilder.error(res, 500, "Server error", err.message || String(err));
  }
};
