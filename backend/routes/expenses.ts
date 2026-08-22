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
import { pool } from "../db/index.js";

const router = express.Router();
let cachedExpenses: Expense[] = [];

router.post("/parse", validateExpenseInput, async (req: Request, res: Response) => {
  try {
    const expenses = parseExpenses(req.body as string);
    if (expenses.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "No valid expenses found" });
    }

    const client = await pool.connect();
    let insertedExpenses: Expense[] = [];

    try {
      await client.query('BEGIN');

      // Temporary dummy user to satisfy Checkpoint 1's NOT NULL constraint
      await client.query(`
        INSERT INTO users (id, email, password_hash) 
        VALUES (1, 'temp@expense.com', 'dummy_hash') 
        ON CONFLICT (email) DO NOTHING
      `);

      for (const exp of expenses) {
        const result = await client.query(
          `INSERT INTO expenses (user_id, date, description, amount, category) 
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [1, exp.date, exp.description, exp.amount, exp.category]
        );
        const row = result.rows[0];
        insertedExpenses.push({
          ...exp,
          id: String(row.id)
        });
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    cachedExpenses = insertedExpenses;
    const categoryTotals = calculateCategoryTotals(insertedExpenses);
    const analytics = getAnalytics(insertedExpenses);

    res.json({
      success: true,
      data: {
        expenses: insertedExpenses,
        categoryTotals,
        analytics,
        message: `Successfully parsed ${insertedExpenses.length} expenses`,
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
