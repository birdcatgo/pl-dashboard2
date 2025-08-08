import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';
import { format, addDays, subDays } from 'date-fns';
import { Plus, Trash2, Send, CheckCircle, Circle } from 'lucide-react';

const TaskManager = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  // Daily task template
  const dailyTaskTemplate = [
    "Create To Do List for Priorities for Today",
    "Check Calendar",
    "Send My Daily Slack Update",
    "P & L Reporting",
    "Prep for tomorrow's P & L",
    "Identify any Redtrack Issues",
    "Bank Account/Credit Card Update",
    "Invoice Check",
    "Check EOD Reports - Sam",
    "Check EOD Reports - Mike",
    "Check EOD Reports - Rutvik",
    "Check EOD Reports - Bikki",
    "Check EOD Reports - Daniel",
    "Check EOD Reports - Ishaan",
    "Check EOD Reports - Aakash",
    "Check EOD Reports - Emil",
    "Status Brew Check - Fanpage Activity",
    "Comment Rev Review with Zel/Jess",
    "Clear Telegram",
    "Clear Teams",
    "Clear Slack"
  ];

  // Load tasks from localStorage on component mount
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const savedTasks = localStorage.getItem(`tasks-${today}`);
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    } else {
      // If no tasks exist for today, populate with daily template
      populateDailyTasks();
    }
  };

  const populateDailyTasks = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const templateTasks = dailyTaskTemplate.map((taskText, index) => ({
      id: Date.now() + index,
      text: taskText,
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
      isTemplateTask: true
    }));
    
    setTasks(templateTasks);
    saveTasks(templateTasks);
  };

  const saveTasks = (taskList) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    localStorage.setItem(`tasks-${today}`, JSON.stringify(taskList));
  };

  const addTask = () => {
    if (!newTask.trim()) {
      toast.error('Please enter a task');
      return;
    }

    const task = {
      id: Date.now(),
      text: newTask.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null
    };

    const updatedTasks = [...tasks, task];
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
    setNewTask('');
    toast.success('Task added successfully');
  };

  const toggleTask = (taskId) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          completed: !task.completed,
          completedAt: !task.completed ? new Date().toISOString() : null
        };
      }
      return task;
    });
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  const deleteTask = (taskId) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
    toast.success('Task deleted');
  };

  const moveCompletedToAccomplished = () => {
    const completedTasks = tasks.filter(task => task.completed);
    if (completedTasks.length === 0) {
      toast.error('No completed tasks to move');
      return;
    }

    // Get today's accomplished from Daily Update
    const today = format(new Date(), 'yyyy-MM-dd');
    const currentAccomplished = localStorage.getItem(`accomplished-${today}`) || '';
    
    // Format completed tasks for Daily Update
    const completedTaskText = completedTasks
      .map(task => task.text)
      .join('\n');
    
    // Combine with existing accomplished items
    const newAccomplished = currentAccomplished 
      ? `${currentAccomplished}\n${completedTaskText}`
      : completedTaskText;
    
    // Save to Daily Update storage
    localStorage.setItem(`accomplished-${today}`, newAccomplished);
    
    // Remove completed tasks from current day
    const remainingTasks = tasks.filter(task => !task.completed);
    setTasks(remainingTasks);
    saveTasks(remainingTasks);
    
    toast.success(`${completedTasks.length} completed task(s) moved to "Accomplished Yesterday"`);
  };

  const loadPreviousTasks = () => {
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    const yesterdayTasks = localStorage.getItem(`tasks-${yesterday}`);
    
    if (yesterdayTasks) {
      const tasks = JSON.parse(yesterdayTasks);
      const uncompletedTasks = tasks.filter(task => !task.completed);
      
      if (uncompletedTasks.length > 0) {
        const today = format(new Date(), 'yyyy-MM-dd');
        const currentTasks = JSON.parse(localStorage.getItem(`tasks-${today}`) || '[]');
        
        // Add uncompleted tasks from yesterday to today
        const updatedTasks = [...currentTasks, ...uncompletedTasks];
        setTasks(updatedTasks);
        saveTasks(updatedTasks);
        
        toast.success(`${uncompletedTasks.length} uncompleted task(s) carried over from yesterday`);
      }
    }
  };

  const sendToDailyUpdate = async () => {
    const uncompletedTasks = tasks.filter(task => !task.completed);
    if (uncompletedTasks.length === 0) {
      toast.error('No tasks to send to Daily Update');
      return;
    }

    // Format tasks for Daily Update priorities
    const taskText = uncompletedTasks.map(task => task.text).join('\n');
    
    // Get current priorities from Daily Update
    const today = format(new Date(), 'yyyy-MM-dd');
    const currentPriorities = localStorage.getItem(`priorities-${today}`) || '';
    
    // Combine with existing priorities
    const newPriorities = currentPriorities 
      ? `${currentPriorities}\n${taskText}`
      : taskText;
    
    // Save to Daily Update storage
    localStorage.setItem(`priorities-${today}`, newPriorities);
    
    toast.success('Tasks sent to Daily Update priorities');
  };

  const completedTasks = tasks.filter(task => task.completed);
  const uncompletedTasks = tasks.filter(task => !task.completed);

  return (
    <div className="p-3 bg-white rounded-lg shadow border">
      {/* Simple Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-sm">Daily Tasks ({uncompletedTasks.length})</h3>
        <div className="flex space-x-1">
          <button
            onClick={populateDailyTasks}
            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Reset
          </button>
          <button
            onClick={loadPreviousTasks}
            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Yesterday
          </button>
        </div>
      </div>

      {/* Simple Add Task */}
      <div className="flex mb-3">
        <input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="+ Add task..."
          onKeyPress={(e) => e.key === 'Enter' && addTask()}
          className="flex-1 text-sm border-b border-gray-300 px-1 py-1 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Paper-like Task List */}
      <div className="space-y-0.5">
        {uncompletedTasks.map((task, index) => (
          <div key={task.id} className="flex items-center py-1 hover:bg-gray-50 rounded">
            <Checkbox
              checked={task.completed}
              onCheckedChange={() => toggleTask(task.id)}
              className="h-4 w-4 mr-2"
            />
            <span className="flex-1 text-sm">{task.text}</span>
            {task.isTemplateTask && (
              <span className="text-xs text-blue-600 mr-2">•</span>
            )}
            <button
              onClick={() => deleteTask(task.id)}
              className="text-gray-400 hover:text-red-500 text-xs px-1"
            >
              ×
            </button>
          </div>
        ))}

        {completedTasks.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="text-xs text-gray-500 hover:text-gray-700 mb-1"
            >
              {showCompleted ? 'Hide' : `Show ${completedTasks.length} done`}
            </button>
            {showCompleted && (
              <div className="space-y-0.5">
                {completedTasks.map((task) => (
                  <div key={task.id} className="flex items-center py-1 text-gray-500">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    <span className="flex-1 text-sm line-through">{task.text}</span>
                    <span className="text-xs text-gray-400">
                      {format(new Date(task.completedAt), 'HH:mm')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tasks.length === 0 && (
          <div className="text-center py-4 text-gray-400 text-sm">
            No tasks. Click "Reset" to load daily routine.
          </div>
        )}
      </div>

      {/* Simple Actions */}
      <div className="flex space-x-2 mt-3 pt-2 border-t border-gray-100">
        <button
          onClick={sendToDailyUpdate}
          disabled={uncompletedTasks.length === 0}
          className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex-1"
        >
          Send to Daily Update
        </button>
        <button
          onClick={moveCompletedToAccomplished}
          disabled={completedTasks.length === 0}
          className="text-xs px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex-1"
        >
          Move Done
        </button>
      </div>
    </div>
  );
};

export default TaskManager; 