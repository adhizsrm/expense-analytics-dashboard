function normDate(s) {
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
  );
  return `${d}-${key ? monthMap[key] : "01"}-${y}`;
}

function parseDate(dateStr) {
  // handle both formats
  if (dateStr.includes("-") && dateStr.split("-")[0].length === 4) {
    // YYYY-MM-DD
    return new Date(dateStr);
  }

  // DD-MM-YYYY
  const [d, m, y] = dateStr.split("-");
  return new Date(y, m - 1, d);
}

export function parseExpenses(text) {
  const expenses = [];
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

export function calculateCategoryTotals(expenses) {
  return expenses.reduce((acc, expense) => {
    const cat = expense.category || "Uncategorized";
    acc[cat] = (acc[cat] || 0) + expense.amount;
    return acc;
  }, {});
}

export function filterExpenses(expenses, filters = {}) {
  let filtered = [...expenses];
  if (filters.category)
    filtered = filtered.filter(
      (e) => e.category.toLowerCase() === filters.category.toLowerCase(),
    );
  if (filters.startDate)
    filtered = filtered.filter(
      (e) => parseDate(e.date) >= parseDate(filters.startDate),
    );
  if (filters.endDate)
    filtered = filtered.filter(
      (e) => parseDate(e.date) <= parseDate(filters.endDate),
    );
  if (filters.minAmount !== undefined)
    filtered = filtered.filter(
      (e) => e.amount >= parseFloat(filters.minAmount),
    );
  if (filters.maxAmount !== undefined)
    filtered = filtered.filter(
      (e) => e.amount <= parseFloat(filters.maxAmount),
    );
  return filtered;
}

export function getAnalytics(expenses) {
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
