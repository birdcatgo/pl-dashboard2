import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays, isWithinInterval, startOfDay, parseISO, parse } from 'date-fns';
import _ from 'lodash';

const TIME_RANGES = {
  '7D': 7,
  'MTD': 'month',
  '30D': 30,
  '60D': 60,
  'YTD': 'year'
};

const formatAxisValue = (value, metric) => {
  if (value === null || typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return '';
  }
  
  if (metric === 'roi') {
    return `${value.toFixed(1)}%`;
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatTooltipValue = (value, metric) => {
  if (value === null || typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return 'N/A';
  }
  return formatAxisValue(value, metric);
};

const CustomTooltip = ({ active, payload, label, metric }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 shadow-lg rounded">
        <p className="text-gray-600 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            <span className="font-medium">{entry.name}: </span>
            {formatTooltipValue(entry.value, metric)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const parseDateString = (dateStr) => {
  // Handle different date formats
  try {
    if (!dateStr) return null;
    
    // Try MM/DD/YYYY format first
    const parsed = parse(dateStr.trim(), 'MM/dd/yyyy', new Date());
    if (isNaN(parsed.getTime())) {
      // Try other formats if needed
      return parseISO(dateStr);
    }
    return parsed;
  } catch (error) {
    console.error('Error parsing date:', dateStr, error);
    return null;
  }
};

const PerformanceTrends = ({ rawData, type = 'network', selectedItems = [] }) => {
  const [timeRange, setTimeRange] = useState('7D');
  const [metric, setMetric] = useState('revenue');

  console.log('PerformanceTrends received:', {
    rawDataLength: rawData?.length,
    type,
    selectedItems,
    timeRange,
    metric,
    sampleRow: rawData?.[0]
  });

  const filteredData = useMemo(() => {
    if (!rawData?.length) return [];

    const today = new Date();
    let startDate;

    if (TIME_RANGES[timeRange] === 'month') {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (TIME_RANGES[timeRange] === 'year') {
      startDate = new Date(today.getFullYear(), 0, 1);
    } else {
      startDate = subDays(today, TIME_RANGES[timeRange]);
    }

    const filtered = rawData.filter(row => {
      const rowDate = parseDateString(row.Date);
      if (!rowDate) return false;
      
      return isWithinInterval(rowDate, {
        start: startOfDay(startDate),
        end: startOfDay(today)
      });
    });

    console.log('Filtered data:', {
      original: rawData.length,
      filtered: filtered.length,
      startDate: startDate.toISOString(),
      endDate: today.toISOString()
    });

    return filtered;
  }, [rawData, timeRange]);

  const chartData = useMemo(() => {
    if (!filteredData.length) {
      console.log('No filtered data available for chart');
      return [];
    }

    const groupedByDate = _.groupBy(filteredData, row => {
      const date = parseDateString(row.Date);
      return date ? format(date, 'yyyy-MM-dd') : 'invalid';
    });

    // Remove any invalid date groups
    delete groupedByDate.invalid;
    
    const data = Object.entries(groupedByDate).map(([date, rows]) => {
      const dataPoint = {
        date: format(new Date(date), 'MMM dd'),
      };

      // Group by network, media buyer, or offer
      let groupKey;
      if (type === 'network') {
        groupKey = 'Network';
      } else if (type === 'buyer') {
        groupKey = 'Media Buyer';
      } else if (type === 'offer') {
        groupKey = 'Offer';
      }

      const groupedData = _.groupBy(rows, groupKey);
      
      selectedItems.forEach(item => {
        const itemData = groupedData[item] || [];
        const revenue = _.sumBy(itemData, row => parseFloat(row['Total Revenue'] || 0));
        const spend = _.sumBy(itemData, row => parseFloat(row['Ad Spend'] || 0));
        const margin = _.sumBy(itemData, row => parseFloat(row.Margin || 0));
        
        dataPoint[`${item}_revenue`] = revenue;
        dataPoint[`${item}_spend`] = spend;
        dataPoint[`${item}_margin`] = margin;
        dataPoint[`${item}_roi`] = spend > 0 ? ((revenue / spend - 1) * 100) : 0;
      });

      return dataPoint;
    });

    const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));

    console.log('Chart data generated:', {
      points: sortedData.length,
      firstPoint: sortedData[0],
      lastPoint: sortedData[sortedData.length - 1]
    });

    return sortedData;
  }, [filteredData, selectedItems, type]);

  const colors = ['#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#9333ea', '#0891b2', '#be185d'];

  if (!chartData.length) {
    return <div className="text-gray-500 text-center py-10">No data available for the selected time range</div>;
  }

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <div className="space-x-2">
          {Object.keys(TIME_RANGES).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm rounded ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
        <div className="space-x-2">
          {['revenue', 'spend', 'margin', 'roi'].map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`px-3 py-1 text-sm rounded capitalize ${
                metric === m
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis 
              tickFormatter={(value) => formatAxisValue(value, metric)} 
            />
            <Tooltip content={<CustomTooltip metric={metric} />} />
            <Legend />
            {selectedItems.map((item, index) => (
              <Line
                key={item}
                type="monotone"
                dataKey={`${item}_${metric}`}
                name={item}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PerformanceTrends;