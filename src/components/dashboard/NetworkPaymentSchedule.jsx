const NetworkPaymentSchedule = ({ networkData }) => {
  const data = [
    { network: 'Suited', terms: 'Net 5 weekly', cap: 100000, exposure: 19475 },
    { network: 'TLG', terms: 'Net 10 weekly', cap: 101500, exposure: 55428 },
    { network: 'Pure Ads', terms: 'Net 15 bi monthly', cap: 7600, exposure: 49362 },
    { network: 'Transparent', terms: 'Net 15 bi monthly', cap: 8160, exposure: 37083 },
    { network: 'Leadnomic', terms: 'Net 5 weekly', cap: 300000, exposure: 4213 },
    { network: 'Wisdom', terms: 'Net 30', cap: 1200, exposure: 1137 },
    { network: 'Lead Econ', terms: 'Net 8 weekly', cap: 1000, exposure: 5723 },
    { network: 'ACA', terms: 'Net 5 weekly', cap: 100000, exposure: 837 }
  ];

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Network Payment Schedule</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Network</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Daily Cap</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Exposure</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Terms</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((network, index) => (
              <tr key={index}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{network.network}</td>
                <td className="px-6 py-4 text-sm text-right">{formatCurrency(network.cap)}</td>
                <td className="px-6 py-4 text-sm text-right">{formatCurrency(network.exposure)}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{network.terms}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ProjectionsSummary = ({ totalAvailableFunds = 200319, totalDailySpend = 39000 }) => {
  const daysOfCoverage = Math.floor(totalAvailableFunds / totalDailySpend) || 0;
  
  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Projections Summary</h3>
      </div>
      <div className="p-6 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-sm text-gray-500">Total Available Funds</div>
          <div className="text-xl font-bold text-gray-900">{formatCurrency(totalAvailableFunds)}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500">Total Daily Spend</div>
          <div className="text-xl font-bold text-gray-900">{formatCurrency(totalDailySpend)}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500">Days of Coverage</div>
          <div className="text-xl font-bold text-gray-900">{daysOfCoverage} days</div>
        </div>
      </div>
    </div>
  );
};

const MediaBuyerSpend = ({ onSpendChange, totalAvailableFunds }) => {
  const defaultBuyers = [
    { name: 'Zel', averageSpend: 2000 },
    { name: 'Daniel', averageSpend: 15000 },
    { name: 'Mike', averageSpend: 10000 },
    { name: 'Dave', averageSpend: 2000 },
    { name: 'Asheesh', averageSpend: 10000 }
  ];

  const [spendAmounts, setSpendAmounts] = useState(
    defaultBuyers.reduce((acc, buyer) => ({
      ...acc,
      [buyer.name]: buyer.averageSpend
    }), {})
  );

  const totalDailySpend = Object.values(spendAmounts).reduce((sum, spend) => sum + (parseFloat(spend) || 0), 0);
  const daysOfCoverage = Math.floor(totalAvailableFunds / totalDailySpend) || 0;

  const handleSpendChange = (buyerName, value) => {
    const newSpends = { ...spendAmounts, [buyerName]: parseFloat(value) || 0 };
    setSpendAmounts(newSpends);
    if (onSpendChange) onSpendChange(newSpends);
  };

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Media Buyer Daily Spend</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Media Buyer</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Average Daily Spend</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">New Spend Scenario</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {defaultBuyers.map((buyer, index) => (
              <tr key={index}>
                <td className="px-6 py-4 text-sm text-gray-900">{buyer.name}</td>
                <td className="px-6 py-4 text-sm text-right">{formatCurrency(buyer.averageSpend)}</td>
                <td className="px-6 py-4">
                  <div className="flex justify-center">
                    <div className="relative w-32">
                      <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">$</span>
                      <input
                        type="text"
                        value={spendAmounts[buyer.name] || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9.]/g, '');
                          handleSpendChange(buyer.name, value);
                        }}
                        onBlur={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          handleSpendChange(buyer.name, value.toFixed(2));
                        }}
                        className="form-input rounded-md border-gray-300 w-full text-right pl-8"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            <tr className="bg-gray-50 font-medium">
              <td className="px-6 py-4 text-sm text-gray-900">Total Daily Spend</td>
              <td className="px-6 py-4 text-sm text-right">{formatCurrency(39000)}</td>
              <td className="px-6 py-4 text-sm text-center">{formatCurrency(totalDailySpend)}</td>
            </tr>
            <tr className="bg-gray-50 font-medium">
              <td className="px-6 py-4 text-sm text-gray-900">Days of Coverage</td>
              <td className="px-6 py-4 text-sm text-right">-</td>
              <td className="px-6 py-4 text-sm text-center">{daysOfCoverage} days</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};