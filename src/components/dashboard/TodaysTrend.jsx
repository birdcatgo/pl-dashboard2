import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DateTime } from 'luxon';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const TodaysTrend = () => {
  const [checkIns, setCheckIns] = useState([]);
  const [groupedCampaigns, setGroupedCampaigns] = useState({});

  // Function to load check-ins from localStorage
  const loadCheckIns = () => {
    // Load both middayCheckIns and middayCheckInData from localStorage
    const middayCheckIns = JSON.parse(localStorage.getItem('middayCheckIns') || '[]');
    
    console.log('Loading check-ins:', {
      middayCheckInsCount: middayCheckIns.length,
      checkInsTimestamps: middayCheckIns.map(ci => ci.timestamp)
    });
    
    if (middayCheckIns.length === 0) {
      setCheckIns([]);
      setGroupedCampaigns({});
      return;
    }
    
    // Filter to today's check-ins only
    const today = DateTime.now().setZone('America/Los_Angeles').toFormat('yyyy-MM-dd');
    const todaysCheckIns = middayCheckIns.filter(checkIn => {
      const checkInDate = DateTime.fromISO(checkIn.timestamp)
        .setZone('America/Los_Angeles')
        .toFormat('yyyy-MM-dd');
      return checkInDate === today;
    });
    
    console.log('Today\'s check-ins:', {
      today,
      totalCheckIns: middayCheckIns.length,
      todaysCheckIns: todaysCheckIns.length,
      timestamps: todaysCheckIns.map(ci => ci.timestamp)
    });
    
    // Sort chronologically
    const sortedCheckIns = [...todaysCheckIns].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    // Set check-ins
    setCheckIns(sortedCheckIns);
    
    // Group campaigns by name
    const grouped = {};
    
    sortedCheckIns.forEach(checkIn => {
      // Filter campaigns with zero spend AND zero revenue
      const validCampaigns = checkIn.campaigns.filter(c => c.spend > 0 || c.revenue > 0);
      
      validCampaigns.forEach(campaign => {
        const campaignName = campaign.campaignName || 'Unknown Campaign';
        
        if (!grouped[campaignName]) {
          grouped[campaignName] = {
            name: campaignName,
            history: []
          };
        }
        
        grouped[campaignName].history.push({
          timestamp: checkIn.timestamp,
          profit: campaign.profit,
          roi: campaign.profitPercent,
          leads: campaign.leads,
          trend: campaign.trend || '➡️',
          profitChange: campaign.profitChange || 0
        });
      });
    });
    
    console.log('Grouped campaigns:', Object.keys(grouped).length);
    setGroupedCampaigns(grouped);
  };

  useEffect(() => {
    // Initial load
    loadCheckIns();
    
    // Setup storage event listener to react to changes in localStorage
    const handleStorageChange = (event) => {
      if (event.key === 'middayCheckIns' || event.key === 'middayCheckInData') {
        console.log(`${event.key} changed in localStorage, reloading data`);
        loadCheckIns();
      }
    };
    
    // Add event listener
    window.addEventListener('storage', handleStorageChange);
    
    // Set up an interval to check for changes
    const intervalId = setInterval(() => {
      loadCheckIns();
    }, 5000); // Check every 5 seconds
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, []);

  const getTrendIcon = (trend) => {
    switch (trend) {
      case '📈':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case '📉':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatCurrency = (value) => {
    if (typeof value !== 'number' || isNaN(value)) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value) => {
    if (typeof value !== 'number' || isNaN(value)) return '-';
    return `${value.toFixed(1)}%`;
  };

  const getROIColorClass = (roi) => {
    if (typeof roi !== 'number' || isNaN(roi)) return 'text-gray-500';
    if (roi >= 30) return 'text-green-600 font-medium';
    if (roi >= 15) return 'text-amber-600 font-medium';
    return 'text-red-600 font-medium';
  };

  const formatTimestamp = (timestamp) => {
    return DateTime.fromISO(timestamp)
      .setZone('America/Los_Angeles')
      .toFormat('h:mm a');
  };

  // Sort check-ins by timestamp for display
  const sortedCheckIns = [...checkIns].sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Today's Campaign Trends</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedCheckIns.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No check-ins recorded. Use the Mid-Day Check-In tab to add data.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 sticky left-0 bg-white">Campaign</th>
                    {sortedCheckIns.map((checkIn, index) => (
                      <th key={index} className="text-center py-2 px-3 min-w-[150px]">
                        {formatTimestamp(checkIn.timestamp)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.values(groupedCampaigns).map((campaign, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-2 px-3 font-bold sticky left-0 bg-white">{campaign.name}</td>
                      {sortedCheckIns.map((checkIn, checkInIndex) => {
                        const history = campaign.history.find(h => h.timestamp === checkIn.timestamp);
                        if (!history) {
                          return <td key={checkInIndex} className="text-center py-2 px-3">-</td>;
                        }
                        
                        return (
                          <td key={checkInIndex} className="text-center py-2 px-3">
                            <div className="flex flex-col items-center space-y-1">
                              <div className="flex items-center space-x-1 justify-center">
                                <span className={`text-sm ${getROIColorClass(history.roi)}`}>
                                  {formatPercent(history.roi)}
                                </span>
                                {getTrendIcon(history.trend)}
                              </div>
                              <div className="text-sm font-bold text-right">
                                {formatCurrency(history.profit)}
                              </div>
                              <div className="text-xs text-gray-400">
                                {history.leads} leads
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TodaysTrend; 