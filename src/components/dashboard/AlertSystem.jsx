import React from 'react';
import useAlerts from '../../utils/useAlerts';

const AlertSystem = ({ data, thresholds }) => {
  const alerts = useAlerts(data, thresholds);

  return (
    <div className="fixed bottom-4 right-4">
      <div className="bg-white rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Alerts</h3>
          <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {alerts.length}
          </span>
        </div>

        <div className="space-y-4">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${
                alert.severity === 'high' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
              }`}
            >
              <p className="text-sm font-medium">{alert.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AlertSystem;
