import { body, query, validationResult } from "express-validator";

export const validateExpenseInput = [
  body()
    .isString()
    .withMessage("Input must be a string")
    .notEmpty()
    .withMessage("Input cannot be empty")
    .isLength({ max: 1000000 })
    .withMessage("Input too large (max 1MB)"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
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

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }
    next();
  },
];
