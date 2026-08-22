import { useState, useEffect } from 'react';
import AuthPage from './components/AuthPage';
import FileUpload from './components/FileUpload';
import StatsCards from './components/StatsCards';
import FilterPanel from './components/FilterPanel';
import CategoryPieChart from './components/CategoryPieChart';
import ExpenseTable from './components/ExpenseTable';
import { expenseAPI, ParseExpensesData, GetExpensesData } from './services/api';
import { FilterSettings } from './types';
import { AxiosError } from 'axios';

export default function App() {
  const [data, setData] = useState<ParseExpensesData | GetExpensesData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('user') || 'null'));

  useEffect(() => {
    if (token) {
      handleClearFilters(); // Boot dashboard automatically
    }
  }, [token]);

  const handleLogin = (newToken: string, newUser: any) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setData(null);
  };

  const handleUpload = async (text: string) => {
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
      const axiosError = err as AxiosError<{ error: string }>;
      setError(axiosError.response?.data?.error || 'Failed to parse expenses');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async (filters: FilterSettings) => {
    setLoading(true);
    setError(null);

    try {
      const response = await expenseAPI.getExpenses(filters);

      if (response.success) {
        setData(response.data);
      }
    } catch (err) {
      const axiosError = err as AxiosError<{ error: string }>;
      setError(axiosError.response?.data?.error || 'Failed to apply filters');
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

  if (!token) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8 relative">
          <div className="absolute right-0 top-0 mt-2">
            <span className="text-sm text-gray-500 mr-4 border border-gray-200 bg-white px-2 py-1 rounded">
              {user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-red-200"
            >
              Sign out
            </button>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2 mt-8">
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