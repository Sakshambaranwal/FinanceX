const P2PContent = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">P2P Transactions</h2>
        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg">
          Send Money
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Quick Send</h3>
          <div className="space-y-3">
            {['John Doe', 'Sarah Wilson', 'Mike Johnson'].map((contact, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{contact}</span>
                <button className="text-blue-600 font-semibold">Send</button>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Recent Transfers</h3>
          <div className="space-y-3">
            {[
              { name: 'Sent to John Doe', amount: '-$50.00', date: 'Today' },
              { name: 'Received from Sarah', amount: '+$25.00', date: 'Yesterday' },
              { name: 'Sent to Mike Johnson', amount: '-$100.00', date: '2 days ago' },
            ].map((transfer, i) => (
              <div key={i} className="flex justify-between items-center py-2">
                <div>
                  <p className="font-medium">{transfer.name}</p>
                  <p className="text-sm text-gray-600">{transfer.date}</p>
                </div>
                <p className={`font-semibold ${
                  transfer.amount.startsWith('+') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transfer.amount}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  export default P2PContent;