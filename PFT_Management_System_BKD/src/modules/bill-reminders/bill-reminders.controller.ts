import type { Request, Response } from "express";
import { BillReminder } from "./bill-reminders.model.ts";
import { Category } from "../category/category.model.ts";
import { Transaction } from "../transactions/transaction.model.ts";
import { validateCreateBillReminder, validateUpdateBillReminder } from "./bill-reminders.validation.ts";
import ResponseBuilder from "../../helper/responce-builder/responseBuilder.ts";

// Helper: compute days until due
function getDaysUntilDue(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// Alert levels: overdue / due-soon (1,3,7 days) / ok
function getAlertLevel(daysLeft: number, isPaid: number): string {
  if (isPaid) return "paid";
  if (daysLeft < 0) return "overdue";
  if (daysLeft <= 1) return "critical";
  if (daysLeft <= 3) return "warning";
  if (daysLeft <= 7) return "soon";
  return "ok";
}

// Create
export const createBillReminder = async (req: Request, res: Response): Promise<Response | void> => {
  const { error, validatedData } = validateCreateBillReminder(req.body);
  if (error) return ResponseBuilder.error(res, 400, "Validation error", error.details[0].message);

  const userId = req.user?.id;
  if (!userId) return ResponseBuilder.error(res, 401, "User is not authenticated");

  try {
    const bill = await BillReminder.create({
      userId,
      name: validatedData!.name,
      amount: validatedData!.amount,
      dueDate: validatedData!.dueDate,
      categoryId: validatedData!.categoryId,
      notes: validatedData!.notes || null,
      isPaid: 0,
      deleted: 0,
    });

    await bill.reload({
      include: [{ model: Category, attributes: ["id", "name"] }],
    });

    return ResponseBuilder.success(res, 201, "Bill reminder created successfully", { bill });
  } catch (err: any) {
    return ResponseBuilder.error(res, 500, "Server error", err.message || String(err));
  }
};

// Get All
export const getBillReminders = async (req: Request, res: Response): Promise<Response | void> => {
  const userId = req.user?.id;
  if (!userId) return ResponseBuilder.error(res, 401, "User is not authenticated");

  try {
    const bills = await BillReminder.findAll({
      where: { userId, deleted: 0 },
      include: [{ model: Category, attributes: ["id", "name"] }],
      order: [["due_date", "ASC"]],
    });

    const result = bills.map((b) => {
      const daysLeft = getDaysUntilDue(b.dueDate);
      const alertLevel = getAlertLevel(daysLeft, b.isPaid);
      return {
        id: b.id,
        name: b.name,
        amount: Number(b.amount),
        dueDate: b.dueDate,
        categoryId: b.categoryId,
        Category: (b as any).Category,
        notes: b.notes,
        isPaid: b.isPaid === 1,
        daysLeft,
        alertLevel,
      };
    });

    return ResponseBuilder.success(res, 200, "Bill reminders retrieved", { result });
  } catch (err: any) {
    return ResponseBuilder.error(res, 500, "Server error", err.message || String(err));
  }
};

// Update
export const updateBillReminder = async (req: Request, res: Response): Promise<Response | void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) return ResponseBuilder.error(res, 400, "Invalid ID");

  const { error, validatedData } = validateUpdateBillReminder(req.body);
  if (error) return ResponseBuilder.error(res, 400, "Validation error", error.details[0].message);

  const userId = req.user?.id;
  if (!userId) return ResponseBuilder.error(res, 401, "User is not authenticated");

  try {
    const bill = await BillReminder.findOne({ where: { id, userId, deleted: 0 } });
    if (!bill) return ResponseBuilder.error(res, 404, "Bill reminder not found");

    await bill.update({
      name: validatedData!.name ?? bill.name,
      amount: validatedData!.amount ?? bill.amount,
      dueDate: validatedData!.dueDate ?? bill.dueDate,
      categoryId: validatedData!.categoryId ?? bill.categoryId,
      notes: validatedData!.notes !== undefined ? validatedData!.notes : bill.notes,
    });

    await bill.reload({
      include: [{ model: Category, attributes: ["id", "name"] }],
    });

    return ResponseBuilder.success(res, 200, "Bill reminder updated successfully", { bill });
  } catch (err: any) {
    return ResponseBuilder.error(res, 500, "Server error", err.message || String(err));
  }
};

// Mark as Paid
export const markBillAsPaid = async (req: Request, res: Response): Promise<Response | void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) return ResponseBuilder.error(res, 400, "Invalid ID");

  const userId = req.user?.id;
  if (!userId) return ResponseBuilder.error(res, 401, "User is not authenticated");

  try {
    const bill = await BillReminder.findOne({ where: { id, userId, deleted: 0 } });
    if (!bill) return ResponseBuilder.error(res, 404, "Bill reminder not found");

    const originalPaidStatus = bill.isPaid;
    const nextPaidStatus = originalPaidStatus === 1 ? 0 : 1;

    if (nextPaidStatus === 1) {
      // Create expense transaction
      await Transaction.create({
        userId,
        amount: bill.amount,
        type: "expense",
        categoryId: bill.categoryId,
        date: new Date(),
        notes: `Paid Bill: ${bill.name}`,
        deleted: 0,
      });
    } else {
      // Find and soft-delete the transaction
      const matchedTx = await Transaction.findOne({
        where: {
          userId,
          amount: bill.amount,
          type: "expense",
          categoryId: bill.categoryId,
          notes: `Paid Bill: ${bill.name}`,
          deleted: 0,
        },
        order: [["createdAt", "DESC"]],
      });
      if (matchedTx) {
        await matchedTx.update({
          deleted: 1,
          deletedAt: new Date(),
        });
      }
    }

    await bill.update({ isPaid: nextPaidStatus });
    return ResponseBuilder.success(res, 200, `Bill marked as ${nextPaidStatus === 1 ? "paid" : "unpaid"}`);
  } catch (err: any) {
    return ResponseBuilder.error(res, 500, "Server error", err.message || String(err));
  }
};

// Delete
export const deleteBillReminder = async (req: Request, res: Response): Promise<Response | void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) return ResponseBuilder.error(res, 400, "Invalid ID");

  const userId = req.user?.id;
  if (!userId) return ResponseBuilder.error(res, 401, "User is not authenticated");

  try {
    const bill = await BillReminder.findOne({ where: { id, userId, deleted: 0 } });
    if (!bill) return ResponseBuilder.error(res, 404, "Bill reminder not found");

    await bill.update({ deleted: 1, deletedAt: new Date() });
    return ResponseBuilder.success(res, 200, "Bill reminder deleted successfully");
  } catch (err: any) {
    return ResponseBuilder.error(res, 500, "Server error", err.message || String(err));
  }
};
