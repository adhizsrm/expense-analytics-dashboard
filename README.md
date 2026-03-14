# Expense Analytics Dashboard

A full-stack expense analysis application that parses raw expense text, calculates analytics, and visualizes spending using interactive charts and tables.

Built with **React, TailwindCSS, Node.js, Express, and Recharts**.

---

# Features

• Upload or paste raw expense data
• Automatic parsing of expense entries
• Category-wise expense analysis
• Interactive pie chart visualization
• Sortable and paginated expense table
• Powerful filtering system
• Analytics summary (totals, averages, categories)
• Drag-and-drop file upload

---

# Tech Stack

## Frontend

* React
* Vite
* TailwindCSS
* Recharts
* Axios

## Backend

* Node.js
* Express
* Express Validator
* CORS

---

# Project Structure

```
expense-analytics-dashboard
│
├── backend
│   ├── middleware
│   │   └── validation.js
│   ├── routes
│   │   └── expenses.js
│   ├── utils
│   │   └── parser.js
│   └── server.js
│
└── frontend
    ├── src
    │   ├── components
    │   │   ├── CategoryPieChart.jsx
    │   │   ├── ExpenseTable.jsx
    │   │   ├── FileUpload.jsx
    │   │   ├── FilterPanel.jsx
    │   │   └── StatsCards.jsx
    │   ├── services
    │   │   └── api.js
    │   ├── App.jsx
    │   └── main.jsx
```

---

# Example Expense Input

```
02-Aug-2025
Petrol – 1985.64 (Transport)
Dinner – 523 (Restaurant)
Snacks – 174 (Snacks)
```

---

# API Endpoints

## Health Check

```
GET /api/health
```

## Parse Expenses

```
POST /api/expenses/parse
```

## Get Expenses (with filters)

```
GET /api/expenses
```

Query parameters:

```
category
startDate
endDate
minAmount
maxAmount
```

Example:

```
/api/expenses?category=Transport&minAmount=500
```

## Get Categories

```
GET /api/expenses/categories
```

## Clear Expenses

```
DELETE /api/expenses
```

---

# Installation

Clone the repository:

```
git clone https://github.com/yourusername/expense-analytics-dashboard.git
```

Navigate to the project:

```
cd expense-analytics-dashboard
```

---

# Backend Setup

```
cd backend
npm install
npm run dev
```

Server runs on:

```
http://localhost:3001
```

---

# Frontend Setup

Open a new terminal:

```
cd frontend
npm install
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

# Future Improvements

* CSV export for filtered expenses
* Monthly expense trends chart
* Database persistence
* Authentication system
* Dark mode UI

---

# Author

Adhishesh M

---

