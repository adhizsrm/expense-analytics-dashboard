import { Request, Response, NextFunction } from "express";
import { body, query, validationResult } from "express-validator";

export const validateExpenseInput = [
  body()
    .isString()
    .withMessage("Input must be a string")
    .notEmpty()
    .withMessage("Input cannot be empty")
    .isLength({ max: 1000000 })
    .withMessage("Input too large (max 1MB)"),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map((e) => {
          if (e.type === 'field') {
            return { field: e.path, message: e.msg };
          }
          return { field: 'unknown', message: e.msg };
        }),
      });
    }
    next();
  },
];

export const validateFilterQuery = [
  query("category").optional().isString().trim().notEmpty(),
  query("startDate").optional().isISO8601(),
  query("endDate").optional().isISO8601(),
  query("minAmount").optional().isFloat({ min: 0 }),
  query("maxAmount").optional().isFloat({ min: 0 }),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map((e) => {
          if (e.type === 'field') {
            return { field: e.path, message: e.msg };
          }
          return { field: 'unknown', message: e.msg };
        }),
      });
    }
    next();
  },
];
