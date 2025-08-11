import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { RefreshCw, ExternalLink, TrendingUp, Users, DollarSign, Filter, ArrowUpDown, CheckSquare, Square, Save, Trash2 } from 'lucide-react';
import VerticalFilter from '../ui/VerticalFilter';

const ActiveFanpagesManager = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMediaBuyer, setFilterMediaBuyer] = useState('all');
  const [filterVertical, setFilterVertical] = useState('all');
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });
  const [statusBrewChecked, setStatusBrewChecked] = useState(new Set());

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

  // Load Status Brew checkboxes from localStorage
  useEffect(() => {
    const savedStatusBrew = localStorage.getItem('statusBrewChecked');
    if (savedStatusBrew) {
      try {
        setStatusBrewChecked(new Set(JSON.parse(savedStatusBrew)));
      } catch (error) {
        console.error('Error loading Status Brew checkboxes:', error);
      }
    }
  }, []);

  // Save Status Brew checkboxes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('statusBrewChecked', JSON.stringify([...statusBrewChecked]));
  }, [statusBrewChecked]);

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

  const clearAllStatusBrew = () => {
    if (confirm('Are you sure you want to clear all Status Brew checkboxes? This action cannot be undone.')) {
      setStatusBrewChecked(new Set());
      toast.success('All Status Brew checkboxes cleared');
    }
  };

  const saveStatusBrewProgress = () => {
    toast.success(`Status Brew progress saved for ${statusBrewChecked.size} fanpages`);
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
    const matchesVertical = filterVertical === 'all' || fanpage.vertical === filterVertical;
    
    return matchesSearch && matchesMediaBuyer && matchesVertical;
  });

  // Sort the filtered data
  const sortedData = getSortedData(filteredData);

  // Get unique values for filters
  const uniqueMediaBuyers = [...new Set(data.map(f => f.mediaBuyer))].sort();
  const uniqueVerticals = [...new Set(data.map(f => f.vertical).filter(v => v !== 'N/A'))].sort();

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Active Fanpages</h2>
          <p className="text-gray-600">All fanpages with ad spend from the latest report date</p>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Active Fanpages</p>
                <p className="text-2xl font-bold">{sortedData.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Media Buyers</p>
                <p className="text-2xl font-bold">{uniqueMediaBuyers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium">Total Spend</p>
                <p className="text-2xl font-bold">{formatCurrency(totalSpend)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckSquare className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">On Status Brew</p>
                <p className="text-2xl font-bold">{statusBrewChecked.size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Search fanpages, ad accounts, networks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Media Buyer</label>
              <Select value={filterMediaBuyer} onValueChange={setFilterMediaBuyer}>
                <SelectTrigger>
                  <SelectValue placeholder="All Media Buyers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Media Buyers</SelectItem>
                  {uniqueMediaBuyers.map(buyer => (
                    <SelectItem key={buyer} value={buyer}>{buyer}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <VerticalFilter
              selectedVertical={filterVertical}
              onVerticalChange={setFilterVertical}
              className=""
            />
          </div>
        </CardContent>
      </Card>

      {/* Fanpages Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active Fanpages ({sortedData.length})</CardTitle>
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
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading active fanpages...</p>
            </div>
          ) : sortedData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No active fanpages found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Status Brew</TableHead>
                    <SortableTableHead sortKey="facebookPage">Facebook Page</SortableTableHead>
                    <SortableTableHead sortKey="name">Campaign Name</SortableTableHead>
                    <SortableTableHead sortKey="mediaBuyer">Media Buyer</SortableTableHead>
                    <SortableTableHead sortKey="vertical">Vertical</SortableTableHead>
                    <SortableTableHead sortKey="network">Network</SortableTableHead>
                    <SortableTableHead sortKey="adAccount">Ad Account</SortableTableHead>
                    <SortableTableHead sortKey="revenue">Revenue</SortableTableHead>
                    <SortableTableHead sortKey="spend">Spend</SortableTableHead>
                    <TableHead>ROAS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.map((fanpage, index) => {
                    const roas = fanpage.spend > 0 ? (fanpage.revenue / fanpage.spend).toFixed(2) : 0;
                    
                    const fanpageId = `${fanpage.mediaBuyer}-${fanpage.name}-${fanpage.network}`;
                    const isChecked = statusBrewChecked.has(fanpageId);
                    
                    return (
                      <TableRow key={`${fanpage.mediaBuyer}-${fanpage.name}-${index}`}>
                        <TableCell className="w-12">
                          <button
                            onClick={() => handleStatusBrewToggle(fanpageId)}
                            className="flex items-center justify-center w-6 h-6 hover:bg-gray-100 rounded transition-colors"
                            title={isChecked ? "Mark as not on Status Brew" : "Mark as on Status Brew"}
                          >
                            {isChecked ? (
                              <CheckSquare className="h-5 w-5 text-green-600" />
                            ) : (
                              <Square className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </TableCell>
                        <TableCell>{fanpage.facebookPage}</TableCell>
                        <TableCell className="font-medium">{fanpage.name}</TableCell>
                        <TableCell>
                          <Badge className={getMediaBuyerColor(fanpage.mediaBuyer)}>
                            {fanpage.mediaBuyer}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getVerticalColor(fanpage.vertical)}>
                            {fanpage.vertical}
                          </Badge>
                        </TableCell>
                        <TableCell>{fanpage.network}</TableCell>
                        <TableCell>{fanpage.adAccount}</TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {formatCurrency(fanpage.revenue)}
                        </TableCell>
                        <TableCell className="text-red-600 font-medium">
                          {formatCurrency(fanpage.spend)}
                        </TableCell>
                        <TableCell className={`font-medium ${roas >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                          {roas}x
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