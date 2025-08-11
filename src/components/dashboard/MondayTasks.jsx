import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { RefreshCw, Plus, ExternalLink, Calendar, Check, X } from 'lucide-react';
import { format } from 'date-fns';

const MondayTasks = ({ onAddToPriorities, addedItems = new Set() }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingDueDate, setEditingDueDate] = useState(null);
  const [newDueDate, setNewDueDate] = useState('');

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
      // Set today's date as due date when adding to priorities
      const todayDate = format(new Date(), 'yyyy-MM-dd');
      await updateDueDate(task.mondayId, todayDate);
      await onAddToPriorities(task.name, null, task.mondayId);
      toast.success(`Added "${task.name}" to priorities and set due date to today`);
    }
  };

  const startEditingDueDate = (taskId, currentDueDate) => {
    setEditingDueDate(taskId);
    // Parse current due date or default to today
    const dateToEdit = currentDueDate && currentDueDate !== 'No Due Date' 
      ? currentDueDate.split(' ')[0] // Extract just the date part if it has time
      : format(new Date(), 'yyyy-MM-dd');
    setNewDueDate(dateToEdit);
  };

  const cancelEditingDueDate = () => {
    setEditingDueDate(null);
    setNewDueDate('');
  };

  const updateDueDate = async (mondayId, newDate) => {
    try {
      const response = await fetch('/api/monday-update-due-date', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: mondayId,
          dueDate: newDate,
          boardId: '6741994585' // ANGE board
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update due date');
      }

      // Update the local task state
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.mondayId === mondayId 
            ? { ...task, dueDate: newDate }
            : task
        )
      );

      toast.success('Due date updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating due date:', error);
      toast.error(`Failed to update due date: ${error.message}`);
      return false;
    }
  };

  const saveDueDate = async () => {
    if (editingDueDate && newDueDate) {
      const success = await updateDueDate(editingDueDate, newDueDate);
      if (success) {
        setEditingDueDate(null);
        setNewDueDate('');
      }
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
              <div key={task.id} className="bg-gray-50 rounded text-xs hover:bg-gray-100 transition-colors">
                {editingDueDate === task.mondayId ? (
                  // Editing mode - full row for date editing
                  <div className="px-2 py-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="truncate font-medium">{task.name}</span>
                      <div className="flex items-center space-x-1">
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
                          className="h-5 px-1"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Input
                        type="date"
                        value={newDueDate}
                        onChange={(e) => setNewDueDate(e.target.value)}
                        className="h-5 text-xs flex-1"
                      />
                      <Button
                        onClick={saveDueDate}
                        size="sm"
                        variant="outline"
                        className="h-5 px-1"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        onClick={cancelEditingDueDate}
                        size="sm"
                        variant="outline"
                        className="h-5 px-1"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Normal mode - single condensed row
                  <div className="flex items-center justify-between py-1 px-2">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <span className="truncate font-medium">{task.name}</span>
                      {task.status && (
                        <Badge className={`text-xs px-1 py-0 ${getStatusColor(task.status)}`}>
                          {task.status}
                        </Badge>
                      )}
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {task.dueDate || 'No Due'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      <Button
                        onClick={() => startEditingDueDate(task.mondayId, task.dueDate)}
                        size="sm"
                        variant="outline"
                        className="h-5 px-1"
                        title="Edit due date"
                      >
                        <Calendar className="h-3 w-3" />
                      </Button>
                      <a
                        href={`https://convert2freedom.monday.com/boards/6741994585/pulses/${task.mondayId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700"
                        title="Open in Monday.com"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <Button
                        onClick={() => handleAddToPriorities(task)}
                        size="sm"
                        variant="outline"
                        className="h-5 px-1"
                        title="Add to priorities"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MondayTasks; 