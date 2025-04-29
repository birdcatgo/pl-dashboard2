import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Copy, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const AdAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await fetch('/api/digitsolution-accounts');
        if (!response.ok) {
          throw new Error('Failed to fetch accounts');
        }
        const data = await response.json();
        setAccounts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getAlertStatus = (alerts) => {
    if (!alerts) return null;
    if (alerts.toLowerCase().includes('error')) return 'error';
    if (alerts.toLowerCase().includes('warning')) return 'warning';
    return 'good';
  };

  // Sort accounts to show those with alerts first
  const sortedAccounts = [...accounts].sort((a, b) => {
    const aHasAlert = a.Alerts && a.Alerts.trim() !== '';
    const bHasAlert = b.Alerts && b.Alerts.trim() !== '';
    if (aHasAlert && !bHasAlert) return -1;
    if (!aHasAlert && bHasAlert) return 1;
    return 0;
  });

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-1 text-left font-medium text-gray-500">Ad Account</th>
              <th className="px-2 py-1 text-left font-medium text-gray-500">Adspower Account</th>
              <th className="px-2 py-1 text-left font-medium text-gray-500">BM</th>
              <th className="px-2 py-1 text-left font-medium text-gray-500">Profile</th>
              <th className="px-2 py-1 text-left font-medium text-gray-500">Media Buyer</th>
              <th className="px-2 py-1 text-left font-medium text-gray-500">AdsPower X4</th>
              <th className="px-2 py-1 text-left font-medium text-gray-500">Alerts</th>
              <th className="px-2 py-1 text-left font-medium text-gray-500">2FA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedAccounts.map((account, index) => {
              const hasAlert = account.Alerts && account.Alerts.trim() !== '';
              const alertStatus = getAlertStatus(account.Alerts);
              
              return (
                <tr 
                  key={index} 
                  className={`${hasAlert ? 'bg-red-50' : ''} hover:bg-gray-50`}
                >
                  <td className="px-2 py-1 font-medium">{account['Ad Account']}</td>
                  <td className="px-2 py-1">{account['Adspower Account'] || '-'}</td>
                  <td className="px-2 py-1">{account.BM}</td>
                  <td className="px-2 py-1">{account.Profile}</td>
                  <td className="px-2 py-1">{account['Media Buyer']}</td>
                  <td className="px-2 py-1">{account['AdsPower X4']}</td>
                  <td className="px-2 py-1">
                    {account.Alerts && (
                      <div className="flex items-center gap-1">
                        {alertStatus === 'error' && <XCircle className="h-3 w-3 text-red-500" />}
                        {alertStatus === 'warning' && <AlertCircle className="h-3 w-3 text-yellow-500" />}
                        {alertStatus === 'good' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                        <span>{account.Alerts}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-1">
                    {account['2FA'] && (
                      <div className="flex items-center gap-1">
                        <span className="font-mono">{account['2FA']}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 w-6 p-1 bg-white hover:bg-gray-100 border-gray-300 flex items-center justify-center"
                          onClick={() => copyToClipboard(account['2FA'])}
                        >
                          <span className="text-gray-600 text-sm">📋</span>
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdAccounts; 