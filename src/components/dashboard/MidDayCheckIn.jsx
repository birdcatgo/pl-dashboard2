import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DateTime } from 'luxon';
import { ChevronDown, ChevronUp, Clock, Trash2, CheckSquare, Square } from 'lucide-react';
import axios from 'axios';
import { parseCampaignName } from '@/lib/campaign-utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getWebhookUrl, isValidWebhookUrl } from '../../lib/slack-config';

const MidDayCheckIn = () => {
  const [rawData, setRawData] = useState('');
  const [processedData, setProcessedData] = useState([]);
  const [historicalData, setHistoricalData] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [expandedTimestamps, setExpandedTimestamps] = useState(new Set());
  const [groupedData, setGroupedData] = useState({});
  const [selectedTimestamps, setSelectedTimestamps] = useState(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [selectedOffer, setSelectedOffer] = useState('');
  const [selectedAdAccount, setSelectedAdAccount] = useState('');
  const [selectedMediaBuyer, setSelectedMediaBuyer] = useState('');
  const [networks, setNetworks] = useState([]);
  const [offers, setOffers] = useState([]);
  const [adAccounts, setAdAccounts] = useState([]);
  const [mediaBuyers, setMediaBuyers] = useState([]);
  const [selectedSlackCheckIn, setSelectedSlackCheckIn] = useState(null);

  const parseCurrency = (value) => {
    if (!value) return 0;
    const cleaned = value.toString().replace(/[$,]/g, '').trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const parsePercentage = (value) => {
    if (!value) return 0;
    const cleaned = value.toString().replace(/[%]/g, '').trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const parseInteger = (value) => {
    if (!value) return 0;
    const cleaned = value.toString().replace(/[^\d]/g, '').trim();
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Load historical data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('middayCheckInData');
    const checkInsData = localStorage.getItem('middayCheckIns');
    let parsedCheckIns = [];
    
    if (checkInsData) {
      parsedCheckIns = JSON.parse(checkInsData);
      console.log('middayCheckIns data from localStorage:', 
        { 
          count: parsedCheckIns.length,
          timestamps: parsedCheckIns.map(c => DateTime.fromISO(c.timestamp).toFormat('dd LLL yyyy, h:mm a'))
        }
      );
    }
    
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      console.log('Loading historical data from localStorage:',
        {
          dataLength: parsedData.length,
          timestamps: [...new Set(parsedData.map(item => item.timestamp))].length
        }
      );
      
      // If the timestamps don't match, try to fix the inconsistency
      const middayCheckInTimestamps = new Set(parsedCheckIns.map(c => c.timestamp));
      const historicalTimestamps = new Set(parsedData.map(item => item.timestamp));
      
      console.log('Timestamp comparison:', {
        middayCheckInsTimestampCount: middayCheckInTimestamps.size,
        historicalTimestampCount: historicalTimestamps.size,
        inconsistent: middayCheckInTimestamps.size !== historicalTimestamps.size
      });
      
      // Make campaign data available for ALL timestamps in middayCheckIns
      if (middayCheckInTimestamps.size !== historicalTimestamps.size && parsedCheckIns.length > 0) {
        // First, organize existing historical data by timestamp
        const historicalByTimestamp = parsedData.reduce((acc, campaign) => {
          if (!acc[campaign.timestamp]) {
            acc[campaign.timestamp] = [];
          }
          acc[campaign.timestamp].push(campaign);
          return acc;
        }, {});
        
        // Build combined data using campaign details from middayCheckIns where possible
        let combinedData = [];
        
        // For each check-in in middayCheckIns
        parsedCheckIns.forEach(checkIn => {
          const timestamp = checkIn.timestamp;
          
          // If we already have campaign data for this timestamp, use it
          if (historicalByTimestamp[timestamp]) {
            combinedData = [...combinedData, ...historicalByTimestamp[timestamp]];
          } 
          // Otherwise, try to construct campaign data from the check-in
          else if (checkIn.campaigns && checkIn.campaigns.length > 0) {
            // Convert check-in campaigns to the historical data format
            const campaignsForTimestamp = checkIn.campaigns.map(campaign => ({
              timestamp: checkIn.timestamp,
              campaignName: campaign.campaignName,
              mediaBuyer: campaign.mediaBuyer,
              adAccount: campaign.adAccount,
              spend: campaign.spend,
              revenue: campaign.revenue,
              profit: campaign.profit,
              profitPercent: campaign.profitPercent,
              leads: campaign.leads,
              profitChange: campaign.profitChange,
              trend: campaign.trend,
              // Add any other fields that might be needed
              status: getCampaignStatus({
                profitPercent: campaign.profitPercent,
                leads: campaign.leads,
                costPerLead: campaign.spend > 0 && campaign.leads > 0 ? campaign.spend / campaign.leads : 0
              })
            }));
            
            combinedData = [...combinedData, ...campaignsForTimestamp];
          }
        });
        
        console.log('Fixed data inconsistency:', {
          originalHistoricalDataLength: parsedData.length,
          newCombinedDataLength: combinedData.length,
          newUniqueTimestamps: [...new Set(combinedData.map(item => item.timestamp))].length
        });
        
        // Update localStorage with the fixed data
        localStorage.setItem('middayCheckInData', JSON.stringify(combinedData));
        
        // Use the combined data instead
        parsedData = combinedData;
      }
      
      setHistoricalData(parsedData);
      
      // Group the historical data by timestamp
      const grouped = groupDataByTimestamp(parsedData);
      console.log('Grouped data by timestamp:', 
        { 
          groupCount: Object.keys(grouped).length,
          timestamps: Object.keys(grouped)
        }
      );
      setGroupedData(grouped);
    } else if (parsedCheckIns.length > 0) {
      // If we have check-ins but no historical data, create the historical data
      let newHistoricalData = [];
      
      parsedCheckIns.forEach(checkIn => {
        if (checkIn.campaigns && checkIn.campaigns.length > 0) {
          const campaignsForTimestamp = checkIn.campaigns.map(campaign => ({
            timestamp: checkIn.timestamp,
            campaignName: campaign.campaignName,
            mediaBuyer: campaign.mediaBuyer,
            adAccount: campaign.adAccount,
            spend: campaign.spend,
            revenue: campaign.revenue,
            profit: campaign.profit,
            profitPercent: campaign.profitPercent,
            leads: campaign.leads,
            profitChange: campaign.profitChange,
            trend: campaign.trend,
            // Add any other fields that might be needed
            status: getCampaignStatus({
              profitPercent: campaign.profitPercent,
              leads: campaign.leads,
              costPerLead: campaign.spend > 0 && campaign.leads > 0 ? campaign.spend / campaign.leads : 0
            })
          }));
          
          newHistoricalData = [...newHistoricalData, ...campaignsForTimestamp];
        }
      });
      
      if (newHistoricalData.length > 0) {
        console.log('Created historical data from check-ins:', {
          newDataLength: newHistoricalData.length,
          timestamps: [...new Set(newHistoricalData.map(item => item.timestamp))].length
        });
        
        localStorage.setItem('middayCheckInData', JSON.stringify(newHistoricalData));
        setHistoricalData(newHistoricalData);
        
        // Group the new historical data by timestamp
        const grouped = groupDataByTimestamp(newHistoricalData);
        setGroupedData(grouped);
      }
    }
  }, []);

  // Group data by timestamp
  const groupDataByTimestamp = (data) => {
    const result = data.reduce((acc, campaign) => {
      if (!acc[campaign.timestamp]) {
        acc[campaign.timestamp] = [];
      }
      acc[campaign.timestamp].push(campaign);
      return acc;
    }, {});
    
    return result;
  };

  const getCampaignStatus = (campaign) => {
    const roi = campaign.profitPercent;
    const leads = campaign.leads;

    if (roi >= 30 && leads >= 5) {
      return 'Scale ✅';
    } else if (roi < 15) {
      return 'Shutoff 🚫';
    } else {
      return 'Watch 👀';
    }
  };

  const processData = (data) => {
    if (!data) return [];
    
    const lines = data.split('\n').filter(line => line.trim());
    const campaigns = [];
    
    for (let i = 0; i < lines.length; i += 17) {
      const block = lines.slice(i, i + 17);
      if (block.length !== 17) {
        console.warn(`Skipping incomplete block at line ${i + 1}, expected 17 lines but got ${block.length}`);
        continue;
      }
      
      // Map the fields according to RedTrack format
      const campaignId = block[0].trim();
      const campaignName = block[1].trim();
      const campaignHash = block[2].trim();
      const adAccount = block[3].trim();
      const spend = parseCurrency(block[4]);
      const revenue = parseCurrency(block[5]);
      const profit = parseCurrency(block[6]);
      const roi = parsePercentage(block[7]);
      const leads = parseInteger(block[8]);
      // Lines 9-16 are optional metrics we don't need
      const trackingUrl = block[16].trim();
      
      // Skip campaigns with no activity
      if (spend === 0 && revenue === 0) {
        console.log(`Skipping inactive campaign: ${campaignName}`);
        continue;
      }
      
      // Parse campaign name components
      const parsedName = parseCampaignName(campaignName);
      
      // Create campaign object
      const campaign = {
        timestamp: DateTime.now().setZone('America/Los_Angeles').toISO(),
        campaignId,
        campaignName,
        campaignHash,
        network: parsedName.network || 'Unknown',
        offer: parsedName.offer || 'Unknown',
        mediaBuyer: parsedName.mediaBuyer || 'Unknown',
        adAccount,
        spend,
        revenue,
        profit,
        profitPercent: roi,
        leads,
        cpl: leads > 0 ? spend / leads : 0,
        status: getCampaignStatus({ profitPercent: roi, leads }),
        trend: '➡️' // Default trend, will be updated in handleProcessData
      };
      
      campaigns.push(campaign);
      
      // Log the processed campaign for debugging
      console.log('Processed campaign:', {
        name: campaign.campaignName,
        spend: campaign.spend,
        revenue: campaign.revenue,
        profit: campaign.profit,
        roi: campaign.profitPercent,
        leads: campaign.leads,
        status: campaign.status
      });
    }
    
    // Deduplicate campaigns
    const uniqueCampaigns = new Map();
    campaigns.forEach(c => {
      const key = `${c.campaignId}-${c.timestamp}`;
      if (!uniqueCampaigns.has(key)) {
        uniqueCampaigns.set(key, c);
      }
    });
    
    return Array.from(uniqueCampaigns.values());
  };

  const handleDataInput = (e) => {
    setRawData(e.target.value);
  };

  const handleProcessData = () => {
    const processed = processData(rawData);
    
    if (processed.length === 0) return;
    
    // Use a single timestamp for all processed campaigns
    const commonTimestamp = DateTime.now().setZone('America/Los_Angeles').toISO();
    const today = DateTime.fromISO(commonTimestamp).toFormat('yyyy-MM-dd');
    
    // Get existing check-ins from localStorage
    const existingCheckIns = JSON.parse(localStorage.getItem('middayCheckIns') || '[]');
    const existingData = JSON.parse(localStorage.getItem('middayCheckInData') || '[]');
    
    // Check if we already have a check-in for today with similar campaigns
    const todayCheckIns = existingCheckIns.filter(checkIn => {
      const checkInDate = DateTime.fromISO(checkIn.timestamp)
        .setZone('America/Los_Angeles')
        .toFormat('yyyy-MM-dd');
      return checkInDate === today;
    });

    if (todayCheckIns.length > 0) {
      // Compare campaign names to detect potential duplicates
      const newCampaignNames = new Set(processed.map(c => c.campaignName));
      const existingCampaignNames = new Set(
        todayCheckIns.flatMap(checkIn => checkIn.campaigns.map(c => c.campaignName))
      );

      // Check for significant overlap (e.g., more than 80% of campaigns match)
      const commonCampaigns = [...newCampaignNames].filter(name => existingCampaignNames.has(name));
      if (commonCampaigns.length >= 0.8 * newCampaignNames.size) {
        if (!window.confirm('A similar check-in already exists for today. Do you want to add this as a new check-in anyway?')) {
          return;
        }
      }
    }

    // Create a new check-in entry with trends
    const newCheckIn = {
      timestamp: commonTimestamp,
      campaigns: processed.map(campaign => {
        // Initialize trend variables
        let trend = '➡️'; // Default trend (new campaign or unchanged)
        let profitChange = 0;
        
        // Only look for trends if we have previous check-ins
        if (existingCheckIns.length > 0) {
          // Get the most recent check-in that has this campaign
          const prevCheckIn = existingCheckIns
            .slice()
            .reverse()
            .find(checkIn => 
              checkIn.campaigns.some(c => c.campaignName === campaign.campaignName)
            );
          
          if (prevCheckIn) {
            const prevCampaign = prevCheckIn.campaigns.find(
              c => c.campaignName === campaign.campaignName
            );
            
            if (prevCampaign && typeof prevCampaign.profit === 'number') {
              profitChange = campaign.profit - prevCampaign.profit;
              
              // Apply trend rules
              if (profitChange > 0) {
                trend = '📈'; // Profit increased
              } else if (profitChange < 0) {
                trend = '📉'; // Profit decreased
              }
              // If profitChange === 0, keep default '➡️'
            }
          }
          // If no previous check-in found for this campaign, keep default '➡️'
        }
        
        // Create campaign object with trend data
        return {
          campaignName: campaign.campaignName,
          mediaBuyer: campaign.mediaBuyer,
          adAccount: campaign.adAccount,
          spend: campaign.spend,
          revenue: campaign.revenue,
          profit: campaign.profit,
          profitPercent: campaign.profitPercent,
          leads: campaign.leads,
          profitChange,
          trend
        };
      })
    };

    // Add the new check-in to the list
    const updatedCheckIns = [...existingCheckIns, newCheckIn];
    
    // Store in localStorage
    localStorage.setItem('middayCheckIns', JSON.stringify(updatedCheckIns));
    
    // Update historical data without duplicates
    const newHistoricalData = [...existingData];
    
    // Add new campaigns, avoiding duplicates
    processed.forEach(newCampaign => {
      // Check if this exact campaign (by ID and timestamp) already exists
      const duplicateIndex = newHistoricalData.findIndex(existing => 
        existing.campaignId === newCampaign.campaignId && 
        existing.timestamp === newCampaign.timestamp
      );
      
      if (duplicateIndex === -1) {
        newHistoricalData.push({
          ...newCampaign,
          timestamp: commonTimestamp
        });
      }
    });
    
    // Update state
    setHistoricalData(newHistoricalData);
    setProcessedData([]); // Clear processed data since it's now in historical
    
    // Save to localStorage
    localStorage.setItem('middayCheckInData', JSON.stringify(newHistoricalData));
    
    // Clear the input area
    setRawData('');
  };

  const formatCurrency = (value) => {
    if (isNaN(value) || value === 0) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value) => {
    if (isNaN(value) || value === 0) return '0%';
    return `${value.toFixed(1)}%`;
  };

  const formatDate = (timestamp) => {
    return DateTime.fromISO(timestamp)
      .setZone('America/Los_Angeles')
      .toFormat('dd LLL yyyy, h:mm a');
  };

  const getROIColorClass = (roi) => {
    if (typeof roi !== 'number' || isNaN(roi)) return 'text-gray-500';
    if (roi >= 30) return 'text-green-600 font-medium';
    if (roi >= 15) return 'text-amber-600 font-medium';
    return 'text-red-600 font-medium';
  };

  const getStatusColor = (status) => {
    if (status.includes('Scale')) return 'text-green-600';
    if (status.includes('Watch')) return 'text-yellow-600';
    if (status.includes('Shutoff')) return 'text-red-600';
    return 'text-gray-600';
  };

  const sendToSlack = async (checkIn) => {
    setIsSending(true);
    try {
      if (!checkIn || !Array.isArray(checkIn.campaigns) || checkIn.campaigns.length === 0) {
        throw new Error('No campaign data available to send.');
      }

      const currentTime = DateTime.fromISO(checkIn.timestamp).setZone('America/Los_Angeles');
      const pstTime = currentTime.toFormat('dd LLL yyyy, h:mm a');

      // Get all check-ins from today to determine if this is the first one
      const existingCheckIns = JSON.parse(localStorage.getItem('middayCheckIns') || '[]');
      const todayCheckIns = existingCheckIns.filter(ci => {
        const checkInDate = DateTime.fromISO(ci.timestamp)
          .setZone('America/Los_Angeles')
          .toFormat('yyyy-MM-dd');
        return checkInDate === currentTime.toFormat('yyyy-MM-dd');
      });

      // ... existing message formatting code ...

      // Send to Slack using the new webhook configuration
      const webhookUrl = getWebhookUrl('PERFORMANCE');
      
      if (!isValidWebhookUrl(webhookUrl)) {
        throw new Error('Invalid Slack webhook URL');
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: message }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      alert('✅ Check-In sent to Slack successfully!');
    } catch (error) {
      console.error('Error sending to Slack:', error);
      alert(`❌ Failed to send to Slack: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const clearHistoricalData = () => {
    if (window.confirm('Are you sure you want to clear all historical data?')) {
      setHistoricalData([]);
      setGroupedData({});
      localStorage.removeItem('middayCheckInData');
      localStorage.removeItem('middayCheckIns');
    }
  };

  const deleteCheckIn = (timestamp) => {
    if (window.confirm('Are you sure you want to delete this check-in?')) {
      // Filter out the check-in with the given timestamp
      const updatedHistoricalData = historicalData.filter(
        campaign => campaign.timestamp !== timestamp
      );
      
      // Update state
      setHistoricalData(updatedHistoricalData);
      
      // Re-group the data
      const updatedGroupedData = groupDataByTimestamp(updatedHistoricalData);
      setGroupedData(updatedGroupedData);
      
      // Update localStorage
      localStorage.setItem('middayCheckInData', JSON.stringify(updatedHistoricalData));
      
      // Also update the middayCheckIns in localStorage
      const existingCheckIns = JSON.parse(localStorage.getItem('middayCheckIns') || '[]');
      const updatedCheckIns = existingCheckIns.filter(checkIn => checkIn.timestamp !== timestamp);
      localStorage.setItem('middayCheckIns', JSON.stringify(updatedCheckIns));
    }
  };

  const toggleTimestampExpansion = (timestamp) => {
    if (selectMode) {
      toggleTimestampSelection(timestamp);
      return;
    }
    
    const newExpanded = new Set(expandedTimestamps);
    if (newExpanded.has(timestamp)) {
      newExpanded.delete(timestamp);
    } else {
      newExpanded.add(timestamp);
    }
    setExpandedTimestamps(newExpanded);
  };

  // New function to toggle timestamp selection
  const toggleTimestampSelection = (timestamp) => {
    const newSelected = new Set(selectedTimestamps);
    if (newSelected.has(timestamp)) {
      newSelected.delete(timestamp);
    } else {
      newSelected.add(timestamp);
    }
    setSelectedTimestamps(newSelected);
  };

  // Toggle select mode
  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    if (selectMode) {
      // Clear selections when exiting select mode
      setSelectedTimestamps(new Set());
    }
  };

  // Check if all timestamps are selected
  const areAllSelected = () => {
    return allTimestamps.length > 0 && selectedTimestamps.size === allTimestamps.length;
  };

  // Toggle select all timestamps
  const toggleSelectAll = () => {
    if (areAllSelected()) {
      setSelectedTimestamps(new Set());
    } else {
      setSelectedTimestamps(new Set(allTimestamps));
    }
  };

  // Delete multiple check-ins
  const deleteSelectedCheckIns = () => {
    if (selectedTimestamps.size === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedTimestamps.size} check-in(s)?`)) {
      // Filter out the check-ins with the selected timestamps
      const updatedHistoricalData = historicalData.filter(
        campaign => !selectedTimestamps.has(campaign.timestamp)
      );
      
      // Update state
      setHistoricalData(updatedHistoricalData);
      
      // Re-group the data
      const updatedGroupedData = groupDataByTimestamp(updatedHistoricalData);
      setGroupedData(updatedGroupedData);
      
      // Update localStorage
      localStorage.setItem('middayCheckInData', JSON.stringify(updatedHistoricalData));
      
      // Also update the middayCheckIns in localStorage
      const existingCheckIns = JSON.parse(localStorage.getItem('middayCheckIns') || '[]');
      const updatedCheckIns = existingCheckIns.filter(checkIn => !selectedTimestamps.has(checkIn.timestamp));
      localStorage.setItem('middayCheckIns', JSON.stringify(updatedCheckIns));
      
      // Clear selections
      setSelectedTimestamps(new Set());
    }
  };

  // Get an array of all timestamps
  const allTimestamps = useMemo(() => {
    // Only use historicalData since it contains all campaigns including processed ones
    const uniqueTimestamps = [...new Set(historicalData.map(item => item.timestamp))];
    const sortedTimestamps = uniqueTimestamps.sort((a, b) => new Date(b) - new Date(a)); // Sort by most recent first
    
    console.log('All Timestamps calculation:', {
      historicalDataLength: historicalData.length,
      uniqueTimestampsLength: uniqueTimestamps.length,
      sortedTimestamps: sortedTimestamps.map(t => DateTime.fromISO(t).toFormat('dd LLL yyyy, h:mm a'))
    });
    
    return sortedTimestamps;
  }, [historicalData]);

  const consolidateAndStoreDailyTrends = () => {
    const checkInsData = localStorage.getItem('middayCheckIns');
    console.log('Check-ins data:', { 
      hasData: !!checkInsData,
      dataLength: checkInsData?.length || 0
    });
    
    if (!checkInsData) {
      alert('No check-in data found. Please process some data first.');
      return;
    }
    
    let parsedCheckIns;
    try {
      parsedCheckIns = JSON.parse(checkInsData);
      console.log('Parsed check-ins:', {
        count: parsedCheckIns.length,
        firstCheckIn: parsedCheckIns[0],
        lastCheckIn: parsedCheckIns[parsedCheckIns.length - 1]
      });
    } catch (error) {
      console.error('Error parsing check-ins:', error);
      alert('Error parsing check-in data. Please try processing the data again.');
      return;
    }
    
    if (parsedCheckIns.length === 0) {
      alert('No check-ins to consolidate. Please process some data first.');
      return;
    }
    
    // Group check-ins by date
    const checkInsByDate = {};
    
    parsedCheckIns.forEach(checkIn => {
      const date = DateTime.fromISO(checkIn.timestamp).setZone('America/Los_Angeles').toFormat('yyyy-MM-dd');
      
      if (!checkInsByDate[date]) {
        checkInsByDate[date] = [];
      }
      
      checkInsByDate[date].push(checkIn);
    });
    
    // Process each day's data
    const consolidatedData = Object.keys(checkInsByDate).map(date => {
      const dayCheckIns = checkInsByDate[date];
      
      // Get all unique campaigns across all check-ins for this day
      const allCampaigns = new Set();
      dayCheckIns.forEach(checkIn => {
        checkIn.campaigns.forEach(campaign => {
          allCampaigns.add(campaign.campaignName);
        });
      });
      
      // For each campaign, collect trend data across the day
      const campaignSummaries = Array.from(allCampaigns).map(campaignName => {
        const trendData = [];
        
        // Sort check-ins chronologically
        const sortedCheckIns = [...dayCheckIns].sort((a, b) => 
          new Date(a.timestamp) - new Date(b.timestamp)
        );
        
        sortedCheckIns.forEach(checkIn => {
          const campaign = checkIn.campaigns.find(c => c.campaignName === campaignName);
          
          if (campaign) {
            trendData.push({
              time: DateTime.fromISO(checkIn.timestamp).setZone('America/Los_Angeles').toFormat('h:mm a'),
              profit: campaign.profit,
              roi: campaign.profitPercent,
              leads: campaign.leads,
              spend: campaign.spend,
              revenue: campaign.revenue,
              profitChange: campaign.profitChange,
              trend: campaign.trend
            });
          }
        });
        
        // Get network, offer, adAccount, mediaBuyer from the most recent check-in with this campaign
        const mostRecentCheckIn = sortedCheckIns.slice().reverse().find(checkIn => 
          checkIn.campaigns.some(c => c.campaignName === campaignName)
        );
        
        const campaignDetails = mostRecentCheckIn?.campaigns.find(c => c.campaignName === campaignName) || {};
        
        // Use the parseCampaignName function to correctly extract campaign components
        const parsedCampaign = parseCampaignName(campaignName);
        
        return {
          campaignName,
          network: parsedCampaign.network,
          offer: parsedCampaign.offer,
          adAccount: campaignDetails.adAccount || parsedCampaign.adAccount,
          mediaBuyer: campaignDetails.mediaBuyer || parsedCampaign.mediaBuyer,
          trendData
        };
      });
      
      return {
        date,
        summary: campaignSummaries
      };
    });
    
    // Get existing daily trend history
    const existingHistory = JSON.parse(localStorage.getItem('dailyTrendHistory') || '[]');
    
    // Create a map of existing dates for easy lookup
    const existingDatesMap = {};
    existingHistory.forEach(entry => {
      existingDatesMap[entry.date] = entry;
    });
    
    // Create a new merged array, replacing entries with the same date
    let updatedHistory = [...existingHistory];
    
    // For each newly consolidated day
    consolidatedData.forEach(newDay => {
      // Check if we already have data for this day
      const existingIndex = updatedHistory.findIndex(existing => existing.date === newDay.date);
      
      if (existingIndex >= 0) {
        // Replace the existing entry with new data
        console.log(`Updating existing data for date: ${newDay.date}`);
        updatedHistory[existingIndex] = newDay;
      } else {
        // Add new entry
        console.log(`Adding new data for date: ${newDay.date}`);
        updatedHistory.push(newDay);
      }
    });
    
    // Log detail about what we're saving
    console.log('Saving daily trend history:', {
      existingHistoryCount: existingHistory.length,
      newDaysCount: consolidatedData.length,
      updatedHistoryCount: updatedHistory.length,
      dates: updatedHistory.map(day => day.date)
    });
    
    // Sort by date (newest first) for better display
    updatedHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Store the updated history
    localStorage.setItem('dailyTrendHistory', JSON.stringify(updatedHistory));
    
    console.log('Daily trend history updated:', {
      totalDays: updatedHistory.length,
      newDaysAdded: consolidatedData.length,
      daysInExistingHistory: existingHistory.length,
      datesAdded: consolidatedData.map(entry => entry.date)
    });
    
    return updatedHistory;
  };

  // Add this function after clearHistoricalData
  const consolidateToDailyTrends = () => {
    if (window.confirm('Are you sure you want to consolidate data to daily trends? This action cannot be undone.')) {
      const result = consolidateAndStoreDailyTrends();
      if (result) {
        // After consolidation, sync to server if in production
        if (process.env.NODE_ENV === 'production') {
          try {
            // Show initial success message
            alert(`Successfully consolidated data into daily trends. ${result.length} days updated. Syncing to server...`);
            
            // Sync to server
            fetch('/api/trends', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ trendData: result }),
            })
              .then(response => response.json())
              .then(data => {
                if (data.success) {
                  alert(`Successfully synced trend data to server!`);
                } else {
                  alert(`Server sync failed. Error: ${data.error}`);
                }
              })
              .catch(error => {
                console.error('Error syncing to server:', error);
                alert(`Server sync failed. See console for details.`);
              });
          } catch (error) {
            console.error('Error syncing to server:', error);
            alert(`Failed to sync to server. Data is still saved locally.`);
          }
        } else {
          alert(`Successfully consolidated data into daily trends. ${result.length} days updated.`);
        }
      } else {
        alert('No data to consolidate or consolidation failed.');
      }
    }
  };

  // Add function to handle Slack selection
  const handleSlackSelection = (timestamp) => {
    setSelectedSlackCheckIn(timestamp === selectedSlackCheckIn ? null : timestamp);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mid-Day Check-In</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="Paste RedTrack data here..."
              value={rawData}
              onChange={handleDataInput}
              className="min-h-[200px] font-mono text-sm"
            />
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <Button onClick={handleProcessData} disabled={!rawData}>
                  Process Data
                </Button>
                <Button onClick={consolidateAndStoreDailyTrends} variant="outline">
                  Consolidate Trends
                </Button>
                <Button 
                  onClick={consolidateToDailyTrends} 
                  className="bg-[#4A90E2] text-white hover:bg-[#357ABD]"
                >
                  Consolidate to Daily Trends
                </Button>
                {historicalData.length > 0 && (
                  <Button 
                    onClick={() => {
                      if (!selectedSlackCheckIn) {
                        alert('Please select a check-in to send to Slack.');
                        return;
                      }
                      const existingCheckIns = JSON.parse(localStorage.getItem('middayCheckIns') || '[]');
                      const selectedCheckIn = existingCheckIns.find(
                        checkIn => checkIn.timestamp === selectedSlackCheckIn
                      );
                      if (!selectedCheckIn) {
                        alert('Selected check-in not found.');
                        return;
                      }
                      sendToSlack(selectedCheckIn);
                    }}
                    disabled={isSending || !selectedSlackCheckIn}
                    className="bg-[#36C5AB] text-white hover:bg-[#2BA192]"
                  >
                    {isSending ? 'Sending...' : `Send ${selectedSlackCheckIn ? formatDate(selectedSlackCheckIn) : ''} to Slack`}
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={toggleSelectMode} variant="outline">
                  {selectMode ? 'Cancel Selection' : 'Select Check-Ins'}
                </Button>
                {selectMode && (
                  <Button onClick={deleteSelectedCheckIns} variant="destructive">
                    Delete Selected
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {(processedData.length > 0 || historicalData.length > 0) && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Historical Check-Ins</CardTitle>
              <div className="flex items-center gap-2">
                <Button 
                  variant={selectMode ? "default" : "outline"} 
                  size="sm"
                  onClick={toggleSelectMode}
                >
                  {selectMode ? "Cancel" : "Select Mode"}
                </Button>
                {selectMode && (
                  <>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={toggleSelectAll}
                    >
                      {areAllSelected() ? "Deselect All" : "Select All"}
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={deleteSelectedCheckIns}
                      disabled={selectedTimestamps.size === 0}
                    >
                      Delete Selected ({selectedTimestamps.size})
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    {selectMode && (
                      <th className="p-2 text-center w-10">
                        <div 
                          className="cursor-pointer inline-block" 
                          onClick={toggleSelectAll}
                        >
                          {areAllSelected() ? (
                            <CheckSquare className="h-5 w-5 text-blue-500" />
                          ) : (
                            <Square className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </th>
                    )}
                    <th className="p-2 text-center w-10">Slack</th>
                    <th className="p-2 text-left w-48">Timestamp</th>
                    <th className="p-2 text-left w-24">Campaigns</th>
                    <th className="p-2 text-right w-32">Total Spend</th>
                    <th className="p-2 text-right w-32">Total Revenue</th>
                    <th className="p-2 text-right w-32">Total Profit</th>
                    <th className="p-2 text-right w-24">Avg ROI</th>
                    <th className="p-2 text-right w-24">Total Leads</th>
                    <th className="p-2 text-center w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allTimestamps.map((timestamp) => {
                    const campaignsForTimestamp = historicalData.filter(
                      campaign => campaign.timestamp === timestamp
                    );
                    
                    const validCampaigns = campaignsForTimestamp.filter(c => {
                      return c.spend !== undefined || 
                             c.revenue !== undefined || 
                             c.profit !== undefined || 
                             c.leads !== undefined;
                    });
                    
                    if (validCampaigns.length === 0) return null;
                    
                    const totalSpend = validCampaigns.reduce((sum, campaign) => sum + (campaign.spend || 0), 0);
                    const totalRevenue = validCampaigns.reduce((sum, campaign) => sum + (campaign.revenue || 0), 0);
                    const totalProfit = validCampaigns.reduce((sum, campaign) => sum + (campaign.profit || 0), 0);
                    const totalLeads = validCampaigns.reduce((sum, campaign) => sum + (campaign.leads || 0), 0);
                    const avgROI = totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0;
                    
                    return (
                      <React.Fragment key={timestamp}>
                        <tr 
                          className={`border-t hover:bg-gray-50 cursor-pointer ${selectedTimestamps.has(timestamp) ? 'bg-blue-50' : ''}`}
                          onClick={() => toggleTimestampExpansion(timestamp)}
                        >
                          {selectMode && (
                            <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                              <div 
                                className="cursor-pointer inline-block" 
                                onClick={() => toggleTimestampSelection(timestamp)}
                              >
                                {selectedTimestamps.has(timestamp) ? (
                                  <CheckSquare className="h-5 w-5 text-blue-500" />
                                ) : (
                                  <Square className="h-5 w-5 text-gray-400" />
                                )}
                              </div>
                            </td>
                          )}
                          <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                            <div 
                              className="cursor-pointer inline-block" 
                              onClick={() => handleSlackSelection(timestamp)}
                            >
                              {selectedSlackCheckIn === timestamp ? (
                                <CheckSquare className="h-5 w-5 text-green-500" />
                              ) : (
                                <Square className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                          </td>
                          <td className="p-2 text-left font-medium flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            {formatDate(timestamp)}
                          </td>
                          <td className="p-2 text-left">{validCampaigns.length}</td>
                          <td className="p-2 text-right font-medium">{formatCurrency(totalSpend)}</td>
                          <td className="p-2 text-right font-medium">{formatCurrency(totalRevenue)}</td>
                          <td className={`p-2 text-right font-medium ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(totalProfit)}
                          </td>
                          <td className={`p-2 text-right ${getROIColorClass(avgROI)}`}>
                            {formatPercent(avgROI)}
                          </td>
                          <td className="p-2 text-right font-medium">{totalLeads}</td>
                          <td className="p-2 text-center flex items-center justify-end space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteCheckIn(timestamp);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            {expandedTimestamps.has(timestamp) ? (
                              <ChevronUp className="h-5 w-5 text-gray-400 inline-block" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-400 inline-block" />
                            )}
                          </td>
                        </tr>
                        {expandedTimestamps.has(timestamp) && (
                          <tr>
                            <td colSpan={selectMode ? "9" : "8"} className="p-0">
                              <div className="p-4 bg-gray-50">
                                <h4 className="font-medium text-sm mb-2">Campaign Details:</h4>
                                <div className="overflow-x-auto border rounded-md">
                                  <table className="w-full border-collapse bg-white">
                                    <thead>
                                      <tr className="bg-gray-100">
                                        <th className="p-2 text-left font-medium w-48">Campaign</th>
                                        <th className="p-2 text-left font-medium w-32">Media Buyer</th>
                                        <th className="p-2 text-left font-medium w-32">Ad Account</th>
                                        <th className="p-2 text-right font-medium w-24">Spend</th>
                                        <th className="p-2 text-right font-medium w-24">Revenue</th>
                                        <th className="p-2 text-right font-medium w-24">Profit</th>
                                        <th className="p-2 text-center font-medium w-20">ROI</th>
                                        <th className="p-2 text-center font-medium w-20">Leads</th>
                                        <th className="p-2 text-right font-medium w-20">CPL</th>
                                        <th className="p-2 text-left font-medium w-24">Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {validCampaigns.map((campaign, idx) => (
                                        <tr key={idx} className="border-t hover:bg-gray-50">
                                          <td className="p-2 text-left font-bold">{campaign.campaignName}</td>
                                          <td className="p-2 text-left">{campaign.mediaBuyer}</td>
                                          <td className="p-2 text-left">{campaign.adAccount}</td>
                                          <td className="p-2 text-right font-medium">{formatCurrency(campaign.spend || 0)}</td>
                                          <td className="p-2 text-right font-medium">{formatCurrency(campaign.revenue || 0)}</td>
                                          <td className={`p-2 text-right font-medium ${(campaign.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(campaign.profit || 0)}
                                          </td>
                                          <td className={`p-2 text-center ${getROIColorClass(campaign.profitPercent || 0)}`}>
                                            {formatPercent(campaign.profitPercent || 0)}
                                          </td>
                                          <td className="p-2 text-center">
                                            <div className="text-sm font-medium">{campaign.leads || 0}</div>
                                          </td>
                                          <td className="p-2 text-right font-medium">
                                            {formatCurrency((campaign.spend || 0) / (campaign.leads || 1))}
                                          </td>
                                          <td className={`p-2 text-left font-medium ${getStatusColor(campaign.status)}`}>
                                            {campaign.status}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MidDayCheckIn; 