import { RecurringTransaction } from "../../modules/recurring-transactions/recurring-transactions.model.ts";
import { Transaction } from "../../modules/transactions/transaction.model.ts";
import { Op } from "sequelize";

// Helper: compute next due date based on frequency
function computeNextDueDate(fromDate: string, frequency: string): string {
  const d = new Date(fromDate);
  switch (frequency) {
    case "Daily":
      d.setDate(d.getDate() + 1);
      break;
    case "Weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "Monthly":
      d.setMonth(d.getMonth() + 1);
      break;
    case "Yearly":
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d.toISOString().split("T")[0];
}

export const processRecurringTransactions = async (): Promise<void> => {
  try {
    const todayStr = new Date().toISOString().split("T")[0];

    // Find all active, non-deleted recurring transactions that are due (nextDueDate <= todayStr)
    const dueRecurring = await RecurringTransaction.findAll({
      where: {
        isActive: 1,
        deleted: 0,
        nextDueDate: {
          [Op.lte]: todayStr,
        },
      },
    });

    for (const item of dueRecurring) {
      let currentDueDate = item.nextDueDate;

      // Keep generating transactions if multiple periods have passed (catch-up)
      while (currentDueDate <= todayStr) {
        // 1. Create the transaction
        await Transaction.create({
          userId: item.userId,
          amount: item.amount,
          type: item.type,
          categoryId: item.categoryId,
          paymentMethod: item.paymentMethod,
          recurringTransactionId: item.id,
          date: new Date(currentDueDate),
          notes: item.notes ? `${item.notes} (Recurring)` : `Recurring ${item.type}`,
          deleted: 0,
        });

        // 2. Advance the next due date
        currentDueDate = computeNextDueDate(currentDueDate, item.frequency);
      }

      // 3. Update the recurring transaction's next due date in DB
      await item.update({ nextDueDate: currentDueDate });
    }
  } catch (error) {
    console.error("Failed to process recurring transactions:", error);
  }
};
