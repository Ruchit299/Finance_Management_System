import { Op, fn, col, literal } from "sequelize";
import type { Request, Response } from "express";
import { Transaction } from "../transactions/transaction.model.ts";
import { Budget } from "../budget/budget.model.ts";
import { SavingsGoal } from "../savings-goals/savings-goals.model.ts";
import { Investment } from "../investment/investment.model.ts";
import { BillReminder } from "../bill-reminders/bill-reminders.model.ts";
import { RecurringTransaction } from "../recurring-transactions/recurring-transactions.model.ts";
import { Category } from "../category/category.model.ts";
import { processRecurringTransactions } from "../../helper/recurring-processor/recurringProcessor.ts";
import ResponseBuilder from "../../helper/responce-builder/responseBuilder.ts";

// Helper: current month string YYYY-MM
function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// Helper: last N months (YYYY-MM) in ascending order
function lastNMonths(n: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

export const getDashboardSummary = async (
  req: Request,
  res: Response
): Promise<Response | void> => {
  const userId = req.user?.id;
  if (!userId) return ResponseBuilder.error(res, 401, "User is not authenticated");

  await processRecurringTransactions();

  const month = req.query.month ? String(req.query.month) : currentMonth();
  const timeframe = req.query.timeframe === "alltime" ? "alltime" : "monthly";

  try {
    // ─── 1. All-time transactions (for total balance cards always) ───────────
    const allTransactions = await Transaction.findAll({
      where: { userId, deleted: 0 },
      attributes: ["amount", "type"],
    });

    const totalIncome = allTransactions
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + Number(t.amount), 0);
    const totalExpense = allTransactions
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + Number(t.amount), 0);
    const totalBalance = totalIncome - totalExpense;

    // ─── 2. Timeframe-specific transactions ──────────────────────────────────
    const [yStr, mStr] = month.split("-");
    const yearNum = Number(yStr);
    const monthNum = Number(mStr) - 1;
    const startOfMonth = new Date(Date.UTC(yearNum, monthNum, 1)).toISOString().split("T")[0];
    const endOfMonth = new Date(Date.UTC(yearNum, monthNum + 1, 0)).toISOString().split("T")[0];

    const txWhere: any = { userId, deleted: 0 };
    if (timeframe === "monthly") {
      txWhere.date = { [Op.between]: [startOfMonth, endOfMonth] };
    }

    const targetTxs = await Transaction.findAll({
      where: txWhere,
      attributes: ["amount", "type", "categoryId", "paymentMethod"],
    });

    const monthlyIncome = targetTxs
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + Number(t.amount), 0);
    const monthlyExpense = targetTxs
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + Number(t.amount), 0);
    const monthlySavings = monthlyIncome - monthlyExpense;

    // ─── 3. Budget utilization ───────────────────────────────────────────────
    const budgetWhere: any = { userId, deleted: 0 };
    if (timeframe === "monthly") {
      budgetWhere.month = month;
    }
    const budgets = await Budget.findAll({
      where: budgetWhere,
      include: [{ model: Category, attributes: ["id", "name"] }],
    });

    const categorySpending: { [k: number]: number } = {};
    targetTxs
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        categorySpending[t.categoryId] = (categorySpending[t.categoryId] || 0) + Number(t.amount);
      });

    // Group budgets by categoryId for all-time aggregation
    const budgetMap: { [catId: number]: { amount: number; Category: any } } = {};
    budgets.forEach((b) => {
      if (!budgetMap[b.categoryId]) {
        budgetMap[b.categoryId] = { amount: 0, Category: (b as any).Category };
      }
      budgetMap[b.categoryId].amount += Number(b.amount);
    });

    const budgetDetails = Object.entries(budgetMap).map(([catIdStr, bInfo]) => {
      const categoryId = Number(catIdStr);
      const spent = categorySpending[categoryId] || 0;
      const percent = bInfo.amount > 0 ? Number(((spent / bInfo.amount) * 100).toFixed(1)) : 0;
      return {
        category: bInfo.Category?.name || '-',
        budgetAmount: bInfo.amount,
        spent,
        percent,
        isExceeded: spent > bInfo.amount,
        remaining: Math.max(0, bInfo.amount - spent),
      };
    });

    const totalBudget = Object.values(budgetMap).reduce((s, b) => s + b.amount, 0);
    const totalBudgetSpent = Object.keys(budgetMap).reduce((s, catIdStr) => s + (categorySpending[Number(catIdStr)] || 0), 0);
    const overallBudgetUtilization =
      totalBudget > 0 ? Number(((totalBudgetSpent / totalBudget) * 100).toFixed(1)) : 0;

    // ─── 4. Category-wise expenses (current timeframe) ───────────────────────
    const allCategories = await Category.findAll();
    const categoryMap: { [id: number]: string } = {};
    allCategories.forEach((c) => {
      categoryMap[c.id] = c.name;
    });

    const categoryExpenses = Object.entries(categorySpending)
      .map(([categoryIdStr, amount]) => {
        const categoryId = Number(categoryIdStr);
        return {
          category: categoryMap[categoryId] || '-',
          amount,
          percent:
            monthlyExpense > 0 ? Number(((amount / monthlyExpense) * 100).toFixed(1)) : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    // ─── 4.5. Payment Method breakdown (expenses only) ──────────────────────
    const paymentMethodSpending: { [k: string]: number } = { Cash: 0, UPI: 0, Online: 0 };
    targetTxs
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const method = t.paymentMethod || "Cash";
        paymentMethodSpending[method] = (paymentMethodSpending[method] || 0) + Number(t.amount);
      });

    const paymentMethodBreakdown = Object.entries(paymentMethodSpending).map(([method, amount]) => {
      return {
        method,
        amount,
        percent: monthlyExpense > 0 ? Number(((amount / monthlyExpense) * 100).toFixed(1)) : 0
      };
    });

    // ─── 4.7. Investment Plans (Active only) ─────────────────────────────────
    const activeInvestments = await Investment.findAll({
      where: { userId, deleted: 0 },
      include: [{ model: Category, attributes: ["id", "name"] }],
    });

    const investmentDetails = await Promise.all(
      activeInvestments.map(async (inv) => {
        const contributions = await Transaction.findAll({
          where: { investmentId: inv.id, userId, deleted: 0 },
          attributes: ["amount"],
        });

        const totalContributed = contributions.reduce((s, t) => s + Number(t.amount), 0);
        const rawPercent = inv.targetAmount > 0 ? Number(((totalContributed / inv.targetAmount) * 100).toFixed(1)) : 0;

        return {
          id: inv.id,
          name: inv.name,
          category: (inv as any).Category?.name || '-',
          amount: Number(inv.amount),
          targetAmount: Number(inv.targetAmount),
          totalContributed,
          percent: rawPercent > 100 ? 100 : rawPercent,
          maturityDate: inv.maturityDate,
          status: inv.status,
        };
      })
    );

    // ─── 5. Monthly spending trend (last 6 months) ───────────────────────────
    const months6 = lastNMonths(6);
    const trendData = await Promise.all(
      months6.map(async (m) => {
        const [tyStr, tmStr] = m.split("-");
        const ty = Number(tyStr);
        const tm = Number(tmStr) - 1;
        const tStart = new Date(Date.UTC(ty, tm, 1)).toISOString().split("T")[0];
        const tEnd = new Date(Date.UTC(ty, tm + 1, 0)).toISOString().split("T")[0];

        const txs = await Transaction.findAll({
          where: { userId, deleted: 0, date: { [Op.between]: [tStart, tEnd] } },
          attributes: ["amount", "type"],
        });
        const inc = txs.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
        const exp = txs.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
        return { month: m, income: inc, expense: exp };
      })
    );

    // ─── 6. Savings Goals summary ────────────────────────────────────────────
    const savingsGoals = await SavingsGoal.findAll({
      where: { userId, deleted: 0 },
      order: [["createdAt", "DESC"]],
      limit: 4,
    });

    const goalsData = savingsGoals.map((g) => {
      const percent =
        Number(g.targetAmount) > 0
          ? Number(((Number(g.savedAmount) / Number(g.targetAmount)) * 100).toFixed(1))
          : 0;
      return {
        id: g.id,
        name: g.name,
        targetAmount: Number(g.targetAmount),
        savedAmount: Number(g.savedAmount),
        percent,
        isCompleted: Number(g.savedAmount) >= Number(g.targetAmount),
        targetDate: g.targetDate,
      };
    });

    // ─── 7. Bill Reminders — upcoming & overdue ──────────────────────────────
    const bills = await BillReminder.findAll({
      where: { userId, deleted: 0, isPaid: 0 },
      include: [{ model: Category, attributes: ["id", "name"] }],
      order: [["due_date", "ASC"]],
      limit: 5,
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const billsData = bills.map((b) => {
      const due = new Date(b.dueDate);
      const daysLeft = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      let alertLevel = "ok";
      if (daysLeft < 0) alertLevel = "overdue";
      else if (daysLeft <= 1) alertLevel = "critical";
      else if (daysLeft <= 3) alertLevel = "warning";
      else if (daysLeft <= 7) alertLevel = "soon";
      return {
        id: b.id,
        name: b.name,
        amount: Number(b.amount),
        dueDate: b.dueDate,
        category: (b as any).Category?.name || '-',
        daysLeft,
        alertLevel,
      };
    });

    const overdueCount = billsData.filter((b) => b.alertLevel === "overdue").length;
    const dueSoonCount = billsData.filter((b) =>
      ["critical", "warning", "soon"].includes(b.alertLevel)
    ).length;

    // ─── 8. Recurring transactions count ─────────────────────────────────────
    const recurringCount = await RecurringTransaction.count({
      where: { userId, deleted: 0, isActive: 1 },
    });

    // ─── 8b. Fetch unique transaction months for dropdown ────────────────────
    const txDates = await Transaction.findAll({
      where: { userId, deleted: 0 },
      attributes: ["date"],
      raw: true,
    });
    const uniqueMonthsSet = new Set<string>();
    uniqueMonthsSet.add(currentMonth());
    txDates.forEach((t: any) => {
      if (t.date) {
        const dateStr = typeof t.date === "string" ? t.date : new Date(t.date).toISOString().split("T")[0];
        const mStr = dateStr.substring(0, 7);
        if (/^\d{4}-\d{2}$/.test(mStr)) {
          uniqueMonthsSet.add(mStr);
        }
      }
    });
    const availableMonths = Array.from(uniqueMonthsSet).sort().reverse();

    // ─── 9. Recent transactions (last 5) ─────────────────────────────────────
    const recentTransactions = await Transaction.findAll({
      where: { userId, deleted: 0 },
      include: [{ model: Category, attributes: ["id", "name"] }],
      order: [["date", "DESC"], ["createdAt", "DESC"]],
      limit: 5,
      attributes: ["id", "amount", "type", "categoryId", "paymentMethod", "date", "notes"],
    });

    return ResponseBuilder.success(res, 200, "Dashboard data retrieved successfully", {
      summary: {
        totalBalance,
        monthlyIncome,
        monthlyExpense,
        monthlySavings,
        overallBudgetUtilization,
        month,
        timeframe,
      },
      availableMonths,
      budgetDetails,
      categoryExpenses,
      paymentMethodBreakdown,
      trendData,
      investments: investmentDetails,
      savingsGoals: goalsData,
      bills: billsData,
      billAlerts: { overdueCount, dueSoonCount },
      recurringCount,
      recentTransactions: recentTransactions.map((t) => ({
        id: t.id,
        amount: Number(t.amount),
        type: t.type,
        category: (t as any).Category?.name || '-',
        paymentMethod: t.paymentMethod,
        date: t.date,
        notes: t.notes,
      })),
    });
  } catch (err: any) {
    return ResponseBuilder.error(res, 500, "Server error", err.message || String(err));
  }
};
