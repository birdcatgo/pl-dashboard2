import { useMemo } from 'react';

const useAlerts = (data, thresholds) => {
  return useMemo(() => {
    if (!data || !thresholds) return [];

    const alerts = [];

    // Example: Check thresholds for each metric in the data
    Object.entries(data).forEach(([key, value]) => {
      const threshold = thresholds[key];
      if (!threshold) return;

      if (value > threshold.max) {
        alerts.push({ type: key, message: `${key} is above the maximum threshold`, severity: 'high' });
      } else if (value < threshold.min) {
        alerts.push({ type: key, message: `${key} is below the minimum threshold`, severity: 'low' });
      }
    });

    return alerts;
  }, [data, thresholds]);
};

export default useAlerts;
