import express, { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
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

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET as string,
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

export const validateForgotPassword = [
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
];

router.post("/forgot-password", validateForgotPassword, async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email } = req.body;

    try {
        const userResult = await pool.query("SELECT id, password_hash FROM users WHERE email = $1", [email]);

        let mockUrl = "";

        if (userResult.rows.length > 0) {
            const user = userResult.rows[0];
            const secret = process.env.JWT_SECRET as string;

            const derivedSecret = crypto
                .createHash("sha256")
                .update(secret + user.password_hash)
                .digest("hex");

            const token = jwt.sign(
                { userId: user.id, purpose: "password-reset" },
                derivedSecret,
                { expiresIn: "15m" }
            );

            const originBase = req.headers.origin || req.headers.referer || "http://localhost:5173";
            const cleanBase = originBase.endsWith('/') ? originBase.slice(0, -1) : originBase;

            mockUrl = `${cleanBase}/?resetToken=${token}`;
        }

        return res.json({
            success: true,
            message: "If that email is registered, a password reset link has been sent.",
            ...(mockUrl ? { dev_only_reset_url: mockUrl } : {})
        });
    } catch (error) {
        const err = error as Error;
        return res.status(500).json({ success: false, error: "Processing failed", details: err.message });
    }
});

export const validateResetPassword = [
    body("token").exists().withMessage("Token is required"),
    body("newPassword").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
];

router.post("/reset-password", validateResetPassword, async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { token, newPassword } = req.body;

    try {
        const decodedBase = jwt.decode(token) as { userId?: number; purpose?: string } | null;
        if (!decodedBase || !decodedBase.userId) {
            return res.status(400).json({ success: false, error: "Invalid token structure" });
        }

        const userResult = await pool.query("SELECT id, password_hash FROM users WHERE id = $1", [decodedBase.userId]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ success: false, error: "Invalid token" });
        }

        const user = userResult.rows[0];
        const secret = process.env.JWT_SECRET as string;
        const derivedSecret = crypto
            .createHash("sha256")
            .update(secret + user.password_hash)
            .digest("hex");

        const verified = jwt.verify(token, derivedSecret) as { purpose: string };

        if (verified.purpose !== "password-reset") {
            return res.status(400).json({ success: false, error: "Invalid token purpose" });
        }

        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [newPasswordHash, user.id]);

        return res.json({ success: true, message: "Password reset successfully. You may now log in." });
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(400).json({ success: false, error: "Token has expired" });
        }
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(400).json({ success: false, error: "Invalid token signature" });
        }
        const err = error as Error;
        return res.status(500).json({ success: false, error: "Reset failed", details: err.message });
    }
});

export default router;
