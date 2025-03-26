import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save } from 'lucide-react';

const MEDIA_BUYERS = [
  'Ishaan',
  'Edwin',
  'Nick N',
  'Mike C',
  'Gagan',
  'Omar',
];

// Meeting dates
const MEETING_DATES = [
  '2025-03-28',
  '2025-04-04',
  '2025-04-11',
  '2025-04-15',
  '2025-04-21'
];

const getMediaBuyerStatus = (performanceData, buyer) => {
  if (!performanceData) return { message: 'No data available', type: 'neutral' };

  // Filter data for this buyer
  const buyerData = performanceData.filter(entry => 
    entry['Media Buyer']?.toLowerCase().includes(buyer.toLowerCase())
  );

  if (buyerData.length === 0) return { message: 'Not running', type: 'inactive' };

  // Calculate total spend and profit
  const totalSpend = buyerData.reduce((sum, entry) => sum + (parseFloat(entry['Ad Spend']) || 0), 0);
  const totalRevenue = buyerData.reduce((sum, entry) => sum + (parseFloat(entry['Total Revenue']) || 0), 0);
  const totalProfit = buyerData.reduce((sum, entry) => sum + (parseFloat(entry.Margin) || 0), 0);
  
  // Calculate ROI
  const roi = totalSpend > 0 ? ((totalRevenue / totalSpend - 1) * 100) : 0;

  // Get the latest entry's date
  const latestDate = new Date(Math.max(...buyerData.map(entry => {
    const [month, day, year] = entry.Date.split('/');
    return new Date(year, month - 1, day);
  })));
  const daysSinceLastActivity = Math.floor((new Date() - latestDate) / (1000 * 60 * 60 * 24));

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Determine status type and message
  if (totalSpend === 0) {
    return { message: 'Not running', type: 'inactive' };
  }

  if (daysSinceLastActivity > 7) {
    return { 
      message: `Inactive (${formatCurrency(totalProfit)} | ${roi.toFixed(1)}% ROI)`, 
      type: 'inactive' 
    };
  }

  // Active status with profit and ROI
  let type;
  if (totalProfit >= 1000 && roi >= 100) {
    type = 'excellent';
  } else if (totalProfit >= 1000 || roi >= 100) {
    type = 'good';
  } else if (totalProfit > 0) {
    type = 'okay';
  } else {
    type = 'warning';
  }

  return {
    message: `${formatCurrency(totalProfit)} | ${roi.toFixed(1)}% ROI`,
    type
  };
};

const getStatusColor = (type) => {
  switch (type) {
    case 'excellent':
      return 'bg-green-100 text-green-800 border border-green-200';
    case 'good':
      return 'bg-blue-100 text-blue-800 border border-blue-200';
    case 'okay':
      return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    case 'warning':
      return 'bg-orange-100 text-orange-800 border border-orange-200';
    case 'inactive':
      return 'bg-gray-100 text-gray-800 border border-gray-200';
    default:
      return 'bg-gray-50 text-gray-600 border border-gray-200';
  }
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

const MediaBuyerProgress = ({ performanceData }) => {
  const [currentMeetingIndex, setCurrentMeetingIndex] = useState(0);
  const currentDate = MEETING_DATES[currentMeetingIndex];

  // Initialize meeting data with a default structure
  const defaultMeetingData = MEETING_DATES.reduce((dates, date) => {
    dates[date] = {};
    MEDIA_BUYERS.forEach(buyer => {
      dates[date][buyer] = {
        attended: false,
        notes: ''
      };
    });
    return dates;
  }, {});

  const [meetingData, setMeetingData] = useState(defaultMeetingData);

  const handleAttendanceChange = (buyer) => {
    setMeetingData(prev => ({
      ...prev,
      [currentDate]: {
        ...prev[currentDate],
        [buyer]: {
          ...prev[currentDate]?.[buyer],
          attended: !(prev[currentDate]?.[buyer]?.attended ?? false)
        }
      }
    }));
  };

  const handleTextChange = (buyer, field, value) => {
    setMeetingData(prev => ({
      ...prev,
      [currentDate]: {
        ...prev[currentDate],
        [buyer]: {
          ...prev[currentDate]?.[buyer],
          [field]: value
        }
      }
    }));
  };

  const handleSave = () => {
    // Here you would typically save the data to your backend
    console.log('Saving meeting data:', meetingData[currentDate]);
    
    // Move to next meeting date if available
    if (currentMeetingIndex < MEETING_DATES.length - 1) {
      setCurrentMeetingIndex(prev => prev + 1);
    }
  };

  // Ensure we have valid data structure
  const ensureDataStructure = () => {
    setMeetingData(prev => {
      const newData = { ...prev };
      MEETING_DATES.forEach(date => {
        if (!newData[date]) {
          newData[date] = {};
        }
        MEDIA_BUYERS.forEach(buyer => {
          if (!newData[date][buyer]) {
            newData[date][buyer] = {
              attended: false,
              notes: ''
            };
          }
        });
      });
      return newData;
    });
  };

  // Call ensureDataStructure when component mounts
  React.useEffect(() => {
    ensureDataStructure();
  }, []);

  // Get safe meeting data with fallbacks
  const getSafeMeetingData = (date, buyer) => {
    return meetingData?.[date]?.[buyer] ?? { attended: false, notes: '' };
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Meeting Progress</CardTitle>
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save & Continue
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-medium text-gray-500">Media Buyer</th>
                <th className="text-left p-4 font-medium text-gray-500">{formatDate(currentDate)}</th>
                <th className="text-left p-4 font-medium text-gray-500">Notes</th>
                <th className="text-left p-4 font-medium text-gray-500">Current Status</th>
              </tr>
            </thead>
            <tbody>
              {MEDIA_BUYERS.map(buyer => (
                <tr key={buyer} className="border-b">
                  <td className="p-4">{buyer}</td>
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={getSafeMeetingData(currentDate, buyer).attended}
                      onChange={() => handleAttendanceChange(buyer)}
                      className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="p-4">
                    <textarea
                      value={getSafeMeetingData(currentDate, buyer).notes}
                      onChange={(e) => handleTextChange(buyer, 'notes', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      rows="2"
                      placeholder="Enter notes..."
                    />
                  </td>
                  <td className="p-4 text-sm">
                    {(() => {
                      const status = getMediaBuyerStatus(performanceData, buyer);
                      return (
                        <div className={`inline-block px-3 py-1 rounded-full font-medium ${getStatusColor(status.type)}`}>
                          {status.message}
                        </div>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default MediaBuyerProgress; 