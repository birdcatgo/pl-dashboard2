import React from 'react';

const OfferPerformance = ({ data, rawData }) => {
  // Handle undefined or empty rawData
  const groupedData = (rawData || []).reduce((acc, row) => {
    const offerKey = `${row.Network} - ${row.Offer}`;
    if (!acc[offerKey]) {
      acc[offerKey] = [];
    }
    acc[offerKey].push(row);
    return acc;
  }, []);

  // Fallback UI for empty data
  if (!groupedData || groupedData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mt-8">
        <h2 className="text-xl font-bold mb-4">Offer Performance</h2>
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 mt-8">
      <h2 className="text-xl font-bold mb-4">Offer Performance</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="text-left p-2">Network - Offer</th>
              <th className="text-right p-2">Count</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedData).map(([offerKey, rows]) => (
              <tr key={offerKey} className="border-b hover:bg-gray-50">
                <td className="p-2">{offerKey}</td>
                <td className="text-right p-2">{rows.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OfferPerformance;
