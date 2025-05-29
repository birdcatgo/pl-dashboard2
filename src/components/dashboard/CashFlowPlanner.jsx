import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp, TrendingDown, DollarSign, CreditCard, Calendar, Calculator, Users, Target, ChevronUp, ChevronDown } from 'lucide-react';
import { format, addDays, isSameDay, isToday, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, subDays } from 'date-fns';
import { parseCampaignName } from '@/lib/campaign-utils';

const CashFlowPlanner = ({ performanceData, creditCardData, upcomingExpenses, invoicesData, networkExposureData }) => {
  const [dailySpend, setDailySpend] = useState(0);
  const [networkData, setNetworkData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFinancialDetails, setShowFinancialDetails] = useState(false);
  
  // Media buyer daily spend states
  const [mediaBuyerSpend, setMediaBuyerSpend] = useState({
    sam: { conservative: 20000, aggressive: 30000 },
    daniel: { conservative: 10000, aggressive: 20000 },
    mikeM: { conservative: 10000, aggressive: 20000 },
    mikeC: { conservative: 10000, aggressive: 10000 },
    pavan: { conservative: 5000, aggressive: 10000 },
    rutvik: { conservative: 5000, aggressive: 10000 },
    bikki: { conservative: 5000, aggressive: 10000 },
    aakash: { conservative: 5000, aggressive: 10000 },
    ishaan: { conservative: 5000, aggressive: 10000 }
  });
  
  // New budget tracking for each media buyer
  const [newBudgets, setNewBudgets] = useState({});
  
  // Network-level budget tracking: { buyer: { network: budget } }
  const [networkBudgets, setNetworkBudgets] = useState({});
  
  // Offer-level budget tracking: { buyer: { "network::offer": budget } }
  const [offerBudgets, setOfferBudgets] = useState({});
  
  // Default budget tracking for inactive buyers: { buyer: budget }
  const [defaultBudgets, setDefaultBudgets] = useState({});
  
  // Toggle state for inactive buyers
  const [inactiveBuyerToggles, setInactiveBuyerToggles] = useState({
    sam: false,
    pavan: false, 
    daniel: false
  });
  
  const [customScenarios, setCustomScenarios] = useState({
    yesterdayActual: 23217.72,
    targetDaily: 82112.13,
    targetDays: 14
  });

  // Fetch network exposure data
  useEffect(() => {
    const fetchNetworkData = async () => {
      try {
        setIsLoading(true);
        console.log('CashFlowPlanner: Fetching network exposure data...');
        
        const response = await fetch('/api/network-exposure');
        if (response.ok) {
          const data = await response.json();
          console.log('CashFlowPlanner: Received network data:', data);
          
          // Flatten the grouped networks
          const allNetworks = Object.entries(data.networks || {}).flatMap(([payPeriod, networks]) => {
            return networks.map(network => ({
              ...network,
              payPeriod
            }));
          });
          
          console.log('CashFlowPlanner: Processed networks:', allNetworks);
          setNetworkData(allNetworks);
        } else {
          console.error('CashFlowPlanner: Failed to fetch network data');
        }
      } catch (error) {
        console.error('CashFlowPlanner: Error fetching network data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNetworkData();
  }, []);

  // Debug all received props
  useEffect(() => {
    console.log('CashFlowPlanner props:', {
      performanceData: performanceData?.data?.length || 0,
      creditCardData: Array.isArray(creditCardData) ? creditCardData.length : 'invalid format',
      upcomingExpenses: Array.isArray(upcomingExpenses) ? upcomingExpenses.length : 'invalid format',
      invoicesData: Array.isArray(invoicesData) ? invoicesData.length : 'invalid format',
      networkExposureData: Array.isArray(networkExposureData) ? networkExposureData.length : 'invalid format',
      networkData: networkData.length
    });
    
    // Debug the actual expense data structure
    if (Array.isArray(upcomingExpenses) && upcomingExpenses.length > 0) {
      console.log('Sample expense data:', upcomingExpenses.slice(0, 3));
      console.log('First expense structure:', upcomingExpenses[0]);
    }

    // Debug performance data structure
    if (performanceData?.data && Array.isArray(performanceData.data) && performanceData.data.length > 0) {
      console.log('CashFlowPlanner: Performance data sample:', performanceData.data.slice(0, 3));
      console.log('CashFlowPlanner: Performance data keys:', Object.keys(performanceData.data[0] || {}));
      
      // Show recent entries
      const recentEntries = performanceData.data
        .filter(entry => entry.Date && entry['Media Buyer'])
        .slice(-5);
      console.log('CashFlowPlanner: Recent performance entries:', recentEntries);
    }
  }, [performanceData, creditCardData, upcomingExpenses, invoicesData, networkExposureData, networkData]);

  // Calculate credit card utilization
  const creditCardMetrics = useMemo(() => {
    if (!Array.isArray(creditCardData)) {
      console.log('Invalid credit card data format');
      return { totalLimit: 0, totalUsed: 0, availableCredit: 0 };
    }

    return creditCardData.reduce((acc, card) => {
      const limit = parseFloat(card.limit || 0);
      const used = parseFloat(card.owing || 0);
      return {
        totalLimit: acc.totalLimit + limit,
        totalUsed: acc.totalUsed + used,
        availableCredit: acc.availableCredit + (limit - used)
      };
    }, { totalLimit: 0, totalUsed: 0, availableCredit: 0 });
  }, [creditCardData]);

  // Calculate upcoming expenses
  const upcomingExpensesMetrics = useMemo(() => {
    if (!Array.isArray(upcomingExpenses)) {
      console.log('Invalid upcoming expenses format');
      return { total: 0, byCategory: {} };
    }

    const thirtyDaysFromNow = addDays(new Date(), 30);
    
    return upcomingExpenses.reduce((acc, expense) => {
      // Handle both array format [Category, Description, Amount, Date] and object format
      let category, amount, dueDate;
      
      if (Array.isArray(expense)) {
        // Array format: [Category, Description, Amount, Date]
        category = expense[0] || 'Uncategorized';
        amount = parseFloat((expense[2] || '0').toString().replace(/[$,]/g, ''));
        dueDate = new Date(expense[3]);
      } else if (expense && typeof expense === 'object') {
        // Object format
        category = expense.status || expense.Category || 'Uncategorized';
        amount = parseFloat(expense.amount || expense.Amount || 0);
        dueDate = new Date(expense.dueDate || expense.Date);
      } else {
        return acc;
      }
      
      // Skip if invalid date or amount
      if (isNaN(dueDate.getTime()) || isNaN(amount)) {
        console.log('Skipping invalid expense:', { category, amount, dueDate: expense[3] || expense.dueDate });
        return acc;
      }
      
      if (dueDate <= thirtyDaysFromNow) {
        acc.total += amount;
        acc.byCategory[category] = (acc.byCategory[category] || 0) + amount;
        console.log('Added expense:', { category, amount, dueDate, total: acc.total });
      }
      
      return acc;
    }, { total: 0, byCategory: {} });
  }, [upcomingExpenses]);

  // Calculate incoming money from invoices
  const incomingMoney = useMemo(() => {
    if (!Array.isArray(invoicesData)) {
      console.log('Invalid invoice data format');
      return { total: 0, byWeek: {} };
    }

    const thirtyDaysFromNow = addDays(new Date(), 30);
    
    return invoicesData.reduce((acc, invoice) => {
      if (!invoice || !invoice.DueDate) return acc;
      
      const dueDate = new Date(invoice.DueDate);
      if (dueDate <= thirtyDaysFromNow) {
        const amount = parseFloat(invoice.AmountDue?.replace(/[^0-9.-]+/g, '') || 0);
        const weekNumber = Math.floor((dueDate - new Date()) / (7 * 24 * 60 * 60 * 1000));
        
        acc.total += amount;
        acc.byWeek[weekNumber] = (acc.byWeek[weekNumber] || 0) + amount;
      }
      return acc;
    }, { total: 0, byWeek: {} });
  }, [invoicesData]);

  // Calculate spending distribution based on net terms
  const spendingDistribution = useMemo(() => {
    if (!Array.isArray(networkData) || networkData.length === 0) {
      console.log('CashFlowPlanner: No network data available for spending distribution');
      return { weekly: 0, monthly: 0, biMonthly: 0 };
    }

    const distribution = { weekly: 0, monthly: 0, biMonthly: 0 };
    
    networkData.forEach(network => {
      if (!network) return;
      
      const spend = parseFloat(network.c2fAmountDue || 0); // Use c2fAmountDue instead of runningTotal
      const netTerms = parseInt(network.netTerms || 0);
      
      console.log(`Network ${network.name}: spend=${spend}, netTerms=${netTerms}`);
      
      if (netTerms <= 7) {
        distribution.weekly += spend;
      } else if (netTerms <= 30) {
        distribution.monthly += spend;
      } else {
        distribution.biMonthly += spend;
      }
    });

    console.log('CashFlowPlanner: Spending distribution:', distribution);
    return distribution;
  }, [networkData]);

  // Calculate required float
  const requiredFloat = useMemo(() => {
    const { weekly, monthly, biMonthly } = spendingDistribution;
    return weekly + (monthly / 2) + (biMonthly / 4);
  }, [spendingDistribution]);

  // Calculate safe daily spending limit
  const safeSpendingLimit = useMemo(() => {
    const totalAvailable = creditCardMetrics.availableCredit + incomingMoney.total;
    const totalRequired = requiredFloat + upcomingExpensesMetrics.total;
    const safetyBuffer = totalRequired * 0.2; // 20% safety buffer
    return Math.max(0, (totalAvailable - totalRequired - safetyBuffer) / 30);
  }, [creditCardMetrics, incomingMoney, requiredFloat, upcomingExpensesMetrics]);

  // Calculate total available funds (cash + credit)
  const totalAvailableFunds = useMemo(() => {
    if (!Array.isArray(creditCardData)) {
      console.log('CashFlowPlanner: Invalid creditCardData format:', creditCardData);
      return 0;
    }
    
    console.log('CashFlowPlanner: Processing financial resources data:', creditCardData.length, 'accounts');
    
    const total = creditCardData.reduce((total, account) => {
      const available = parseFloat(account.available?.toString().replace(/[^0-9.-]+/g, '') || 0);
      console.log(`Account ${account.account}: $${available.toLocaleString()}`);
      return total + available;
    }, 0);
    
    console.log('CashFlowPlanner: Total available funds calculated:', total);
    return total;
  }, [creditCardData]);

  // Helper function to map media buyer names consistently
  const mapMediaBuyerName = (originalName) => {
    if (!originalName) return null;
    
    const nameLower = originalName.toLowerCase().trim();
    
    if (nameLower.includes('sam')) return 'sam';
    if (nameLower.includes('daniel')) return 'daniel';
    if (nameLower.includes('mike')) {
      // Try to distinguish between Mike M and Mike C
      if (nameLower.includes('mike c') || nameLower.includes('mikec') || nameLower.includes('mike.c') || nameLower.includes('mike_c')) {
        return 'mikeC';
      } else if (nameLower.includes('mike m') || nameLower.includes('mikem') || nameLower.includes('mike.m') || nameLower.includes('mike_m')) {
        return 'mikeM';
      } else {
        // Default to mikeM if we can't distinguish, but log it for debugging
        console.log(`Ambiguous Mike name: ${originalName}, defaulting to mikeM`);
        return 'mikeM';
      }
    }
    if (nameLower.includes('pavan')) return 'pavan';
    if (nameLower.includes('rutvik')) return 'rutvik';
    if (nameLower.includes('bikki')) return 'bikki';
    if (nameLower.includes('aakash')) return 'aakash';
    if (nameLower.includes('ishaan')) return 'ishaan';
    
    // Handle "Unknown" or other unrecognized names
    console.log(`Unrecognized media buyer: ${originalName}`);
    return null;
  };

  // Calculate yesterday's actual spend from performance data
  const yesterdayActualSpend = useMemo(() => {
    if (!performanceData?.data || !Array.isArray(performanceData.data)) {
      return customScenarios.yesterdayActual; // Fallback to manual input
    }

    // Find the most recent date in the data
    const dates = performanceData.data
      .map(entry => entry.Date)
      .filter(date => date)
      .sort((a, b) => new Date(b) - new Date(a)); // Sort descending
    
    const mostRecentDate = dates[0];
    
    if (!mostRecentDate) {
      return customScenarios.yesterdayActual; // Fallback if no dates found
    }

    // Calculate total spend for the most recent date
    const recentDaySpend = performanceData.data.reduce((total, entry) => {
      if (entry.Date === mostRecentDate) {
        const spend = parseFloat(entry.Spend?.replace(/[^0-9.-]+/g, '') || 0);
        return total + spend;
      }
      return total;
    }, 0);

    // If we found data for the most recent date, use it; otherwise fall back to manual input
    return recentDaySpend > 0 ? recentDaySpend : customScenarios.yesterdayActual;
  }, [performanceData, customScenarios.yesterdayActual]);

  // Calculate yesterday's spend by media buyer
  const yesterdaySpendByBuyer = useMemo(() => {
    if (!performanceData?.data || !Array.isArray(performanceData.data)) {
      return {};
    }

    // Find the most recent date in the data
    const dates = performanceData.data
      .map(entry => entry.Date)
      .filter(date => date)
      .sort((a, b) => new Date(b) - new Date(a)); // Sort descending
    
    const mostRecentDate = dates[0];
    
    if (!mostRecentDate) {
      return {}; // No data available
    }

    console.log('CashFlowPlanner: Most recent date found:', mostRecentDate);

    // Get all unique media buyers for debugging
    const allMediaBuyers = [...new Set(performanceData.data
      .map(entry => entry['Media Buyer'])
      .filter(buyer => buyer))];
    
    console.log('CashFlowPlanner: All media buyers in performance data:', allMediaBuyers);
    console.log('CashFlowPlanner: Expected media buyer names:', Object.keys(mediaBuyerSpend));
    
    // Check for recent date entries with media buyers
    const recentEntriesWithBuyers = performanceData.data
      .filter(entry => entry.Date === mostRecentDate && entry['Media Buyer'])
      .map(entry => ({
        date: entry.Date,
        buyer: entry['Media Buyer'],
        spend: entry.Spend || entry['Ad Spend']
      }));
    
    console.log('CashFlowPlanner: Recent entries with media buyers:', recentEntriesWithBuyers);

    // Calculate spend by media buyer for the most recent date
    const spendByBuyer = {};
    performanceData.data.forEach(entry => {
      if (entry.Date === mostRecentDate && entry['Media Buyer']) {
        const originalName = entry['Media Buyer'];
        const spend = parseFloat(entry.Spend?.toString().replace(/[^0-9.-]+/g, '') || entry['Ad Spend'] || 0);
        
        console.log(`Processing: ${originalName}, spend: ${spend}`);
        
        // Improved mapping logic for media buyer names
        let buyerKey = mapMediaBuyerName(originalName);
        
        if (buyerKey) {
          console.log(`Mapped ${originalName} to key: ${buyerKey}`);
          spendByBuyer[buyerKey] = (spendByBuyer[buyerKey] || 0) + spend;
        }
      }
    });

    console.log('CashFlowPlanner: Final spend by buyer:', spendByBuyer);
    return spendByBuyer;
  }, [performanceData]);

  // Calculate yesterday's revenue and ROI by media buyer
  const yesterdayROIByBuyer = useMemo(() => {
    if (!performanceData?.data || !Array.isArray(performanceData.data)) {
      return {};
    }

    // Find the most recent date in the data
    const dates = performanceData.data
      .map(entry => entry.Date)
      .filter(date => date)
      .sort((a, b) => new Date(b) - new Date(a));
    
    const mostRecentDate = dates[0];
    
    if (!mostRecentDate) {
      return {};
    }

    // Calculate revenue and ROI by media buyer for the most recent date
    const roiByBuyer = {};
    performanceData.data.forEach(entry => {
      if (entry.Date === mostRecentDate && entry['Media Buyer']) {
        const originalName = entry['Media Buyer'];
        const spend = parseFloat(entry.Spend?.toString().replace(/[^0-9.-]+/g, '') || entry['Ad Spend'] || 0);
        const revenue = parseFloat(entry['Total Revenue']?.toString().replace(/[^0-9.-]+/g, '') || 0);
        
        // Map media buyer name using same logic as spend calculation
        let buyerKey = mapMediaBuyerName(originalName);
        
        if (buyerKey) {
          if (!roiByBuyer[buyerKey]) {
            roiByBuyer[buyerKey] = { spend: 0, revenue: 0, roi: 0 };
          }
          
          roiByBuyer[buyerKey].spend += spend;
          roiByBuyer[buyerKey].revenue += revenue;
        }
      }
    });

    // Calculate ROI percentage for each buyer
    Object.keys(roiByBuyer).forEach(buyer => {
      const data = roiByBuyer[buyer];
      if (data.spend > 0) {
        data.roi = ((data.revenue - data.spend) / data.spend) * 100;
      } else {
        data.roi = 0;
      }
    });

    console.log('CashFlowPlanner: ROI by buyer:', roiByBuyer);
    return roiByBuyer;
  }, [performanceData]);

  // Calculate yesterday's and previous day's ROI by offer with trends
  const yesterdayROIByOffer = useMemo(() => {
    if (!performanceData?.data || !Array.isArray(performanceData.data)) {
      return {};
    }

    // Find the two most recent dates in the data
    const dates = [...new Set(performanceData.data
      .map(entry => entry.Date)
      .filter(date => date))]
      .sort((a, b) => new Date(b) - new Date(a));
    
    const mostRecentDate = dates[0];
    const previousDate = dates[1];
    
    if (!mostRecentDate) {
      return {};
    }

    console.log('CashFlowPlanner: Calculating ROI trends - Recent:', mostRecentDate, 'Previous:', previousDate);

    // Calculate ROI by offer for both dates
    const calculateROIForDate = (targetDate) => {
      const roiByOffer = {};
      performanceData.data.forEach(entry => {
        if (entry.Date === targetDate && entry['Media Buyer'] && entry.Offer) {
          const originalName = entry['Media Buyer'];
          const offer = entry.Offer;
          const spend = parseFloat(entry.Spend?.toString().replace(/[^0-9.-]+/g, '') || entry['Ad Spend'] || 0);
          const revenue = parseFloat(entry['Total Revenue']?.toString().replace(/[^0-9.-]+/g, '') || 0);
          
          // Map media buyer name
          let buyerKey = mapMediaBuyerName(originalName);
          
          if (buyerKey && offer) {
            const offerKey = `${buyerKey}::${offer}`;
            
            if (!roiByOffer[offerKey]) {
              roiByOffer[offerKey] = { 
                buyer: buyerKey, 
                offer: offer, 
                spend: 0, 
                revenue: 0, 
                roi: 0 
              };
            }
            
            roiByOffer[offerKey].spend += spend;
            roiByOffer[offerKey].revenue += revenue;
          }
        }
      });

      // Calculate ROI percentage for each offer
      Object.keys(roiByOffer).forEach(offerKey => {
        const data = roiByOffer[offerKey];
        if (data.spend > 0) {
          data.roi = ((data.revenue - data.spend) / data.spend) * 100;
        } else {
          data.roi = 0;
        }
      });

      return roiByOffer;
    };

    const currentROI = calculateROIForDate(mostRecentDate);
    const previousROI = previousDate ? calculateROIForDate(previousDate) : {};

    // Add trend information
    Object.keys(currentROI).forEach(offerKey => {
      const current = currentROI[offerKey];
      const previous = previousROI[offerKey];
      
      if (previous && previous.spend > 0) {
        const roiDiff = current.roi - previous.roi;
        current.trend = roiDiff > 1 ? 'up' : roiDiff < -1 ? 'down' : 'flat';
        current.roiChange = roiDiff;
      } else {
        current.trend = 'new';
        current.roiChange = 0;
      }
    });

    console.log('CashFlowPlanner: ROI by offer with trends:', currentROI);
    return currentROI;
  }, [performanceData]);

  // Group offers by media buyer for display
  const offersByBuyer = useMemo(() => {
    const grouped = {};
    Object.entries(yesterdayROIByOffer).forEach(([offerKey, data]) => {
      const buyer = data.buyer;
      if (!grouped[buyer]) {
        grouped[buyer] = [];
      }
      grouped[buyer].push({
        ...data,
        offerKey
      });
    });

    // Sort offers within each buyer by spend descending
    Object.keys(grouped).forEach(buyer => {
      grouped[buyer].sort((a, b) => b.spend - a.spend);
    });

    return grouped;
  }, [yesterdayROIByOffer]);

  // Calculate network-level spend by media buyer
  const networkSpendByBuyer = useMemo(() => {
    if (!performanceData?.data || !Array.isArray(performanceData.data)) {
      return {};
    }

    // Find the most recent date in the data
    const dates = performanceData.data
      .map(entry => entry.Date)
      .filter(date => date)
      .sort((a, b) => new Date(b) - new Date(a));
    
    const mostRecentDate = dates[0];
    
    if (!mostRecentDate) {
      return {};
    }

    const networkSpendData = {};
    
    performanceData.data.forEach(entry => {
      if (entry.Date === mostRecentDate && entry['Media Buyer'] && entry.Network) {
        const originalName = entry['Media Buyer'];
        const network = entry.Network;
        const spend = parseFloat(entry.Spend?.toString().replace(/[^0-9.-]+/g, '') || entry['Ad Spend'] || 0);
        
        // Map media buyer name using same logic as before
        let buyerKey = mapMediaBuyerName(originalName);
        
        if (buyerKey && spend > 0) {
          if (!networkSpendData[buyerKey]) {
            networkSpendData[buyerKey] = {};
          }
          
          networkSpendData[buyerKey][network] = (networkSpendData[buyerKey][network] || 0) + spend;
        }
      }
    });

    // Add payment terms information for each network
    const enrichedData = {};
    Object.entries(networkSpendData).forEach(([buyer, networks]) => {
      enrichedData[buyer] = {};
      Object.entries(networks).forEach(([network, spend]) => {
        // Find payment terms for this network from networkData
        const networkInfo = networkData.find(n => n.name === network);
        const paymentTerms = networkInfo?.paymentTerms || 'Unknown';
        
        enrichedData[buyer][network] = {
          spend,
          paymentTerms,
          netTerms: networkInfo?.netTerms || 0
        };
      });
    });

    console.log('CashFlowPlanner: Network spend by buyer:', enrichedData);
    return enrichedData;
  }, [performanceData, networkData]);

  // Calculate network-offer combinations by media buyer with proper association
  const networkOffersByBuyer = useMemo(() => {
    if (!performanceData?.data || !Array.isArray(performanceData.data)) {
      return {};
    }

    // Find the most recent date in the data
    const dates = performanceData.data
      .map(entry => entry.Date)
      .filter(date => date)
      .sort((a, b) => new Date(b) - new Date(a));
    
    const mostRecentDate = dates[0];
    
    if (!mostRecentDate) {
      return {};
    }

    console.log('CashFlowPlanner: Calculating network-offer combinations for date:', mostRecentDate);

    // Debug: Show all unique media buyer names in the data
    const allMediaBuyers = [...new Set(performanceData.data
      .filter(entry => entry.Date === mostRecentDate && entry['Media Buyer'])
      .map(entry => entry['Media Buyer']))];
    console.log('CashFlowPlanner: All media buyers found for', mostRecentDate, ':', allMediaBuyers);

    const networkOfferData = {};
    
    performanceData.data.forEach(entry => {
      if (entry.Date === mostRecentDate && entry['Media Buyer']) {
        const originalName = entry['Media Buyer'];
        const network = entry.Network || 'Unknown';
        const offer = entry.Offer || 'No Offer';
        const spend = parseFloat(entry.Spend?.toString().replace(/[^0-9.-]+/g, '') || entry['Ad Spend'] || 0);
        const revenue = parseFloat(entry['Total Revenue']?.toString().replace(/[^0-9.-]+/g, '') || 0);
        
        let buyerKey = mapMediaBuyerName(originalName);
        
        if (buyerKey && spend > 0) {
          if (!networkOfferData[buyerKey]) {
            networkOfferData[buyerKey] = {};
          }
          
          const networkOfferKey = `${network}::${offer}`;
          
          if (!networkOfferData[buyerKey][networkOfferKey]) {
            // Find payment terms for this network
            const networkInfo = networkData.find(n => n.name === network);
            const paymentTerms = networkInfo?.paymentTerms || 'Unknown';
            
            networkOfferData[buyerKey][networkOfferKey] = {
              network,
              offer,
              paymentTerms,
              spend: 0,
              revenue: 0,
              roi: 0
            };
          }
          
          networkOfferData[buyerKey][networkOfferKey].spend += spend;
          networkOfferData[buyerKey][networkOfferKey].revenue += revenue;
        }
      }
    });

    // Calculate ROI for each network-offer combination
    Object.keys(networkOfferData).forEach(buyer => {
      Object.keys(networkOfferData[buyer]).forEach(networkOfferKey => {
        const data = networkOfferData[buyer][networkOfferKey];
        if (data.spend > 0) {
          data.roi = ((data.revenue - data.spend) / data.spend) * 100;
        }
      });
      
      // Sort network-offers by spend descending
      const sortedEntries = Object.entries(networkOfferData[buyer])
        .sort(([,a], [,b]) => b.spend - a.spend);
      
      networkOfferData[buyer] = Object.fromEntries(sortedEntries);
    });

    console.log('CashFlowPlanner: Network-offer combinations by buyer:', networkOfferData);
    return networkOfferData;
  }, [performanceData, networkData]);

  // Helper function to format currency for inputs
  const formatCurrencyForInput = (value) => {
    if (!value || value === 0) return '';
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Helper function to parse currency input back to number
  const parseCurrencyInput = (value) => {
    if (!value) return 0;
    return parseFloat(value.toString().replace(/[^0-9.-]+/g, '')) || 0;
  };

  // Update custom scenarios to use calculated yesterday spend
  const updatedCustomScenarios = useMemo(() => ({
    ...customScenarios,
    yesterdayActual: yesterdayActualSpend
  }), [customScenarios, yesterdayActualSpend]);

  // Calculate total network budget for a specific buyer
  const getBuyerNetworkBudgetTotal = (buyer) => {
    const buyerNetworkBudgets = networkBudgets[buyer] || {};
    return Object.values(buyerNetworkBudgets).reduce((sum, budget) => sum + (budget || 0), 0);
  };

  // Calculate total network budgets across all buyers
  const totalNetworkBudgets = useMemo(() => {
    return Object.keys(mediaBuyerSpend).reduce((total, buyer) => {
      return total + getBuyerNetworkBudgetTotal(buyer);
    }, 0);
  }, [networkBudgets, mediaBuyerSpend]);

  // Get effective conservative budget (prioritize network budgets, then new budgets, then original)
  const effectiveConservativeBudget = useMemo(() => {
    // First check if any network budgets are set
    if (totalNetworkBudgets > 0) {
      return totalNetworkBudgets;
    }
    // Then check if any manual new budgets are set
    const hasNewBudgets = Object.values(newBudgets).some(budget => budget > 0);
    if (hasNewBudgets) {
      return totalNewBudget;
    }
    // Finally fall back to original conservative budgets
    return Object.values(mediaBuyerSpend).reduce((sum, buyer) => sum + buyer.conservative, 0);
  }, [totalNetworkBudgets, newBudgets, totalNewBudget, mediaBuyerSpend]);

  // Calculate different spending scenarios
  const spendingScenarios = useMemo(() => {
    const scenarios = [];
    
    // Latest day's actual
    scenarios.push({
      name: "Latest Day's Actual",
      dailySpend: updatedCustomScenarios.yesterdayActual,
      coverage: totalAvailableFunds > 0 ? Math.floor(totalAvailableFunds / updatedCustomScenarios.yesterdayActual) : 0,
      type: 'actual'
    });
    
    // Target scenario - calculate daily spend based on desired days
    const targetDailySpend = totalAvailableFunds > 0 ? totalAvailableFunds / updatedCustomScenarios.targetDays : 0;
    scenarios.push({
      name: 'Target Daily',
      dailySpend: targetDailySpend,
      coverage: updatedCustomScenarios.targetDays,
      type: 'target'
    });
    
    return scenarios;
  }, [mediaBuyerSpend, updatedCustomScenarios, totalAvailableFunds]);

  // Helper functions
  const updateMediaBuyerSpend = (buyer, type, value) => {
    setMediaBuyerSpend(prev => ({
      ...prev,
      [buyer]: {
        ...prev[buyer],
        [type]: parseFloat(value) || 0
      }
    }));
  };

  const updateCustomScenario = (scenario, value) => {
    setCustomScenarios(prev => ({
      ...prev,
      [scenario]: parseFloat(value) || 0
    }));
  };

  const updateNewBudget = (buyer, value) => {
    setNewBudgets(prev => ({
      ...prev,
      [buyer]: parseFloat(value) || 0
    }));
  };

  const updateNetworkBudget = (buyer, network, value) => {
    setNetworkBudgets(prev => ({
      ...prev,
      [buyer]: {
        ...prev[buyer],
        [network]: parseFloat(value) || 0
      }
    }));
  };

  const clearNetworkBudget = (buyer, network) => {
    setNetworkBudgets(prev => {
      if (!prev[buyer]) return prev;
      const newBuyerBudgets = { ...prev[buyer] };
      delete newBuyerBudgets[network];
      return {
        ...prev,
        [buyer]: newBuyerBudgets
      };
    });
  };

  // Calculate total new budget (replaces conservative when set)
  const totalNewBudget = useMemo(() => {
    return Object.values(newBudgets).reduce((sum, budget) => sum + (budget || 0), 0);
  }, [newBudgets]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Special formatting for spending scenarios - rounds up and no decimals
  const formatScenarioCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.ceil(value));
  };

  const updateOfferBudget = (buyer, networkOfferKey, value) => {
    setOfferBudgets(prev => ({
      ...prev,
      [buyer]: {
        ...prev[buyer],
        [networkOfferKey]: parseFloat(value) || 0
      }
    }));
  };

  const clearOfferBudget = (buyer, networkOfferKey) => {
    setOfferBudgets(prev => {
      if (!prev[buyer]) return prev;
      const newBuyerBudgets = { ...prev[buyer] };
      delete newBuyerBudgets[networkOfferKey];
      return {
        ...prev,
        [buyer]: newBuyerBudgets
      };
    });
  };

  const updateDefaultBudget = (buyer, value) => {
    setDefaultBudgets(prev => ({
      ...prev,
      [buyer]: parseFloat(value) || 0
    }));
  };

  // Calculate total offer budgets across all buyers
  const totalOfferBudgets = useMemo(() => {
    return Object.keys(mediaBuyerSpend).reduce((total, buyer) => {
      const buyerOfferBudgets = offerBudgets[buyer] || {};
      const buyerDefaultBudget = defaultBudgets[buyer] || 0;
      const offerBudgetTotal = Object.values(buyerOfferBudgets).reduce((sum, budget) => sum + (budget || 0), 0);
      
      // Use offer budgets if any exist, otherwise use default budget
      return total + (offerBudgetTotal > 0 ? offerBudgetTotal : buyerDefaultBudget);
    }, 0);
  }, [offerBudgets, defaultBudgets, mediaBuyerSpend]);

  // Calculate total weekly offer budgets
  const totalWeeklyOfferBudgets = useMemo(() => {
    return Object.keys(mediaBuyerSpend).reduce((total, buyer) => {
      const buyerOfferBudgets = offerBudgets[buyer] || {};
      const networkOffers = networkOffersByBuyer[buyer] || {};
      
      return total + Object.entries(buyerOfferBudgets).reduce((sum, [networkOfferKey, budget]) => {
        const offerData = networkOffers[networkOfferKey];
        if (offerData && offerData.paymentTerms === 'Weekly') {
          return sum + (budget || 0);
        }
        return sum;
      }, 0);
    }, 0);
  }, [offerBudgets, mediaBuyerSpend, networkOffersByBuyer]);

  // Calculate all active network-offer combinations across the team
  const allActiveNetworkOffers = useMemo(() => {
    const activeOffers = new Map();
    
    Object.entries(networkOffersByBuyer).forEach(([buyer, offers]) => {
      Object.entries(offers).forEach(([networkOfferKey, data]) => {
        if (data.spend > 0) { // Only include offers with actual spend
          const key = networkOfferKey;
          if (!activeOffers.has(key) || activeOffers.get(key).spend < data.spend) {
            activeOffers.set(key, {
              network: data.network,
              offer: data.offer,
              paymentTerms: data.paymentTerms,
              spend: data.spend,
              roi: data.roi,
              networkOfferKey: key
            });
          }
        }
      });
    });
    
    // Sort by payment terms (Weekly first) then by spend
    return Array.from(activeOffers.values()).sort((a, b) => {
      if (a.paymentTerms === 'Weekly' && b.paymentTerms !== 'Weekly') return -1;
      if (b.paymentTerms === 'Weekly' && a.paymentTerms !== 'Weekly') return 1;
      return b.spend - a.spend;
    });
  }, [networkOffersByBuyer]);

  // Calculate all available network-offer combinations for planning (includes inactive)
  const allAvailableNetworkOffers = useMemo(() => {
    const availableOffers = new Map();
    
    // First, add all currently active offers
    Object.entries(networkOffersByBuyer).forEach(([buyer, offers]) => {
      Object.entries(offers).forEach(([networkOfferKey, data]) => {
        if (data.spend > 0) {
          const key = networkOfferKey;
          availableOffers.set(key, {
            network: data.network,
            offer: data.offer,
            paymentTerms: data.paymentTerms,
            spend: data.spend,
            roi: data.roi,
            networkOfferKey: key,
            isActive: true
          });
        }
      });
    });
    
    // Then, add all network combinations from network exposure data with common offers
    const commonOffers = ['Auto', 'Bath', 'Bathroom', 'Comments', 'Debt', 'EDU', 'EDU DS', 'Health', 'MMA', 'Roofing', 'Solar', 'VSL', 'Windows', 'Dumb Money'];
    
    networkData.forEach(network => {
      commonOffers.forEach(offer => {
        const key = `${network.name}::${offer}`;
        if (!availableOffers.has(key)) {
          availableOffers.set(key, {
            network: network.name,
            offer: offer,
            paymentTerms: network.paymentTerms || 'Unknown',
            spend: 0,
            roi: 0,
            networkOfferKey: key,
            isActive: false
          });
        }
      });
    });
    
    // Sort by payment terms (Weekly first) then by spend, then alphabetically
    return Array.from(availableOffers.values()).sort((a, b) => {
      if (a.paymentTerms === 'Weekly' && b.paymentTerms !== 'Weekly') return -1;
      if (b.paymentTerms === 'Weekly' && a.paymentTerms !== 'Weekly') return 1;
      if (a.isActive && !b.isActive) return -1;
      if (b.isActive && !a.isActive) return 1;
      if (b.spend !== a.spend) return b.spend - a.spend;
      return a.network.localeCompare(b.network);
    });
  }, [networkOffersByBuyer, networkData]);

  // Calculate team performance metrics (Yesterday, Last 7 Days, MTD) by network-offer
  const teamPerformanceMetrics = useMemo(() => {
    if (!performanceData?.data || !Array.isArray(performanceData.data)) {
      return {};
    }

    // Find date ranges
    const allDates = performanceData.data
      .map(entry => entry.Date)
      .filter(date => date)
      .sort((a, b) => new Date(b) - new Date(a));
    
    const mostRecentDate = allDates[0];
    if (!mostRecentDate) return {};

    const mostRecentDateObj = new Date(mostRecentDate);
    const sevenDaysAgo = new Date(mostRecentDateObj);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const startOfMonth = new Date(mostRecentDateObj.getFullYear(), mostRecentDateObj.getMonth(), 1);

    // Calculate metrics for each network-offer combination
    const calculateMetrics = (startDate, endDate = null) => {
      const metrics = {};
      
      performanceData.data.forEach(entry => {
        const entryDate = new Date(entry.Date);
        if (entryDate < startDate || (endDate && entryDate > endDate)) return;
        
        if (entry['Media Buyer'] && entry.Network && entry.Offer) {
          // Parse the campaign name to get normalized network name
          const campaignName = `${entry.Network} ${entry.Offer}`;
          const parsedCampaign = parseCampaignName(campaignName);
          
          // Use parsed network name instead of raw entry.Network
          const normalizedNetwork = parsedCampaign.network !== 'Unknown' ? parsedCampaign.network : entry.Network;
          const networkOfferKey = `${normalizedNetwork}::${entry.Offer}`;
          
          const spend = parseFloat(entry.Spend?.toString().replace(/[^0-9.-]+/g, '') || entry['Ad Spend'] || 0);
          const revenue = parseFloat(entry['Total Revenue']?.toString().replace(/[^0-9.-]+/g, '') || 0);
          
          if (spend > 0) {
            if (!metrics[networkOfferKey]) {
              metrics[networkOfferKey] = {
                network: normalizedNetwork,
                offer: entry.Offer,
                spend: 0,
                revenue: 0,
                roi: 0,
                paymentTerms: 'Unknown' // Will be filled from networkData
              };
            }
            
            metrics[networkOfferKey].spend += spend;
            metrics[networkOfferKey].revenue += revenue;
          }
        }
      });

      // Calculate ROI and add payment terms
      Object.keys(metrics).forEach(key => {
        const data = metrics[key];
        if (data.spend > 0) {
          data.roi = ((data.revenue - data.spend) / data.spend) * 100;
        }
        
        // Find payment terms from networkData with improved matching
        let networkInfo = networkData.find(n => n.name === data.network);
        
        // If not found, try partial matching
        if (!networkInfo) {
          networkInfo = networkData.find(n => 
            n.name.toLowerCase().includes(data.network.toLowerCase()) ||
            data.network.toLowerCase().includes(n.name.toLowerCase())
          );
        }
        
        // Fallback payment terms for common networks not in exposure data
        if (!networkInfo) {
          switch (data.network.toLowerCase()) {
            case 'aca':
              data.paymentTerms = 'Weekly';
              break;
            case 'digistore':
              data.paymentTerms = 'Weekly';
              break;
            case 'leadnomics':
            case 'leadnomic':
              data.paymentTerms = 'Weekly';
              break;
            default:
              data.paymentTerms = 'Unknown';
          }
        } else {
          data.paymentTerms = networkInfo.paymentTerms || 'Unknown';
        }
      });

      return metrics;
    };

    return {
      yesterday: calculateMetrics(mostRecentDateObj, mostRecentDateObj),
      last7Days: calculateMetrics(sevenDaysAgo),
      mtd: calculateMetrics(startOfMonth)
    };
  }, [performanceData, networkData]);

  // Get all unique network-offers with team performance
  const teamNetworkOffers = useMemo(() => {
    const allOffers = new Set();
    
    Object.values(teamPerformanceMetrics).forEach(period => {
      Object.keys(period).forEach(key => allOffers.add(key));
    });

    return Array.from(allOffers).map(key => {
      const yesterday = teamPerformanceMetrics.yesterday?.[key];
      const last7Days = teamPerformanceMetrics.last7Days?.[key];
      const mtd = teamPerformanceMetrics.mtd?.[key];
      
      // Use data from the period with the most recent activity
      const baseData = yesterday || last7Days || mtd || {
        network: key.split('::')[0],
        offer: key.split('::')[1],
        paymentTerms: 'Unknown'
      };

      return {
        networkOfferKey: key,
        network: baseData.network,
        offer: baseData.offer,
        paymentTerms: baseData.paymentTerms,
        yesterday: yesterday || { spend: 0, revenue: 0, roi: 0 },
        last7Days: last7Days || { spend: 0, revenue: 0, roi: 0 },
        mtd: mtd || { spend: 0, revenue: 0, roi: 0 }
      };
    }).sort((a, b) => {
      // Sort by payment terms (Weekly first) then by yesterday spend
      if (a.paymentTerms === 'Weekly' && b.paymentTerms !== 'Weekly') return -1;
      if (b.paymentTerms === 'Weekly' && a.paymentTerms !== 'Weekly') return 1;
      return b.yesterday.spend - a.yesterday.spend;
    });
  }, [teamPerformanceMetrics]);

  // Helper function to format payment terms display
  const formatPaymentTermsDisplay = (paymentTerms) => {
    if (!paymentTerms) return 'Unk';
    
    const normalized = paymentTerms.toString().toLowerCase().trim();
    
    if (normalized.includes('bi-monthly') || normalized.includes('bi monthly')) return 'Bi-M';
    if (normalized.includes('monthly')) return 'Mon';
    if (normalized.includes('weekly')) return 'Wk';
    if (normalized.includes('net')) return paymentTerms; // Keep Net 30, Net 15, etc.
    
    // Handle specific cases
    switch (normalized) {
      case 'bi-monthly':
      case 'bimonthly':
        return 'Bi-M';
      case 'monthly':
        return 'Mon';
      case 'weekly':
        return 'Wk';
      default:
        return 'Unk';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Planner</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading cash flow data...</div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Credit Card Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-blue-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      <div className="text-sm text-blue-600 font-medium">Total Credit Limit</div>
                    </div>
                    <div className="text-2xl font-bold text-blue-700">
                      {formatCurrency(creditCardMetrics.totalLimit)}
                    </div>
                    <div className="text-sm text-blue-600 mt-1">
                      {formatCurrency(creditCardMetrics.availableCredit)} available
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-green-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <div className="text-sm text-green-600 font-medium">Incoming Money (30 days)</div>
                    </div>
                    <div className="text-2xl font-bold text-green-700">
                      {formatCurrency(incomingMoney.total)}
                    </div>
                    <div className="text-sm text-green-600 mt-1">
                      Across {Object.keys(incomingMoney.byWeek).length} weeks
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-purple-600" />
                      <div className="text-sm text-purple-600 font-medium">Upcoming Expenses (30 days)</div>
                    </div>
                    <div className="text-2xl font-bold text-purple-700">
                      {formatCurrency(upcomingExpensesMetrics.total)}
                    </div>
                    <div className="text-sm text-purple-600 mt-1">
                      {Object.keys(upcomingExpensesMetrics.byCategory).length} categories
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Daily Spend Calculator */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Calculator className="h-6 w-6 text-blue-600" />
                  <h3 className="text-xl font-semibold">Daily Spend Calculator</h3>
                </div>

                {/* Team Performance Overview */}
                <Card className="border-2 border-purple-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      <span>Team Performance Overview</span>
                    </CardTitle>
                    <div className="text-xs text-gray-600 mt-1">
                      Network-offer performance across time periods
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 pb-3">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-1 font-medium w-48">Network • Offer</th>
                            <th className="text-center py-1 font-medium w-16">Terms</th>
                            <th className="text-center py-1 font-medium w-20">Yesterday ROI</th>
                            <th className="text-center py-1 font-medium w-20">7-Day ROI</th>
                            <th className="text-center py-1 font-medium w-20">MTD ROI</th>
                            <th className="text-center py-1 font-medium w-20">Yesterday Spend</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teamNetworkOffers.map((offer, index) => {
                            const getROIColor = (roi) => {
                              if (roi >= 20) return 'text-green-600 font-bold';
                              if (roi >= 0) return 'text-yellow-600 font-medium';
                              return 'text-red-600 font-bold';
                            };
                            
                            const getPaymentTermColor = (paymentTerms) => {
                              switch (paymentTerms) {
                                case 'Weekly': return 'bg-green-100 text-green-800 border-green-300 font-bold';
                                case 'Monthly': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
                                case 'Bi-Monthly': return 'bg-red-100 text-red-700 border-red-300';
                                default: return 'bg-gray-100 text-gray-700 border-gray-300';
                              }
                            };

                            const getRowHighlight = (paymentTerms) => {
                              return paymentTerms === 'Weekly' ? 'bg-green-25' : '';
                            };
                            
                            return (
                              <tr key={offer.networkOfferKey} 
                                  className={`border-b border-gray-100 hover:bg-blue-50 ${getRowHighlight(offer.paymentTerms)}`}>
                                {/* Network • Offer */}
                                <td className="py-1">
                                  <div className="flex items-center space-x-1">
                                    <span className="font-medium text-blue-700 text-xs">{offer.network}</span>
                                    <span className="text-gray-400">•</span>
                                    <span className="font-medium text-orange-700 text-xs">{offer.offer}</span>
                                    {offer.paymentTerms === 'Weekly' && (
                                      <span className="text-green-600 text-xs">⭐</span>
                                    )}
                                  </div>
                                </td>
                                
                                {/* Payment Terms */}
                                <td className="py-1 text-center">
                                  <span className={`px-1 py-0.5 rounded border text-xs font-medium ${getPaymentTermColor(offer.paymentTerms)}`}>
                                    {formatPaymentTermsDisplay(offer.paymentTerms)}
                                  </span>
                                </td>
                                
                                {/* Yesterday ROI */}
                                <td className="py-1 text-center">
                                  <span className={`${getROIColor(offer.yesterday.roi)} text-xs`}>
                                    {offer.yesterday.spend > 0 ? `${offer.yesterday.roi.toFixed(1)}%` : 'N/A'}
                                  </span>
                                </td>
                                
                                {/* 7-Day ROI */}
                                <td className="py-1 text-center">
                                  <span className={`${getROIColor(offer.last7Days.roi)} text-xs`}>
                                    {offer.last7Days.spend > 0 ? `${offer.last7Days.roi.toFixed(1)}%` : 'N/A'}
                                  </span>
                                </td>
                                
                                {/* MTD ROI */}
                                <td className="py-1 text-center">
                                  <span className={`${getROIColor(offer.mtd.roi)} text-xs`}>
                                    {offer.mtd.spend > 0 ? `${offer.mtd.roi.toFixed(1)}%` : 'N/A'}
                                  </span>
                                </td>
                                
                                {/* Yesterday Spend */}
                                <td className="py-1 text-center">
                                  <span className="text-blue-600 font-medium text-xs">
                                    {formatCurrency(offer.yesterday.spend)}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Total Available Funds Summary */}
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                  <CardContent className="pt-4 pb-4">
                    <div 
                      className="cursor-pointer select-none"
                      onClick={() => setShowFinancialDetails(!showFinancialDetails)}
                    >
                      <div className="text-center">
                        <div className="text-sm text-blue-600 font-medium flex items-center justify-center space-x-2">
                          <span>Total Available Funds</span>
                          {showFinancialDetails ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                        <div className="text-2xl font-bold text-blue-800">
                          {formatCurrency(totalAvailableFunds)}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">Cash + Available Credit</div>
                      </div>
                    </div>
                    
                    {/* Financial Resources Dropdown */}
                    {showFinancialDetails && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <div className="text-sm font-medium text-blue-700 mb-3">Financial Resources Breakdown</div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-blue-200">
                                <th className="text-left py-2 font-medium text-blue-700">Resource</th>
                                <th className="text-right py-2 font-medium text-blue-700">Available</th>
                                <th className="text-right py-2 font-medium text-blue-700">Owing</th>
                                <th className="text-right py-2 font-medium text-blue-700">Limit</th>
                                <th className="text-right py-2 font-medium text-blue-700">Utilization</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Array.isArray(creditCardData) && creditCardData.map((account, index) => {
                                const available = parseFloat(account.available?.toString().replace(/[^0-9.-]+/g, '') || 0);
                                const owing = parseFloat(account.owing?.toString().replace(/[^0-9.-]+/g, '') || 0);
                                const limit = parseFloat(account.limit?.toString().replace(/[^0-9.-]+/g, '') || 0);
                                const utilization = limit > 0 ? (owing / limit) * 100 : 0;
                                
                                const getUtilizationColor = (util) => {
                                  if (util >= 80) return 'text-red-600';
                                  if (util >= 60) return 'text-yellow-600';
                                  return 'text-green-600';
                                };
                                
                                return (
                                  <tr key={index} className="border-b border-blue-100">
                                    <td className="py-2 font-medium text-blue-900">{account.account}</td>
                                    <td className="py-2 text-right font-bold text-green-700">
                                      {formatCurrency(available)}
                                    </td>
                                    <td className="py-2 text-right text-blue-700">
                                      {formatCurrency(owing)}
                                    </td>
                                    <td className="py-2 text-right text-blue-600">
                                      {limit > 0 ? formatCurrency(limit) : 'N/A'}
                                    </td>
                                    <td className={`py-2 text-right font-medium ${getUtilizationColor(utilization)}`}>
                                      {limit > 0 ? `${utilization.toFixed(1)}%` : 'N/A'}
                                    </td>
                                  </tr>
                                );
                              })}
                              {/* Summary Row */}
                              <tr className="border-t-2 border-blue-300 font-bold bg-blue-50">
                                <td className="py-2 text-blue-800">TOTAL</td>
                                <td className="py-2 text-right text-green-700">
                                  {formatCurrency(totalAvailableFunds)}
                                </td>
                                <td className="py-2 text-right text-blue-700">
                                  {formatCurrency(creditCardMetrics.totalUsed)}
                                </td>
                                <td className="py-2 text-right text-blue-600">
                                  {formatCurrency(creditCardMetrics.totalLimit)}
                                </td>
                                <td className="py-2 text-right text-blue-700">
                                  {creditCardMetrics.totalLimit > 0 ? 
                                    `${((creditCardMetrics.totalUsed / creditCardMetrics.totalLimit) * 100).toFixed(1)}%` : 
                                    'N/A'
                                  }
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <div className="text-xs text-blue-500 mt-2 text-center">
                          Click above to collapse this view
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Spending Scenarios Summary */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Target className="h-5 w-5 text-purple-600" />
                      <span>Spending Scenarios Overview</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Custom Scenario Inputs */}
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs text-gray-500">
                              Latest Day's Actual 
                              {yesterdayActualSpend > 0 && yesterdayActualSpend !== customScenarios.yesterdayActual && (
                                <span className="text-green-600 ml-1">📊 Live</span>
                              )}
                            </Label>
                            <Input
                              type="text"
                              value={formatCurrencyForInput(updatedCustomScenarios.yesterdayActual)}
                              onChange={(e) => updateCustomScenario('yesterdayActual', parseCurrencyInput(e.target.value))}
                              className="h-8 text-xs"
                              placeholder={yesterdayActualSpend > 0 ? "Auto-calculated" : "Enter manually"}
                            />
                            {yesterdayActualSpend > 0 && yesterdayActualSpend !== customScenarios.yesterdayActual && (
                              <div className="text-xs text-green-600 mt-1">
                                Auto: {formatCurrency(yesterdayActualSpend)}
                              </div>
                            )}
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Target Days Coverage</Label>
                            <Input
                              type="number"
                              value={updatedCustomScenarios.targetDays}
                              onChange={(e) => updateCustomScenario('targetDays', e.target.value)}
                              className="h-8 text-xs"
                              placeholder="Days to last"
                            />
                            <div className="text-xs text-gray-500 mt-1">
                              Daily: {formatScenarioCurrency(totalAvailableFunds / (updatedCustomScenarios.targetDays || 1))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Scenarios Summary Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 font-medium">Scenario</th>
                              <th className="text-right py-2 font-medium">Daily Spend</th>
                              <th className="text-right py-2 font-medium">Coverage</th>
                            </tr>
                          </thead>
                          <tbody>
                            {spendingScenarios.map((scenario, index) => {
                              const getCoverageColor = (days) => {
                                if (days >= 30) return 'text-green-600';
                                if (days >= 14) return 'text-yellow-600';
                                return 'text-red-600';
                              };

                              return (
                                <tr key={index} className="border-b border-gray-100">
                                  <td className="py-2 text-xs font-medium">{scenario.name}</td>
                                  <td className="py-2 text-right text-xs font-mono">
                                    {formatScenarioCurrency(scenario.dailySpend)}
                                  </td>
                                  <td className={`py-2 text-right text-xs font-bold ${getCoverageColor(scenario.coverage)}`}>
                                    {scenario.coverage} days
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Quick Summary Cards */}
                      <div className="grid grid-cols-2 gap-4">
                        {spendingScenarios.map((scenario, index) => {
                          const getCoverageColor = (days) => {
                            if (days >= 30) return 'bg-green-50 border-green-200 text-green-700';
                            if (days >= 14) return 'bg-yellow-50 border-yellow-200 text-yellow-700';
                            return 'bg-red-50 border-red-200 text-red-700';
                          };

                          const getIcon = (type) => {
                            switch (type) {
                              case 'conservative': return '🟢';
                              case 'aggressive': return '🔴';
                              case 'actual': return '📊';
                              case 'target': return '🎯';
                              default: return '📈';
                            }
                          };

                          return (
                            <Card key={index} className={`p-3 ${getCoverageColor(scenario.coverage)}`}>
                              <div className="text-center space-y-1">
                                <div className="text-xs font-medium flex items-center justify-center space-x-1">
                                  <span>{getIcon(scenario.type)}</span>
                                  <span>{scenario.name}</span>
                                </div>
                                <div className="text-lg font-bold">
                                  {scenario.coverage} days
                                </div>
                                <div className="text-xs opacity-75">
                                  {formatScenarioCurrency(scenario.dailySpend)}
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Media Buyer Allocations */}
                <Card className="border-2 border-green-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Users className="h-5 w-5 text-green-600" />
                      <span>Media Buyer Performance & Budget Allocation</span>
                    </CardTitle>
                    <div className="text-xs text-gray-600 mt-1">
                      Set budgets by network-offer combination • Prioritize Weekly payments
                    </div>
                    {/* Budget Summary */}
                    <div className="flex items-center space-x-4 mt-2 text-xs">
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-600">Total Budget:</span>
                        <span className="font-bold text-blue-600">{formatCurrency(totalOfferBudgets)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-600">Weekly:</span>
                        <span className="font-bold text-green-600">{formatCurrency(totalWeeklyOfferBudgets)}</span>
                        <span className="text-xs text-gray-500">
                          ({totalOfferBudgets > 0 ? Math.round((totalWeeklyOfferBudgets / totalOfferBudgets) * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 pb-3">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-1 font-medium w-20">Media Buyer</th>
                            <th className="text-left py-1 font-medium w-48">Network • Offer</th>
                            <th className="text-center py-1 font-medium w-16">Terms</th>
                            <th className="text-center py-1 font-medium w-20">Yesterday</th>
                            <th className="text-center py-1 font-medium w-16">ROI</th>
                            <th className="text-right py-1 font-medium w-24">New Budget</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Active buyers with offers */}
                          {Object.entries(mediaBuyerSpend)
                            .filter(([buyer]) => {
                              const networkOffers = networkOffersByBuyer[buyer] || {};
                              return Object.keys(networkOffers).length > 0;
                            })
                            .sort(([buyerA], [buyerB]) => {
                              // Sort by yesterday spend descending
                              const spendA = yesterdaySpendByBuyer[buyerA] || 0;
                              const spendB = yesterdaySpendByBuyer[buyerB] || 0;
                              return spendB - spendA;
                            })
                            .flatMap(([buyer]) => {
                              const displayName = buyer === 'mikeM' ? 'Mike M' : 
                                                buyer === 'mikeC' ? 'Mike C' : 
                                                buyer.charAt(0).toUpperCase() + buyer.slice(1);
                              
                              const networkOffers = networkOffersByBuyer[buyer] || {};
                              const buyerOfferBudgets = offerBudgets[buyer] || {};
                              
                              const getROIColor = (roi) => {
                                if (roi >= 20) return 'text-green-600 font-bold';
                                if (roi >= 0) return 'text-yellow-600 font-medium';
                                return 'text-red-600 font-bold';
                              };
                              
                              const getPaymentTermColor = (paymentTerms) => {
                                switch (paymentTerms) {
                                  case 'Weekly': return 'bg-green-100 text-green-800 border-green-300 font-bold';
                                  case 'Monthly': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
                                  case 'Bi-Monthly': return 'bg-red-100 text-red-700 border-red-300';
                                  default: return 'bg-gray-100 text-gray-700 border-gray-300';
                                }
                              };
                              
                              const getRowHighlight = (paymentTerms) => {
                                return paymentTerms === 'Weekly' ? 'bg-green-25' : '';
                              };
                              
                              return Object.entries(networkOffers)
                                .sort(([,a], [,b]) => {
                                  // Sort by: 1) Weekly first, 2) Spend descending
                                  if (a.paymentTerms === 'Weekly' && b.paymentTerms !== 'Weekly') return -1;
                                  if (b.paymentTerms === 'Weekly' && a.paymentTerms !== 'Weekly') return 1;
                                  return b.spend - a.spend;
                                })
                                .map(([networkOfferKey, data], index) => (
                                  <tr key={`${buyer}-${networkOfferKey}`} 
                                      className={`border-b border-gray-100 hover:bg-blue-50 ${getRowHighlight(data.paymentTerms)}`}>
                                    {/* Media Buyer - only show on first row for each buyer */}
                                    <td className="py-1">
                                      {index === 0 ? (
                                        <span className="font-bold text-blue-700 text-sm">{displayName}</span>
                                      ) : (
                                        <span className="text-gray-300">↳</span>
                                      )}
                                    </td>
                                    
                                    {/* Network • Offer */}
                                    <td className="py-1">
                                      <div className="flex items-center space-x-1">
                                        <span className="font-medium text-blue-700 text-xs">{data.network}</span>
                                        <span className="text-gray-400">•</span>
                                        <span className="font-medium text-orange-700 text-xs">{data.offer}</span>
                                        {data.paymentTerms === 'Weekly' && (
                                          <span className="text-green-600 text-xs">⭐</span>
                                        )}
                                      </div>
                                    </td>
                                    
                                    {/* Payment Terms */}
                                    <td className="py-1 text-center">
                                      <span className={`px-1 py-0.5 rounded border text-xs font-medium ${getPaymentTermColor(data.paymentTerms)}`}>
                                        {formatPaymentTermsDisplay(data.paymentTerms)}
                                      </span>
                                    </td>
                                    
                                    {/* Yesterday Spend */}
                                    <td className="py-1 text-center">
                                      <span className="text-blue-600 font-medium text-xs">
                                        {formatCurrency(data.spend)}
                                      </span>
                                    </td>
                                    
                                    {/* ROI */}
                                    <td className="py-1 text-center">
                                      <span className={`${getROIColor(data.roi)} text-xs`}>
                                        {data.roi.toFixed(1)}%
                                      </span>
                                    </td>
                                    
                                    {/* Budget Input */}
                                    <td className="py-1 text-right">
                                      <Input
                                        type="text"
                                        value={formatCurrencyForInput(buyerOfferBudgets[networkOfferKey] || 0)}
                                        onChange={(e) => updateOfferBudget(buyer, networkOfferKey, parseCurrencyInput(e.target.value))}
                                        className={`w-24 h-6 text-xs text-right ${
                                          data.paymentTerms === 'Weekly' 
                                            ? 'border-green-400 focus:border-green-500 bg-green-25' 
                                            : 'border-blue-300 focus:border-blue-500'
                                        }`}
                                        placeholder="$0"
                                      />
                                    </td>
                                  </tr>
                                ));
                            })}
                          
                          {/* Inactive buyers section */}
                          {Object.entries(mediaBuyerSpend)
                            .filter(([buyer]) => {
                              const networkOffers = networkOffersByBuyer[buyer] || {};
                              return Object.keys(networkOffers).length === 0;
                            })
                            .sort(([buyerA], [buyerB]) => {
                              // Put Daniel and Pavan at the bottom
                              if (buyerA === 'daniel') return 1;
                              if (buyerB === 'daniel') return -1;
                              if (buyerA === 'pavan') return 1;
                              if (buyerB === 'pavan') return -1;
                              return 0;
                            })
                            .flatMap(([buyer]) => {
                              const displayName = buyer === 'mikeM' ? 'Mike M' : 
                                                buyer === 'mikeC' ? 'Mike C' : 
                                                buyer.charAt(0).toUpperCase() + buyer.slice(1);
                              
                              const buyerOfferBudgets = offerBudgets[buyer] || {};
                              const defaultBudget = defaultBudgets[buyer] || 0;
                              const isToggled = inactiveBuyerToggles[buyer];
                              
                              const rows = [];
                              
                              // Always show the main buyer row with toggle
                              rows.push(
                                <tr key={`${buyer}-header`} className="bg-blue-25 border-l-2 border-blue-400">
                                  <td className="py-2">
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => setInactiveBuyerToggles(prev => ({
                                          ...prev,
                                          [buyer]: !prev[buyer]
                                        }))}
                                        className="text-blue-600 hover:text-blue-800 transition-colors"
                                      >
                                        {isToggled ? '▼' : '▶'}
                                      </button>
                                      <span className="font-bold text-blue-700 text-sm">{displayName}</span>
                                    </div>
                                    <div className="text-xs text-orange-600 mt-0.5 ml-6">📋 Planning</div>
                                  </td>
                                  <td className="py-2">
                                    <div className="text-xs text-blue-600">
                                      {allAvailableNetworkOffers.length} team offers available • 
                                      {allAvailableNetworkOffers.filter(o => o.paymentTerms === 'Weekly').length} weekly priority
                                    </div>
                                  </td>
                                  <td className="py-2 text-center">
                                    <span className="text-xs text-gray-500">Various</span>
                                  </td>
                                  <td className="py-2 text-center">
                                    <span className="text-gray-400 text-xs">$0</span>
                                  </td>
                                  <td className="py-2 text-center">
                                    <span className="text-gray-400 text-xs">N/A</span>
                                  </td>
                                  <td className="py-2 text-right">
                                    <Input
                                      type="text"
                                      value={formatCurrencyForInput(defaultBudget)}
                                      onChange={(e) => updateDefaultBudget(buyer, parseCurrencyInput(e.target.value))}
                                      className="w-24 h-6 text-xs text-right border-blue-300 focus:border-blue-500"
                                      placeholder="Default $"
                                    />
                                  </td>
                                </tr>
                              );
                              
                              // If toggled on, show all available offers
                              if (isToggled) {
                                const getPaymentTermColor = (paymentTerms) => {
                                  switch (paymentTerms) {
                                    case 'Weekly': return 'bg-green-100 text-green-800 border-green-300 font-bold';
                                    case 'Monthly': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
                                    case 'Bi-Monthly': return 'bg-red-100 text-red-700 border-red-300';
                                    default: return 'bg-gray-100 text-gray-700 border-gray-300';
                                  }
                                };
                                
                                const getRowHighlight = (paymentTerms) => {
                                  return paymentTerms === 'Weekly' ? 'bg-green-25' : '';
                                };
                                
                                allActiveNetworkOffers.forEach((offer, index) => {
                                  rows.push(
                                    <tr key={`${buyer}-offer-${offer.networkOfferKey}`} 
                                        className={`border-b border-gray-100 hover:bg-blue-50 ${getRowHighlight(offer.paymentTerms)} bg-blue-50`}>
                                      {/* Media Buyer - show arrow for sub-rows */}
                                      <td className="py-1 pl-4">
                                        <span className="text-gray-400 text-xs">↳</span>
                                      </td>
                                      
                                      {/* Network • Offer */}
                                      <td className="py-1">
                                        <div className="flex items-center space-x-1">
                                          <span className="font-medium text-blue-700 text-xs">{offer.network}</span>
                                          <span className="text-gray-400">•</span>
                                          <span className="font-medium text-orange-700 text-xs">{offer.offer}</span>
                                          {offer.paymentTerms === 'Weekly' && (
                                            <span className="text-green-600 text-xs">⭐</span>
                                          )}
                                          <span className={`text-xs ${offer.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                                            ({offer.isActive ? 'Active' : 'Available'})
                                          </span>
                                        </div>
                                      </td>
                                      
                                      {/* Payment Terms */}
                                      <td className="py-1 text-center">
                                        <span className={`px-1 py-0.5 rounded border text-xs font-medium ${getPaymentTermColor(offer.paymentTerms)}`}>
                                          {formatPaymentTermsDisplay(offer.paymentTerms)}
                                        </span>
                                      </td>
                                      
                                      {/* Yesterday - Show actual spend if active, $0 if available */}
                                      <td className="py-1 text-center">
                                        <span className={`text-xs ${offer.isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                                          {offer.isActive && offer.spend > 0 ? formatCurrency(offer.spend) : '$0'}
                                        </span>
                                      </td>
                                      
                                      {/* ROI - Show actual ROI if active, N/A if available */}
                                      <td className="py-1 text-center">
                                        <span className={`text-xs ${offer.isActive && offer.spend > 0 ? 
                                          (offer.roi >= 20 ? 'text-green-600' : offer.roi >= 0 ? 'text-yellow-600' : 'text-red-600') : 
                                          'text-gray-400'}`}>
                                          {offer.isActive && offer.spend > 0 ? `${offer.roi.toFixed(1)}%` : 'N/A'}
                                        </span>
                                      </td>
                                      
                                      {/* Budget Input */}
                                      <td className="py-1 text-right">
                                        <Input
                                          type="text"
                                          value={formatCurrencyForInput(buyerOfferBudgets[offer.networkOfferKey] || 0)}
                                          onChange={(e) => updateOfferBudget(buyer, offer.networkOfferKey, parseCurrencyInput(e.target.value))}
                                          className={`w-24 h-6 text-xs text-right ${
                                            offer.paymentTerms === 'Weekly' 
                                              ? 'border-green-400 focus:border-green-500 bg-green-25' 
                                              : 'border-blue-300 focus:border-blue-500'
                                          }`}
                                          placeholder="$0"
                                        />
                                      </td>
                                    </tr>
                                  );
                                });
                              }
                              
                              return rows;
                            })}
                          
                          {/* Overall Total Row */}
                          <tr className="border-t-2 border-gray-400 font-bold bg-gray-50">
                            <td className="py-2 text-sm">
                              <div className="flex items-center space-x-1">
                                <Calculator className="h-4 w-4 text-gray-700" />
                                <span>TOTAL</span>
                              </div>
                            </td>
                            <td className="py-2 text-sm text-gray-800">All Network-Offers</td>
                            <td className="py-2 text-center">
                              <div className="text-xs text-gray-600">
                                {Math.round((totalWeeklyOfferBudgets / (totalOfferBudgets || 1)) * 100)}% Wk
                              </div>
                            </td>
                            <td className="py-2 text-center text-blue-600 text-xs font-bold">
                              {formatCurrency(Object.values(yesterdaySpendByBuyer).reduce((sum, spend) => sum + spend, 0))}
                            </td>
                            <td className="py-2 text-center">
                              {(() => {
                                const totalSpend = Object.values(yesterdayROIByBuyer).reduce((sum, data) => sum + data.spend, 0);
                                const totalRevenue = Object.values(yesterdayROIByBuyer).reduce((sum, data) => sum + data.revenue, 0);
                                const overallROI = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
                                const getROIColor = (roi) => {
                                  if (roi >= 20) return 'text-green-600';
                                  if (roi >= 0) return 'text-yellow-600';
                                  return 'text-red-600';
                                };
                                return (
                                  <span className={`font-bold text-xs ${getROIColor(overallROI)}`}>
                                    {totalSpend > 0 ? `${overallROI.toFixed(1)}%` : 'N/A'}
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="py-2 text-right font-bold text-blue-600">
                              <div>
                                <div className="text-sm">{formatCurrency(totalOfferBudgets)}</div>
                                <div className="text-xs font-normal text-green-600">
                                  Weekly: {formatCurrency(totalWeeklyOfferBudgets)}
                                </div>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CashFlowPlanner;