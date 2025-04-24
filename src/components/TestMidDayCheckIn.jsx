import { useState } from 'react';

const TestMidDayCheckIn = () => {
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const sendTestMessage = async () => {
    setIsSending(true);
    setResult(null);
    setError(null);
    
    try {
      // Simple test message
      const messageText = "This is a test mid-day check-in message from the test component.";
      
      console.log('Sending test message to Slack API...');
      
      const response = await fetch('/api/slack-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'midday-checkin',
          data: {
            message: messageText,
            timestamp: new Date().toISOString()
          },
        }),
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Success response:', result);
      setResult(result);
    } catch (error) {
      console.error('Error sending to Slack:', error);
      setError(error.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow">
      <h2 className="text-xl font-semibold mb-4">Test Midday Check-In</h2>
      
      <button
        onClick={sendTestMessage}
        disabled={isSending}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {isSending ? 'Sending...' : 'Send Test Message'}
      </button>
      
      {result && (
        <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded">
          <h3 className="font-medium text-green-800">Success!</h3>
          <pre className="mt-2 text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded">
          <h3 className="font-medium text-red-800">Error</h3>
          <p className="mt-2 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default TestMidDayCheckIn; 