import type { Request, Response } from "express";
import { SavingsGoal } from "./savings-goals.model.ts";
import {
  validateCreateSavingsGoal,
  validateUpdateSavingsGoal,
  validateAddSavings,
} from "./savings-goals.validation.ts";
import ResponseBuilder from "../../helper/responce-builder/responseBuilder.ts";

// Create Savings Goal
export const createSavingsGoal = async (req: Request, res: Response): Promise<Response | void> => {
  const { error, validatedData } = validateCreateSavingsGoal(req.body);
  if (error) {
    return ResponseBuilder.error(res, 400, "Validation error", error.details[0].message);
  }

  const userId = req.user?.id;
  if (!userId) {
    return ResponseBuilder.error(res, 401, "User is not authenticated");
  }

  try {
    const goal = await SavingsGoal.create({
      userId,
      name: validatedData!.name,
      description: validatedData!.description || null,
      targetAmount: validatedData!.targetAmount,
      targetDate: validatedData!.targetDate,
      savedAmount: 0,
      deleted: 0,
    });

    return ResponseBuilder.success(res, 201, "Savings goal created successfully", { goal });
  } catch (err: any) {
    return ResponseBuilder.error(res, 500, "Server error", err.message || String(err));
  }
};

// Get All Savings Goals
export const getSavingsGoals = async (req: Request, res: Response): Promise<Response | void> => {
  const userId = req.user?.id;
  if (!userId) {
    return ResponseBuilder.error(res, 401, "User is not authenticated");
  }

  try {
    const goals = await SavingsGoal.findAll({
      where: { userId, deleted: 0 },
      order: [["createdAt", "DESC"]],
    });

    const result = goals.map((g) => {
      const percent =
        g.targetAmount > 0
          ? Number(((Number(g.savedAmount) / Number(g.targetAmount)) * 100).toFixed(1))
          : 0;
      const remaining = Math.max(0, Number(g.targetAmount) - Number(g.savedAmount));
      const isCompleted = Number(g.savedAmount) >= Number(g.targetAmount);
      const today = new Date();
      const target = new Date(g.targetDate);
      const daysLeft = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: g.id,
        name: g.name,
        description: g.description,
        targetAmount: Number(g.targetAmount),
        savedAmount: Number(g.savedAmount),
        targetDate: g.targetDate,
        percent,
        remaining,
        isCompleted,
        daysLeft,
      };
    });

    return ResponseBuilder.success(res, 200, "Savings goals retrieved successfully", { result });
  } catch (err: any) {
    return ResponseBuilder.error(res, 500, "Server error", err.message || String(err));
  }
};

// Update Savings Goal (edit name, description, targetAmount, targetDate)
export const updateSavingsGoal = async (req: Request, res: Response): Promise<Response | void> => {
  const goalId = Number(req.params.id);
  if (isNaN(goalId)) {
    return ResponseBuilder.error(res, 400, "Invalid goal ID");
  }

  const { error, validatedData } = validateUpdateSavingsGoal(req.body);
  if (error) {
    return ResponseBuilder.error(res, 400, "Validation error", error.details[0].message);
  }

  const userId = req.user?.id;
  if (!userId) {
    return ResponseBuilder.error(res, 401, "User is not authenticated");
  }

  try {
    const goal = await SavingsGoal.findOne({ where: { id: goalId, userId, deleted: 0 } });
    if (!goal) {
      return ResponseBuilder.error(res, 404, "Savings goal not found");
    }

    await goal.update({
      name: validatedData!.name ?? goal.name,
      description: validatedData!.description !== undefined ? validatedData!.description : goal.description,
      targetAmount: validatedData!.targetAmount ?? goal.targetAmount,
      targetDate: validatedData!.targetDate ?? goal.targetDate,
    });

    return ResponseBuilder.success(res, 200, "Savings goal updated successfully", { goal });
  } catch (err: any) {
    return ResponseBuilder.error(res, 500, "Server error", err.message || String(err));
  }
};

// Add Savings to a Goal (deposit)
export const addSavings = async (req: Request, res: Response): Promise<Response | void> => {
  const goalId = Number(req.params.id);
  if (isNaN(goalId)) {
    return ResponseBuilder.error(res, 400, "Invalid goal ID");
  }

  const { error, validatedData } = validateAddSavings(req.body);
  if (error) {
    return ResponseBuilder.error(res, 400, "Validation error", error.details[0].message);
  }

  const userId = req.user?.id;
  if (!userId) {
    return ResponseBuilder.error(res, 401, "User is not authenticated");
  }

  try {
    const goal = await SavingsGoal.findOne({ where: { id: goalId, userId, deleted: 0 } });
    if (!goal) {
      return ResponseBuilder.error(res, 404, "Savings goal not found");
    }

    const newSaved = Number(goal.savedAmount) + Number(validatedData!.amount);
    await goal.update({ savedAmount: newSaved });

    return ResponseBuilder.success(res, 200, "Savings added successfully", {
      savedAmount: newSaved,
      targetAmount: Number(goal.targetAmount),
      isCompleted: newSaved >= Number(goal.targetAmount),
    });
  } catch (err: any) {
    return ResponseBuilder.error(res, 500, "Server error", err.message || String(err));
  }
};

// Delete Savings Goal (soft delete)
export const deleteSavingsGoal = async (req: Request, res: Response): Promise<Response | void> => {
  const goalId = Number(req.params.id);
  if (isNaN(goalId)) {
    return ResponseBuilder.error(res, 400, "Invalid goal ID");
  }

  const userId = req.user?.id;
  if (!userId) {
    return ResponseBuilder.error(res, 401, "User is not authenticated");
  }

  try {
    const goal = await SavingsGoal.findOne({ where: { id: goalId, userId, deleted: 0 } });
    if (!goal) {
      return ResponseBuilder.error(res, 404, "Savings goal not found");
    }

    await goal.update({ deleted: 1, deletedAt: new Date() });

    return ResponseBuilder.success(res, 200, "Savings goal deleted successfully");
  } catch (err: any) {
    return ResponseBuilder.error(res, 500, "Server error", err.message || String(err));
  }
};
