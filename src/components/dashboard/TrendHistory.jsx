import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DateTime } from 'luxon';
import { TrendingUp, TrendingDown, Minus, Calendar, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from 'axios';

const TrendHistory = () => {
  const [savedSnapshots, setSavedSnapshots] = useState([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [expandedCampaigns, setExpandedCampaigns] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [snapshotToDelete, setSnapshotToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load saved snapshots on component mount
  useEffect(() => {
    loadSavedSnapshots();
  }, []);

  const loadSavedSnapshots = () => {
    setIsLoading(true);
    try {
      const savedTrends = localStorage.getItem('campaignTrendsHistory');
      if (savedTrends) {
        const parsedTrends = JSON.parse(savedTrends);
        // Sort by date (newest first)
        const sortedTrends = [...parsedTrends].sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        );
        
        setSavedSnapshots(sortedTrends);
        
        // Select the most recent snapshot by default if available
        if (sortedTrends.length > 0 && !selectedSnapshot) {
          setSelectedSnapshot(sortedTrends[0]);
          
          // Initialize expanded state for all campaigns to false
          const initialExpandedState = {};
          sortedTrends[0].campaigns.forEach(campaign => {
            initialExpandedState[campaign.campaignName] = false;
          });
          setExpandedCampaigns(initialExpandedState);
        }
      } else {
        setSavedSnapshots([]);
      }
    } catch (error) {
      console.error('Error loading saved snapshots:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSnapshotSelect = (timestamp) => {
    const selected = savedSnapshots.find(snapshot => snapshot.timestamp === timestamp);
    if (selected) {
      setSelectedSnapshot(selected);
      
      // Initialize expanded state for all campaigns to false
      const initialExpandedState = {};
      selected.campaigns.forEach(campaign => {
        initialExpandedState[campaign.campaignName] = false;
      });
      setExpandedCampaigns(initialExpandedState);
    }
  };

  const toggleCampaignExpanded = (campaignName) => {
    setExpandedCampaigns(prev => ({
      ...prev,
      [campaignName]: !prev[campaignName]
    }));
  };

  const formatDate = (dateStr) => {
    return DateTime.fromISO(dateStr).toFormat('MMMM d, yyyy');
  };

  const formatTimestamp = (timestamp) => {
    return DateTime.fromISO(timestamp)
      .setZone('America/Los_Angeles')
      .toFormat('h:mm a');
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

  const handleDeleteSnapshot = (snapshot) => {
    setSnapshotToDelete(snapshot);
    setConfirmDelete(true);
  };

  const confirmDeleteSnapshot = () => {
    if (!snapshotToDelete) return;
    
    try {
      // Filter out the snapshot to delete
      const updatedSnapshots = savedSnapshots.filter(
        snapshot => snapshot.timestamp !== snapshotToDelete.timestamp
      );
      
      // Update localStorage
      localStorage.setItem('campaignTrendsHistory', JSON.stringify(updatedSnapshots));
      
      // Update state
      setSavedSnapshots(updatedSnapshots);
      
      // If we deleted the currently selected snapshot, select the most recent one
      if (selectedSnapshot?.timestamp === snapshotToDelete.timestamp) {
        if (updatedSnapshots.length > 0) {
          setSelectedSnapshot(updatedSnapshots[0]);
        } else {
          setSelectedSnapshot(null);
        }
      }
      
      // Try to update server data if in production
      if (process.env.NODE_ENV === 'production') {
        axios.post('/api/trends', { trendData: updatedSnapshots })
          .catch(error => console.error('Error updating server data:', error));
      }
    } catch (error) {
      console.error('Error deleting snapshot:', error);
    }
    
    // Reset delete state
    setSnapshotToDelete(null);
    setConfirmDelete(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Saved Campaign Trend History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              Loading saved trend history...
            </div>
          ) : savedSnapshots.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No saved trend history found. Use the "Save to History" button on Today's Campaign Trends to save snapshots.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-64">
                  <Select 
                    value={selectedSnapshot?.timestamp || ''} 
                    onValueChange={handleSnapshotSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a saved snapshot" />
                    </SelectTrigger>
                    <SelectContent>
                      {savedSnapshots.map(snapshot => (
                        <SelectItem key={snapshot.timestamp} value={snapshot.timestamp}>
                          {snapshot.label || formatDate(snapshot.date)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedSnapshot && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDeleteSnapshot(selectedSnapshot)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                )}
              </div>

              {selectedSnapshot && (
                <div className="space-y-6">
                  <div className="p-4 bg-gray-50 rounded-md">
                    <div className="text-sm text-gray-500 mb-1">
                      <Calendar className="h-4 w-4 inline-block mr-1" /> 
                      {formatDate(selectedSnapshot.date)}
                    </div>
                    <h3 className="text-lg font-semibold">
                      {selectedSnapshot.label || `Campaign Snapshot - ${formatDate(selectedSnapshot.date)}`}
                    </h3>
                    <div className="text-sm text-gray-500 mt-1">
                      {selectedSnapshot.checkIns.length} check-ins recorded
                    </div>
                  </div>

                  <div className="space-y-4">
                    {selectedSnapshot.campaigns.map(campaign => (
                      <Card key={campaign.campaignName} className="overflow-hidden">
                        <div 
                          className="flex items-center justify-between p-4 cursor-pointer bg-gray-50 hover:bg-gray-100"
                          onClick={() => toggleCampaignExpanded(campaign.campaignName)}
                        >
                          <h4 className="font-medium">{campaign.campaignName}</h4>
                          <div className="flex items-center gap-2">
                            {expandedCampaigns[campaign.campaignName] ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                        
                        {expandedCampaigns[campaign.campaignName] && (
                          <div className="p-4">
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b">
                                    <th className="text-left py-2 px-3">Time</th>
                                    <th className="text-center py-2 px-3">ROI</th>
                                    <th className="text-center py-2 px-3">Profit</th>
                                    <th className="text-center py-2 px-3">Leads</th>
                                    <th className="text-center py-2 px-3">Trend</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {campaign.history.map((entry, index) => (
                                    <tr key={index} className="border-b">
                                      <td className="py-2 px-3">{formatTimestamp(entry.timestamp)}</td>
                                      <td className={`text-center py-2 px-3 ${getROIColorClass(entry.roi)}`}>
                                        {formatPercent(entry.roi)}
                                      </td>
                                      <td className="text-center py-2 px-3 font-medium">
                                        {formatCurrency(entry.profit)}
                                      </td>
                                      <td className="text-center py-2 px-3">
                                        {entry.leads}
                                      </td>
                                      <td className="text-center py-2 px-3">
                                        {getTrendIcon(entry.trend)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Delete Dialog */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the snapshot from{' '}
              {snapshotToDelete ? (snapshotToDelete.label || formatDate(snapshotToDelete.date)) : ''}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteSnapshot}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrendHistory; 