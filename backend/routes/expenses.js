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

const router = express.Router();
let cachedExpenses = [];

router.post("/parse", validateExpenseInput, (req, res) => {
  try {
    const expenses = parseExpenses(req.body);
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
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to parse expenses",
        details: error.message,
      });
  }
});

router.get("/", validateFilterQuery, (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      minAmount: req.query.minAmount,
      maxAmount: req.query.maxAmount,
    };
    Object.keys(filters).forEach(
      (key) => filters[key] === undefined && delete filters[key]
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

router.get("/categories", (req, res) => {
  const categories = [...new Set(cachedExpenses.map((e) => e.category))].sort();
  res.json({ success: true, data: { categories } });
});

router.delete("/", (req, res) => {
  cachedExpenses = [];
  res.json({ success: true, message: "All expenses cleared" });
});

export default router;
