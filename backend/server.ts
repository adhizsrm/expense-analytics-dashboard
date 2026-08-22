import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import expenseRoutes from "./routes/expenses.js";
import { initDB } from "./db/index.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.text({ limit: "10mb" }));

app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    message: "Expense Analytics API is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/expenses", expenseRoutes);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

app.listen(PORT, async () => {
  try {
    await initDB();
  } catch (error) {
    console.error("Database initialization failed:", error);
  }
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints:`);
  console.log(`   - POST http://localhost:${PORT}/api/expenses/parse`);
  console.log(`   - GET  http://localhost:${PORT}/api/expenses`);
  console.log(`   - GET  http://localhost:${PORT}/api/expenses/categories`);
});
