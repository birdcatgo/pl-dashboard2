import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { RefreshCw, ExternalLink, TrendingUp, Users, DollarSign, Filter } from 'lucide-react';
import VerticalFilter from '../ui/VerticalFilter';

const ActiveFanpagesManager = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMediaBuyer, setFilterMediaBuyer] = useState('all');
  const [filterVertical, setFilterVertical] = useState('all');

  const fetchActiveFanpages = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/active-fanpages');
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to fetch active fanpages');
      }
      
      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Invalid response format from server');
      }
      
      setData(responseData.activeFanpages || []);
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

  const formatCurrency = (value) => {
    if (!value || value === 'N/A' || value === '0') return '$0.00';
    const num = parseFloat(value.replace(/[^0-9.-]+/g, ''));
    if (isNaN(num)) return value;
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

  // Filter data based on search and filters
  const filteredData = data.filter(fanpage => {
    const matchesSearch = fanpage.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fanpage.adAccount.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fanpage.network.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMediaBuyer = filterMediaBuyer === 'all' || fanpage.mediaBuyer === filterMediaBuyer;
    const matchesVertical = filterVertical === 'all' || fanpage.vertical === filterVertical;
    
    return matchesSearch && matchesMediaBuyer && matchesVertical;
  });

  // Get unique values for filters
  const uniqueMediaBuyers = [...new Set(data.map(f => f.mediaBuyer))].sort();
  const uniqueVerticals = [...new Set(data.map(f => f.vertical).filter(v => v !== 'N/A'))].sort();

  // Calculate totals
  const totalRevenue = filteredData.reduce((sum, fanpage) => {
    const rev = parseFloat(fanpage.adRev?.replace(/[^0-9.-]+/g, '') || 0);
    return sum + (isNaN(rev) ? 0 : rev);
  }, 0);

  const totalSpend = filteredData.reduce((sum, fanpage) => {
    const spend = parseFloat(fanpage.adSpend?.replace(/[^0-9.-]+/g, '') || 0);
    return sum + (isNaN(spend) ? 0 : spend);
  }, 0);

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
                <p className="text-2xl font-bold">{filteredData.length}</p>
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
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue.toString())}</p>
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
                <p className="text-2xl font-bold">{formatCurrency(totalSpend.toString())}</p>
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
          <CardTitle>Active Fanpages ({filteredData.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading active fanpages...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No active fanpages found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign Name</TableHead>
                    <TableHead>Fanpage Name</TableHead>
                    <TableHead>Media Buyer</TableHead>
                    <TableHead>Vertical</TableHead>
                    <TableHead>Network</TableHead>
                    <TableHead>Ad Account</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Spend</TableHead>
                    <TableHead>ROAS</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((fanpage) => {
                    const revenue = parseFloat(fanpage.adRev?.replace(/[^0-9.-]+/g, '') || 0);
                    const spend = parseFloat(fanpage.adSpend?.replace(/[^0-9.-]+/g, '') || 0);
                    const roas = spend > 0 ? (revenue / spend).toFixed(2) : 0;
                    
                    return (
                      <TableRow key={`${fanpage.mediaBuyer}-${fanpage.id}`}>
                        <TableCell className="font-medium">{fanpage.name}</TableCell>
                        <TableCell>{fanpage.fanpageName}</TableCell>
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
                          {formatCurrency(fanpage.adRev)}
                        </TableCell>
                        <TableCell className="text-red-600 font-medium">
                          {formatCurrency(fanpage.adSpend)}
                        </TableCell>
                        <TableCell className={`font-medium ${roas >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                          {roas}x
                        </TableCell>
                        <TableCell>
                          <a
                            href={`https://convert2freedom.monday.com/boards/${fanpage.boardId}/pulses/${fanpage.itemId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
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