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

router.get("/", validateFilterQuery, async (req: Request, res: Response) => {
  try {
    let queryArgs: (string | number)[] = [1];
    let queryConditions = ["user_id = $1"]; // temp dummy user until Checkpoint 4

    if (req.query.category) {
      queryArgs.push(req.query.category as string);
      queryConditions.push(`LOWER(category) = LOWER($${queryArgs.length})`);
    }
    if (req.query.startDate) {
      queryArgs.push(req.query.startDate as string);
      queryConditions.push(`date >= $${queryArgs.length}`);
    }
    if (req.query.endDate) {
      queryArgs.push(req.query.endDate as string);
      queryConditions.push(`date <= $${queryArgs.length}`);
    }
    if (req.query.minAmount !== undefined) {
      queryArgs.push(parseFloat(req.query.minAmount as string));
      queryConditions.push(`amount >= $${queryArgs.length}`);
    }
    if (req.query.maxAmount !== undefined) {
      queryArgs.push(parseFloat(req.query.maxAmount as string));
      queryConditions.push(`amount <= $${queryArgs.length}`);
    }

    const whereClause = "WHERE " + queryConditions.join(" AND ");
    const sql = `SELECT id, TO_CHAR(date, 'YYYY-MM-DD') AS date, description, amount, category FROM expenses ${whereClause} ORDER BY date DESC`;

    const result = await pool.query(sql, queryArgs);

    const filtered: Expense[] = result.rows.map(row => ({
      ...row,
      id: String(row.id),
      amount: parseFloat(row.amount), // PG driver returns NUMERIC as string to preserve precision
    }));

    const categoryTotals = calculateCategoryTotals(filtered);
    const analytics = getAnalytics(filtered);

    res.json({
      success: true,
      data: {
        expenses: filtered,
        categoryTotals,
        analytics,
        filtersApplied: queryArgs.length > 1,
      },
    });
  } catch (error) {
    const err = error as Error;
    res
      .status(500)
      .json({ success: false, error: "Failed to filter expenses", details: err.message });
  }
});

router.get("/categories", async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT DISTINCT category FROM expenses WHERE user_id = 1 ORDER BY category");
    const categories = result.rows.map(row => row.category);
    res.json({ success: true, data: { categories } });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, error: "Failed to fetch categories", details: err.message });
  }
});

router.delete("/", async (req: Request, res: Response) => {
  try {
    await pool.query("DELETE FROM expenses WHERE user_id = 1");
    res.json({ success: true, message: "All expenses cleared" });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, error: "Failed to clear expenses", details: err.message });
  }
});

export default router;
