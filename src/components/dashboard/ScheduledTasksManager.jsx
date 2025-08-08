import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Plus, Calendar, Clock, Trash2, Edit, X } from 'lucide-react';
import { toast } from 'sonner';

const ScheduledTasksManager = () => {
  const [scheduledTasks, setScheduledTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({
    name: '',
    type: 'weekly',
    dayOfWeek: 1,
    dayOfMonth: 1,
    enabled: true
  });

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

  const addNewTask = () => {
    if (!newTask.name.trim()) {
      toast.error('Please enter a task name');
      return;
    }

    // Generate a unique ID
    const taskId = `custom-${Date.now()}`;
    
    // Create schedule description based on type
    let schedule = '';
    
    // Helper function to get proper ordinal suffix
    const getOrdinalSuffix = (day) => {
      if (day >= 11 && day <= 13) return 'th';
      switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };
    
    switch (newTask.type) {
      case 'daily':
        schedule = 'Every day';
        break;
      case 'weekly':
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        schedule = `Every ${dayNames[newTask.dayOfWeek]}`;
        break;
      case 'bi-monthly':
        schedule = `${newTask.dayOfMonth}${getOrdinalSuffix(newTask.dayOfMonth)} of every month`;
        break;
      case 'monthly':
        schedule = `${newTask.dayOfMonth}${getOrdinalSuffix(newTask.dayOfMonth)} of every month`;
        break;
      default:
        schedule = 'Custom schedule';
    }

    const taskToAdd = {
      id: taskId,
      name: newTask.name.trim(),
      type: newTask.type,
      schedule,
      dayOfWeek: newTask.type === 'weekly' ? newTask.dayOfWeek : undefined,
      dayOfMonth: ['bi-monthly', 'monthly'].includes(newTask.type) ? newTask.dayOfMonth : undefined,
      enabled: newTask.enabled
    };

    const updatedTasks = [...scheduledTasks, taskToAdd];
    saveScheduledTasks(updatedTasks);
    
    // Reset form
    setNewTask({
      name: '',
      type: 'weekly',
      dayOfWeek: 1,
      dayOfMonth: 1,
      enabled: true
    });
    setShowAddForm(false);
    toast.success('Scheduled task added successfully');
  };

  const resetForm = () => {
    setNewTask({
      name: '',
      type: 'weekly',
      dayOfWeek: 1,
      dayOfMonth: 1,
      enabled: true
    });
    setShowAddForm(false);
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
              onClick={() => setShowAddForm(true)}
              size="sm"
              variant="default"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Task
            </Button>
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

      {/* Add Task Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Add Scheduled Task</h3>
              <Button
                onClick={resetForm}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="taskName">Task Name</Label>
                <Input
                  id="taskName"
                  value={newTask.name}
                  onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                  placeholder="Enter task name..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="taskType">Schedule Type</Label>
                <Select
                  value={newTask.type}
                  onValueChange={(value) => setNewTask({ ...newTask, type: value })}
                >
                  <SelectTrigger className="mt-1 bg-white border border-gray-300 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    <SelectItem value="daily" className="text-gray-900 hover:bg-gray-100">Daily</SelectItem>
                    <SelectItem value="weekly" className="text-gray-900 hover:bg-gray-100">Weekly</SelectItem>
                    <SelectItem value="bi-monthly" className="text-gray-900 hover:bg-gray-100">Bi-Monthly</SelectItem>
                    <SelectItem value="monthly" className="text-gray-900 hover:bg-gray-100">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newTask.type === 'weekly' && (
                <div>
                  <Label htmlFor="dayOfWeek">Day of Week</Label>
                  <Select
                    value={newTask.dayOfWeek.toString()}
                    onValueChange={(value) => setNewTask({ ...newTask, dayOfWeek: parseInt(value) })}
                  >
                    <SelectTrigger className="mt-1 bg-white border border-gray-300 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                      <SelectItem value="0" className="text-gray-900 hover:bg-gray-100">Sunday</SelectItem>
                      <SelectItem value="1" className="text-gray-900 hover:bg-gray-100">Monday</SelectItem>
                      <SelectItem value="2" className="text-gray-900 hover:bg-gray-100">Tuesday</SelectItem>
                      <SelectItem value="3" className="text-gray-900 hover:bg-gray-100">Wednesday</SelectItem>
                      <SelectItem value="4" className="text-gray-900 hover:bg-gray-100">Thursday</SelectItem>
                      <SelectItem value="5" className="text-gray-900 hover:bg-gray-100">Friday</SelectItem>
                      <SelectItem value="6" className="text-gray-900 hover:bg-gray-100">Saturday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {(newTask.type === 'bi-monthly' || newTask.type === 'monthly') && (
                <div>
                  <Label htmlFor="dayOfMonth">Day of Month</Label>
                  <Select
                    value={newTask.dayOfMonth.toString()}
                    onValueChange={(value) => setNewTask({ ...newTask, dayOfMonth: parseInt(value) })}
                  >
                    <SelectTrigger className="mt-1 bg-white border border-gray-300 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-60">
                      {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                        <SelectItem key={day} value={day.toString()} className="text-gray-900 hover:bg-gray-100">
                          {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={newTask.enabled}
                  onChange={(e) => setNewTask({ ...newTask, enabled: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="enabled" className="text-sm">Enable task immediately</Label>
              </div>
            </div>

            <div className="flex space-x-2 mt-6">
              <Button
                onClick={addNewTask}
                className="flex-1"
                disabled={!newTask.name.trim()}
              >
                Add Task
              </Button>
              <Button
                onClick={resetForm}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ScheduledTasksManager; 