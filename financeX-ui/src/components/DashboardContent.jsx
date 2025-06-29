import { useContext } from 'react';
import { AppContext } from '../AppContext';  
import { Eye, EyeOff, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
  
  const DashboardContent = () => {

    const context = useContext(AppContext);
    const { showBalance } = context;
    return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Total Balance</h2>
          <button onClick={() => setShowBalance(!showBalance)}>
            {showBalance ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
        </div>
        <p className="text-3xl font-bold">
          {showBalance ? '$12,450.00' : '••••••'}
        </p>
        <p className="text-blue-100 mt-2">+2.5% from last month</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Income</p>
              <p className="text-2xl font-bold text-green-600">$3,200</p>
            </div>
            <ArrowUpRight className="text-green-600" size={24} />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Expenses</p>
              <p className="text-2xl font-bold text-red-600">$1,890</p>
            </div>
            <ArrowDownRight className="text-red-600" size={24} />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Investments</p>
              <p className="text-2xl font-bold text-blue-600">$8,360</p>
            </div>
            <TrendingUp className="text-blue-600" size={24} />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {[
            { name: 'Grocery Store', amount: '-$85.00', date: 'Today', type: 'expense' },
            { name: 'Salary Deposit', amount: '+$3,200.00', date: 'Yesterday', type: 'income' },
            { name: 'Netflix Subscription', amount: '-$15.99', date: '2 days ago', type: 'expense' },
          ].map((transaction, i) => (
            <div key={i} className="flex justify-between items-center py-2">
              <div>
                <p className="font-medium">{transaction.name}</p>
                <p className="text-sm text-gray-600">{transaction.date}</p>
              </div>
              <p className={`font-semibold ${
                transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
              }`}>
                {transaction.amount}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
    );
  };

  export default DashboardContent;