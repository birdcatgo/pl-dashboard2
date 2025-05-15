import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import { format } from 'date-fns';

const DEFAULT_PL_PRIORITY = "P & L reporting";
const DEFAULT_SCHEDULE = "No Planned Interruptions";

const DailyUpdate = () => {
  const [accomplished, setAccomplished] = useState('');
  const [priorities, setPriorities] = useState(DEFAULT_PL_PRIORITY);
  const [challenges, setChallenges] = useState('');
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load previous day's priorities when component mounts
  useEffect(() => {
    const loadPreviousPriorities = () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = format(yesterday, 'yyyy-MM-dd');
      
      // Get yesterday's priorities from localStorage
      const previousPriorities = localStorage.getItem(`priorities-${yesterdayKey}`);
      if (previousPriorities) {
        // Move yesterday's priorities to accomplished
        setAccomplished(previousPriorities);
      }
    };

    loadPreviousPriorities();
  }, []);

  const formatMessage = () => {
    const formatList = (text) => {
      return text
        .split('\n')
        .filter(line => line.trim())
        .map(line => `:white_check_mark: ${line.trim()}`)
        .join('\n');
    };

    const formatPriorities = (text) => {
      // Ensure P&L reporting is always first
      const lines = text.split('\n').filter(line => line.trim());
      if (!lines.includes(DEFAULT_PL_PRIORITY)) {
        lines.unshift(DEFAULT_PL_PRIORITY);
      }
      return lines.map(line => `:pushpin: ${line.trim()}`).join('\n');
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

    return `*Daily Update from Ange*\n\n` +
    `:one: Accomplished Yesterday:
    ${formatList(accomplished)}
    
    :two: Priorities for Today:
    ${formatPriorities(priorities)}
    
    :three: Challenges & Support Needed:
    ${formatChallenges(challenges)}
    
    :four: My Schedule This Week:
    ${formatSchedule(schedule)}`;
  };

  const handleSubmit = async () => {
    if (!accomplished.trim() || !priorities.trim() || !challenges.trim() || !schedule.trim()) {
      toast.error('Please fill in all sections');
      return;
    }

    setIsSubmitting(true);
    try {
      const message = formatMessage();
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

      // Save today's priorities for tomorrow
      const today = new Date();
      const todayKey = format(today, 'yyyy-MM-dd');
      localStorage.setItem(`priorities-${todayKey}`, priorities);

      toast.success('Daily update sent successfully!');
      // Clear the form but keep P&L reporting as default priority and default schedule
      setAccomplished('');
      setPriorities(DEFAULT_PL_PRIORITY);
      setChallenges('');
      setSchedule(DEFAULT_SCHEDULE);
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
          <label className="text-sm font-medium">Accomplished Yesterday</label>
          <Textarea
            value={accomplished}
            onChange={(e) => setAccomplished(e.target.value)}
            placeholder="Enter each accomplishment on a new line"
            className="min-h-[100px]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Priorities for Today</label>
          <Textarea
            value={priorities}
            onChange={(e) => setPriorities(e.target.value)}
            placeholder="Enter each priority on a new line (P & L reporting will always be included first)"
            className="min-h-[100px]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Challenges & Support Needed</label>
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

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'Sending...' : 'Send Daily Update'}
        </Button>
      </div>
    </div>
  );
};

export default DailyUpdate; 