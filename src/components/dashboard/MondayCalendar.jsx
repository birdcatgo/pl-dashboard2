import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { RefreshCw, Plus, ExternalLink, Calendar } from 'lucide-react';

const MondayCalendar = ({ onAddToPriorities, addedItems = new Set() }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCalendarItems = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/monday-calendar');
      
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Monday calendar API error response:', errorText);
        
        let errorMessage = 'Failed to fetch calendar items';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch (parseError) {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }
      
      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse Monday calendar response as JSON:', parseError);
        console.error('Raw response:', responseText);
        throw new Error('Invalid response format from server');
      }
      
      setItems(data.items || []);
      
      // Show warning if calendar is temporarily unavailable
      if (data.error) {
        toast.warning('Calendar data may be incomplete');
      }
    } catch (err) {
      console.error('Error fetching Monday calendar:', err);
      setError(err.message);
      toast.error('Failed to load Monday.com calendar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarItems();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchCalendarItems();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleAddToPriorities = async (item) => {
    if (onAddToPriorities) {
      await onAddToPriorities(item.name, item.date, item.mondayId);
      toast.success(`Added "${item.name}" to priorities`);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category) => {
    switch (category?.toLowerCase()) {
      case 'management':
        return 'bg-purple-100 text-purple-800';
      case 'media buying':
      case 'media buying mastermind':
        return 'bg-orange-100 text-orange-800';
      case '1on1 media buyer':
        return 'bg-green-100 text-green-800';
      case 'accounting':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-red-700 text-sm mb-2">Failed to load Monday.com calendar</p>
            <p className="text-red-600 text-xs mb-3">{error}</p>
            <div className="space-y-2">
              <Button onClick={fetchCalendarItems} size="sm" variant="outline">
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
              <div className="text-xs text-gray-500">
                <p>This might be due to:</p>
                <ul className="text-left mt-1 space-y-1">
                  <li>• API token not configured in production</li>
                  <li>• Network connectivity issues</li>
                  <li>• Monday.com API rate limiting</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Today's Calendar
          </CardTitle>
          <Button
            onClick={fetchCalendarItems}
            size="sm"
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        {loading ? (
          <div className="text-center py-4">
            <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
            <p className="text-xs text-gray-500">Loading calendar...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-xs text-gray-500">No calendar items for today</p>
          </div>
        ) : (
          <div className="space-y-1">
            {items.filter(item => !addedItems.has(item.id)).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-1 px-2 bg-blue-50 rounded text-xs hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <span className="truncate">{item.name}</span>
                  {item.status && (
                    <Badge className={`text-xs px-1 py-0 ${getStatusColor(item.status)}`}>
                      {item.status}
                    </Badge>
                  )}
                  {item.category && (
                    <Badge className={`text-xs px-1 py-0 ${getCategoryColor(item.category)}`}>
                      {item.category}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  <span className="text-xs text-gray-500">
                    {item.date}
                  </span>
                  <a
                    href={`https://convert2freedom.monday.com/boards/1449674691/pulses/${item.mondayId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <Button
                    onClick={() => handleAddToPriorities(item)}
                    size="sm"
                    variant="outline"
                    className="h-6 px-2"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MondayCalendar; 