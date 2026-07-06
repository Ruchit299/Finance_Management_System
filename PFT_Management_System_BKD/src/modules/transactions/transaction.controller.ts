import { Op } from "sequelize";
import type { Request, Response } from "express";
import { Transaction } from "./transaction.model.ts";
import { Category } from "../category/category.model.ts";
import { Investment } from "../investment/investment.model.ts";
import {
  validateCreateTransaction,
  validateUpdateTransaction,
  validateFilterTransaction,
} from "./transaction.validation.ts";
import ResponseBuilder from "../../helper/responce-builder/responseBuilder.ts";

const transactionRelations = [
  { model: Category, attributes: ["id", "name"] },
  { model: Investment, as: "Investment", attributes: ["id", "name", "status", "amount", "targetAmount"] },
];

const findUserInvestment = async (investmentId: number, userId: number) => {
  return Investment.findOne({
    where: { id: investmentId, userId, deleted: 0 },
  });
};

// Create Transaction
export const createTransaction = async (req: Request, res: Response): Promise<Response | void> => {
  const { error, validatedData } = validateCreateTransaction(req.body);
  if (error) {
    return ResponseBuilder.error(res, 400, "Validation error", error.details[0].message);
  }

  const userId = req.user?.id;
  if (!userId) {
    return ResponseBuilder.error(res, 401, "User is not authenticated");
  }

  try {
    if (validatedData!.investmentId !== undefined) {
      const investment = await findUserInvestment(validatedData!.investmentId, userId);
      if (!investment) {
        return ResponseBuilder.error(res, 400, "Validation error", "Invalid investment ID");
      }

      if (investment.categoryId !== validatedData!.categoryId) {
        return ResponseBuilder.error(res, 400, "Validation error", "Investment transactions must use the investment's category");
      }
    }

    const transaction = await Transaction.create({
      userId,
      amount: validatedData!.amount,
      type: validatedData!.type,
      categoryId: validatedData!.categoryId,
      paymentMethod: validatedData!.paymentMethod || "Cash",
      date: new Date(validatedData!.date),
      notes: validatedData!.notes || null,
      investmentId: validatedData!.investmentId ?? null,
      deleted: 0,
    });

    await transaction.reload({
      include: transactionRelations,
    });

    return ResponseBuilder.success(res, 201, "Transaction created successfully", transaction.toJSON());
  } catch (err: any) {
    return ResponseBuilder.error(res, 500, "Server error", err.message || String(err));
  }
};

// Update Transaction
export const updateTransaction = async (req: Request, res: Response): Promise<Response | void> => {
  const transactionId = Number(req.params.id);
  if (isNaN(transactionId)) {
    return ResponseBuilder.error(res, 400, "Invalid transaction ID");
  }

  const { error, validatedData } = validateUpdateTransaction(req.body);
  if (error) {
    return ResponseBuilder.error(res, 400, "Validation error", error.details[0].message);
  }

  const userId = req.user?.id;
  if (!userId) {
    return ResponseBuilder.error(res, 401, "User is not authenticated");
  }

  try {
    const transaction = await Transaction.findOne({
      where: { id: transactionId, userId, deleted: 0 },
    });

    if (!transaction) {
      return ResponseBuilder.error(res, 404, "Transaction not found");
    }

    const nextInvestmentId = validatedData?.investmentId !== undefined ? validatedData.investmentId : transaction.investmentId;
    let nextCategoryId = validatedData?.categoryId !== undefined ? validatedData.categoryId : transaction.categoryId;

    if (nextInvestmentId !== null && nextInvestmentId !== undefined) {
      const investment = await findUserInvestment(nextInvestmentId, userId);
      if (!investment) {
        return ResponseBuilder.error(res, 400, "Validation error", "Invalid investment ID");
      }

      if (validatedData?.categoryId !== undefined && validatedData.categoryId !== investment.categoryId) {
        return ResponseBuilder.error(res, 400, "Validation error", "Investment transactions must use the investment's category");
      }

      nextCategoryId = investment.categoryId;
    }

    await transaction.update({
      amount: validatedData?.amount !== undefined ? validatedData.amount : transaction.amount,
      type: validatedData?.type !== undefined ? validatedData.type : transaction.type,
      categoryId: nextCategoryId,
      paymentMethod: validatedData?.paymentMethod !== undefined ? validatedData.paymentMethod : transaction.paymentMethod,
      date: validatedData?.date !== undefined ? new Date(validatedData.date) : transaction.date,
      notes: validatedData?.notes !== undefined ? (validatedData.notes || null) : transaction.notes,
      investmentId: nextInvestmentId,
    });

    await transaction.reload({
      include: transactionRelations,
    });

    return ResponseBuilder.success(res, 200, "Transaction updated successfully", transaction.toJSON());
  } catch (err: any) {
    return ResponseBuilder.error(res, 500, "Server error", err.message || String(err));
  }
};

// Delete Transaction
export const deleteTransaction = async (req: Request, res: Response): Promise<Response | void> => {
  const transactionId = Number(req.params.id);
  if (isNaN(transactionId)) {
    return ResponseBuilder.error(res, 400, "Invalid transaction ID");
  }

  const userId = req.user?.id;
  if (!userId) {
    return ResponseBuilder.error(res, 401, "User is not authenticated");
  }

  try {
    const transaction = await Transaction.findOne({
      where: { id: transactionId, userId, deleted: 0 },
    });

    if (!transaction) {
      return ResponseBuilder.error(res, 404, "Transaction not found");
    }

    await transaction.update({
      deleted: 1,
      deletedAt: new Date(),
    });

    return ResponseBuilder.success(res, 200, "Transaction deleted successfully");
  } catch (err: any) {
    return ResponseBuilder.error(res, 500, "Server error", err.message || String(err));
  }
};

// Get Transactions (with filtering & search)
export const getTransactions = async (req: Request, res: Response): Promise<Response | void> => {
  const { error, validatedData } = validateFilterTransaction(req.query);
  if (error) {
    return ResponseBuilder.error(res, 400, "Validation error", error.details[0].message);
  }

  const userId = req.user?.id;
  if (!userId) {
    return ResponseBuilder.error(res, 401, "User is not authenticated");
  }

  try {
    const whereClause: any = {
      userId,
      deleted: 0,
    };

    // Date range filter
    if (validatedData?.startDate || validatedData?.endDate) {
      whereClause.date = {};
      if (validatedData.startDate) {
        whereClause.date[Op.gte] = validatedData.startDate;
      }
      if (validatedData.endDate) {
        whereClause.date[Op.lte] = validatedData.endDate;
      }
    }

    // Category filter
    if (validatedData?.categoryId !== undefined) {
      whereClause.categoryId = validatedData.categoryId;
    }

    // Investment filter
    if (validatedData?.investmentId !== undefined) {
      whereClause.investmentId = validatedData.investmentId;
    }

    // Type filter
    if (validatedData?.type) {
      whereClause.type = validatedData.type;
    }

    // Payment Method filter
    if (validatedData?.paymentMethod) {
      whereClause.paymentMethod = validatedData.paymentMethod;
    }

    // Amount range filter
    if (validatedData?.minAmount !== undefined || validatedData?.maxAmount !== undefined) {
      whereClause.amount = {};
      if (validatedData.minAmount !== undefined) {
        whereClause.amount[Op.gte] = validatedData.minAmount;
      }
      if (validatedData.maxAmount !== undefined) {
        whereClause.amount[Op.lte] = validatedData.maxAmount;
      }
    }

    const transactions = await Transaction.findAll({
      where: whereClause,
      include: transactionRelations,
      order: [["date", "DESC"], ["createdAt", "DESC"]],
    });

    return ResponseBuilder.success(res, 200, "Transactions retrieved successfully", { result: transactions });
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
      deleted: 0,
    });

    await transaction.reload({
      include: transactionRelations,
    });

    return ResponseBuilder.success(res, 201, "Investment contribution recorded successfully", transaction.toJSON());
  } catch (err: any) {
    return ResponseBuilder.error(res, 500, "Server error", err.message || String(err));
  }
};