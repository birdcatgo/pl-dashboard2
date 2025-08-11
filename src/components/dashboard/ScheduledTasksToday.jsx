import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Calendar, Clock, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const ScheduledTasksToday = ({ onAddToPriorities, addedItems = new Set() }) => {
  const [scheduledTasks, setScheduledTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchScheduledTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get the current configuration from localStorage
      const savedConfig = localStorage.getItem('scheduled-tasks-config');
      let url = '/api/scheduled-tasks';
      
      if (savedConfig) {
        const configParam = encodeURIComponent(savedConfig);
        url = `/api/scheduled-tasks?config=${configParam}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setScheduledTasks(data.scheduledTasks);
        } else {
          setError('Failed to load scheduled tasks');
        }
      } else {
        setError('Failed to load scheduled tasks');
      }
    } catch (error) {
      console.error('Error fetching scheduled tasks:', error);
      setError('Error loading scheduled tasks');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchScheduledTasks();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchScheduledTasks();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleAddToPriorities = async (task) => {
    if (onAddToPriorities) {
      await onAddToPriorities(task.text, null, task.id, true); // Pass task.id as mondayId for tracking
      toast.success(`Added "${task.text}" to priorities`);
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'daily':
        return 'bg-blue-100 text-blue-800';
      case 'weekly':
        return 'bg-green-100 text-green-800';
      case 'bi-monthly':
        return 'bg-purple-100 text-purple-800';
      case 'monthly':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'daily':
        return <Clock className="h-3 w-3" />;
      case 'weekly':
      case 'bi-monthly':
      case 'monthly':
        return <Calendar className="h-3 w-3" />;
      default:
        return <Calendar className="h-3 w-3" />;
    }
  };

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-red-700 text-sm mb-2">Failed to load scheduled tasks</p>
            <p className="text-red-600 text-xs mb-3">{error}</p>
            <Button onClick={fetchScheduledTasks} size="sm" variant="outline">
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
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
            Scheduled Tasks for Today
          </CardTitle>
          <Button
            onClick={fetchScheduledTasks}
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
            <p className="text-xs text-gray-500">Loading scheduled tasks...</p>
          </div>
        ) : scheduledTasks.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-xs text-gray-500">No scheduled tasks for today</p>
          </div>
        ) : (
          <div className="space-y-1">
            {scheduledTasks.filter(task => !addedItems.has(task.id)).map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between py-1 px-2 bg-yellow-50 rounded text-xs hover:bg-yellow-100 transition-colors border border-yellow-200"
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <div className={`p-1 rounded ${getTypeColor(task.type)}`}>
                    {getTypeIcon(task.type)}
                  </div>
                  <span className="truncate font-medium">{task.text}</span>
                  <Badge className={`text-xs px-1 py-0 ${getTypeColor(task.type)}`}>
                    {task.type}
                  </Badge>
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  <Button
                    onClick={() => handleAddToPriorities(task)}
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 bg-yellow-100 hover:bg-yellow-200 border-yellow-300"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            
            {/* Show already added tasks */}
            {scheduledTasks.filter(task => addedItems.has(task.id)).map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded text-xs border border-gray-200"
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <div className={`p-1 rounded ${getTypeColor(task.type)}`}>
                    {getTypeIcon(task.type)}
                  </div>
                  <span className="truncate text-gray-500 line-through">{task.text}</span>
                  <Badge className="text-xs px-1 py-0 bg-gray-100 text-gray-600">
                    Added
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {scheduledTasks.length > 0 && (
          <div className="mt-3 p-2 bg-yellow-50 rounded text-xs text-yellow-800 border border-yellow-200">
            <p className="font-medium mb-1">💡 Tip:</p>
            <p>Click the + button to add these scheduled tasks to your "Priorities for Today"</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ScheduledTasksToday; 