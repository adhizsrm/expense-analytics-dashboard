
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FFC658', '#FF6B9D', '#C77DFF', '#06FFA5'
];

export default function CategoryPieChart({ categoryTotals }) {
  if (!categoryTotals || Object.keys(categoryTotals).length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Category Distribution
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          No data to display
        </div>
      </div>
    );
  }

  const data = Object.entries(categoryTotals)
    .map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
    }))
    .sort((a, b) => b.value - a.value);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / data.payload.payload.totalValue) * 100).toFixed(1);

      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{data.name}</p>
          <p className="text-sm text-gray-600">
            ₹{data.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500">{percentage}% of total</p>
        </div>
      );
    }
    return null;
  };

  // Custom label to show only percentage on pie
  const renderLabel = ({ name, percent }) => {
    return `${(percent * 100).toFixed(0)}%`;
  };

  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  const enrichedData = data.map(item => ({ ...item, totalValue }));

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <span className="mr-2">📈</span>
        Category Distribution
      </h3>

      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={enrichedData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={110}
            fill="#8884d8"
            dataKey="value"
          >
            {enrichedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend with categories and amounts */}
      <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between gap-3 px-2 py-1 hover:bg-gray-50 rounded">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm text-gray-700 truncate">{item.name}</span>
            </div>
            <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
              ₹{item.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}