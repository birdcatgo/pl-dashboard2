import React, { useState, useEffect } from 'react';
import { DEFAULT_EOD_REMINDER_MESSAGE } from '@/lib/slack-config';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from 'sonner';
import { RefreshCw, ExternalLink, Calendar, Users, TrendingUp, DollarSign, Filter } from 'lucide-react';
import VerticalFilter from '../ui/VerticalFilter';

const MediaBuyerEODManager = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [filterVertical, setFilterVertical] = useState('all');
  const [checkedItems, setCheckedItems] = useState(new Set());

  const handleCheckboxChange = (itemId, checked) => {
    const newCheckedItems = new Set(checkedItems);
    if (checked) {
      newCheckedItems.add(itemId);
    } else {
      newCheckedItems.delete(itemId);
    }
    setCheckedItems(newCheckedItems);
    
    // Store in localStorage for persistence
    localStorage.setItem('eod-checked-items', JSON.stringify([...newCheckedItems]));
  };

  // Load checked items from localStorage on component mount
  useEffect(() => {
    const savedCheckedItems = localStorage.getItem('eod-checked-items');
    if (savedCheckedItems) {
      setCheckedItems(new Set(JSON.parse(savedCheckedItems)));
    }
  }, []);

  const [customMessage, setCustomMessage] = useState(DEFAULT_EOD_REMINDER_MESSAGE);
  const [showCustomMessage, setShowCustomMessage] = useState(false);
  const [selectedBuyersForReminder, setSelectedBuyersForReminder] = useState(new Set());

  const sendSlackReminders = async () => {
    try {
      setLoading(true);
      
      // Get media buyers who have missing reports but have data
      const missingBuyers = data.filter(buyer => 
        !buyer.datesMatch && 
        buyer.subitems?.length > 0 &&
        selectedBuyersForReminder.has(buyer.name)
      );
      
      if (missingBuyers.length === 0) {
        toast.info('Please select at least one media buyer to send reminders to.');
        return;
      }

      // Send reminders to each selected buyer
      const results = await Promise.all(
        missingBuyers.map(async (buyer) => {
          const response = await fetch('/api/media-buyer-slack-reminder', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              mediaBuyer: buyer.name,
              buyerData: buyer,
              customMessage: showCustomMessage ? {
                text: customMessage,
                blocks: [{
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: customMessage
                  }
                }]
              } : null
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to send reminder to ${buyer.name}`);
          }

          return buyer.name;
        })
      );

      toast.success(`Slack reminders sent to: ${results.join(', ')}`);
      setCustomMessage('');
      setShowCustomMessage(false);
      setSelectedBuyersForReminder(new Set());
    } catch (error) {
      console.error('Error sending Slack reminders:', error);
      toast.error('Failed to send Slack reminders');
    } finally {
      setLoading(false);
    }
  };

  const fetchEODData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/media-buyer-eod');
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to fetch EOD data');
      }
      
      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Invalid response format from server');
      }
      
      setData(responseData.results || []);
    } catch (err) {
      console.error('Error fetching EOD data:', err);
      setError(err.message);
      toast.error('Failed to load media buyer EOD data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEODData();
    
    // Auto-refresh every 10 minutes
    const interval = setInterval(() => {
      fetchEODData();
    }, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (buyer) => {
    if (buyer.error) return 'bg-red-100 text-red-800';
    if (buyer.datesMatch) return 'bg-green-100 text-green-800';
    if (buyer.subitems && buyer.subitems.length > 0) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (buyer) => {
    if (buyer.error) return 'Error';
    if (buyer.datesMatch) return 'Up to Date';
    if (buyer.subitems && buyer.subitems.length > 0) return 'Report Missing';
    return 'No Data';
  };

  const getDateStatus = (dateString) => {
    if (!dateString || dateString === 'No date found') return 'No Date';
    
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    if (dateString.includes(today)) return 'Today';
    if (dateString.includes(yesterday)) return 'Yesterday';
    return 'Older';
  };

  const getDateStatusColor = (dateString) => {
    const status = getDateStatus(dateString);
    switch (status) {
      case 'Today': return 'bg-green-100 text-green-800';
      case 'Yesterday': return 'bg-yellow-100 text-yellow-800';
      case 'Older': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (value) => {
    if (!value || value === 'N/A') return 'N/A';
    const num = parseFloat(value.replace(/[^0-9.-]+/g, ''));
    if (isNaN(num)) return value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(num);
  };

  // Filter data based on vertical
  const filteredData = data.filter(buyer => {
    if (filterVertical === 'all') return true;
    
    // Check if any subitems match the selected vertical
    return buyer.subitems?.some(subitem => 
      subitem.vertical?.toLowerCase().includes(filterVertical.toLowerCase()) ||
      filterVertical.toLowerCase().includes(subitem.vertical?.toLowerCase())
    );
  });

  // Get unique verticals from all data
  const uniqueVerticals = [...new Set(
    data.flatMap(buyer => 
      buyer.subitems?.map(subitem => subitem.vertical).filter(v => v && v !== 'N/A') || []
    )
  )].sort();

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-red-700 text-sm mb-2">Failed to load media buyer EOD data</p>
            <p className="text-red-600 text-xs mb-3">{error}</p>
            <Button onClick={fetchEODData} size="sm" variant="outline">
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Media Buyer EOD Manager</h2>
          <p className="text-gray-600">Track daily reports and active fanpages for all media buyers</p>
        </div>
        <Button
          onClick={fetchEODData}
          disabled={loading}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>


      {/* Combined Table View */}
      <Card>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading media buyer data...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">{filteredData.length}</span> Media Buyers |
                  <span className="text-green-600 ml-2 font-medium">{filteredData.filter(buyer => buyer.datesMatch).length}</span> Up to Date |
                  <span className="text-red-600 ml-2 font-medium">{filteredData.filter(buyer => !buyer.datesMatch && buyer.subitems?.length > 0).length}</span> Missing Reports
                </div>
                <div className="flex items-center space-x-4">
                  <div>
                    Total Revenue: <span className="font-medium text-green-600">
                      {formatCurrency(
                        filteredData.reduce((total, buyer) => {
                          const buyerTotal = buyer.subitems?.reduce((sum, subitem) => {
                            const rev = parseFloat(subitem.adRev?.replace(/[^0-9.-]+/g, '') || 0);
                            return sum + (isNaN(rev) ? 0 : rev);
                          }, 0) || 0;
                          return total + buyerTotal;
                        }, 0).toString()
                      )}
                    </span>
                  </div>
                  <div>
                    Active Fanpages: <span className="font-medium">
                      {filteredData.reduce((total, buyer) => total + (buyer.subitems?.length || 0), 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Main Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={data.filter(buyer => !buyer.datesMatch && buyer.subitems?.length > 0).length > 0 && 
                                 data.filter(buyer => !buyer.datesMatch && buyer.subitems?.length > 0)
                                     .every(buyer => selectedBuyersForReminder.has(buyer.name))}
                          onCheckedChange={(checked) => {
                            const newSelected = new Set(selectedBuyersForReminder);
                            const eligibleBuyers = data.filter(buyer => !buyer.datesMatch && buyer.subitems?.length > 0);
                            if (checked) {
                              eligibleBuyers.forEach(buyer => newSelected.add(buyer.name));
                            } else {
                              eligibleBuyers.forEach(buyer => newSelected.delete(buyer.name));
                            }
                            setSelectedBuyersForReminder(newSelected);
                          }}
                        />
                        <span>Media Buyer</span>
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Latest Report</TableHead>
                    <TableHead>EOD Report</TableHead>
                    <TableHead>Active Fanpages</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Spend</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((buyer) => (
                    <TableRow 
                      key={buyer.name}
                      className={selectedBuyer?.name === buyer.name ? 'bg-blue-50' : ''}
                    >
                      <TableCell className="font-medium">{buyer.name}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(buyer)}>
                          {getStatusText(buyer)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span>{buyer.mostRecentDate}</span>
                          <Badge className={`text-xs ${getDateStatusColor(buyer.mostRecentDate)}`}>
                            {getDateStatus(buyer.mostRecentDate)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {buyer.latestEODDate}
                      </TableCell>
                      <TableCell>
                        {buyer.subitems?.length || 0}
                      </TableCell>
                      <TableCell className="font-medium text-green-600">
                        {formatCurrency(
                          buyer.subitems?.reduce((sum, subitem) => {
                            const rev = parseFloat(subitem.adRev?.replace(/[^0-9.-]+/g, '') || 0);
                            return sum + (isNaN(rev) ? 0 : rev);
                          }, 0).toString()
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-red-600">
                        {formatCurrency(
                          buyer.subitems?.reduce((sum, subitem) => {
                            const spend = parseFloat(subitem.adSpend?.replace(/[^0-9.-]+/g, '') || 0);
                            return sum + (isNaN(spend) ? 0 : spend);
                          }, 0).toString()
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedBuyer(selectedBuyer?.name === buyer.name ? null : buyer)}
                          >
                            {selectedBuyer?.name === buyer.name ? 'Hide Details' : 'View Details'}
                          </Button>
                          {!buyer.datesMatch && buyer.subitems?.length > 0 && (
                            <Checkbox
                              checked={selectedBuyersForReminder.has(buyer.name)}
                              onCheckedChange={(checked) => {
                                const newSelected = new Set(selectedBuyersForReminder);
                                if (checked) {
                                  newSelected.add(buyer.name);
                                } else {
                                  newSelected.delete(buyer.name);
                                }
                                setSelectedBuyersForReminder(newSelected);
                              }}
                            />
                          )}
                          <a
                            href={`https://convert2freedom.monday.com/boards/${buyer.boardId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Slack Notification Controls */}
              {selectedBuyersForReminder.size > 0 && (
                <div className="mt-4 space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <h4 className="text-sm font-medium">Send Reminders to {selectedBuyersForReminder.size} Media Buyers</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCustomMessage(!showCustomMessage)}
                      >
                        {showCustomMessage ? 'Use Default Message' : 'Edit Message'}
                      </Button>
                    </div>
                    <Button
                      onClick={sendSlackReminders}
                      disabled={loading}
                      size="sm"
                      className="space-x-2"
                    >
                      <span>📨</span>
                      <span>{loading ? 'Sending...' : 'Send Reminders'}</span>
                    </Button>
                  </div>

                  {showCustomMessage && (
                    <textarea
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder="Enter your custom message here... (supports Slack markdown)"
                      rows={5}
                      className="w-full p-2 border rounded-md font-mono text-sm"
                    />
                  )}

                  {!showCustomMessage && (
                    <div className="bg-gray-50 p-4 rounded-md">
                      <pre className="whitespace-pre-wrap text-xs font-mono">{DEFAULT_EOD_REMINDER_MESSAGE}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed View for Selected Buyer */}
      {selectedBuyer && (
        <div className="space-y-6">
          {/* Media Buyer Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{selectedBuyer.name} - Fanpage Details</span>
                <div className="flex items-center space-x-2">
                  <a
                    href={`https://convert2freedom.monday.com/boards/${selectedBuyer.boardId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Board
                  </a>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedBuyer(null)}
                  >
                    Close
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedBuyer.subitems && selectedBuyer.subitems.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign Name</TableHead>
                      <TableHead>Fanpage</TableHead>
                      <TableHead>Vertical</TableHead>
                      <TableHead>Network</TableHead>
                      <TableHead>Ad Account</TableHead>
                      <TableHead>Ad Revenue</TableHead>
                      <TableHead>Ad Spend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedBuyer.subitems.map((subitem) => (
                      <TableRow key={subitem.id}>
                        <TableCell className="font-medium">{subitem.name}</TableCell>
                        <TableCell className="font-medium">{subitem.fanpageName}</TableCell>
                        <TableCell>{subitem.vertical}</TableCell>
                        <TableCell>{subitem.network}</TableCell>
                        <TableCell>{subitem.adAccount}</TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {formatCurrency(subitem.adRev)}
                        </TableCell>
                        <TableCell className="text-red-600 font-medium">
                          {formatCurrency(subitem.adSpend)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No fanpage data available for {selectedBuyer.name}</p>
                  {selectedBuyer.error && (
                    <p className="text-red-500 text-sm mt-2">{selectedBuyer.error}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comparison Summary */}
          {selectedBuyer.comparisonData && selectedBuyer.comparisonData.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Items</p>
                    <p className="text-2xl font-bold">{selectedBuyer.datesMatch ? selectedBuyer.comparisonData.length : 'N/A'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Within 10%</p>
                    <p className="text-2xl font-bold text-green-600">
                      {selectedBuyer.datesMatch ? selectedBuyer.comparisonData.filter(item => item.isMatched).length : 'N/A'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Outside 10%</p>
                    <p className="text-2xl font-bold text-red-600">
                      {selectedBuyer.datesMatch ? selectedBuyer.comparisonData.filter(item => !item.isMatched && item.hasMatchingData).length : 'N/A'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">No Data</p>
                    <p className="text-2xl font-bold text-gray-600">
                      {selectedBuyer.datesMatch ? selectedBuyer.comparisonData.filter(item => !item.hasMatchingData).length : 'N/A'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Accuracy Rate</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {selectedBuyer.datesMatch ? 
                        `${Math.round((selectedBuyer.comparisonData.filter(item => item.isMatched).length / selectedBuyer.comparisonData.length) * 100)}%` : 
                        'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* EOD Report Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span>Data Comparison: {selectedBuyer.name} vs EOD Report</span>
                  <div className="text-sm text-gray-600 mt-1">
                    {selectedBuyer.datesMatch ? (
                      <span className="text-green-600">✓ Comparing data from {selectedBuyer.latestEODDate}</span>
                    ) : (
                      <span className="text-red-600">
                        ⚠️ {selectedBuyer.name} has data from {selectedBuyer.mostRecentDate}, but Ange has data from {selectedBuyer.latestEODDate}
                      </span>
                    )}
                  </div>
                </div>
                <a
                  href="https://convert2freedom.monday.com/boards/9498909231"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View EOD Board
                </a>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedBuyer.comparisonData && selectedBuyer.comparisonData.length > 0 ? (
                <div>
                  {!selectedBuyer.datesMatch && (
                    <div className="mb-4">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-yellow-800 mb-1">
                          ⚠️ Date Mismatch Warning
                        </h4>
                        <p className="text-yellow-700 text-sm">
                          Showing latest available data: <strong>{selectedBuyer.name}</strong> ({selectedBuyer.mostRecentDate}) vs <strong>Ange</strong> ({selectedBuyer.latestEODDate})
                        </p>
                      </div>
                    </div>
                  )}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold">Campaign</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead>Network</TableHead>
                        <TableHead className="text-center">MB Rev/Spend</TableHead>
                        <TableHead className="text-center">Ange Rev/Spend</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Checkbox
                              checked={selectedBuyer.comparisonData.length > 0 && 
                                selectedBuyer.comparisonData.every(comparison => 
                                  checkedItems.has(`${selectedBuyer.name}-${comparison.mediaBuyerData.name}-${comparison.mediaBuyerData.adAccount}`)
                                )}
                              onCheckedChange={(checked) => {
                                const newCheckedItems = new Set(checkedItems);
                                selectedBuyer.comparisonData.forEach(comparison => {
                                  const itemId = `${selectedBuyer.name}-${comparison.mediaBuyerData.name}-${comparison.mediaBuyerData.adAccount}`;
                                  if (checked) {
                                    newCheckedItems.add(itemId);
                                  } else {
                                    newCheckedItems.delete(itemId);
                                  }
                                });
                                setCheckedItems(newCheckedItems);
                                localStorage.setItem('eod-checked-items', JSON.stringify([...newCheckedItems]));
                              }}
                            />
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedBuyer.comparisonData.map((comparison, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {comparison.mediaBuyerData.name}
                          </TableCell>
                          <TableCell className="font-medium">
                            {comparison.mediaBuyerData.adAccount}
                          </TableCell>
                          <TableCell>{comparison.mediaBuyerData.network}</TableCell>
                          <TableCell className="text-center whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-green-600">{selectedBuyer.datesMatch ? formatCurrency(comparison.mediaBuyerData.adRev) : '$0.00'}</span>
                              <span className="text-red-600">{selectedBuyer.datesMatch ? formatCurrency(comparison.mediaBuyerData.adSpend) : '$0.00'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-green-600">{!selectedBuyer.datesMatch ? formatCurrency(comparison.eodData?.adRev || '0') : (comparison.eodData ? formatCurrency(comparison.eodData.adRev) : 'N/A')}</span>
                              <span className="text-red-600">{!selectedBuyer.datesMatch ? formatCurrency(comparison.eodData?.adSpend || '0') : (comparison.eodData ? formatCurrency(comparison.eodData.adSpend) : 'N/A')}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {!selectedBuyer.datesMatch ? (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                Different
                              </Badge>
                            ) : comparison.hasMatchingData ? (
                              <Badge className={comparison.isMatched ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                {comparison.isMatched ? '✓ Match' : '✗ Mismatch'}
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-800">
                                No Data
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={checkedItems.has(`${selectedBuyer.name}-${comparison.mediaBuyerData.name}-${comparison.mediaBuyerData.adAccount}`)}
                              onCheckedChange={(checked) => 
                                handleCheckboxChange(`${selectedBuyer.name}-${comparison.mediaBuyerData.name}-${comparison.mediaBuyerData.adAccount}`, checked)
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No comparison data available</p>
                  <p className="text-sm text-gray-400 mt-2">
                    This could be because there's no matching data in the EOD report or the media buyer has no data.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MediaBuyerEODManager; 