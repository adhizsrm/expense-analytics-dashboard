import { Expense, ExpenseAnalytics, FilterSettings } from "../types/index.js";

function normDate(s: string): string {
  const m = s.trim().match(/^(\d{2})-([A-Za-z]+)-(\d{4})/);
  if (!m) return s.trim();
  const [, d, mon, y] = m;
  const monthMap = {
    Jan: "01",
    January: "01",
    Feb: "02",
    February: "02",
    Mar: "03",
    March: "03",
    Apr: "04",
    April: "04",
    May: "05",
    Jun: "06",
    June: "06",
    Jul: "07",
    July: "07",
    Aug: "08",
    August: "08",
    Sep: "09",
    Sept: "09",
    September: "09",
    Oct: "10",
    October: "10",
    Nov: "11",
    November: "11",
    Dec: "12",
    December: "12",
  };
  const key = Object.keys(monthMap).find(
    (k) => k.toLowerCase() === mon.toLowerCase().replace(/\.$/, ""),
  ) as keyof typeof monthMap | undefined;
  return `${d}-${key ? monthMap[key] : "01"}-${y}`;
}

function parseDate(dateStr: string): Date {
  // handle both formats
  if (dateStr.includes("-") && dateStr.split("-")[0].length === 4) {
    // YYYY-MM-DD
    return new Date(dateStr);
  }

  // DD-MM-YYYY
  const [d, m, y] = dateStr.split("-");
  return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
}

export function parseExpenses(text: string): Expense[] {
  const expenses: Expense[] = [];
  let currentDate = null;
  let lineNumber = 0;
  for (const rawLine of text.split(/\r?\n/)) {
    lineNumber++;
    const line = rawLine.trim();
    if (!line) continue;
    const mDate = line.match(/^(\d{2}-[A-Za-z]+-\d{4})(?:\s*\(.*?\))?$/);
    if (mDate) {
      currentDate = normDate(mDate[1]);
      continue;
    }
    const mItem = line.match(
      /^(.*?)\s*[–-]\s*([0-9,]+(?:\.[0-9]+)?)\s*(?:\(([^)]+)\))?$/,
    );
    if (mItem && currentDate) {
      const description = mItem[1].trim();
      const amount = parseFloat(mItem[2].replace(/,/g, ""));
      const category = (mItem[3] || "Uncategorized").trim();
      if (!isNaN(amount) && amount >= 0) {
        expenses.push({
          id: `${currentDate}-${expenses.length}`,
          date: currentDate,
          description,
          amount,
          category,
          lineNumber,
        });
      }
    }
  }
  return expenses;
}

export function calculateCategoryTotals(expenses: Expense[]): Record<string, number> {
  return expenses.reduce((acc, expense) => {
    const cat = expense.category || "Uncategorized";
    acc[cat] = (acc[cat] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);
}

export function filterExpenses(expenses: Expense[], filters: FilterSettings = {}): Expense[] {
  let filtered = [...expenses];
  const cat = filters.category;
  if (cat)
    filtered = filtered.filter(
      (e) => e.category.toLowerCase() === cat.toLowerCase(),
    );
  const start = filters.startDate;
  if (start)
    filtered = filtered.filter(
      (e) => parseDate(e.date) >= parseDate(start),
    );
  const end = filters.endDate;
  if (end)
    filtered = filtered.filter(
      (e) => parseDate(e.date) <= parseDate(end),
    );
  const minAmt = filters.minAmount;
  if (minAmt !== undefined)
    filtered = filtered.filter(
      (e) => e.amount >= (typeof minAmt === 'string' ? parseFloat(minAmt) : minAmt),
    );
  const maxAmt = filters.maxAmount;
  if (maxAmt !== undefined)
    filtered = filtered.filter(
      (e) => e.amount <= (typeof maxAmt === 'string' ? parseFloat(maxAmt) : maxAmt),
    );
  return filtered;
}

export function getAnalytics(expenses: Expense[]): ExpenseAnalytics {
  if (expenses.length === 0)
    return {
      totalExpenses: 0,
      totalAmount: 0,
      averageAmount: 0,
      categoriesCount: 0,
      highestExpense: null,
      lowestExpense: null,
    };
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const categories = new Set(expenses.map((e) => e.category));
  return {
    totalExpenses: expenses.length,
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    averageAmount: parseFloat((totalAmount / expenses.length).toFixed(2)),
    categoriesCount: categories.size,
    highestExpense: expenses.reduce((max, e) =>
      e.amount > max.amount ? e : max,
    ),
    lowestExpense: expenses.reduce((min, e) =>
      e.amount < min.amount ? e : min,
    ),
  };
}
