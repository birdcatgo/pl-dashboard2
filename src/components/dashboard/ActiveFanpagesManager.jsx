import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { RefreshCw, ExternalLink, TrendingUp, Users, DollarSign, Filter, ArrowUpDown, CheckSquare, Square, Save, Trash2, Send, MessageSquare } from 'lucide-react';
import VerticalFilter from '../ui/VerticalFilter';
import MultiSelect from '../ui/multi-select';

const ActiveFanpagesManager = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMediaBuyer, setFilterMediaBuyer] = useState('all');
  const [filterVertical, setFilterVertical] = useState(['all']);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });
  const [statusBrewChecked, setStatusBrewChecked] = useState(new Set());
  const [postIdChecked, setPostIdChecked] = useState(new Set());
  const [smmChecked, setSmmChecked] = useState(new Set());
  const [organicPostChecked, setOrganicPostChecked] = useState(new Set());

  const fetchActiveFanpages = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/active-fanpages');
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to fetch active fanpages');
      }
      
      const responseData = await response.json();
      
      if (!responseData.success) {
        throw new Error(responseData.error || 'Failed to fetch active fanpages');
      }
      
      setData(responseData.fanpages || []);
    } catch (err) {
      console.error('Error fetching active fanpages:', err);
      setError(err.message);
      toast.error('Failed to load active fanpages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveFanpages();
    
    // Auto-refresh every 15 minutes
    const interval = setInterval(() => {
      fetchActiveFanpages();
    }, 15 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Load checkboxes and data from localStorage
  useEffect(() => {
    const savedStatusBrew = localStorage.getItem('statusBrewChecked');
    const savedPostId = localStorage.getItem('postIdChecked');
    const savedSMM = localStorage.getItem('smmChecked');
    const savedOrganicPost = localStorage.getItem('organicPostChecked');
    
    if (savedStatusBrew) {
      try {
        setStatusBrewChecked(new Set(JSON.parse(savedStatusBrew)));
      } catch (error) {
        console.error('Error loading Status Brew checkboxes:', error);
      }
    }
    
    if (savedPostId) {
      try {
        setPostIdChecked(new Set(JSON.parse(savedPostId)));
      } catch (error) {
        console.error('Error loading Post ID checkboxes:', error);
      }
    }
    
    if (savedSMM) {
      try {
        setSmmChecked(new Set(JSON.parse(savedSMM)));
      } catch (error) {
        console.error('Error loading SMM checkboxes:', error);
      }
    }
    
    if (savedOrganicPost) {
      try {
        setOrganicPostChecked(new Set(JSON.parse(savedOrganicPost)));
      } catch (error) {
        console.error('Error loading Organic Post checkboxes:', error);
      }
    }
  }, []);

  // Save all data to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('statusBrewChecked', JSON.stringify([...statusBrewChecked]));
  }, [statusBrewChecked]);
  
  useEffect(() => {
    localStorage.setItem('postIdChecked', JSON.stringify([...postIdChecked]));
  }, [postIdChecked]);
  
  useEffect(() => {
    localStorage.setItem('smmChecked', JSON.stringify([...smmChecked]));
  }, [smmChecked]);
  
  useEffect(() => {
    localStorage.setItem('organicPostChecked', JSON.stringify([...organicPostChecked]));
  }, [organicPostChecked]);

  const formatCurrency = (value) => {
    if (!value || value === 'N/A' || value === '0') return '$0.00';
    const num = parseFloat(value.toString().replace(/[^0-9.-]+/g, ''));
    if (isNaN(num)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(num);
  };

  const getVerticalColor = (vertical) => {
    switch (vertical?.toLowerCase()) {
      case 'solar':
        return 'bg-yellow-100 text-yellow-800';
      case 'health':
      case 'health insurance':
        return 'bg-green-100 text-green-800';
      case 'weight loss':
        return 'bg-pink-100 text-pink-800';
      case 'edu':
      case 'education':
        return 'bg-blue-100 text-blue-800';
      case 'auto':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMediaBuyerColor = (buyer) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-orange-100 text-orange-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-red-100 text-red-800',
      'bg-teal-100 text-teal-800'
    ];
    const index = ['Mike', 'Sam', 'Daniel', 'Bikki', 'Rutvik', 'Aakash', 'Emil', 'Ishaan'].indexOf(buyer);
    return colors[index % colors.length];
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleStatusBrewToggle = (fanpageId) => {
    setStatusBrewChecked(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fanpageId)) {
        newSet.delete(fanpageId);
      } else {
        newSet.add(fanpageId);
      }
      return newSet;
    });
  };

  const handleSmmToggle = (fanpageId) => {
    setSmmChecked(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fanpageId)) {
        newSet.delete(fanpageId);
      } else {
        newSet.add(fanpageId);
      }
      return newSet;
    });
  };

  const handleOrganicPostToggle = (fanpageId) => {
    setOrganicPostChecked(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fanpageId)) {
        newSet.delete(fanpageId);
      } else {
        newSet.add(fanpageId);
      }
      return newSet;
    });
  };

  const handlePostIdToggle = (fanpageId) => {
    setPostIdChecked(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fanpageId)) {
        newSet.delete(fanpageId);
      } else {
        newSet.add(fanpageId);
      }
      return newSet;
    });
  };

  const clearAllStatusBrew = () => {
    if (confirm('Are you sure you want to clear all Status Brew checkboxes? This action cannot be undone.')) {
      setStatusBrewChecked(new Set());
      toast.success('All Status Brew checkboxes cleared');
    }
  };

  const saveStatusBrewProgress = () => {
    toast.success(`Status Brew progress saved for ${statusBrewChecked.size} fanpages`);
  };

  const sendSmmOrderToSlack = async () => {
    const smmFanpages = sortedData.filter(fanpage => {
      const fanpageId = `${fanpage.mediaBuyer}-${fanpage.name}-${fanpage.network}`;
      return smmChecked.has(fanpageId);
    });

    if (smmFanpages.length === 0) {
      toast.error('No fanpages selected for SMM orders');
      return;
    }

    const message = `*Order SMM for these Pages:*\n\n${smmFanpages.map(fanpage => 
      `• **${fanpage.name}**\n  - Media Buyer: ${fanpage.mediaBuyer}\n  - Ad Account: ${fanpage.adAccount}\n  - Facebook Page: ${fanpage.facebookPage}`
    ).join('\n\n')}`;

    try {
      const response = await fetch('https://hooks.slack.com/services/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', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: message
        }),
      });

      if (response.ok) {
        toast.success(`SMM order sent for ${smmFanpages.length} fanpages`);
        // Clear the checked items after sending
        setSmmChecked(new Set());
      } else {
        throw new Error('Failed to send message to Slack');
      }
    } catch (error) {
      console.error('Error sending SMM order to Slack:', error);
      toast.error('Failed to send SMM order to Slack');
    }
  };

  const sendOrganicPostOrderToSlack = async () => {
    const organicFanpages = sortedData.filter(fanpage => {
      const fanpageId = `${fanpage.mediaBuyer}-${fanpage.name}-${fanpage.network}`;
      return organicPostChecked.has(fanpageId);
    });

    if (organicFanpages.length === 0) {
      toast.error('No fanpages selected for Organic Post orders');
      return;
    }

    const message = `*Order Organic Posts for these Pages:*\n\n${organicFanpages.map(fanpage => 
      `• **${fanpage.name}**\n  - Media Buyer: ${fanpage.mediaBuyer}\n  - Ad Account: ${fanpage.adAccount}\n  - Facebook Page: ${fanpage.facebookPage}`
    ).join('\n\n')}`;

    try {
      const response = await fetch('https://hooks.slack.com/services/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', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: message
        }),
      });

      if (response.ok) {
        toast.success(`Organic Post order sent for ${organicFanpages.length} fanpages`);
        // Clear the checked items after sending
        setOrganicPostChecked(new Set());
      } else {
        throw new Error('Failed to send message to Slack');
      }
    } catch (error) {
      console.error('Error sending Organic Post order to Slack:', error);
      toast.error('Failed to send Organic Post order to Slack');
    }
  };

  const getSortedData = (items) => {
    if (!sortConfig.key) return items;

    return [...items].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle numeric values
      if (['revenue', 'spend'].includes(sortConfig.key)) {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      } else {
        // Convert to lowercase for string comparison
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Filter data based on search and filters
  const filteredData = data.filter(fanpage => {
    const matchesSearch = 
      fanpage.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fanpage.adAccount.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fanpage.network.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fanpage.facebookPage.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMediaBuyer = filterMediaBuyer === 'all' || fanpage.mediaBuyer === filterMediaBuyer;
    
    // Check if vertical matches any selected verticals (with fuzzy matching)
    const matchesVertical = filterVertical.includes('all') || 
      filterVertical.some(selectedVertical => {
        // Direct match
        if (fanpage.vertical === selectedVertical) return true;
        
        // Fuzzy match - compare normalized versions
        const fanpageNormalized = normalizeVertical(fanpage.vertical);
        const selectedNormalized = normalizeVertical(selectedVertical);
        return fanpageNormalized === selectedNormalized;
      });
    
    return matchesSearch && matchesMediaBuyer && matchesVertical;
  });

  // Sort the filtered data
  const sortedData = getSortedData(filteredData);

  // Helper function to normalize verticals for fuzzy matching
  const normalizeVertical = (vertical) => {
    return vertical
      .toLowerCase()
      .replace(/\s+/g, '') // Remove all spaces
      .replace(/[^a-z0-9]/g, ''); // Remove special characters
  };

  // Get unique values for filters with fuzzy matching
  const uniqueMediaBuyers = [...new Set(data.map(f => f.mediaBuyer))].sort();
  const rawVerticals = [...new Set(data.map(f => f.vertical).filter(v => v !== 'N/A'))];
  
  // Group similar verticals together
  const verticalGroups = {};
  rawVerticals.forEach(vertical => {
    const normalized = normalizeVertical(vertical);
    if (!verticalGroups[normalized]) {
      verticalGroups[normalized] = [];
    }
    verticalGroups[normalized].push(vertical);
  });
  
  // Create unique verticals list (use the first/shortest name for each group)
  const uniqueVerticals = Object.values(verticalGroups)
    .map(group => group.sort((a, b) => a.length - b.length)[0])
    .sort();

  // Calculate totals
  const totalRevenue = sortedData.reduce((sum, fanpage) => sum + (fanpage.revenue || 0), 0);
  const totalSpend = sortedData.reduce((sum, fanpage) => sum + (fanpage.spend || 0), 0);



  const SortableTableHead = ({ children, sortKey }) => {
    const isSorted = sortConfig.key === sortKey;
    
    return (
      <TableHead>
        <button
          className="flex items-center space-x-1 hover:text-gray-700"
          onClick={() => requestSort(sortKey)}
        >
          <span>{children}</span>
          <ArrowUpDown className={`h-4 w-4 ${isSorted ? 'text-blue-500' : 'text-gray-400'}`} />
        </button>
      </TableHead>
    );
  };

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-red-700 text-sm mb-2">Failed to load active fanpages</p>
            <p className="text-red-600 text-xs mb-3">{error}</p>
            <Button onClick={fetchActiveFanpages} size="sm" variant="outline">
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Active Fanpages</h2>
          <p className="text-sm text-gray-600">All fanpages with ad spend from the latest report date</p>
        </div>
        <Button
          onClick={fetchActiveFanpages}
          disabled={loading}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-gray-500">Active Fanpages</div>
            <div className="text-2xl font-bold">{sortedData.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-gray-500">Media Buyers</div>
            <div className="text-2xl font-bold">{uniqueMediaBuyers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-gray-500">On Status Brew</div>
            <div className="text-2xl font-bold">{statusBrewChecked.size}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-gray-500">SMM Orders</div>
            <div className="text-2xl font-bold">{smmChecked.size}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Search</label>
              <Input
                type="text"
                placeholder="Search fanpages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Media Buyer</label>
              <select
                value={filterMediaBuyer}
                onChange={(e) => setFilterMediaBuyer(e.target.value)}
                className="w-full p-2 border rounded-md bg-white"
              >
                <option value="all">All Media Buyers</option>
                {uniqueMediaBuyers.map(buyer => (
                  <option key={buyer} value={buyer}>{buyer}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Vertical</label>
              <MultiSelect
                options={['all', ...uniqueVerticals]}
                selected={filterVertical}
                onChange={setFilterVertical}
                placeholder="Select verticals..."
              />
            </div>
          </div>
        </CardContent>
      </Card>



      {/* Fanpages Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Active Fanpages ({sortedData.length})</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                onClick={saveStatusBrewProgress}
                size="sm"
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4" />
                <span>Save</span>
              </Button>
              <Button
                onClick={sendSmmOrderToSlack}
                size="sm"
                disabled={smmChecked.size === 0}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Send SMM ({smmChecked.size})</span>
              </Button>
              <Button
                onClick={sendOrganicPostOrderToSlack}
                size="sm"
                disabled={organicPostChecked.size === 0}
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700"
              >
                <Send className="h-4 w-4" />
                <span>Send Organic ({organicPostChecked.size})</span>
              </Button>
              <Button
                onClick={clearAllStatusBrew}
                size="sm"
                variant="outline"
                className="flex items-center space-x-2 text-red-600 border-red-300 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>Clear</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="text-center py-4">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Loading active fanpages...</p>
            </div>
          ) : sortedData.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm">No active fanpages found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="text-sm">
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead className="w-10 py-2 text-xs">Status</TableHead>
                    <SortableTableHead sortKey="facebookPage">Page</SortableTableHead>
                    <SortableTableHead sortKey="name">Campaign</SortableTableHead>
                    <SortableTableHead sortKey="mediaBuyer">Buyer</SortableTableHead>
                    <SortableTableHead sortKey="vertical">Vertical</SortableTableHead>
                    <SortableTableHead sortKey="network">Network</SortableTableHead>
                    <SortableTableHead sortKey="adAccount">Account</SortableTableHead>
                    <SortableTableHead sortKey="revenue">Revenue</SortableTableHead>
                    <SortableTableHead sortKey="spend">Spend</SortableTableHead>
                    <TableHead className="py-2 text-xs">ROAS</TableHead>
                    <TableHead className="w-10 py-2 text-xs">SMM</TableHead>
                    <TableHead className="w-10 py-2 text-xs">Organic</TableHead>
                    <TableHead className="w-10 py-2 text-xs">Post ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.map((fanpage, index) => {
                    const roas = fanpage.spend > 0 ? (fanpage.revenue / fanpage.spend).toFixed(2) : 0;
                    
                    const fanpageId = `${fanpage.mediaBuyer}-${fanpage.name}-${fanpage.network}`;
                    const isStatusBrewChecked = statusBrewChecked.has(fanpageId);
                    const isSmmChecked = smmChecked.has(fanpageId);
                    const isOrganicChecked = organicPostChecked.has(fanpageId);
                    const isPostIdChecked = postIdChecked.has(fanpageId);
                    
                    return (
                      <TableRow key={`${fanpage.mediaBuyer}-${fanpage.name}-${index}`}>
                        <TableCell className="w-10 py-2">
                          <button
                            onClick={() => handleStatusBrewToggle(fanpageId)}
                            className="flex items-center justify-center w-5 h-5 hover:bg-gray-100 rounded transition-colors"
                            title={isStatusBrewChecked ? "Mark as not on Status Brew" : "Mark as on Status Brew"}
                          >
                            {isStatusBrewChecked ? (
                              <CheckSquare className="h-4 w-4 text-green-600" />
                            ) : (
                              <Square className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </TableCell>
                        <TableCell className="py-2 text-xs">{fanpage.facebookPage}</TableCell>
                        <TableCell className="font-medium py-2 text-xs">{fanpage.name}</TableCell>
                        <TableCell className="py-2">
                          <Badge className={`${getMediaBuyerColor(fanpage.mediaBuyer)} text-xs px-1 py-0`}>
                            {fanpage.mediaBuyer}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2">
                          <Badge className={`${getVerticalColor(fanpage.vertical)} text-xs px-1 py-0`}>
                            {fanpage.vertical}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2 text-xs">{fanpage.network}</TableCell>
                        <TableCell className="py-2 text-xs">{fanpage.adAccount}</TableCell>
                        <TableCell className="text-green-600 font-medium py-2 text-xs">
                          {formatCurrency(fanpage.revenue)}
                        </TableCell>
                        <TableCell className="text-red-600 font-medium py-2 text-xs">
                          {formatCurrency(fanpage.spend)}
                        </TableCell>
                        <TableCell className={`font-medium py-2 text-xs ${roas >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                          {roas}x
                        </TableCell>
                        <TableCell className="w-10 py-2">
                          <button
                            onClick={() => handleSmmToggle(fanpageId)}
                            className="flex items-center justify-center w-5 h-5 hover:bg-gray-100 rounded transition-colors"
                            title={isSmmChecked ? "Remove from SMM order" : "Add to SMM order"}
                          >
                            {isSmmChecked ? (
                              <CheckSquare className="h-4 w-4 text-blue-600" />
                            ) : (
                              <Square className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </TableCell>
                        <TableCell className="w-10 py-2">
                          <button
                            onClick={() => handleOrganicPostToggle(fanpageId)}
                            className="flex items-center justify-center w-5 h-5 hover:bg-gray-100 rounded transition-colors"
                            title={isOrganicChecked ? "Remove from Organic Post order" : "Add to Organic Post order"}
                          >
                            {isOrganicChecked ? (
                              <CheckSquare className="h-4 w-4 text-purple-600" />
                            ) : (
                              <Square className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </TableCell>
                        <TableCell className="w-10 py-2">
                          <button
                            onClick={() => handlePostIdToggle(fanpageId)}
                            className="flex items-center justify-center w-5 h-5 hover:bg-gray-100 rounded transition-colors"
                            title={isPostIdChecked ? "Remove Post ID flag" : "Add Post ID flag"}
                          >
                            {isPostIdChecked ? (
                              <CheckSquare className="h-4 w-4 text-orange-600" />
                            ) : (
                              <Square className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActiveFanpagesManager;