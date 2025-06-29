const Expense = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Expenses</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
          Add Expense
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">This Month</h3>
          <p className="text-3xl font-bold text-red-600">$1,890.00</p>
          <p className="text-gray-600 mt-2">15% more than last month</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Categories</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Food & Dining</span>
              <span className="font-semibold">$650</span>
            </div>
            <div className="flex justify-between">
              <span>Transportation</span>
              <span className="font-semibold">$320</span>
            </div>
            <div className="flex justify-between">
              <span>Entertainment</span>
              <span className="font-semibold">$180</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  export default Expense;