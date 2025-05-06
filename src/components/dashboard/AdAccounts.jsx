import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Copy, AlertCircle, CheckCircle2, XCircle, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

// Base32 decoding function
const base32Decode = (input) => {
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (let i = 0; i < input.length; i++) {
    const val = base32Chars.indexOf(input.charAt(i).toUpperCase());
    if (val === -1) return null;
    bits += val.toString(2).padStart(5, '0');
  }
  return bits;
};

// Convert binary string to bytes
const binaryToBytes = (binary) => {
  const bytes = [];
  for (let i = 0; i < binary.length; i += 8) {
    bytes.push(parseInt(binary.substr(i, 8), 2));
  }
  return new Uint8Array(bytes);
};

const AdAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatedCodes, setGeneratedCodes] = useState({});
  const [expandedBuyers, setExpandedBuyers] = useState({});

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

  // Generate TOTP code
  const generateTOTP = async (secret) => {
    if (!secret) return null;
    
    try {
      // Decode base32 secret
      const bits = base32Decode(secret);
      if (!bits) return null;

      // Get current time in 30-second intervals
      const time = Math.floor(Date.now() / 1000 / 30);
      const timeBytes = new Uint8Array(8);
      for (let i = 0; i < 8; i++) {
        timeBytes[7 - i] = time & 0xff;
        time >>= 8;
      }

      // Create HMAC-SHA1 hash
      const key = binaryToBytes(bits);
      const keyBuffer = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'HMAC', hash: 'SHA-1' },
        false,
        ['sign']
      );
      
      const hash = await crypto.subtle.sign(
        'HMAC',
        keyBuffer,
        timeBytes
      );

      // Get offset from last 4 bits
      const offset = new Uint8Array(hash)[new Uint8Array(hash).length - 1] & 0xf;
      
      // Get 4 bytes starting at offset
      const binary = (
        ((new Uint8Array(hash)[offset] & 0x7f) << 24) |
        ((new Uint8Array(hash)[offset + 1] & 0xff) << 16) |
        ((new Uint8Array(hash)[offset + 2] & 0xff) << 8) |
        (new Uint8Array(hash)[offset + 3] & 0xff)
      );

      // Generate 6-digit code
      const code = (binary % 1000000).toString().padStart(6, '0');
      return code;
    } catch (error) {
      console.error('Error generating TOTP:', error);
      return null;
    }
  };

  const handleGenerateCode = async (account) => {
    try {
      const cleanSecret = account['2FA'].replace(/\s+/g, '');
      console.log('Sending clean secret:', cleanSecret);
      
      const response = await fetch('/api/generate-totp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ secret: cleanSecret }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('API Error Response:', data);
        throw new Error(data.error || 'Failed to generate TOTP code');
      }

      if (data.code) {
        setGeneratedCodes(prev => ({
          ...prev,
          [account['Ad Account']]: data.code
        }));
        copyToClipboard(data.code);
      } else {
        console.error('No code in response:', data);
        toast.error('Failed to generate 2FA code');
      }
    } catch (error) {
      console.error('Error generating TOTP:', error);
      console.error('Error details:', error.message);
      toast.error(error.message || 'Failed to generate 2FA code');
    }
  };

  const toggleBuyer = (buyerId) => {
    setExpandedBuyers(prev => ({
      ...prev,
      [buyerId]: !prev[buyerId]
    }));
  };

  // Group accounts by Media Buyer
  const groupedAccounts = accounts.reduce((acc, account) => {
    const mediaBuyer = account['Media Buyer'] || 'Unassigned';
    if (!acc[mediaBuyer]) {
      acc[mediaBuyer] = {
        mediaBuyer,
        accounts: []
      };
    }
    acc[mediaBuyer].accounts.push(account);
    return acc;
  }, {});

  // Sort media buyers alphabetically and sort accounts within each group
  const sortedBuyers = Object.values(groupedAccounts).sort((a, b) => {
    return a.mediaBuyer.localeCompare(b.mediaBuyer);
  }).map(buyerGroup => ({
    ...buyerGroup,
    accounts: buyerGroup.accounts.sort((a, b) => {
      // First sort by alert status
      const aHasAlert = a.Alerts && a.Alerts.trim() !== '';
      const bHasAlert = b.Alerts && b.Alerts.trim() !== '';
      
      if (aHasAlert !== bHasAlert) {
        return aHasAlert ? 1 : -1; // No alerts go to the top
      }
      
      // Then sort by Adspower Account within each alert status group
      const adspowerA = (a['Adspower Account'] || '').toLowerCase();
      const adspowerB = (b['Adspower Account'] || '').toLowerCase();
      
      if (adspowerA !== adspowerB) {
        // Handle empty Adspower Account values
        if (!adspowerA) return 1;  // Push empty values to the bottom
        if (!adspowerB) return -1; // Push empty values to the bottom
        return adspowerA.localeCompare(adspowerB);
      }
      
      // Finally sort by Ad Account if everything else is equal
      return a['Ad Account'].localeCompare(b['Ad Account']);
    })
  }));

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
      <div className="space-y-4">
        {sortedBuyers.map((buyerGroup) => (
          <div key={buyerGroup.mediaBuyer} className="border rounded-lg overflow-hidden">
            <div 
              className="bg-gray-100 p-3 flex items-center justify-between cursor-pointer"
              onClick={() => toggleBuyer(buyerGroup.mediaBuyer)}
            >
              <div className="flex items-center gap-2">
                {expandedBuyers[buyerGroup.mediaBuyer] ? 
                  <ChevronDown size={20} /> : 
                  <ChevronRight size={20} />
                }
                <h3 className="font-medium">{buyerGroup.mediaBuyer}</h3>
                <span className="text-sm text-gray-500">
                  ({buyerGroup.accounts.length} account{buyerGroup.accounts.length !== 1 ? 's' : ''})
                </span>
              </div>
            </div>
            
            {expandedBuyers[buyerGroup.mediaBuyer] && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-1 text-left font-medium text-gray-500">Ad Account</th>
                      <th className="px-2 py-1 text-left font-medium text-gray-500">Adspower Account</th>
                      <th className="px-2 py-1 text-left font-medium text-gray-500">BM</th>
                      <th className="px-2 py-1 text-left font-medium text-gray-500">Profile</th>
                      <th className="px-2 py-1 text-left font-medium text-gray-500">AdsPower X4</th>
                      <th className="px-2 py-1 text-left font-medium text-gray-500">Alerts</th>
                      <th className="px-2 py-1 text-left font-medium text-gray-500">2FA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {buyerGroup.accounts.map((account) => {
                      const hasAlert = account.Alerts && account.Alerts.trim() !== '';
                      const alertStatus = getAlertStatus(account.Alerts);
                      const generatedCode = generatedCodes[account['Ad Account']];
                      
                      return (
                        <tr key={account['Ad Account']} className={`${hasAlert ? 'bg-red-50' : ''} hover:bg-gray-50`}>
                          <td className="px-2 py-1">
                            <span className="font-medium">{account['Ad Account']}</span>
                          </td>
                          <td className="px-2 py-1">{account['Adspower Account'] || '-'}</td>
                          <td className="px-2 py-1">{account.BM}</td>
                          <td className="px-2 py-1">{account.Profile}</td>
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
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-1">
                                    <span className="font-mono text-sm">{account['2FA']}</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-1"
                                      onClick={() => copyToClipboard(account['2FA'])}
                                    >
                                      <Copy size={14} />
                                    </Button>
                                  </div>
                                  {generatedCode && (
                                    <div className="flex items-center gap-1">
                                      <span className="font-mono text-sm text-green-600">{generatedCode}</span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-1"
                                        onClick={() => copyToClipboard(generatedCode)}
                                      >
                                        <Copy size={14} />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-1"
                                  onClick={() => handleGenerateCode(account)}
                                  title="Generate new 2FA code"
                                >
                                  <RefreshCw size={14} />
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
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdAccounts; 