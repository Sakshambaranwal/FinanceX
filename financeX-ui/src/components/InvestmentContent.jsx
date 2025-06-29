  const InvestmentsContent = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Investments</h2>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg">
          New Investment
        </button>
      </div>
      
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Portfolio Overview</h3>
        <p className="text-3xl font-bold text-green-600">$8,360.00</p>
        <p className="text-gray-600 mt-2">+12.5% overall return</p>
        
        <div className="mt-6 space-y-4">
          {[
            { name: 'Tech Stocks', value: '$4,200', return: '+15.2%' },
            { name: 'Index Fund', value: '$3,160', return: '+8.7%' },
            { name: 'Crypto', value: '$1,000', return: '+25.3%' },
          ].map((investment, i) => (
            <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">{investment.name}</p>
                <p className="text-sm text-gray-600">{investment.value}</p>
              </div>
              <p className="font-semibold text-green-600">{investment.return}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  export default InvestmentsContent;