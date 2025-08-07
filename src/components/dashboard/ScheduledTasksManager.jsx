import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Plus, Calendar, Clock, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

const ScheduledTasksManager = () => {
  const [scheduledTasks, setScheduledTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  // Default scheduled tasks configuration
  const defaultScheduledTasks = [
    {
      id: 'weekly-invoices',
      name: 'Weekly Invoices',
      type: 'weekly',
      schedule: 'Every Tuesday',
      dayOfWeek: 2, // Tuesday
      enabled: true
    },
    {
      id: 'bi-monthly-invoices',
      name: 'Bi-Monthly Invoices',
      type: 'bi-monthly',
      schedule: '2nd and 17th of every month',
      dayOfMonth: [2, 17],
      enabled: true
    },
    {
      id: 'monthly-invoices',
      name: 'Monthly Invoices',
      type: 'monthly',
      schedule: '2nd of every month',
      dayOfMonth: 2,
      enabled: true
    },
    {
      id: 'media-buyer-pl',
      name: 'Media Buyer Profit & Loss',
      type: 'monthly',
      schedule: '2nd of every month',
      dayOfMonth: 2,
      enabled: true
    },
    {
      id: 'company-pl',
      name: 'Company Profit & Loss',
      type: 'monthly',
      schedule: '2nd of every month',
      dayOfMonth: 2,
      enabled: true
    }
  ];

  useEffect(() => {
    loadScheduledTasks();
  }, []);

  const loadScheduledTasks = () => {
    const saved = localStorage.getItem('scheduled-tasks-config');
    if (saved) {
      setScheduledTasks(JSON.parse(saved));
    } else {
      setScheduledTasks(defaultScheduledTasks);
      localStorage.setItem('scheduled-tasks-config', JSON.stringify(defaultScheduledTasks));
    }
  };

  const saveScheduledTasks = (tasks) => {
    localStorage.setItem('scheduled-tasks-config', JSON.stringify(tasks));
    setScheduledTasks(tasks);
  };

  const toggleTaskEnabled = (taskId) => {
    const updatedTasks = scheduledTasks.map(task => 
      task.id === taskId ? { ...task, enabled: !task.enabled } : task
    );
    saveScheduledTasks(updatedTasks);
    toast.success(`Task ${updatedTasks.find(t => t.id === taskId).enabled ? 'enabled' : 'disabled'}`);
  };

  const deleteTask = (taskId) => {
    const updatedTasks = scheduledTasks.filter(task => task.id !== taskId);
    saveScheduledTasks(updatedTasks);
    toast.success('Scheduled task deleted');
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
        return <Clock className="h-4 w-4" />;
      case 'weekly':
      case 'bi-monthly':
      case 'monthly':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const testScheduledTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/scheduled-tasks');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success(`Generated ${data.scheduledTasks.length} tasks for today (${data.date.dayName})`);
          console.log('Scheduled tasks for today:', data.scheduledTasks);
        }
      }
    } catch (error) {
      console.error('Error testing scheduled tasks:', error);
      toast.error('Error testing scheduled tasks');
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Scheduled Tasks Manager</CardTitle>
          <div className="flex space-x-2">
            <Button
              onClick={testScheduledTasks}
              size="sm"
              variant="outline"
              disabled={loading}
            >
              {loading ? 'Testing...' : 'Test Today'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        <div className="space-y-2">
          {scheduledTasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                task.enabled ? 'bg-white' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3 flex-1">
                <div className={`p-1 rounded ${getTypeColor(task.type)}`}>
                  {getTypeIcon(task.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium text-sm ${!task.enabled ? 'text-gray-500' : ''}`}>
                      {task.name}
                    </span>
                    <Badge className={`text-xs ${getTypeColor(task.type)}`}>
                      {task.type}
                    </Badge>
                    {!task.enabled && (
                      <Badge className="text-xs bg-gray-100 text-gray-600">
                        Disabled
                      </Badge>
                    )}
                  </div>
                  <p className={`text-xs text-gray-500 ${!task.enabled ? 'text-gray-400' : ''}`}>
                    {task.schedule}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  onClick={() => toggleTaskEnabled(task.id)}
                  size="sm"
                  variant={task.enabled ? "outline" : "default"}
                  className="h-7 px-2"
                >
                  {task.enabled ? 'Disable' : 'Enable'}
                </Button>
                <Button
                  onClick={() => deleteTask(task.id)}
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">How it works:</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• <strong>Weekly:</strong> Weekly Invoices (every Tuesday)</li>
            <li>• <strong>Bi-Monthly:</strong> Bi-Monthly Invoices (2nd and 17th of month)</li>
            <li>• <strong>Monthly:</strong> Monthly Invoices, Media Buyer P&L, Company P&L (2nd of month)</li>
            <li>• Tasks are automatically added to "Priorities for Today" when you load the dashboard</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScheduledTasksManager; 