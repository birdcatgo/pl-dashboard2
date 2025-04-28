import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DateTime } from 'luxon';
import { TrendingUp, TrendingDown, Minus, Save, Calendar } from 'lucide-react';
import { Button } from "@/components/ui/button";
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TodaysTrend = () => {
  const [checkIns, setCheckIns] = useState([]);
  const [groupedCampaigns, setGroupedCampaigns] = useState({});
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveLabel, setSaveLabel] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

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

  // Save today's trends to history
  const saveTrendsToHistory = async () => {
    if (checkIns.length === 0 || Object.keys(groupedCampaigns).length === 0) {
      setSavedMessage("No data to save.");
      return;
    }

    try {
      setIsSaving(true);

      // Format the data for storage
      const today = DateTime.now().setZone('America/Los_Angeles');
      const todayFormatted = today.toFormat('yyyy-MM-dd');
      
      const trendsSnapshot = {
        date: todayFormatted,
        label: saveLabel || today.toFormat('MMMM d, yyyy'),
        timestamp: new Date().toISOString(),
        checkIns: checkIns,
        campaigns: Object.values(groupedCampaigns).map(campaign => ({
          campaignName: campaign.name,
          history: campaign.history
        }))
      };

      // Get existing history or initialize new array
      const existingHistory = JSON.parse(localStorage.getItem('campaignTrendsHistory') || '[]');
      
      // Add new snapshot
      existingHistory.push(trendsSnapshot);
      
      // Save back to localStorage
      localStorage.setItem('campaignTrendsHistory', JSON.stringify(existingHistory));

      // Try to save to server if in production
      if (process.env.NODE_ENV === 'production') {
        try {
          // First, get existing trend data
          const trendsResponse = await axios.get('/api/trends');
          const existingTrendData = trendsResponse.data.trendData || [];
          
          // Add our new day to the existing trends
          const updatedTrendData = [...existingTrendData, trendsSnapshot];
          
          // Save back to server
          await axios.post('/api/trends', { trendData: updatedTrendData });
          
          console.log('Saved trends to server');
        } catch (error) {
          console.error('Error saving to server:', error);
          // Continue with local save even if server save fails
        }
      }

      setSavedMessage("Today's trends saved successfully!");
      setSaveDialogOpen(false);
      setSaveLabel('');
      
      // Automatically clear message after 3 seconds
      setTimeout(() => {
        setSavedMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error saving trends:', error);
      setSavedMessage("Error saving trends: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Open save dialog
  const handleSaveClick = () => {
    const today = DateTime.now().setZone('America/Los_Angeles');
    setSaveLabel(today.toFormat('MMMM d, yyyy'));
    setSaveDialogOpen(true);
  };

  // Sort check-ins by timestamp for display
  const sortedCheckIns = [...checkIns].sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Today's Campaign Trends</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSaveClick}
            disabled={checkIns.length === 0}
            className="flex items-center gap-1"
          >
            <Save className="h-4 w-4" />
            Save to History
          </Button>
        </CardHeader>
        <CardContent>
          {sortedCheckIns.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No check-ins recorded. Use the Mid-Day Check-In tab to add data.
            </div>
          ) : (
            <>
              {savedMessage && (
                <div className="mb-4 p-2 bg-green-50 text-green-700 rounded border border-green-200">
                  {savedMessage}
                </div>
              )}
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Today's Campaign Trends</DialogTitle>
            <DialogDescription>
              This will save a snapshot of today's campaign trends for future reference.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="save-label">Label (optional)</Label>
              <Input
                id="save-label"
                placeholder="e.g., March 15 - High ROI Day"
                value={saveLabel}
                onChange={(e) => setSaveLabel(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={saveTrendsToHistory} 
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TodaysTrend; 