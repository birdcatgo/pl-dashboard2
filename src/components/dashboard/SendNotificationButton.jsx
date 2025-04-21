import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Check, Bell } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function SendNotificationButton({ plData, expenseData }) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success', 'error', or null

  const sendBreakEvenNotification = async () => {
    setIsLoading(true);
    setStatus(null);
    
    try {
      // Calculate necessary data for the notification
      const revenue = plData.reduce((sum, entry) => sum + entry.revenue, 0);
      const adSpend = plData.reduce((sum, entry) => sum + entry.adSpend, 0);
      const commissions = plData.reduce((sum, entry) => sum + (entry.commission || 0), 0);
      
      // Get expenses from expense data
      const totalExpenses = expenseData.reduce((sum, expense) => sum + expense.amount, 0);
      const dailyExpenses = totalExpenses / 30; // Approximate daily expenses
      
      // Calculate profit
      const profit = revenue - adSpend - commissions - totalExpenses;
      const roi = profit / adSpend;
      
      // Project end of month profit based on current daily rate
      const daysLeft = getDaysLeftInMonth();
      const dailyProfit = profit / (new Date().getDate());
      const projectedProfit = profit + (dailyProfit * daysLeft);
      
      const response = await fetch('/api/slack-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'break-even',
          data: {
            profit,
            expenses: totalExpenses,
            commissions,
            dailyExpenses,
            roi,
            revenue,
            adSpend,
            projectedProfit
          }
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setStatus('success');
        setTimeout(() => setStatus(null), 3000); // Reset after 3 seconds
      } else {
        console.error('Error sending notification:', result.error);
        setStatus('error');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };
  
  function getDaysLeftInMonth() {
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return lastDay.getDate() - today.getDate();
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={status === 'success' ? 'success' : status === 'error' ? 'destructive' : 'secondary'}
            size="sm"
            onClick={sendBreakEvenNotification}
            disabled={isLoading}
            className="ml-2"
          >
            {isLoading ? (
              <span className="flex items-center gap-1">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> 
                Sending...
              </span>
            ) : status === 'success' ? (
              <span className="flex items-center gap-1">
                <Check className="h-4 w-4" /> 
                Sent!
              </span>
            ) : status === 'error' ? (
              <span className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4" /> 
                Failed
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Bell className="h-4 w-4" /> 
                Send Break-Even Alert
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Send break-even notification to Slack</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 