export interface Expense {
    id: string;
    date: string; // Stored as DD-MM-YYYY or similar string based on parsing
    description: string;
    amount: number;
    category: string;
    lineNumber: number;
}

export interface ExpenseAnalytics {
    totalExpenses: number;
    totalAmount: number;
    averageAmount: number;
    categoriesCount: number;
    highestExpense: Expense | null;
    lowestExpense: Expense | null;
}

export interface FilterSettings {
    category?: string;
    startDate?: string; // ISO or DD-MM-YYYY string
    endDate?: string;
    minAmount?: string | number;
    maxAmount?: string | number;
}
