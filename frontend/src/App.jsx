import { useState } from 'react';
import FileUpload from './components/FileUpload';
import StatsCards from './components/StatsCards';
import FilterPanel from './components/FilterPanel';
import CategoryPieChart from './components/CategoryPieChart';
import ExpenseTable from './components/ExpenseTable';
import { expenseAPI } from './services/api';

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);

  const handleUpload = async (text) => {
    setLoading(true);
    setError(null);

    try {
      const response = await expenseAPI.parseExpenses(text);

      if (response.success) {
        setData(response.data);

        // Fetch categories
        const catResponse = await expenseAPI.getCategories();
        if (catResponse.success) {
          setCategories(catResponse.data.categories);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to parse expenses');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async (filters) => {
    setLoading(true);
    setError(null);

    try {
      const response = await expenseAPI.getExpenses(filters);

      if (response.success) {
        setData(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to apply filters');
      console.error('Filter error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = async () => {
    setLoading(true);

    try {
      const response = await expenseAPI.getExpenses({});

      if (response.success) {
        setData(response.data);
      }
    } catch (err) {
      console.error('Clear filters error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            💰 Expense Analytics Dashboard
          </h1>
          <p className="text-gray-600">
            Upload, parse, and visualize your expenses with powerful filtering
          </p>
        </header>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Upload Section */}
        <FileUpload onUpload={handleUpload} loading={loading} />

        {/* Analytics Section */}
        {data && (
          <>
            <div className="mt-8">
              <StatsCards analytics={data.analytics} />
            </div>

            <FilterPanel
              categories={categories}
              onFilter={handleFilter}
              onClear={handleClearFilters}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <CategoryPieChart categoryTotals={data.categoryTotals} />

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  📊 Top Categories
                </h3>
                <div className="space-y-3">
                  {Object.entries(data.categoryTotals)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([category, amount]) => (
                      <div key={category} className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">{category}</span>
                        <span className="text-gray-900 font-bold">
                          ₹{amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <ExpenseTable expenses={data.expenses} />
          </>
        )}

        {/* Footer */}
        <footer className="text-center mt-8 text-gray-600 text-sm">
          <p>Built with React, Tailwind CSS, Node.js, Express, and Recharts</p>
        </footer>
      </div>
    </div>
  );
}