import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { RefreshCw, Plus, ExternalLink } from 'lucide-react';

const MondayTasks = ({ onAddToPriorities, onAddMultiple, addedItems = new Set(), onClearAddedItems }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  const fetchMondayTasks = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching Monday tasks...');
      const url = '/api/monday-tasks';
      const response = await fetch(url);
      console.log('Response status:', response.status);
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error('Invalid response format from server');
      }
      
      console.log('Parsed data:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tasks');
      }
      
      if (data.success) {
        console.log(`Successfully loaded ${data.tasks?.length || 0} tasks`);
        setTasks(data.tasks || []);
      } else {
        throw new Error(data.error || 'API returned success: false');
      }
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

  const handleAddAllToPriorities = async () => {
    const tasksToAdd = tasks.filter(task => !addedItems.has(task.mondayId));
    if (tasksToAdd.length === 0) {
      toast.info('No tasks to add');
      return;
    }

    console.log('Adding all tasks:', tasksToAdd.map(t => ({ name: t.name, mondayId: t.mondayId })));
    console.log('Current addedItems:', [...addedItems]);

    if (onAddMultiple) {
      const taskList = tasksToAdd.map(task => ({
        taskName: task.name,
        date: null,
        mondayId: task.mondayId,
        isScheduled: false
      }));
      
      const addedCount = await onAddMultiple(taskList);
      toast.success(`Added ${addedCount} tasks to priorities`);
    } else {
      // Fall back to individual adds
      for (const task of tasksToAdd) {
        if (onAddToPriorities) {
          await onAddToPriorities(task.name, null, task.mondayId);
        }
      }
      toast.success(`Added ${tasksToAdd.length} tasks to priorities`);
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
            <div className="space-y-2">
              <Button onClick={fetchMondayTasks} size="sm" variant="outline">
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
              <div className="text-xs text-gray-500">
                <p>This might be due to:</p>
                <ul className="text-left mt-1 space-y-1">
                  <li>• API token not configured in production</li>
                  <li>• Network connectivity issues</li>
                  <li>• Monday.com API rate limiting</li>
                  <li>• No tasks match the current filter criteria</li>
                </ul>
              </div>
              <details className="text-left mt-2">
                <summary className="cursor-pointer text-xs text-gray-600">Click to see technical details</summary>
                <div className="mt-1 p-2 bg-gray-100 rounded text-xs font-mono">
                  {error}
                </div>
              </details>
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
          <div>
            <CardTitle className="text-sm font-medium">Monday.com Tasks (ANGE)</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            {tasks.filter(task => !addedItems.has(task.mondayId)).length > 0 && (
              <Button
                onClick={handleAddAllToPriorities}
                size="sm"
                variant="default"
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={loading}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add All
              </Button>
            )}
            <Button
              onClick={fetchMondayTasks}
              size="sm"
              variant="outline"
              disabled={loading}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Button
              onClick={() => {
                if (onClearAddedItems) {
                  onClearAddedItems();
                  console.log('Requested to clear addedItems set');
                }
              }}
              size="sm"
              variant="outline"
              className="text-red-600 border-red-300 hover:bg-red-50"
              title="Clear added items tracking"
            >
              Clear Added
            </Button>
          </div>
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
            {tasks.filter(task => !addedItems.has(task.mondayId)).map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded text-xs hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <span className="truncate text-sm font-medium">{task.name}</span>
                  {task.status && (
                    <Badge className={`text-xs px-2 py-0.5 ${getStatusColor(task.status)}`}>
                      {task.status}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2 ml-3">
                  <a
                    href={`https://convert2freedom.monday.com/boards/6741994585/pulses/${task.mondayId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700"
                    title="Open in Monday.com"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <Button
                    onClick={() => handleAddToPriorities(task)}
                    size="sm"
                    variant="outline"
                    className="h-7 px-2"
                    title="Add to priorities"
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