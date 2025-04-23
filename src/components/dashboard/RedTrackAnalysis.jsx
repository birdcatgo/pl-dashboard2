import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from 'date-fns';

const RedTrackAnalysis = () => {
  const [rawData, setRawData] = useState('');
  const [processedData, setProcessedData] = useState([]);
  const [historicalData, setHistoricalData] = useState([]);
  const [selectedView, setSelectedView] = useState('current'); // 'current' or 'historical'

  // Load historical data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('redtrackHistoricalData');
    if (savedData) {
      setHistoricalData(JSON.parse(savedData));
    }
  }, []);

  const getCampaignStatus = (campaign) => {
    const roi = campaign.profitPercent;
    const leads = campaign.leads;
    const cpl = campaign.costPerLead;

    if (roi > 30 && leads >= 5) {
      return 'Scale';
    } else if (roi < 15 || cpl > 100) {
      return 'Shutoff';
    } else {
      return 'Watch';
    }
  };

  const processData = (data) => {
    // Split into lines and remove empty lines
    const lines = data.split('\n')
      .map(line => line.trim())
      .filter(line => line !== '');
    
    // Group into chunks of 17 lines
    const chunks = [];
    for (let i = 0; i < lines.length; i += 17) {
      const chunk = lines.slice(i, i + 17);
      if (chunk.length === 17) {
        chunks.push(chunk);
      }
    }

    // Process each chunk
    const processed = chunks.map(chunk => {
      // Helper function to parse currency values
      const parseCurrency = (value) => {
        const cleaned = value.replace(/[$,]/g, '').trim();
        return cleaned === '' || cleaned === '-' ? 0 : parseFloat(cleaned);
      };
      
      // Helper function to parse percentage values
      const parsePercentage = (value) => {
        const cleaned = value.replace('%', '').trim();
        return cleaned === '' || cleaned === '-' ? 0 : parseFloat(cleaned);
      };
      
      // Helper function to parse integer values
      const parseInteger = (value) => {
        const cleaned = value.trim();
        return cleaned === '' || cleaned === '-' ? 0 : parseInt(cleaned);
      };

      const campaign = {
        campaignId: chunk[0],
        campaignName: chunk[1],
        adId: chunk[2],
        platform: chunk[3],
        spend: parseCurrency(chunk[4]),
        revenue: parseCurrency(chunk[5]),
        profit: parseCurrency(chunk[6]),
        profitPercent: parsePercentage(chunk[7]),
        leads: parseInteger(chunk[8]),
        costPerLead: parseCurrency(chunk[9]),
        revenuePerLead: parseCurrency(chunk[10]),
        conversionRate: parsePercentage(chunk[11]),
        cpc: parseCurrency(chunk[12]),
        cpm: parseCurrency(chunk[13]),
        clicks: parseInteger(chunk[14]),
        ctr: parsePercentage(chunk[15]),
        trackingUrl: chunk[16],
        timestamp: new Date().toISOString(),
        status: '' // Will be set after processing
      };

      campaign.status = getCampaignStatus(campaign);
      return campaign;
    });

    return processed;
  };

  const handleDataInput = (e) => {
    setRawData(e.target.value);
  };

  const handleProcessData = () => {
    const processed = processData(rawData);
    setProcessedData(processed);

    // Add to historical data
    const newHistoricalData = [...historicalData, ...processed];
    setHistoricalData(newHistoricalData);
    localStorage.setItem('redtrackHistoricalData', JSON.stringify(newHistoricalData));
  };

  const formatCurrency = (value) => {
    if (isNaN(value) || value === 0) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value) => {
    if (isNaN(value) || value === 0) return '0.00%';
    return `${value.toFixed(2)}%`;
  };

  const formatDate = (timestamp) => {
    return format(new Date(timestamp), 'MMM d, yyyy h:mm a');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Scale':
        return 'text-green-600';
      case 'Watch':
        return 'text-yellow-600';
      case 'Shutoff':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleExportCSV = () => {
    const dataToExport = selectedView === 'current' ? processedData : historicalData;
    if (dataToExport.length === 0) return;

    const headers = [
      'Timestamp',
      'Status',
      'Campaign ID',
      'Campaign Name',
      'Ad ID',
      'Platform',
      'Spend',
      'Revenue',
      'Profit',
      'Profit %',
      'Leads',
      'Cost/Lead',
      'Revenue/Lead',
      'Conversion %',
      'CPC',
      'CPM',
      'Clicks',
      'CTR',
      'Tracking URL'
    ];

    const csvContent = [
      headers.join(','),
      ...dataToExport.map(campaign => [
        campaign.timestamp,
        campaign.status,
        campaign.campaignId,
        `"${campaign.campaignName}"`,
        campaign.adId,
        `"${campaign.platform}"`,
        formatCurrency(campaign.spend),
        formatCurrency(campaign.revenue),
        formatCurrency(campaign.profit),
        formatPercent(campaign.profitPercent),
        campaign.leads,
        formatCurrency(campaign.costPerLead),
        formatCurrency(campaign.revenuePerLead),
        formatPercent(campaign.conversionRate),
        formatCurrency(campaign.cpc),
        formatCurrency(campaign.cpm),
        campaign.clicks,
        formatPercent(campaign.ctr),
        `"${campaign.trackingUrl}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `redtrack-analysis-${selectedView}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const clearHistoricalData = () => {
    if (window.confirm('Are you sure you want to clear all historical data?')) {
      setHistoricalData([]);
      localStorage.removeItem('redtrackHistoricalData');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>RedTrack Data Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="Paste RedTrack data here..."
              value={rawData}
              onChange={handleDataInput}
              className="min-h-[200px] font-mono text-sm"
            />
            <div className="flex gap-2">
              <Button onClick={handleProcessData}>Process Data</Button>
              {(processedData.length > 0 || historicalData.length > 0) && (
                <Button variant="outline" onClick={handleExportCSV}>
                  Export CSV
                </Button>
              )}
              {historicalData.length > 0 && (
                <Button variant="outline" onClick={clearHistoricalData}>
                  Clear History
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {(processedData.length > 0 || historicalData.length > 0) && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Processed Data</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={selectedView === 'current' ? 'default' : 'outline'}
                  onClick={() => setSelectedView('current')}
                >
                  Current
                </Button>
                <Button
                  variant={selectedView === 'historical' ? 'default' : 'outline'}
                  onClick={() => setSelectedView('historical')}
                >
                  Historical
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    {selectedView === 'historical' && <th className="p-2 text-left">Timestamp</th>}
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Campaign</th>
                    <th className="p-2 text-right">Spend</th>
                    <th className="p-2 text-right">Revenue</th>
                    <th className="p-2 text-right">Profit</th>
                    <th className="p-2 text-right">ROI</th>
                    <th className="p-2 text-right">Leads</th>
                    <th className="p-2 text-right">CPL</th>
                    <th className="p-2 text-right">RPL</th>
                    <th className="p-2 text-right">Conv%</th>
                    <th className="p-2 text-right">CPC</th>
                    <th className="p-2 text-right">CPM</th>
                    <th className="p-2 text-right">Clicks</th>
                    <th className="p-2 text-right">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedView === 'current' ? processedData : historicalData).map((campaign, index) => (
                    <tr key={index} className="border-t hover:bg-gray-50">
                      {selectedView === 'historical' && (
                        <td className="p-2 text-left text-sm text-gray-500">
                          {formatDate(campaign.timestamp)}
                        </td>
                      )}
                      <td className={`p-2 text-left font-medium ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </td>
                      <td className="p-2">
                        <div className="font-medium">{campaign.campaignName}</div>
                        <div className="text-xs text-gray-500">{campaign.platform}</div>
                      </td>
                      <td className="p-2 text-right">{formatCurrency(campaign.spend)}</td>
                      <td className="p-2 text-right">{formatCurrency(campaign.revenue)}</td>
                      <td className={`p-2 text-right ${campaign.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(campaign.profit)}
                      </td>
                      <td className={`p-2 text-right ${campaign.profitPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercent(campaign.profitPercent)}
                      </td>
                      <td className="p-2 text-right">{campaign.leads}</td>
                      <td className="p-2 text-right">{formatCurrency(campaign.costPerLead)}</td>
                      <td className="p-2 text-right">{formatCurrency(campaign.revenuePerLead)}</td>
                      <td className="p-2 text-right">{formatPercent(campaign.conversionRate)}</td>
                      <td className="p-2 text-right">{formatCurrency(campaign.cpc)}</td>
                      <td className="p-2 text-right">{formatCurrency(campaign.cpm)}</td>
                      <td className="p-2 text-right">{campaign.clicks}</td>
                      <td className="p-2 text-right">{formatPercent(campaign.ctr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RedTrackAnalysis; 