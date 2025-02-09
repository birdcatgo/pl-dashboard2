import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronRight } from 'lucide-react';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const CardGroup = ({ cardData, cardNumber }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const totalAmount = useMemo(() => 
    cardData.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0),
    [cardData]
  );

  return (
    <div className="mb-6">
      <div 
        className="flex items-center justify-between p-4 bg-gray-50 rounded-t-lg cursor-pointer hover:bg-gray-100"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          <h3 className="text-lg font-medium">Card {cardNumber}</h3>
        </div>
        <span className="text-lg font-semibold">{formatCurrency(totalAmount)}</span>
      </div>
      
      {isExpanded && (
        <div className="border rounded-b-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Merchant</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Last Digits</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cardData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{item.purpose}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{item.merchantName}</td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900">{formatCurrency(item.amount)}</td>
                  <td className="px-6 py-4 text-sm text-right text-gray-500">{item.cardLastDigits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const TradeshiftOverview = ({ tradeshiftData }) => {
  console.log('TradeshiftOverview received data:', {
    hasData: !!tradeshiftData,
    dataLength: tradeshiftData?.length,
    sampleData: tradeshiftData?.[0],
    rawData: tradeshiftData
  });

  const groupedByCard = useMemo(() => {
    if (!tradeshiftData || !Array.isArray(tradeshiftData)) {
      console.log('No valid tradeshift data to process');
      return {};
    }
    
    return tradeshiftData.reduce((acc, item) => {
      if (!item) return acc;
      
      const cardNumber = item.card || 'Unknown';
      if (!acc[cardNumber]) {
        acc[cardNumber] = [];
      }
      
      // Ensure amount is a number
      const processedItem = {
        ...item,
        amount: parseFloat(item.amount) || 0
      };
      
      acc[cardNumber].push(processedItem);
      return acc;
    }, {});
  }, [tradeshiftData]);

  // Log grouped data
  console.log('Grouped card data:', groupedByCard);

  const totalAmount = useMemo(() => 
    tradeshiftData?.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) || 0,
    [tradeshiftData]
  );

  if (!tradeshiftData || !Array.isArray(tradeshiftData) || tradeshiftData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tradeshift Cards Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No tradeshift data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Tradeshift Cards Overview</CardTitle>
          <span className="text-2xl font-bold">{formatCurrency(totalAmount)}</span>
        </div>
      </CardHeader>
      <CardContent>
        {Object.entries(groupedByCard).map(([cardNumber, cardData]) => (
          <CardGroup 
            key={cardNumber} 
            cardNumber={cardNumber} 
            cardData={cardData} 
          />
        ))}
      </CardContent>
    </Card>
  );
};

export default TradeshiftOverview; 