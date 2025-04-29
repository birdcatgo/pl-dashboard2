import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DateTime } from 'luxon';
import { 
  TrendingUp, TrendingDown, Minus, Calendar, ChevronDown, ChevronUp, 
  Save, RefreshCw, Upload, Download, Filter, Search, Layers
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { 
  Select, SelectContent, SelectGroup, SelectItem,
  SelectLabel, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DatePicker } from "@/components/ui/date-picker";
import axios from 'axios';
import { parseCampaignName } from '@/lib/campaign-utils';
import { sendNotification } from '@/lib/notifications';

const DailyTrends = () => {
  const [trendHistory, setTrendHistory] = useState([]);
  const [expandedDays, setExpandedDays] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);
  
  // New state for filtering and matrix view
  const [filters, setFilters] = useState({
    offer: '',
    adAccount: '',
    mediaBuyer: '',
    network: '',
    searchTerm: '',
    startDate: null,
    endDate: null
  });
  const [groupBy, setGroupBy] = useState('none'); // 'none', 'offer', 'adAccount', 'mediaBuyer', 'network'
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'matrix'
  
  // Derived data for filters
  const [uniqueOffers, setUniqueOffers] = useState([]);
  const [uniqueAdAccounts, setUniqueAdAccounts] = useState([]);
  const [uniqueMediaBuyers, setUniqueMediaBuyers] = useState([]);
  const [uniqueNetworks, setUniqueNetworks] = useState([]);
  const [filteredDays, setFilteredDays] = useState([]);

  // State for matrix view
  const [timeSlots, setTimeSlots] = useState([]);
  
  // Load historical trend data from localStorage and optionally from the server
  useEffect(() => {
    loadTrendData();
  }, []);
  
  const loadTrendData = async (forceServerFetch = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Always get local data first
      const savedData = localStorage.getItem('dailyTrendHistory');
      let localData = [];
      
      console.log('Loading trend data:', { 
        hasLocalData: !!savedData, 
        localDataLength: savedData?.length || 0,
        forceServerFetch 
      });
      
      if (savedData) {
        try {
          localData = JSON.parse(savedData);
          
          // Ensure localData is an array
          if (!Array.isArray(localData)) {
            console.error('Local data is not an array:', localData);
            throw new Error('Invalid data format: expected an array');
          }
          
          // Filter out any invalid entries and parse campaign names
          localData = localData.filter(entry => 
            entry && typeof entry === 'object' && entry.date && Array.isArray(entry.summary)
          ).map(day => ({
            ...day,
            summary: day.summary.map(campaign => {
              // Parse campaign name to get network, offer, etc.
              const { network, offer, adAccount, mediaBuyer } = parseCampaignName(campaign.campaignName);
              return {
                ...campaign,
                network: network || campaign.network || 'Unknown',
                offer: offer || campaign.offer || 'Unknown',
                adAccount: adAccount || campaign.adAccount || 'Unknown',
                mediaBuyer: mediaBuyer || campaign.mediaBuyer || 'Unknown'
              };
            })
          }));
          
          // Sort by date (most recent first)
          localData = [...localData].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
          );
          
          console.log('Loaded local trend history:', {
            daysCount: localData.length,
            firstDay: localData[0]?.date,
            lastDay: localData[localData.length - 1]?.date,
            allDates: localData.map(day => day.date),
            campaignCount: localData[0]?.summary?.length
          });
          
          // Set initial state with local data
          if (!forceServerFetch) {
            setTrendHistory(localData);
            extractUniqueValues(localData);
            applyFilters(localData);
          }
        } catch (error) {
          console.error('Error parsing local trend history:', error);
          // Clear invalid data
          localStorage.removeItem('dailyTrendHistory');
          const errorMessage = `Error loading local data: ${error.message}. Please try syncing from server or clear history.`;
          setError(errorMessage);
          await sendNotification(errorMessage, 'error');
        }
      } else {
        await sendNotification('No local trend history found. Please sync from server.', 'info');
      }
      
      // Check if we're in production or if a server fetch is explicitly requested
      const isProduction = process.env.NODE_ENV === 'production';
      
      if (isProduction || forceServerFetch) {
        try {
          setIsSyncing(true);
          const response = await axios.get('/api/trends');
          let serverData = response.data.trendData || [];
          
          // Parse campaign names in server data
          serverData = serverData.map(day => ({
            ...day,
            summary: day.summary.map(campaign => {
              // Parse campaign name to get network, offer, etc.
              const { network, offer, adAccount, mediaBuyer } = parseCampaignName(campaign.campaignName);
              return {
                ...campaign,
                network: network || campaign.network,
                offer: offer || campaign.offer,
                adAccount: adAccount || campaign.adAccount,
                mediaBuyer: mediaBuyer || campaign.mediaBuyer
              };
            })
          }));
          
          console.log('Loaded server trend history:', {
            daysCount: serverData.length,
            firstDay: serverData[0]?.date,
            allDates: serverData.map(day => day.date)
          });
          
          if (serverData.length > 0) {
            // Sort by date (most recent first)
            const sortedServerData = [...serverData].sort((a, b) => 
              new Date(b.date) - new Date(a.date)
            );
            
            // Merge server and local data if both exist
            let mergedData = sortedServerData;
            
            if (localData.length > 0) {
              // Create maps for quick lookup
              const serverDatesMap = {};
              sortedServerData.forEach(entry => {
                serverDatesMap[entry.date] = entry;
              });
              
              const localDatesMap = {};
              localData.forEach(entry => {
                localDatesMap[entry.date] = entry;
              });
              
              // Combine all dates
              const allDates = [...new Set([
                ...Object.keys(serverDatesMap),
                ...Object.keys(localDatesMap)
              ])];
              
              // For each date, take the entry with more data
              mergedData = allDates.map(date => {
                const serverEntry = serverDatesMap[date];
                const localEntry = localDatesMap[date];
                
                if (!serverEntry) return localEntry;
                if (!localEntry) return serverEntry;
                
                // If both exist, take the one with more campaign data
                if (serverEntry.summary.length >= localEntry.summary.length) {
                  return serverEntry;
                } else {
                  return localEntry;
                }
              }).filter(Boolean); // Remove any undefined entries
            }
            
            // Update state with merged data
            setTrendHistory(mergedData);
            extractUniqueValues(mergedData);
            applyFilters(mergedData);
            
            // Save to localStorage
            localStorage.setItem('dailyTrendHistory', JSON.stringify(mergedData));
            setLastSynced(new Date().toISOString());
            await sendNotification('Successfully synced trend data from server.', 'success');
          } else {
            await sendNotification('No trend data found on server.', 'warning');
          }
        } catch (error) {
          console.error('Error fetching server data:', error);
          const errorMessage = `Error syncing from server: ${error.message}`;
          setError(errorMessage);
          await sendNotification(errorMessage, 'error');
        } finally {
          setIsSyncing(false);
        }
      }
    } catch (err) {
      console.error('Error in loadTrendData:', err);
      setError('An unexpected error occurred loading trend data.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Extract unique values from the data for filter dropdowns
  const extractUniqueValues = (data) => {
    const offers = new Set();
    const adAccounts = new Set();
    const mediaBuyers = new Set();
    const networks = new Set();
    
    data.forEach(day => {
      day.summary.forEach(campaign => {
        // Only consider valid campaigns (with trendData and non-zero spend)
        if (campaign.trendData && campaign.trendData.length > 0) {
            if (campaign.offer) offers.add(campaign.offer);
            if (campaign.adAccount) adAccounts.add(campaign.adAccount);
            if (campaign.mediaBuyer) mediaBuyers.add(campaign.mediaBuyer);
            if (campaign.network) networks.add(campaign.network);
        }
      });
    });
    
    setUniqueOffers(Array.from(offers).sort());
    setUniqueAdAccounts(Array.from(adAccounts).sort());
    setUniqueMediaBuyers(Array.from(mediaBuyers).sort());
    setUniqueNetworks(Array.from(networks).sort());
  };
  
  // Apply filters to the data
  const applyFilters = (data) => {
    // Create a deep copy of the data to avoid mutating the original
    const filteredData = JSON.parse(JSON.stringify(data));
    
    // Filter at the day level first (for date range)
    const filteredByDate = filteredData.filter(day => {
      if (filters.startDate && new Date(day.date) < new Date(filters.startDate)) {
        return false;
      }
      
      if (filters.endDate && new Date(day.date) > new Date(filters.endDate)) {
        return false;
      }
      
      return true;
    });
    
    // Then filter at the campaign level within each day
    const result = filteredByDate.map(day => {
      // Filter campaigns based on criteria
      const filteredCampaigns = day.summary.filter(campaign => {
        // Ignore campaigns with $0 spend and $0 revenue
        const hasSpendOrRevenue = campaign.trendData && campaign.trendData.some(
          dataPoint => (dataPoint.spend > 0 || dataPoint.revenue > 0)
        );
        
        if (!hasSpendOrRevenue) return false;
        
        // Apply filters
        if (filters.offer && campaign.offer !== filters.offer) return false;
        if (filters.adAccount && campaign.adAccount !== filters.adAccount) return false;
        if (filters.mediaBuyer && campaign.mediaBuyer !== filters.mediaBuyer) return false;
        if (filters.network && campaign.network !== filters.network) return false;
        
        // Search term filter on campaign name
        if (filters.searchTerm && !campaign.campaignName.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
          return false;
        }
        
        return true;
      });
      
      return { ...day, summary: filteredCampaigns };
    });
    
    // Remove days with no campaigns after filtering
    const nonEmptyDays = result.filter(day => day.summary.length > 0);
    
    // If grouping is enabled, group the campaigns
    if (groupBy !== 'none') {
      const groupedData = nonEmptyDays.map(day => {
        const groupedSummary = groupCampaigns(day.summary, groupBy);
        return { ...day, summary: groupedSummary };
      });
      
      setFilteredDays(groupedData);
    } else {
      setFilteredDays(nonEmptyDays);
    }
    
    // Generate time slots for matrix view if in matrix mode
    if (viewMode === 'matrix') {
      generateTimeSlots(nonEmptyDays);
    }
  };
  
  // Function to group campaigns based on the selected grouping field
  const groupCampaigns = (campaigns, groupField) => {
    const groups = {};
    
    campaigns.forEach(campaign => {
      const groupValue = campaign[groupField] || 'Unknown';
      
      if (!groups[groupValue]) {
        groups[groupValue] = {
          campaignName: `${groupField}: ${groupValue}`,
          [groupField]: groupValue,
          trendData: [],
          campaigns: []
        };
      }
      
      // Store the original campaign
      groups[groupValue].campaigns.push(campaign);
      
      // Merge trend data
      if (campaign.trendData && campaign.trendData.length > 0) {
        campaign.trendData.forEach(dataPoint => {
          // Find existing data point for this time
          const existingPoint = groups[groupValue].trendData.find(
            point => point.time === dataPoint.time
          );
          
          if (existingPoint) {
            // Update the existing data point
            existingPoint.profit = (existingPoint.profit || 0) + (dataPoint.profit || 0);
            existingPoint.roi = calculateAverageROI(existingPoint.roi, dataPoint.roi, existingPoint.campaigns.length);
            existingPoint.leads = (existingPoint.leads || 0) + (dataPoint.leads || 0);
            existingPoint.spend = (existingPoint.spend || 0) + (dataPoint.spend || 0);
            existingPoint.revenue = (existingPoint.revenue || 0) + (dataPoint.revenue || 0);
            existingPoint.campaigns.push(campaign.campaignName);
          } else {
            // Create a new data point
            groups[groupValue].trendData.push({
              ...dataPoint,
              campaigns: [campaign.campaignName]
            });
          }
        });
      }
    });
    
    return Object.values(groups);
  };
  
  const calculateAverageROI = (existingROI, newROI, count) => {
    if (!existingROI) return newROI;
    if (!newROI) return existingROI;
    
    // Weighted average based on existing count
    return ((existingROI * count) + newROI) / (count + 1);
  };
  
  // Generate time slots for matrix view
  const generateTimeSlots = (days) => {
    const allSlots = new Set();
    
    days.forEach(day => {
      day.summary.forEach(campaign => {
        if (campaign.trendData) {
          campaign.trendData.forEach(dataPoint => {
            if (dataPoint.time) {
              allSlots.add(dataPoint.time);
            }
          });
        }
      });
    });
    
    // Sort time slots chronologically
    const sortedSlots = Array.from(allSlots).sort((a, b) => {
      const timeA = DateTime.fromFormat(a, 'h:mm a');
      const timeB = DateTime.fromFormat(b, 'h:mm a');
      return timeA - timeB;
    });
    
    setTimeSlots(sortedSlots);
  };
  
  // Effect to reapply filters when filter state changes
  useEffect(() => {
    if (trendHistory.length > 0) {
      applyFilters(trendHistory);
    }
  }, [filters, groupBy, viewMode, trendHistory]);
  
  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const resetFilters = () => {
    setFilters({
      offer: '',
      adAccount: '',
      mediaBuyer: '',
      network: '',
      searchTerm: '',
      startDate: null,
      endDate: null
    });
    setGroupBy('none');
  };
  
  const syncToServer = async () => {
    if (trendHistory.length === 0) {
      setError('No trend data to sync to server.');
      return;
    }
    
    try {
      setIsSyncing(true);
      setError(null);
      
      const response = await axios.post('/api/trends', {
        trendData: trendHistory
      });
      
      console.log('Server sync response:', response.data);
      
      if (response.data.success) {
        setLastSynced(new Date());
        alert('Successfully synced trend data to server!');
      } else {
        throw new Error('Sync response indicates failure');
      }
    } catch (error) {
      console.error('Error syncing to server:', error);
      setError('Failed to sync data to server. Please try again later.');
    } finally {
      setIsSyncing(false);
    }
  };
  
  const handleSyncFromServer = () => {
    loadTrendData(true);
  };
  
  const toggleDayExpansion = (date) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDays(newExpanded);
  };
  
  const formatDate = (dateStr) => {
    return DateTime.fromFormat(dateStr, 'yyyy-MM-dd').toFormat('EEEE, MMMM d, yyyy');
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
      case '📈':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case '📉':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getROIColorClass = (roi) => {
    if (typeof roi !== 'number' || isNaN(roi)) return 'text-gray-500';
    if (roi >= 30) return 'text-green-600 font-medium';
    if (roi >= 15) return 'text-amber-600 font-medium';
    return 'text-red-600 font-medium';
  };
  
  const getProfitTrend = (trendData) => {
    if (!trendData || trendData.length < 2) return { trend: '➡️', change: 0 };
    
    const first = trendData[0];
    const last = trendData[trendData.length - 1];
    
    const change = last.profit - first.profit;
    let trend = '➡️';
    
    if (change > 0) {
      trend = '📈';
    } else if (change < 0) {
      trend = '📉';
    }
    
    return { trend, change };
  };
  
  const exportTrendsToCsv = () => {
    // Only proceed if we have data
    if (trendHistory.length === 0) {
      alert('No trend data to export');
      return;
    }
    
    // Create CSV content
    let csvContent = "Date,Campaign,Network,Offer,Ad Account,Media Buyer,Initial Profit,Final Profit,Profit Change,Initial ROI,Final ROI,ROI Change,Total Leads\n";
    
    trendHistory.forEach(day => {
      const date = day.date;
      
      day.summary.forEach(campaign => {
        const { campaignName, network, offer, adAccount, mediaBuyer, trendData } = campaign;
        
        if (trendData.length > 0) {
          const firstCheckIn = trendData[0];
          const lastCheckIn = trendData[trendData.length - 1];
          
          const initialProfit = firstCheckIn.profit || 0;
          const finalProfit = lastCheckIn.profit || 0;
          const profitChange = finalProfit - initialProfit;
          
          const initialRoi = firstCheckIn.roi || 0;
          const finalRoi = lastCheckIn.roi || 0;
          const roiChange = finalRoi - initialRoi;
          
          const totalLeads = trendData.reduce((sum, data) => sum + (data.leads || 0), 0);
          
          csvContent += `"${date}","${campaignName}","${network}","${offer}","${adAccount}","${mediaBuyer}",${initialProfit},${finalProfit},${profitChange},${initialRoi},${finalRoi},${roiChange},${totalLeads}\n`;
        }
      });
    });
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'daily_trends_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const clearTrendHistory = () => {
    if (window.confirm("Are you sure you want to clear all daily trend history? This action cannot be undone.")) {
      localStorage.removeItem('dailyTrendHistory');
      setTrendHistory([]);
      setError(null);
    }
  };

  // Also load saved campaign trends history
  useEffect(() => {
    loadSavedCampaignTrends();
  }, []);

  // Load saved campaign trends history from localStorage
  const loadSavedCampaignTrends = () => {
    const savedTrends = localStorage.getItem('campaignTrendsHistory');
    if (savedTrends) {
      try {
        const parsedTrends = JSON.parse(savedTrends);
        console.log('Loaded saved campaign trends history:', {
          count: parsedTrends.length,
          dates: parsedTrends.map(day => day.date)
        });
      } catch (error) {
        console.error('Error parsing saved campaign trends:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Daily Campaign Trends</CardTitle>
          <div className="flex gap-2 items-center">
            {lastSynced && (
              <span className="text-xs text-gray-500">
                Last synced: {DateTime.fromJSDate(lastSynced).toFormat('MMM d, h:mm a')}
              </span>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSyncFromServer}
              disabled={isSyncing}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              {isSyncing ? 'Syncing...' : 'Sync from Server'}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={syncToServer}
              disabled={isSyncing || trendHistory.length === 0}
              className="flex items-center gap-1"
            >
              <Upload className="h-4 w-4" />
              {isSyncing ? 'Syncing...' : 'Save to Server'}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={exportTrendsToCsv}
              disabled={trendHistory.length === 0}
              className="flex items-center gap-1"
            >
              <Save className="h-4 w-4" />
              Export CSV
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={clearTrendHistory}
              disabled={trendHistory.length === 0 || isSyncing}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 flex items-center gap-1"
            >
              Clear History
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (window.confirm("Are you sure you want to fully reset trend history? This will clear local data and attempt to re-sync from server.")) {
                  // Clear localStorage first
                  localStorage.removeItem('dailyTrendHistory');
                  
                  // Reset state
                  setTrendHistory([]);
                  setError(null);
                  
                  // Force server fetch
                  loadTrendData(true);
                  
                  alert("Daily trend history has been reset. If connected to a server, data will be reloaded.");
                }
              }}
              className="bg-yellow-500 text-white hover:bg-yellow-600 flex items-center gap-1"
            >
              Reset & Sync
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700">
              {error}
            </div>
          )}
          
          {/* Filters and Controls */}
          {trendHistory.length > 0 && (
            <div className="mb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <div className="flex-1">
                    <Label htmlFor="view-mode">View Mode</Label>
                    <Select 
                      value={viewMode} 
                      onValueChange={(value) => setViewMode(value)}
                    >
                      <SelectTrigger id="view-mode">
                        <SelectValue placeholder="Select view mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="list">List View</SelectItem>
                        <SelectItem value="matrix">Matrix View</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="group-by">Group By</Label>
                    <Select 
                      value={groupBy} 
                      onValueChange={(value) => setGroupBy(value)}
                    >
                      <SelectTrigger id="group-by">
                        <SelectValue placeholder="No Grouping" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Grouping</SelectItem>
                        <SelectItem value="offer">Group by Offer</SelectItem>
                        <SelectItem value="adAccount">Group by Ad Account</SelectItem>
                        <SelectItem value="mediaBuyer">Group by Media Buyer</SelectItem>
                        <SelectItem value="network">Group by Network</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-end gap-2">
                  <div className="flex-1">
                    <Label htmlFor="search-term">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="search-term"
                        className="pl-8"
                        placeholder="Search campaigns..."
                        value={filters.searchTerm}
                        onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-end gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-10 gap-1">
                        <Filter className="h-4 w-4" />
                        Filters
                        {Object.values(filters).some(v => v && v !== '') && (
                          <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-600">
                            {Object.values(filters).filter(v => v && v !== '').length}
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-4 p-2">
                        <h4 className="font-medium">Filter Campaigns</h4>
                        
                        <div className="space-y-2">
                          <Label htmlFor="filter-offer">Offer</Label>
                          <Select 
                            value={filters.offer} 
                            onValueChange={(value) => handleFilterChange('offer', value)}
                          >
                            <SelectTrigger id="filter-offer">
                              <SelectValue placeholder="All Offers" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">All Offers</SelectItem>
                              {uniqueOffers.map(offer => (
                                <SelectItem key={offer} value={offer}>{offer}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="filter-adAccount">Ad Account</Label>
                          <Select 
                            value={filters.adAccount} 
                            onValueChange={(value) => handleFilterChange('adAccount', value)}
                          >
                            <SelectTrigger id="filter-adAccount">
                              <SelectValue placeholder="All Ad Accounts" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">All Ad Accounts</SelectItem>
                              {uniqueAdAccounts.map(account => (
                                <SelectItem key={account} value={account}>{account}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="filter-mediaBuyer">Media Buyer</Label>
                          <Select 
                            value={filters.mediaBuyer} 
                            onValueChange={(value) => handleFilterChange('mediaBuyer', value)}
                          >
                            <SelectTrigger id="filter-mediaBuyer">
                              <SelectValue placeholder="All Media Buyers" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">All Media Buyers</SelectItem>
                              {uniqueMediaBuyers.map(buyer => (
                                <SelectItem key={buyer} value={buyer}>{buyer}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="filter-network">Network</Label>
                          <Select 
                            value={filters.network} 
                            onValueChange={(value) => handleFilterChange('network', value)}
                          >
                            <SelectTrigger id="filter-network">
                              <SelectValue placeholder="All Networks" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">All Networks</SelectItem>
                              {uniqueNetworks.map(network => (
                                <SelectItem key={network} value={network}>{network}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="pt-2 flex justify-between">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={resetFilters}
                          >
                            Reset Filters
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => document.body.click()} // Close popover
                          >
                            Apply Filters
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-10 gap-1">
                        <Calendar className="h-4 w-4" />
                        Date Range
                        {(filters.startDate || filters.endDate) && (
                          <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-600">
                            Active
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-4">
                      <div className="space-y-4">
                        <h4 className="font-medium">Select Date Range</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="start-date">Start Date</Label>
                            <div className="mt-1">
                              <DatePicker
                                id="start-date"
                                selected={filters.startDate}
                                onSelect={(date) => handleFilterChange('startDate', date)}
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="end-date">End Date</Label>
                            <div className="mt-1">
                              <DatePicker
                                id="end-date"
                                selected={filters.endDate}
                                onSelect={(date) => handleFilterChange('endDate', date)}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              handleFilterChange('startDate', null);
                              handleFilterChange('endDate', null);
                            }}
                            className="mr-2"
                          >
                            Clear
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => document.body.click()} // Close popover
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={clearTrendHistory}
                    disabled={trendHistory.length === 0 || isSyncing}
                    className="h-10 text-red-500 hover:text-red-700 hover:bg-red-50 ml-auto"
                  >
                    Clear History
                  </Button>
                </div>
              </div>
            </div>
          )}
        
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading trend data...</p>
            </div>
          ) : trendHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No daily trend history available. Use the Mid-Day Check-In tab to save daily trends.
            </div>
          ) : filteredDays.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No data matching your current filters. Try adjusting your filter criteria.
            </div>
          ) : viewMode === 'matrix' ? (
            // Matrix View
            <div className="overflow-x-auto">
              <div className="text-sm text-gray-500 mb-2">
                Showing {filteredDays.reduce((sum, day) => sum + day.summary.length, 0)} campaigns
                {groupBy !== 'none' && ` grouped by ${groupBy}`} across {filteredDays.length} days
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-2 px-3 border-b sticky left-0 bg-gray-50">Campaign</th>
                    <th className="text-left py-2 px-3 border-b">Date</th>
                    {timeSlots.map(time => (
                      <th key={time} className="text-center py-2 px-3 border-b whitespace-nowrap">
                        {time}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Matrix rows - one per campaign per day */}
                  {filteredDays.map((day, dayIndex) => (
                    day.summary.map((campaign, campaignIndex) => {
                      // Skip campaigns with no trend data
                      if (!campaign.trendData || campaign.trendData.length === 0) return null;
                      
                      // Skip campaigns with $0 spend and $0 revenue
                      const hasSpendOrRevenue = campaign.trendData.some(
                        dataPoint => (dataPoint.spend > 0 || dataPoint.revenue > 0)
                      );
                      
                      if (!hasSpendOrRevenue) return null;
                      
                      // Prepare row data
                      const formattedDate = formatDate(day.date);
                      
                      return (
                        <tr key={`${dayIndex}-${campaignIndex}`} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-3 font-medium sticky left-0 bg-white">
                            {campaign.campaignName}
                            {groupBy !== 'none' && campaign.campaigns && (
                              <div className="text-xs text-gray-500">
                                ({campaign.campaigns.length} campaigns)
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">{formattedDate}</td>
                          {timeSlots.map(time => {
                            // Find data for this time slot
                            const dataPoint = campaign.trendData.find(d => d.time === time);
                            
                            if (!dataPoint) return <td key={time} className="py-2 px-3 text-center">-</td>;
                            
                            // Find the previous data point for comparison
                            const timeSlotIndex = timeSlots.indexOf(time);
                            let previousDataPoint = null;
                            
                            if (timeSlotIndex > 0) {
                              const previousTime = timeSlots[timeSlotIndex - 1];
                              previousDataPoint = campaign.trendData.find(d => d.time === previousTime);
                            }
                            
                            const roi = dataPoint.roi || 0;
                            const previousRoi = previousDataPoint?.roi || 0;
                            const roiChange = roi - previousRoi;
                            
                            const roiColorClass = getROIColorClass(roi);
                            
                            // Trend direction
                            let trendClass = 'text-gray-500';
                            let TrendIcon = Minus;
                            
                            if (roiChange > 0) {
                              trendClass = 'text-green-500';
                              TrendIcon = TrendingUp;
                            } else if (roiChange < 0) {
                              trendClass = 'text-red-500';
                              TrendIcon = TrendingDown;
                            }
                            
                            return (
                              <td key={time} className="py-2 px-3 text-center">
                                <div className={`${roiColorClass}`}>
                                  {formatPercent(roi)}
                                </div>
                                <div className="flex items-center justify-center gap-1">
                                  <TrendIcon className={`h-3 w-3 ${trendClass}`} />
                                  <span className="text-xs">{dataPoint.leads || 0} leads</span>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            // List View
            <div className="space-y-4">
              {filteredDays.map((day, dayIndex) => (
                <div key={dayIndex} className="border rounded-md overflow-hidden">
                  <div 
                    className="bg-gray-50 p-4 flex justify-between items-center cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleDayExpansion(day.date)}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">{formatDate(day.date)}</span>
                      <span className="text-gray-500">({day.summary.length} campaigns)</span>
                    </div>
                    {expandedDays.has(day.date) ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  
                  {expandedDays.has(day.date) && (
                    <div className="p-4">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-3">Campaign</th>
                              {groupBy === 'none' && (
                                <>
                                  <th className="text-left py-2 px-3">Network</th>
                                  <th className="text-left py-2 px-3">Offer</th>
                                  <th className="text-left py-2 px-3">Ad Account</th>
                                  <th className="text-left py-2 px-3">Media Buyer</th>
                                </>
                              )}
                              <th className="text-right py-2 px-3">Start Profit</th>
                              <th className="text-right py-2 px-3">End Profit</th>
                              <th className="text-center py-2 px-3">Trend</th>
                              <th className="text-right py-2 px-3">ROI Change</th>
                              <th className="text-right py-2 px-3">Total Leads</th>
                            </tr>
                          </thead>
                          <tbody>
                            {day.summary.map((campaign, campaignIndex) => {
                              const { trendData } = campaign;
                              
                              // Skip if no trend data
                              if (!trendData || trendData.length === 0) return null;
                              
                              // Skip campaigns with $0 spend and $0 revenue
                              const hasSpendOrRevenue = trendData.some(
                                dataPoint => (dataPoint.spend > 0 || dataPoint.revenue > 0)
                              );
                              
                              if (!hasSpendOrRevenue) return null;
                              
                              const firstCheckIn = trendData[0];
                              const lastCheckIn = trendData[trendData.length - 1];
                              const { trend, change } = getProfitTrend(trendData);
                              
                              const initialRoi = firstCheckIn.roi || 0;
                              const finalRoi = lastCheckIn.roi || 0;
                              
                              const totalLeads = trendData.reduce((sum, data) => sum + (data.leads || 0), 0);
                              
                              return (
                                <tr key={campaignIndex} className="border-b hover:bg-gray-50">
                                  <td className="py-2 px-3 font-medium">
                                    {campaign.campaignName}
                                    {groupBy !== 'none' && campaign.campaigns && (
                                      <div className="text-xs text-gray-500">
                                        {campaign.campaigns.length} campaigns
                                      </div>
                                    )}
                                  </td>
                                  
                                  {groupBy === 'none' && (
                                    <>
                                      <td className="py-2 px-3">{campaign.network}</td>
                                      <td className="py-2 px-3">{campaign.offer}</td>
                                      <td className="py-2 px-3">{campaign.adAccount}</td>
                                      <td className="py-2 px-3">{campaign.mediaBuyer}</td>
                                    </>
                                  )}
                                  
                                  <td className="py-2 px-3 text-right">
                                    {formatCurrency(firstCheckIn.profit)}
                                  </td>
                                  <td className="py-2 px-3 text-right">
                                    {formatCurrency(lastCheckIn.profit)}
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      {getTrendIcon(trend)}
                                      <span className={change >= 0 ? "text-green-600" : "text-red-600"}>
                                        {formatCurrency(Math.abs(change))}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-2 px-3 text-right">
                                    <span className={`${getROIColorClass(finalRoi)}`}>
                                      {formatPercent(initialRoi)} → {formatPercent(finalRoi)}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-right font-medium">
                                    {totalLeads}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyTrends; 