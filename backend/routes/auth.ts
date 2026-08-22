import express, { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db/index.js";

const router = express.Router();

export const validateRegister = [
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long"),
];

router.post("/register", validateRegister, async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        const existingUser = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ success: false, error: "Email already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = await pool.query(
            "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at",
            [email, passwordHash]
        );

        res.status(201).json({
            success: true,
            data: newUser.rows[0],
            message: "User registered successfully",
        });
    } catch (error) {
        const err = error as Error;
        res.status(500).json({ success: false, error: "Registration failed", details: err.message });
    }
});

export const validateLogin = [
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("password").exists().withMessage("Password is required"),
];

router.post("/login", validateLogin, async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        const userResult = await pool.query("SELECT id, email, password_hash FROM users WHERE email = $1", [email]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ success: false, error: "Invalid email or password" });
        }

        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ success: false, error: "Invalid email or password" });
        }

        if (!process.env.JWT_SECRET) {
            console.warn("WARNING: JWT_SECRET is not defined in environment variables");
        }
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET || "fallback_secret",
            { expiresIn: "1d" }
        );

        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: String(user.id),
                    email: user.email,
                }
            },
            message: "Login successful"
        });
    } catch (error) {
        const err = error as Error;
        res.status(500).json({ success: false, error: "Login failed", details: err.message });
    }
});

export default router;
