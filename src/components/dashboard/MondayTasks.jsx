import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { RefreshCw, Plus, ExternalLink } from 'lucide-react';

const MondayTasks = ({ onAddToPriorities, addedItems = new Set() }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMondayTasks = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/monday-tasks');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tasks');
      }
      
      setTasks(data.tasks || []);
    } catch (err) {
      console.error('Error fetching Monday tasks:', err);
      setError(err.message);
      toast.error('Failed to load Monday.com tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMondayTasks();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchMondayTasks();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleAddToPriorities = async (task) => {
    if (onAddToPriorities) {
      await onAddToPriorities(task.name, null, task.mondayId);
      toast.success(`Added "${task.name}" to priorities`);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'working on it':
      case 'in progress':
      case 'ongoing':
        return 'bg-blue-100 text-blue-800';
      case 'stuck':
      case 'blocked':
      case 'problem solve':
        return 'bg-red-100 text-red-800';
      case 'need to do':
        return 'bg-yellow-100 text-yellow-800';
      case 'waiting':
        return 'bg-purple-100 text-purple-800';
      case 'done':
      case 'complete':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-red-700 text-sm mb-2">Failed to load Monday.com tasks</p>
            <p className="text-red-600 text-xs mb-3">{error}</p>
            <Button onClick={fetchMondayTasks} size="sm" variant="outline">
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
          <CardTitle className="text-sm font-medium">Monday.com Tasks (ANGE)</CardTitle>
          <Button
            onClick={fetchMondayTasks}
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
            <p className="text-xs text-gray-500">Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-xs text-gray-500">No active tasks found</p>
          </div>
        ) : (
          <div className="space-y-1">
            {tasks.filter(task => !addedItems.has(task.id)).map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded text-xs hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <span className="truncate">{task.name}</span>
                  {task.status && (
                    <Badge className={`text-xs px-1 py-0 ${getStatusColor(task.status)}`}>
                      {task.status}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  <a
                    href={`https://convert2freedom.monday.com/boards/6741994585/pulses/${task.mondayId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <Button
                    onClick={() => handleAddToPriorities(task)}
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

export default MondayTasks; 