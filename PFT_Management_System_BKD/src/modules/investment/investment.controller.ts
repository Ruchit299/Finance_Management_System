import type { Request, Response } from "express";
import { Investment } from "./investment.model.ts";
import { Category } from "../category/category.model.ts";
import { Transaction } from "../transactions/transaction.model.ts";
import {
  validateCreateInvestment,
  validateUpdateInvestment,
} from "./investment.validation.ts";
import ResponseBuilder from "../../helper/responce-builder/responseBuilder.ts";

// Create Investment
export const createInvestment = async (req: Request, res: Response): Promise<Response | void> => {
  const { error, validatedData } = validateCreateInvestment(req.body);
  if (error) {
    return ResponseBuilder.error(res, 400, "Validation error", error.details[0].message);
  }

  const userId = req.user?.id;
  if (!userId) {
    return ResponseBuilder.error(res, 401, "User is not authenticated");
  }

  const start = new Date(validatedData!.startDate);
  const end = new Date(validatedData!.maturityDate);
  if (end < start) {
    return ResponseBuilder.error(res, 400, "Validation error", "Maturity date cannot be before start date");
  }

  try {
    // Verify that the Category exists and is an investment category
    const category = await Category.findOne({
      where: { id: validatedData!.categoryId, type: "investment", deleted: 0 },
    });
    if (!category) {
      return ResponseBuilder.error(res, 400, "Validation error", "Invalid investment category");
    }

    const investment = await Investment.create({
      userId,
      name: validatedData!.name,
      amount: validatedData!.amount,
      targetAmount: validatedData!.targetAmount,
      categoryId: validatedData!.categoryId,
      paymentMethod: validatedData!.paymentMethod || "Cash",
      startDate: validatedData!.startDate,
      maturityDate: validatedData!.maturityDate,
      notes: validatedData!.notes || null,
      status: validatedData!.status || "Active",
      deleted: 0,
    });

    // Automatically create a corresponding transaction record under Transactions
    await Transaction.create({
      userId,
      amount: validatedData!.amount,
      type: "expense",
      categoryId: validatedData!.categoryId,
      paymentMethod: validatedData!.paymentMethod || "Cash",
      date: new Date(validatedData!.startDate),
      notes: `Investment SIP: ${validatedData!.name}`,
      investmentId: investment.id,
      deleted: 0,
    });

    await investment.reload({
      include: [{ model: Category, attributes: ["id", "name"] }],
    });

    return ResponseBuilder.success(res, 201, "Investment plan created successfully", investment.toJSON());
  } catch (err: any) {
    return ResponseBuilder.error(res, 500, "Server error", err.message || String(err));
  }
};

// Get Investments
export const getInvestments = async (req: Request, res: Response): Promise<Response | void> => {
  const userId = req.user?.id;
  if (!userId) {
    return ResponseBuilder.error(res, 401, "User is not authenticated");
  }

  try {
    const investments = await Investment.findAll({
      where: { userId, deleted: 0 },
      include: [{ model: Category, attributes: ["id", "name"] }],
      order: [["startDate", "DESC"], ["createdAt", "DESC"]],
    });

    return ResponseBuilder.success(res, 200, "Investments retrieved successfully", { result: investments });
  } catch (err: any) {
    return ResponseBuilder.error(res, 500, "Server error", err.message || String(err));
  }
};

// Update Investment
export const updateInvestment = async (req: Request, res: Response): Promise<Response | void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return ResponseBuilder.error(res, 400, "Invalid investment ID");
  }

  const { error, validatedData } = validateUpdateInvestment(req.body);
  if (error) {
    return ResponseBuilder.error(res, 400, "Validation error", error.details[0].message);
  }

  const userId = req.user?.id;
  if (!userId) {
    return ResponseBuilder.error(res, 401, "User is not authenticated");
  }

  try {
    const investment = await Investment.findOne({
      where: { id, userId, deleted: 0 },
    });

    if (!investment) {
      return ResponseBuilder.error(res, 404, "Investment plan not found");
    }

    const nextStartDate = validatedData?.startDate !== undefined ? validatedData.startDate : investment.startDate;
    const nextMaturityDate = validatedData?.maturityDate !== undefined ? validatedData.maturityDate : investment.maturityDate;
    if (new Date(nextMaturityDate) < new Date(nextStartDate)) {
      return ResponseBuilder.error(res, 400, "Validation error", "Maturity date cannot be before start date");
    }

    if (validatedData?.categoryId !== undefined) {
      const category = await Category.findOne({
        where: { id: validatedData.categoryId, type: "investment", deleted: 0 },
      });
      if (!category) {
        return ResponseBuilder.error(res, 400, "Validation error", "Invalid investment category");
      }
    }

    await investment.update({
      name: validatedData?.name !== undefined ? validatedData.name : investment.name,
      amount: validatedData?.amount !== undefined ? validatedData.amount : investment.amount,
      targetAmount: validatedData?.targetAmount !== undefined ? validatedData.targetAmount : investment.targetAmount,
      categoryId: validatedData?.categoryId !== undefined ? validatedData.categoryId : investment.categoryId,
      paymentMethod: validatedData?.paymentMethod !== undefined ? validatedData.paymentMethod : investment.paymentMethod,
      startDate: nextStartDate,
      maturityDate: nextMaturityDate,
      notes: validatedData?.notes !== undefined ? (validatedData.notes || null) : investment.notes,
      status: validatedData?.status !== undefined ? validatedData.status : investment.status,
    });

    await investment.reload({
      include: [{ model: Category, attributes: ["id", "name"] }],
    });

    return ResponseBuilder.success(res, 200, "Investment plan updated successfully", investment.toJSON());
  } catch (err: any) {
    return ResponseBuilder.error(res, 500, "Server error", err.message || String(err));
  }
};

// Delete Investment
export const deleteInvestment = async (req: Request, res: Response): Promise<Response | void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return ResponseBuilder.error(res, 400, "Invalid investment ID");
  }

  const userId = req.user?.id;
  if (!userId) {
    return ResponseBuilder.error(res, 401, "User is not authenticated");
  }

  try {
    const investment = await Investment.findOne({
      where: { id, userId, deleted: 0 },
    });

    if (!investment) {
      return ResponseBuilder.error(res, 404, "Investment plan not found");
    }

    await investment.update({
      deleted: 1,
      deletedAt: new Date(),
    });

    // Also soft-delete any transactions linked to this investment plan
    await Transaction.update(
      { deleted: 1, deletedAt: new Date() },
      { where: { investmentId: id, userId } }
    );

    return ResponseBuilder.success(res, 200, "Investment plan deleted successfully");
  } catch (err: any) {
    return ResponseBuilder.error(res, 500, "Server error", err.message || String(err));
  }
};

// Record Contribution manually
export const recordContribution = async (req: Request, res: Response): Promise<Response | void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return ResponseBuilder.error(res, 400, "Invalid investment ID");
  }

  const userId = req.user?.id;
  if (!userId) {
    return ResponseBuilder.error(res, 401, "User is not authenticated");
  }

  try {
    const investment = await Investment.findOne({
      where: { id, userId, deleted: 0 },
    });

    if (!investment) {
      return ResponseBuilder.error(res, 404, "Investment plan not found");
    }

    const { date, amount, paymentMethod } = req.body;
    const txAmount = amount ? Number(amount) : Number(investment.amount);
    const txMethod = paymentMethod || investment.paymentMethod || "Cash";
    const txDate = date ? new Date(date) : new Date();

    const transaction = await Transaction.create({
      userId,
      amount: txAmount,
      type: "expense",
      categoryId: investment.categoryId,
      paymentMethod: txMethod,
      date: txDate,
      notes: `Investment SIP: ${investment.name}`,
      investmentId: investment.id,
      deleted: 0
    });

    return ResponseBuilder.success(res, 201, "Investment contribution recorded successfully", transaction.toJSON());
  } catch (err: any) {
    return ResponseBuilder.error(res, 500, "Server error", err.message || String(err));
  }
};
