import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';
import { Plus, CheckCircle, Save, Trash2 } from 'lucide-react';
import MondayTasks from './MondayTasks';
import MondayCalendar from './MondayCalendar';
import ScheduledTasksToday from './ScheduledTasksToday';

const DEFAULT_PL_PRIORITY = "P & L reporting";
const DEFAULT_SCHEDULE = "No Planned Interruptions";

const DailyUpdate = () => {
  const [priorities, setPriorities] = useState(DEFAULT_PL_PRIORITY);
  const [challenges, setChallenges] = useState('');
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingEOD, setIsSubmittingEOD] = useState(false);
  
  // Task management state
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [addedMondayItems, setAddedMondayItems] = useState(new Set());
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [templateText, setTemplateText] = useState('');


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

  // Load today's data when component mounts
  useEffect(() => {
    const loadTodaysData = () => {
      const today = new Date();
      const todayKey = format(today, 'yyyy-MM-dd');
      
      // Load today's priorities from TaskManager (uncompleted tasks from yesterday)
      const todayPriorities = localStorage.getItem(`priorities-${todayKey}`);
      if (todayPriorities) {
        // Convert the text back to task objects
        const priorityLines = todayPriorities.split('\n').filter(line => line.trim());
        const priorityTasks = priorityLines.map((text, index) => ({
          id: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
          text: text.trim(),
          completed: false,
          createdAt: new Date().toISOString(),
          completedAt: null,
          fromYesterday: true
        }));
        setTasks(priorityTasks);
      }

      // Load today's challenges
      const todayChallenges = localStorage.getItem(`challenges-${todayKey}`);
      if (todayChallenges) {
        setChallenges(todayChallenges);
      }

      // Load today's schedule
      const todaySchedule = localStorage.getItem(`schedule-${todayKey}`);
      if (todaySchedule) {
        setSchedule(todaySchedule);
      }

      // Load added Monday items tracking
      const addedItems = localStorage.getItem(`addedMondayItems-${todayKey}`);
      if (addedItems) {
        setAddedMondayItems(new Set(JSON.parse(addedItems)));
      }
    };

    const initializeData = async () => {
      loadTodaysData();
      await loadTasks();
    };
    
    initializeData();
  }, []);

  // Task management functions
  const loadTasks = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const savedTasks = localStorage.getItem(`tasks-${today}`);
    
    if (savedTasks) {
      const parsedTasks = JSON.parse(savedTasks);
      setTasks(parsedTasks);
      
      // Check if we need to add scheduled tasks
      const hasScheduledTasks = parsedTasks.some(task => task.fromScheduled);
      if (!hasScheduledTasks) {
        await loadScheduledTasks();
      }
    } else {
      // If no tasks exist for today, populate with daily template
      populateDailyTasks();
      await loadScheduledTasks();
    }
  };

  const loadScheduledTasks = async () => {
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
        if (data.success && data.scheduledTasks.length > 0) {
          const existingTaskIds = new Set(tasks.map(task => task.id));
          const newScheduledTasks = data.scheduledTasks.filter(task => !existingTaskIds.has(task.id));
          
          if (newScheduledTasks.length > 0) {
            const updatedTasks = [...tasks, ...newScheduledTasks];
            setTasks(updatedTasks);
            saveTasks(updatedTasks);
            console.log(`Added ${newScheduledTasks.length} scheduled tasks for today`);
          }
        }
      }
    } catch (error) {
      console.error('Error loading scheduled tasks:', error);
    }
  };

  const saveTasks = (taskList) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    localStorage.setItem(`tasks-${today}`, JSON.stringify(taskList));
  };

  const loadDailyTemplate = () => {
    const savedTemplate = localStorage.getItem('daily-task-template');
    if (savedTemplate) {
      return JSON.parse(savedTemplate);
    }
    return dailyTaskTemplate;
  };

  const saveDailyTemplate = (template) => {
    localStorage.setItem('daily-task-template', JSON.stringify(template));
  };

  const populateDailyTasks = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const currentTemplate = loadDailyTemplate();
    const templateTasks = currentTemplate.map((taskText, index) => ({
      id: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
      text: taskText,
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
      isTemplateTask: true
    }));
    
    setTasks(templateTasks);
    saveTasks(templateTasks);
  };

  const startEditingTemplate = () => {
    const currentTemplate = loadDailyTemplate();
    setTemplateText(currentTemplate.join('\n'));
    setIsEditingTemplate(true);
  };

  const saveTemplate = () => {
    const newTemplate = templateText.split('\n').filter(line => line.trim());
    saveDailyTemplate(newTemplate);
    setIsEditingTemplate(false);
    toast.success('Daily template updated successfully');
  };

  const cancelEditTemplate = () => {
    setIsEditingTemplate(false);
    setTemplateText('');
  };

  const resetToDefaultTemplate = () => {
    saveDailyTemplate(dailyTaskTemplate);
    toast.success('Template reset to default');
  };

  const savePriorities = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    saveTasks(tasks);
    toast.success('Priorities saved successfully');
  };

  const clearAllPriorities = () => {
    if (confirm('Are you sure you want to clear all priorities? This action cannot be undone.')) {
      setTasks([]);
      setAddedMondayItems(new Set());
      const today = format(new Date(), 'yyyy-MM-dd');
      localStorage.removeItem(`tasks-${today}`);
      localStorage.removeItem(`addedMondayItems-${today}`);
      toast.success('All priorities cleared');
    }
  };

  const clearAddedMondayItems = () => {
    setAddedMondayItems(new Set());
    const today = format(new Date(), 'yyyy-MM-dd');
    localStorage.removeItem(`addedMondayItems-${today}`);
    toast.success('Added items tracking cleared');
  };



  const addTask = async () => {
    if (!newTask.trim()) {
      toast.error('Please enter a task');
      return;
    }

    const taskText = newTask.trim();
    const task = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: taskText,
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null
    };

    const updatedTasks = [...tasks, task];
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
    setNewTask('');
    toast.success('Task added successfully');

    // Create corresponding item in Monday.com ANGE group
    try {
      const response = await fetch('/api/monday-create-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemName: taskText
        }),
      });

      if (!response.ok) {
        console.error('Failed to create Monday.com item');
      } else {
        const data = await response.json();
        // Update the task with the Monday.com item ID for future status updates
        const taskWithMondayId = {
          ...task,
          mondayId: data.itemId
        };
        const updatedTasksWithMondayId = updatedTasks.map(t => 
          t.id === task.id ? taskWithMondayId : t
        );
        setTasks(updatedTasksWithMondayId);
        saveTasks(updatedTasksWithMondayId);
        console.log('Successfully created Monday.com item for task:', taskText);
      }
    } catch (error) {
      console.error('Error creating Monday.com item:', error);
    }
  };

  const addMultipleMondayTasksToPriorities = async (taskList) => {
    // Batch add multiple tasks at once
    const tasksToAdd = [];
    const mondayIdsToTrack = [];
    
    for (const { taskName, date, mondayId, isScheduled } of taskList) {
      const taskText = date ? `${taskName} (${date})` : taskName;
      
      // Check if task already exists in priorities to avoid duplicates
      const existingTask = tasks.find(task => 
        task.mondayId === mondayId || 
        task.text.toLowerCase() === taskText.toLowerCase()
      );
      
      if (!existingTask) {
        const task = {
          id: isScheduled ? `scheduled-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: taskText,
          completed: false,
          createdAt: new Date().toISOString(),
          completedAt: null,
          fromMonday: !isScheduled,
          fromScheduled: isScheduled,
          mondayId: mondayId
        };
        
        tasksToAdd.push(task);
        if (mondayId) {
          mondayIdsToTrack.push(mondayId);
        }
      }
    }
    
    if (tasksToAdd.length > 0) {
      const updatedTasks = [...tasks, ...tasksToAdd];
      setTasks(updatedTasks);
      saveTasks(updatedTasks);
      
      // Batch update the tracking set
      if (mondayIdsToTrack.length > 0) {
        setAddedMondayItems(prev => {
          const newSet = new Set([...prev, ...mondayIdsToTrack]);
          // Save to localStorage
          const today = format(new Date(), 'yyyy-MM-dd');
          localStorage.setItem(`addedMondayItems-${today}`, JSON.stringify([...newSet]));
          console.log(`Added ${mondayIdsToTrack.length} items to tracking set. New set:`, [...newSet]);
          return newSet;
        });
      }
    }
    
    return tasksToAdd.length;
  };

  const addMondayTaskToPriorities = async (taskName, date = null, mondayId = null, isScheduled = false) => {
    // If date is provided, include it in the task text
    const taskText = date ? `${taskName} (${date})` : taskName;
    
    // Check if task already exists in priorities to avoid duplicates
    const existingTask = tasks.find(task => 
      task.mondayId === mondayId || 
      task.text.toLowerCase() === taskText.toLowerCase()
    );
    
    if (existingTask) {
      toast.warning('Task already exists in priorities');
      return;
    }
    
    const task = {
      id: isScheduled ? `scheduled-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: taskText,
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
      fromMonday: !isScheduled,
      fromScheduled: isScheduled,
      mondayId: mondayId
    };
    
    const updatedTasks = [...tasks, task];
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
    
    // Add to the tracking set so it gets removed from source components
    if (mondayId) {
      setAddedMondayItems(prev => {
        const newSet = new Set([...prev, mondayId]);
        // Save to localStorage
        const today = format(new Date(), 'yyyy-MM-dd');
        localStorage.setItem(`addedMondayItems-${today}`, JSON.stringify([...newSet]));
        console.log(`Added ${mondayId} to tracking set. New set:`, [...newSet]);
        return newSet;
      });
    }

    // If this is a Monday.com task (not scheduled), update the status to "Working on It"
    if (mondayId && !isScheduled) {
      try {
        // Determine which board the task came from
        let boardId = '6741994585'; // Default to ANGE board
        
        // If it's a calendar item, use the calendar board
        if (taskText.includes('(') && taskText.includes(')')) {
          boardId = '1449674691'; // Calendar board
        }
        
        console.log('Updating Monday.com status to Working on It for task:', {
          taskText: taskText,
          mondayId: mondayId,
          boardId: boardId
        });
        
        const response = await fetch('/api/monday-update-to-working', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            itemId: mondayId,
            boardId: boardId
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Failed to update Monday.com status to Working on It:', errorData);
        } else {
          const successData = await response.json();
          console.log('Successfully updated Monday.com status to Working on It for task:', taskText, successData);
        }
      } catch (error) {
        console.error('Error updating Monday.com status to Working on It:', error);
      }
    }
  };

  const toggleTask = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    const isCompleting = !task.completed;
    
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

    // If completing a Monday.com task, update the status on Monday.com
    if (isCompleting && task.mondayId) {
      try {
        // Determine which board the task came from
        let boardId = '6741994585'; // Default to ANGE board
        
        // If it's a calendar item, use the calendar board
        if (task.text.includes('(') && task.text.includes(')')) {
          boardId = '1449674691'; // Calendar board
        }
        
        console.log('Updating Monday.com status for task:', {
          taskText: task.text,
          mondayId: task.mondayId,
          boardId: boardId,
          isCompleting: isCompleting
        });
        
        const response = await fetch('/api/monday-update-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            itemId: task.mondayId,
            boardId: boardId
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Failed to update Monday.com status:', errorData);
        } else {
          const successData = await response.json();
          console.log('Successfully updated Monday.com status for task:', task.text, successData);
        }
      } catch (error) {
        console.error('Error updating Monday.com status:', error);
      }
    }
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

    // Format completed tasks for Daily Update
    const completedTaskText = completedTasks
      .map(task => task.text)
      .join('\n');
    
    // Combine with existing accomplished items
    const newAccomplished = accomplished 
      ? `${accomplished}\n${completedTaskText}`
      : completedTaskText;
    
    setAccomplished(newAccomplished);
    
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

  const clearChallenges = () => {
    setChallenges('');
    toast.success('Challenges cleared');
  };

  const completedTasks = tasks.filter(task => task.completed);
  const uncompletedTasks = tasks.filter(task => !task.completed);

  // Format message for daily update (all priorities + challenges/schedule if present)
  const formatDailyUpdateMessage = () => {
    const allTasks = tasks.filter(task => task.text.trim()); // All tasks regardless of completion
    
    const formatPriorities = () => {
      if (allTasks.length === 0) return ':pushpin: No priorities set';
      return allTasks.map(task => `:pushpin: ${task.text}`).join('\n');
    };
    
    const formatChallenges = (text) => {
      return text
        .split('\n')
        .filter(line => line.trim())
        .map(line => `:construction: ${line.trim()}`)
        .join('\n');
    };
    
    const formatSchedule = (text) => {
      return text
        .split('\n')
        .filter(line => line.trim())
        .map(line => `:calendar: ${line.trim()}`)
        .join('\n');
    };
    
    let message = `*Daily Update from Ange*\n\n` +
    `:one: Priorities for Today:\n${formatPriorities()}\n\n`;
    
    // Only include challenges if it's not blank
    if (challenges.trim()) {
      message += `:two: Challenges & Support Needed:\n${formatChallenges(challenges)}\n\n`;
    }
    
    // Only include schedule if it's not the default
    if (schedule.trim() && schedule !== DEFAULT_SCHEDULE) {
      const sectionNumber = challenges.trim() ? ':three:' : ':two:';
      message += `${sectionNumber} My Schedule This Week:\n${formatSchedule(schedule)}`;
    }
    
    return message;
  };

  // Format message for EOD update (only completed tasks)
  const formatEODUpdateMessage = () => {
    const completedTasks = tasks.filter(task => task.completed);
    
    const formatCompleted = () => {
      if (completedTasks.length === 0) return ':white_check_mark: No tasks completed today';
      return completedTasks.map(task => `:white_check_mark: ${task.text}`).join('\n');
    };
    
    let message = `*EOD Update from Ange*\n\n` +
    `:star: Completed Today:\n${formatCompleted()}`;
    
    return message;
  };

  const handleDailyUpdate = async () => {
    if (tasks.length === 0) {
      toast.error('Please add some priorities for today');
      return;
    }

    setIsSubmitting(true);
    try {
      const message = formatDailyUpdateMessage();
      console.log('Sending message to Slack:', {
        messageLength: message.length,
        channel: 'daily-updates-mgmt'
      });

      const response = await fetch('/api/slack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          channel: 'daily-updates-mgmt'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to send message to Slack');
      }

      // Save current state to localStorage
      const today = new Date();
      const todayKey = format(today, 'yyyy-MM-dd');
      
      localStorage.setItem(`challenges-${todayKey}`, challenges);
      localStorage.setItem(`schedule-${todayKey}`, schedule);

      toast.success('Daily update sent successfully!');
    } catch (error) {
      console.error('Error sending to Slack:', {
        message: error.message,
        stack: error.stack
      });
      toast.error(error.message || 'Failed to send daily update');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEODUpdate = async () => {
    const completedTasks = tasks.filter(task => task.completed);
    
    if (completedTasks.length === 0) {
      toast.error('No completed tasks to send in EOD update');
      return;
    }

    setIsSubmittingEOD(true);
    try {
      const message = formatEODUpdateMessage();
      console.log('Sending EOD update to Slack:', {
        messageLength: message.length,
        channel: 'daily-updates-mgmt'
      });

      const response = await fetch('/api/slack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          channel: 'daily-updates-mgmt'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to send message to Slack');
      }

      // Save uncompleted tasks for tomorrow's priorities
      const today = new Date();
      const todayKey = format(today, 'yyyy-MM-dd');
      const uncompletedTasks = tasks.filter(task => !task.completed);
      const uncompletedTaskText = uncompletedTasks.map(task => task.text).join('\n');
      
      if (uncompletedTaskText.trim()) {
        localStorage.setItem(`priorities-${todayKey}`, uncompletedTaskText);
      }

      toast.success('EOD update sent successfully!');
    } catch (error) {
      console.error('Error sending EOD update to Slack:', {
        message: error.message,
        stack: error.stack
      });
      toast.error(error.message || 'Failed to send EOD update');
    } finally {
      setIsSubmittingEOD(false);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Daily Update</h2>
        <p className="text-sm text-gray-500">
          Fill in your daily update and send it to the management channel
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Priorities for Today</label>
            <div className="flex space-x-1">
              <button
                onClick={savePriorities}
                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center"
                title="Save current progress"
              >
                <Save className="h-3 w-3 mr-1" />
                Save
              </button>
              <button
                onClick={clearAllPriorities}
                className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center"
                title="Clear all priorities"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear
              </button>
              <button
                onClick={populateDailyTasks}
                className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Reset Template
              </button>
              <button
                onClick={startEditingTemplate}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Edit Template
              </button>
              <button
                onClick={loadPreviousTasks}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Load Yesterday
              </button>
            </div>
          </div>
          
          {/* Task List */}
          <div className="border rounded-lg p-3 bg-gray-50 min-h-[100px]">
            {/* Add New Task */}
            <div className="flex mb-3">
              <input
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="+ Add task..."
                onKeyPress={(e) => e.key === 'Enter' && addTask()}
                className="flex-1 text-sm border-b border-gray-300 px-1 py-1 focus:outline-none focus:border-blue-500 bg-transparent"
              />
            </div>

            {/* Task List */}
            <div className="space-y-0.5">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center py-1 hover:bg-white rounded">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => toggleTask(task.id)}
                    className="h-4 w-4 mr-2"
                  />
                  <span className={`flex-1 text-sm ${task.completed ? 'line-through text-gray-500' : ''}`}>{task.text}</span>
                  
                  {task.isTemplateTask && (
                    <span className="text-xs text-blue-600 mr-2">•</span>
                  )}
                  {task.fromMonday && (
                    <span className="text-xs text-purple-600 mr-2">📅</span>
                  )}
                  {task.fromScheduled && (
                    <span className="text-xs text-yellow-600 mr-2">⏰</span>
                  )}
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-gray-400 hover:text-red-500 text-xs px-1"
                  >
                    ×
                  </button>
                </div>
              ))}



              {tasks.length === 0 && (
                <div className="text-center py-4 text-gray-400 text-sm">
                  No tasks. Click "Reset Template" to load daily routine.
                </div>
              )}
            </div>
          </div>

          {/* Legacy Textarea (hidden but functional) */}
          <Textarea
            value={priorities}
            onChange={(e) => setPriorities(e.target.value)}
            placeholder="Enter each priority on a new line (P & L reporting will always be included first)"
            className="min-h-[100px] hidden"
          />

          {/* Edit Template Modal */}
          {isEditingTemplate && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-medium mb-4">Edit Daily Task Template</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Edit the default tasks that appear every day. Enter each task on a new line.
                </p>
                <Textarea
                  value={templateText}
                  onChange={(e) => setTemplateText(e.target.value)}
                  placeholder="Enter each task on a new line..."
                  className="min-h-[200px] mb-4"
                />
                <div className="flex space-x-2 mb-3">
                  <Button
                    onClick={saveTemplate}
                    className="flex-1"
                  >
                    Save Template
                  </Button>
                  <Button
                    onClick={cancelEditTemplate}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
                <div className="text-center">
                  <button
                    onClick={resetToDefaultTemplate}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Reset to Default Template
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Monday.com Tasks Integration */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Monday.com Tasks</label>
          <MondayTasks onAddToPriorities={addMondayTaskToPriorities} onAddMultiple={addMultipleMondayTasksToPriorities} addedItems={addedMondayItems} onClearAddedItems={clearAddedMondayItems} />
        </div>

        {/* Monday.com Calendar Integration */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Today's Calendar</label>
          <MondayCalendar onAddToPriorities={addMondayTaskToPriorities} addedItems={addedMondayItems} />
        </div>

        {/* Scheduled Tasks for Today */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Scheduled Tasks for Today</label>
          <ScheduledTasksToday onAddToPriorities={addMondayTaskToPriorities} addedItems={addedMondayItems} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Challenges & Support Needed</label>
            <button
              onClick={clearChallenges}
              className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Clear
            </button>
          </div>
          <Textarea
            value={challenges}
            onChange={(e) => setChallenges(e.target.value)}
            placeholder="Enter each challenge on a new line"
            className="min-h-[100px]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">My Schedule This Week</label>
          <Textarea
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
            placeholder="Enter your schedule for the week (defaults to 'No Planned Interruptions')"
            className="min-h-[100px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleDailyUpdate}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? 'Sending...' : 'Send Daily Update'}
          </Button>
          <Button
            onClick={handleEODUpdate}
            disabled={isSubmittingEOD}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmittingEOD ? 'Sending...' : 'Send EOD Update'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DailyUpdate; 