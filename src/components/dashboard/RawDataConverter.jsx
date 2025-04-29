import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download } from 'lucide-react';

const RawDataConverter = () => {
  const [redtrackData, setRedtrackData] = useState([]);
  const [swydoData, setSwydoData] = useState([]);
  const [combinedData, setCombinedData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch Redtrack data
      const redtrackResponse = await fetch('/api/redtrack-data');
      const redtrackJson = await redtrackResponse.json();
      setRedtrackData(redtrackJson);

      // Fetch Swydo data
      const swydoResponse = await fetch('/api/swydo-data');
      const swydoJson = await swydoResponse.json();
      setSwydoData(swydoJson);

      // Combine the data
      const combined = combineData(redtrackJson, swydoJson);
      setCombinedData(combined);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const combineData = (redtrack, swydo) => {
    return redtrack.map(rt => {
      const matchingSwydo = swydo.find(s => 
        s['Ad Account'] === rt['Ad Account'] && 
        s.Network === rt.Network
      );
      
      return {
        Name: rt.Name,
        'Ad Account': rt['Ad Account'],
        Network: rt.Network,
        Offer: rt.Offer,
        'Media Buyer': rt['Media Buyer'],
        'Redtrack Ad Rev': rt['Redtrack Ad Rev'],
        'Redtrack Ad Spend': rt['Redtrack Ad Spend'],
        'Swydo Ad Spend': matchingSwydo ? matchingSwydo['Ad Spend'] : 0
      };
    });
  };

  const exportToCSV = (data) => {
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'combined-data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="redtrack" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="redtrack">Redtrack Raw Data</TabsTrigger>
          <TabsTrigger value="swydo">Swydo Raw Data</TabsTrigger>
          <TabsTrigger value="combined">Combined</TabsTrigger>
        </TabsList>

        <TabsContent value="redtrack">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => exportToCSV(redtrackData)}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(redtrackData[0] || {}).map((header) => (
                      <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {redtrackData.map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value, i) => (
                        <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="swydo">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => exportToCSV(swydoData)}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(swydoData[0] || {}).map((header) => (
                      <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {swydoData.map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value, i) => (
                        <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="combined">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => exportToCSV(combinedData)}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(combinedData[0] || {}).map((header) => (
                      <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {combinedData.map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value, i) => (
                        <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RawDataConverter; 