import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DateTime } from 'luxon';
import { TrendingUp, TrendingDown, Minus, BarChart2, Search } from 'lucide-react';
import { Input } from "@/components/ui/input";

const CampaignTrends = () => {
  const [checkInData, setCheckInData] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('profitChange');
  const [sortDirection, setSortDirection] = useState('desc');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    loadCheckInData();
  }, []);
  
  const loadCheckInData = () => {
    setIsLoading(true);
    
    try {
      // Load direct check-in data
      const checkInsData = localStorage.getItem('middayCheckIns');
      
      if (!checkInsData) {
        console.log('No check-in data found in localStorage');
        setIsLoading(false);
        return;
      }
      
      // Parse check-in data
      const parsedCheckIns = JSON.parse(checkInsData);
      
      if (!parsedCheckIns || !Array.isArray(parsedCheckIns) || parsedCheckIns.length === 0) {
        console.log('No valid check-in data found');
        setIsLoading(false);
        return;
      }
      
      // Sort check-ins by timestamp (oldest first)
      const sortedCheckIns = [...parsedCheckIns].sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
      );
      
      console.log('Loaded check-in data:', {
        count: sortedCheckIns.length,
        firstTimestamp: sortedCheckIns[0]?.timestamp,
        lastTimestamp: sortedCheckIns[sortedCheckIns.length - 1]?.timestamp
      });
      
      setCheckInData(sortedCheckIns);
      
      // Process all campaigns across all check-ins
      processCampaigns(sortedCheckIns);
    } catch (error) {
      console.error('Error loading check-in data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const processCampaigns = (checkIns) => {
    // Create a map to track each campaign's performance across all check-ins
    const campaignMap = {};
    
    // Process each check-in
    checkIns.forEach((checkIn, checkInIndex) => {
      const timestamp = checkIn.timestamp;
      const displayTime = DateTime.fromISO(timestamp).toFormat('MM/dd h:mm a');
      
      // Process each campaign in this check-in
      checkIn.campaigns.forEach(campaign => {
        const campaignName = campaign.campaignName;
        
        if (!campaignName) return;
        
        // Initialize campaign in map if needed
        if (!campaignMap[campaignName]) {
          campaignMap[campaignName] = {
            name: campaignName,
            mediaBuyer: campaign.mediaBuyer || 'Unknown',
            adAccount: campaign.adAccount || 'Unknown',
            firstSeen: displayTime,
            lastSeen: displayTime,
            history: []
          };
        }
        
        // Update last seen time
        campaignMap[campaignName].lastSeen = displayTime;
        
        // Add this check-in's data to the campaign's history
        campaignMap[campaignName].history.push({
          timestamp: timestamp,
          displayTime: displayTime,
          profit: campaign.profit || 0,
          spend: campaign.spend || 0,
          revenue: campaign.revenue || 0,
          roi: campaign.profitPercent || 0,
          leads: campaign.leads || 0,
          checkInIndex: checkInIndex
        });
      });
    });
    
    // Convert map to array and calculate metrics
    const campaignArray = Object.values(campaignMap).map(campaign => {
      // Sort history by timestamp
      campaign.history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      // Calculate performance metrics
      if (campaign.history.length >= 2) {
        const firstEntry = campaign.history[0];
        const lastEntry = campaign.history[campaign.history.length - 1];
        
        campaign.initialProfit = firstEntry.profit;
        campaign.currentProfit = lastEntry.profit;
        campaign.profitChange = lastEntry.profit - firstEntry.profit;
        campaign.profitChangePct = firstEntry.profit !== 0 ? 
          ((lastEntry.profit - firstEntry.profit) / Math.abs(firstEntry.profit)) * 100 : 0;
        
        campaign.initialRoi = firstEntry.roi;
        campaign.currentRoi = lastEntry.roi;
        campaign.roiChange = lastEntry.roi - firstEntry.roi;
        
        campaign.totalLeads = campaign.history.reduce((sum, entry) => sum + entry.leads, 0);
        campaign.totalSpend = campaign.history.reduce((sum, entry) => sum + entry.spend, 0);
        campaign.totalRevenue = campaign.history.reduce((sum, entry) => sum + entry.revenue, 0);
        
        campaign.trend = campaign.profitChange > 0 ? 'up' : 
                         campaign.profitChange < 0 ? 'down' : 'stable';
      } else {
        // Single data point
        const entry = campaign.history[0];
        campaign.initialProfit = entry.profit;
        campaign.currentProfit = entry.profit;
        campaign.profitChange = 0;
        campaign.profitChangePct = 0;
        campaign.initialRoi = entry.roi;
        campaign.currentRoi = entry.roi;
        campaign.roiChange = 0;
        campaign.totalLeads = entry.leads;
        campaign.totalSpend = entry.spend;
        campaign.totalRevenue = entry.revenue;
        campaign.trend = 'stable';
      }
      
      // Calculate overall ROI
      campaign.overallRoi = campaign.totalSpend > 0 ? 
        ((campaign.totalRevenue - campaign.totalSpend) / campaign.totalSpend) * 100 : 0;
      
      // Determine status based on ROI and leads
      campaign.status = determineStatus(campaign.currentRoi, campaign.totalLeads);
      
      return campaign;
    });
    
    console.log('Processed campaigns:', {
      count: campaignArray.length,
      campaigns: campaignArray.map(c => c.name)
    });
    
    setCampaigns(campaignArray);
  };
  
  const determineStatus = (roi, leads) => {
    if (roi >= 30 && leads >= 5) {
      return { label: 'Scale', class: 'text-green-600 font-bold', action: 'Increase spend' };
    } else if (roi < 15 || roi < 0) {
      return { label: 'Shut Off', class: 'text-red-600 font-bold', action: 'Turn off campaign' };
    } else {
      return { label: 'Watch', class: 'text-yellow-600 font-bold', action: 'Monitor performance' };
    }
  };
  
  const handleSortChange = (field) => {
    if (sortBy === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, set to descending by default
      setSortBy(field);
      setSortDirection('desc');
    }
  };
  
  const getSortedCampaigns = () => {
    // First filter by search term if any
    let filteredCampaigns = campaigns;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filteredCampaigns = campaigns.filter(campaign => 
        campaign.name.toLowerCase().includes(term) ||
        campaign.mediaBuyer.toLowerCase().includes(term) ||
        campaign.adAccount.toLowerCase().includes(term)
      );
    }
    
    // Then sort
    return [...filteredCampaigns].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'mediaBuyer':
          comparison = a.mediaBuyer.localeCompare(b.mediaBuyer);
          break;
        case 'adAccount':
          comparison = a.adAccount.localeCompare(b.adAccount);
          break;
        case 'initialProfit':
          comparison = a.initialProfit - b.initialProfit;
          break;
        case 'currentProfit':
          comparison = a.currentProfit - b.currentProfit;
          break;
        case 'profitChange':
          comparison = a.profitChange - b.profitChange;
          break;
        case 'profitChangePct':
          comparison = a.profitChangePct - b.profitChangePct;
          break;
        case 'initialRoi':
          comparison = a.initialRoi - b.initialRoi;
          break;
        case 'currentRoi':
          comparison = a.currentRoi - b.currentRoi;
          break;
        case 'roiChange':
          comparison = a.roiChange - b.roiChange;
          break;
        case 'totalLeads':
          comparison = a.totalLeads - b.totalLeads;
          break;
        case 'totalSpend':
          comparison = a.totalSpend - b.totalSpend;
          break;
        case 'overallRoi':
          comparison = a.overallRoi - b.overallRoi;
          break;
        case 'status':
          comparison = a.status.label.localeCompare(b.status.label);
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
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
  
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const renderSparkline = (history) => {
    if (!history || history.length < 2) return null;
    
    const width = 100;
    const height = 20;
    const padding = 2;
    
    // Calculate min and max profit values for scaling
    const profits = history.map(h => h.profit);
    const minProfit = Math.min(...profits);
    const maxProfit = Math.max(...profits);
    const range = maxProfit - minProfit;
    
    // Create points for the sparkline
    const points = history.map((point, i) => {
      const x = ((i / (history.length - 1)) * (width - (2 * padding))) + padding;
      
      // Scale y value and invert (SVG y increases downward)
      const y = range === 0 ? 
        height / 2 : // If there's no range, just use the middle
        height - padding - ((point.profit - minProfit) / range) * (height - (2 * padding));
      
      return `${x},${y}`;
    }).join(' ');
    
    // Determine the line color based on profit trend
    const firstProfit = history[0].profit;
    const lastProfit = history[history.length - 1].profit;
    const lineColor = lastProfit > firstProfit ? '#10b981' : // green
                      lastProfit < firstProfit ? '#ef4444' : // red
                      '#6b7280'; // gray
    
    return (
      <svg width={width} height={height} className="inline-block ml-2">
        <polyline
          points={points}
          fill="none"
          stroke={lineColor}
          strokeWidth="1.5"
        />
      </svg>
    );
  };
  
  const renderSortArrow = (field) => {
    if (sortBy !== field) return null;
    
    return sortDirection === 'asc' ? 
      <span className="ml-1">↑</span> : 
      <span className="ml-1">↓</span>;
  };
  
  const getROIColorClass = (roi) => {
    if (typeof roi !== 'number' || isNaN(roi)) return 'text-gray-500';
    if (roi >= 30) return 'text-green-600 font-medium';
    if (roi >= 15) return 'text-amber-600 font-medium';
    return 'text-red-600 font-medium';
  };

  const sortedCampaigns = getSortedCampaigns();
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <BarChart2 className="h-5 w-5 mr-2" />
              Campaign Performance Trends
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Track campaign performance over time to optimize spend
            </p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-gray-500" />
              <Input
                type="text"
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 max-w-xs"
              />
            </div>
            <Button
              variant="outline"
              onClick={loadCheckInData}
              className="whitespace-nowrap"
            >
              Refresh Data
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading campaign data...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-2">No campaign data available.</p>
              <p className="text-sm text-gray-400">Use the Mid-Day Check-In tab to add campaign data.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th 
                      className="text-left p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSortChange('name')}
                    >
                      Campaign {renderSortArrow('name')}
                    </th>
                    <th 
                      className="text-left p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSortChange('mediaBuyer')}
                    >
                      Media Buyer {renderSortArrow('mediaBuyer')}
                    </th>
                    <th 
                      className="text-left p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSortChange('adAccount')}
                    >
                      Ad Account {renderSortArrow('adAccount')}
                    </th>
                    <th 
                      className="text-right p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSortChange('initialProfit')}
                    >
                      Initial Profit {renderSortArrow('initialProfit')}
                    </th>
                    <th 
                      className="text-right p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSortChange('currentProfit')}
                    >
                      Current Profit {renderSortArrow('currentProfit')}
                    </th>
                    <th 
                      className="text-center p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSortChange('profitChange')}
                    >
                      Profit Change {renderSortArrow('profitChange')}
                    </th>
                    <th 
                      className="text-right p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSortChange('initialRoi')}
                    >
                      Initial ROI {renderSortArrow('initialRoi')}
                    </th>
                    <th 
                      className="text-right p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSortChange('currentRoi')}
                    >
                      Current ROI {renderSortArrow('currentRoi')}
                    </th>
                    <th 
                      className="text-right p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSortChange('totalLeads')}
                    >
                      Total Leads {renderSortArrow('totalLeads')}
                    </th>
                    <th 
                      className="text-right p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSortChange('totalSpend')}
                    >
                      Total Spend {renderSortArrow('totalSpend')}
                    </th>
                    <th 
                      className="text-center p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSortChange('status')}
                    >
                      Action {renderSortArrow('status')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCampaigns.map((campaign, index) => (
                    <tr 
                      key={index} 
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-3 font-medium">
                        {campaign.name}
                        <div className="text-xs text-gray-500 mt-1">
                          {campaign.firstSeen} → {campaign.lastSeen}
                        </div>
                      </td>
                      <td className="p-3">{campaign.mediaBuyer}</td>
                      <td className="p-3">{campaign.adAccount}</td>
                      <td className="p-3 text-right">
                        {formatCurrency(campaign.initialProfit)}
                      </td>
                      <td className="p-3 text-right">
                        {formatCurrency(campaign.currentProfit)}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center">
                          {getTrendIcon(campaign.trend)}
                          <span 
                            className={campaign.profitChange >= 0 ? 'text-green-600 ml-1' : 'text-red-600 ml-1'}
                          >
                            {formatCurrency(Math.abs(campaign.profitChange))}
                          </span>
                          {renderSparkline(campaign.history)}
                        </div>
                      </td>
                      <td className={`p-3 text-right ${getROIColorClass(campaign.initialRoi)}`}>
                        {formatPercent(campaign.initialRoi)}
                      </td>
                      <td className={`p-3 text-right ${getROIColorClass(campaign.currentRoi)}`}>
                        {formatPercent(campaign.currentRoi)}
                      </td>
                      <td className="p-3 text-right font-medium">
                        {campaign.totalLeads}
                      </td>
                      <td className="p-3 text-right">
                        {formatCurrency(campaign.totalSpend)}
                      </td>
                      <td className={`p-3 text-center ${campaign.status.class}`}>
                        {campaign.status.label}
                        <div className="text-xs text-gray-500 mt-1 font-normal">
                          {campaign.status.action}
                        </div>
                      </td>
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

export default CampaignTrends; 