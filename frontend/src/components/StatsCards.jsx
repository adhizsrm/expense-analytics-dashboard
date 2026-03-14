export default function StatsCards({ analytics }) {
  if (!analytics) return null;

  const stats = [
    {
      label: 'Total Expenses',
      value: analytics.totalExpenses,
      icon: '📝',
      color: 'bg-blue-500',
    },
    {
      label: 'Total Amount',
      value: `₹${analytics.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
      icon: '💰',
      color: 'bg-green-500',
    },
    {
      label: 'Average Amount',
      value: `₹${analytics.averageAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
      icon: '📊',
      color: 'bg-purple-500',
    },
    {
      label: 'Categories',
      value: analytics.categoriesCount,
      icon: '🏷️',
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">{stat.icon}</span>
            <div className={`w-2 h-2 rounded-full ${stat.color}`}></div>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.label}</h3>
          <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
