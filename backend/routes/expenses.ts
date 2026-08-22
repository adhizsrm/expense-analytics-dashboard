import express from "express";
import {
  parseExpenses,
  calculateCategoryTotals,
  filterExpenses,
  getAnalytics,
} from "../utils/parser.js";
import {
  validateExpenseInput,
  validateFilterQuery,
} from "../middleware/validation.js";
import { Request, Response } from "express";
import { Expense } from "../types/index.js";

const router = express.Router();
let cachedExpenses: Expense[] = [];

router.post("/parse", validateExpenseInput, (req: Request, res: Response) => {
  try {
    const expenses = parseExpenses(req.body as string);
    if (expenses.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "No valid expenses found" });
    }
    cachedExpenses = expenses;
    const categoryTotals = calculateCategoryTotals(expenses);
    const analytics = getAnalytics(expenses);
    res.json({
      success: true,
      data: {
        expenses,
        categoryTotals,
        analytics,
        message: `Successfully parsed ${expenses.length} expenses`,
      },
    });
  } catch (error) {
    const err = error as Error;
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to parse expenses",
        details: err.message,
      });
  }
});

router.get("/", validateFilterQuery, (req: Request, res: Response) => {
  try {
    const filters = {
      category: req.query.category as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      minAmount: req.query.minAmount as string | undefined,
      maxAmount: req.query.maxAmount as string | undefined,
    };
    Object.keys(filters).forEach(
      (key) => {
        const k = key as keyof typeof filters;
        if (filters[k] === undefined) delete filters[k];
      }
    );
    const filtered = filterExpenses(cachedExpenses, filters);
    const categoryTotals = calculateCategoryTotals(filtered);
    const analytics = getAnalytics(filtered);
    res.json({
      success: true,
      data: {
        expenses: filtered,
        categoryTotals,
        analytics,
        filtersApplied: Object.keys(filters).length > 0,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: "Failed to filter expenses" });
  }
});

router.get("/categories", (req: Request, res: Response) => {
  const categories = [...new Set(cachedExpenses.map((e) => e.category))].sort();
  res.json({ success: true, data: { categories } });
});

router.delete("/", (req: Request, res: Response) => {
  cachedExpenses = [];
  res.json({ success: true, message: "All expenses cleared" });
});

export default router;
