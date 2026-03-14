# 💰 Expense Analytics Dashboard

A full-stack dashboard that parses raw expense text and generates insights such as category breakdowns, statistics, and visualizations.

Built with **React, Node.js, Express, TailwindCSS, and Recharts**.

---

## 🚀 Features

* 📂 Upload expense data via **text input or file**
* 🧠 **Smart parsing** of raw expense entries
* 📊 **Category distribution charts**
* 📈 Expense **analytics and statistics**
* 🔍 **Advanced filtering**

  * Category
  * Date range
  * Amount range
* 📋 **Sortable and paginated expense table**
* 🏷 Automatic **category detection**
* ⚡ Fast **React + Vite frontend**

---

## 🧱 Tech Stack

### Frontend

* React
* Vite
* Tailwind CSS
* Recharts
* Axios

### Backend

* Node.js
* Express
* Express Validator
* CORS

---

## 📂 Project Structure

```
expense-analytics-dashboard/
├── backend/
│   ├── middleware/
│   │   └── validation.js
│   ├── routes/
│   │   └── expenses.js
│   ├── utils/
│   │   └── parser.js
│   ├── package-lock.json
│   ├── package.json
│   └── server.js
├── frontend/
│     ├── src/
│     │   ├── components/
│     │   │   ├── CategoryPieChart.jsx
│     │   │   ├── ExpenseTable.jsx
│     │   │   ├── FileUpload.jsx
│     │   │   ├── FilterPanel.jsx
│     │   │   └── StatsCards.jsx
│     │   ├── services/
│     │   │   └── api.js
│     │   ├── App.jsx
│     │   ├── index.css
│     │   └── main.jsx
│     ├── index.html
│     ├── package-lock.json
│     ├── package.json
│     ├── postcss.config.js
│     ├── tailwind.config.js
│     └── vite.config.js
├── .gitignore
└── README.md
```

---

## ⚙️ Installation

### 1️⃣ Clone the repository

```
git clone https://github.com/adhizsrm/expense-analytics-dashboard.git
cd expense-analytics-dashboard
```

---

### 2️⃣ Start the Backend

```
cd backend
npm install
npm run dev
```

Backend runs on:

```
http://localhost:3001
```

---

### 3️⃣ Start the Frontend

Open another terminal:

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

## 📝 Example Expense Format

```
02-Aug-2025
Petrol – 1985.64 (Transport)
Dinner – 523 (Restaurant)
Snacks – 174 (Snacks)
```

---

## 📊 API Endpoints

### Parse Expenses

```
POST /api/expenses/parse
```

### Get Expenses

```
GET /api/expenses
```

### Get Categories

```
GET /api/expenses/categories
```

### Clear Expenses

```
DELETE /api/expenses
```

---

## 📈 Analytics Provided

* Total expenses
* Total amount spent
* Average expense
* Category breakdown
* Highest expense
* Lowest expense

---

## 🛠 Future Improvements

* Database persistence
* User authentication
* Export analytics to CSV/PDF
* Monthly spending trends

---

## 👨‍💻 Author

**Adhishesh M**

GitHub:
https://github.com/adhizsrm
