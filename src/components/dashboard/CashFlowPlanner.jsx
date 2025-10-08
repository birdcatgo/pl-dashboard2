import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp, TrendingDown, DollarSign, CreditCard, Calendar, Calculator, Users, Target, ChevronUp, ChevronDown } from 'lucide-react';
import { format, addDays, isSameDay, isToday, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, subDays } from 'date-fns';
import { parseCampaignName } from '@/lib/campaign-utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const CashFlowPlanner = ({ performanceData, creditCardData, upcomingExpenses, invoicesData, networkExposureData, cashFlowData }) => {
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
        const amountValue = expense.amount || expense.Amount || 0;
        amount = parseFloat(amountValue.toString().replace(/[$,]/g, ''));
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

  // Calculate incoming money from invoices (20 days overdue to all future)
  const incomingMoney = useMemo(() => {
    if (!Array.isArray(invoicesData)) {
      console.log('Invalid invoice data format');
      return { total: 0, totalWithBelowThreshold: 0, byWeek: {}, belowThresholdCount: 0 };
    }

    const today = new Date();
    const twentyDaysAgo = subDays(today, 20);
    
    return invoicesData.reduce((acc, invoice) => {
      if (!invoice || !invoice.DueDate) return acc;
      
      const dueDate = new Date(invoice.DueDate);
      
      // Only include invoices that are:
      // 1. Not more than 20 days overdue (>= twentyDaysAgo), AND
      // 2. Any future date (no upper limit)
      // This shows: 20 days past + today + all future invoices
      if (dueDate >= twentyDaysAgo) {
        const amount = parseFloat(invoice.AmountDue?.replace(/[^0-9.-]+/g, '') || 0);
        const weekNumber = Math.floor((dueDate - today) / (7 * 24 * 60 * 60 * 1000));
        
        // Track total including below threshold
        acc.totalWithBelowThreshold += amount;
        
        // Only add to main total if above $200 threshold
        if (amount >= 200) {
          acc.total += amount;
          acc.byWeek[weekNumber] = (acc.byWeek[weekNumber] || 0) + amount;
        } else {
          acc.belowThresholdCount++;
        }
      }
      return acc;
    }, { total: 0, totalWithBelowThreshold: 0, byWeek: {}, belowThresholdCount: 0 });
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
                      <div className="text-sm text-green-600 font-medium">Incoming Money (All Future)</div>
                    </div>
                    <div className="text-2xl font-bold text-green-700">
                      {formatCurrency(incomingMoney.total)}
                    </div>
                    <div className="text-sm text-green-600 mt-1">
                      ≥$200 threshold • {incomingMoney.belowThresholdCount > 0 && `${incomingMoney.belowThresholdCount} below threshold • `}Max 20 days overdue
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

              {/* Incoming Money & Upcoming Expenses Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Cash Flow Details</h3>
                <p className="text-sm text-gray-600">Showing from 20 days overdue through all future invoices</p>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Incoming Money Detail */}
                  <Card className="border-2 border-green-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <span>Incoming Money</span>
                      </CardTitle>
                      <div className="text-sm text-gray-600">From 20 days overdue to all future invoices (≥$200 threshold)</div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b-2 border-green-200">
                          <span className="font-semibold text-gray-700">Total Expected</span>
                          <span className="text-xl font-bold text-green-700">
                            {formatCurrency(incomingMoney.total)}
                          </span>
                        </div>
                        
                        {invoicesData && invoicesData.length > 0 ? (
                          <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {invoicesData
                              .filter(invoice => {
                                if (!invoice || !invoice.DueDate) return false;
                                const today = new Date();
                                const dueDate = new Date(invoice.DueDate);
                                const twentyDaysAgo = subDays(today, 20);
                                // Show invoices from 20 days overdue to all future
                                return dueDate >= twentyDaysAgo;
                              })
                              .sort((a, b) => new Date(a.DueDate) - new Date(b.DueDate))
                              .map((invoice, index) => {
                                const amount = parseFloat(invoice.AmountDue?.replace(/[^0-9.-]+/g, '') || 0);
                                const dueDate = new Date(invoice.DueDate);
                                const daysUntil = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
                                const isBelowThreshold = amount < 200;
                                const isOverdue = daysUntil < 0;
                                
                                return (
                                  <div 
                                    key={index} 
                                    className={`flex justify-between items-start p-2 rounded text-xs ${
                                      isBelowThreshold 
                                        ? 'bg-gray-50 border border-gray-200 hover:bg-gray-100' 
                                        : isOverdue 
                                          ? 'bg-red-50 hover:bg-red-100'
                                          : 'hover:bg-green-50'
                                    }`}
                                  >
                                    <div className="flex-1">
                                      <div className={`font-medium ${isBelowThreshold ? 'text-gray-500' : isOverdue ? 'text-red-800' : 'text-gray-800'}`}>
                                        {invoice.Network || 'Unknown'}
                                        {isOverdue && !isBelowThreshold && (
                                          <span className="ml-2 text-xs text-red-600 font-semibold">
                                            🔴 Overdue
                                          </span>
                                        )}
                                        {isBelowThreshold && (
                                          <span className="ml-2 text-xs text-orange-600 font-normal">
                                            ⚠️ Below threshold
                                          </span>
                                        )}
                                      </div>
                                      <div className={isBelowThreshold ? 'text-gray-400' : isOverdue ? 'text-red-600' : 'text-gray-500'}>
                                        {format(dueDate, 'MMM dd, yyyy')}
                                        <span className={`ml-2 ${
                                          isOverdue 
                                            ? 'text-red-600 font-semibold' 
                                            : daysUntil <= 7 
                                              ? 'text-green-600 font-semibold' 
                                              : 'text-gray-400'
                                        }`}>
                                          ({Math.abs(daysUntil)} {isOverdue ? 'days overdue' : 'days'})
                                        </span>
                                      </div>
                                      {isBelowThreshold && (
                                        <div className="text-xs text-orange-600 italic mt-0.5">
                                          Likely won't be paid out
                                        </div>
                                      )}
                                    </div>
                                    <div className={`font-bold ${isBelowThreshold ? 'text-gray-400 line-through' : isOverdue ? 'text-red-700' : 'text-green-700'}`}>
                                      {formatCurrency(amount)}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-400 text-sm">
                            No invoices (max 20 days overdue, ≥$200 threshold)
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Upcoming Expenses Detail */}
                  <Card className="border-2 border-purple-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <Calendar className="h-5 w-5 text-purple-600" />
                        <span>Upcoming Expenses</span>
                      </CardTitle>
                      <div className="text-sm text-gray-600">Scheduled payments in the next 30 days</div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b-2 border-purple-200">
                          <span className="font-semibold text-gray-700">Total Due</span>
                          <span className="text-xl font-bold text-purple-700">
                            {formatCurrency(upcomingExpensesMetrics.total)}
                          </span>
                        </div>
                        
                        {upcomingExpenses && upcomingExpenses.length > 0 ? (
                          <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {upcomingExpenses
                              .map((expense, index) => {
                                // Handle both array and object formats
                                let category, description, amount, dateStr;
                                
                                if (Array.isArray(expense)) {
                                  category = expense[0] || 'Uncategorized';
                                  description = expense[1] || '';
                                  amount = parseFloat((expense[2] || '0').toString().replace(/[$,]/g, ''));
                                  dateStr = expense[3];
                                } else if (expense && typeof expense === 'object') {
                                  category = expense.Category || expense.status || 'Uncategorized';
                                  description = expense.Description || '';
                                  const amountValue = expense.Amount || expense.amount || 0;
                                  amount = parseFloat(amountValue.toString().replace(/[$,]/g, ''));
                                  dateStr = expense.Date || expense.dueDate;
                                } else {
                                  return null;
                                }
                                
                                if (!dateStr || isNaN(amount)) return null;
                                
                                const dueDate = new Date(dateStr);
                                if (isNaN(dueDate.getTime())) return null;
                                
                                const thirtyDaysFromNow = addDays(new Date(), 30);
                                if (dueDate > thirtyDaysFromNow) return null;
                                
                                const daysUntil = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
                                
                                return {
                                  index,
                                  category,
                                  description,
                                  amount,
                                  dueDate,
                                  daysUntil
                                };
                              })
                              .filter(Boolean)
                              .sort((a, b) => a.dueDate - b.dueDate)
                              .map((expense) => (
                                <div key={expense.index} className="flex justify-between items-start p-2 hover:bg-purple-50 rounded text-xs">
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-800">{expense.category}</div>
                                    <div className="text-gray-600 text-xs">{expense.description}</div>
                                    <div className="text-gray-500">
                                      {format(expense.dueDate, 'MMM dd, yyyy')}
                                      <span className={`ml-2 ${expense.daysUntil <= 7 ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                                        ({expense.daysUntil} days)
                                      </span>
                                    </div>
                                  </div>
                                  <div className="font-bold text-purple-700">
                                    {formatCurrency(expense.amount)}
                                  </div>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-400 text-sm">
                            No expenses scheduled in the next 30 days
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Calendar View */}
                <Card className="border-2 border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <span>30-Day Cash Flow Calendar</span>
                    </CardTitle>
                    <div className="text-sm text-gray-600">Visual timeline of incoming (≥$200, max 20 days overdue) and outgoing cash</div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-1">
                        {/* Day headers */}
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                          <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
                            {day}
                          </div>
                        ))}
                        
                        {/* Calendar days */}
                        {(() => {
                          const today = new Date();
                          const startDate = startOfMonth(today);
                          const endDate = endOfMonth(addDays(today, 30));
                          const days = eachDayOfInterval({ start: startDate, end: endDate });
                          
                          return days.map((day, index) => {
                            const isInRange = day >= today && day <= addDays(today, 30);
                            const isCurrentMonth = isSameMonth(day, today);
                            
                            // Calculate incoming and outgoing for this day
                            let incoming = 0;
                            let outgoing = 0;
                            
                            // Check invoices (max 20 days overdue and below $200 threshold excluded)
                            if (invoicesData) {
                              const twentyDaysAgo = subDays(new Date(), 20);
                              invoicesData.forEach(invoice => {
                                if (invoice && invoice.DueDate) {
                                  const dueDate = new Date(invoice.DueDate);
                                  if (isSameDay(dueDate, day) && dueDate >= twentyDaysAgo) {
                                    const amount = parseFloat(invoice.AmountDue?.replace(/[^0-9.-]+/g, '') || 0);
                                    // Only count invoices >= $200 threshold
                                    if (amount >= 200) {
                                      incoming += amount;
                                    }
                                  }
                                }
                              });
                            }
                            
                            // Check expenses
                            if (upcomingExpenses) {
                              upcomingExpenses.forEach(expense => {
                                let dateStr;
                                let amount;
                                
                                if (Array.isArray(expense)) {
                                  dateStr = expense[3];
                                  amount = parseFloat((expense[2] || '0').toString().replace(/[$,]/g, ''));
                                } else if (expense && typeof expense === 'object') {
                                  dateStr = expense.Date || expense.dueDate;
                                  const amountValue = expense.Amount || expense.amount || 0;
                                  amount = parseFloat(amountValue.toString().replace(/[$,]/g, ''));
                                }
                                
                                if (dateStr && !isNaN(amount)) {
                                  const dueDate = new Date(dateStr);
                                  if (!isNaN(dueDate.getTime()) && isSameDay(dueDate, day)) {
                                    outgoing += amount;
                                  }
                                }
                              });
                            }
                            
                            const netFlow = incoming - outgoing;
                            const hasActivity = incoming > 0 || outgoing > 0;
                            
                            return (
                              <div
                                key={index}
                                className={`
                                  min-h-[60px] p-1 border rounded text-xs
                                  ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''}
                                  ${isToday(day) ? 'border-2 border-blue-500 bg-blue-50' : 'border-gray-200'}
                                  ${isInRange && hasActivity && netFlow > 0 ? 'bg-green-50' : ''}
                                  ${isInRange && hasActivity && netFlow < 0 ? 'bg-red-50' : ''}
                                  ${isInRange && hasActivity && netFlow === 0 ? 'bg-yellow-50' : ''}
                                `}
                              >
                                <div className={`font-semibold ${isToday(day) ? 'text-blue-700' : ''}`}>
                                  {format(day, 'd')}
                                </div>
                                {hasActivity && isInRange && (
                                  <div className="mt-1 space-y-0.5">
                                    {incoming > 0 && (
                                      <div className="text-green-700 font-bold" title={`Incoming: ${formatCurrency(incoming)}`}>
                                        +{formatCurrency(incoming).replace('$', '')}
                                      </div>
                                    )}
                                    {outgoing > 0 && (
                                      <div className="text-red-700 font-bold" title={`Outgoing: ${formatCurrency(outgoing)}`}>
                                        -{formatCurrency(outgoing).replace('$', '')}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>
                      
                      {/* Legend */}
                      <div className="flex justify-center space-x-4 text-xs pt-3 border-t">
                        <div className="flex items-center space-x-1">
                          <div className="w-4 h-4 bg-green-50 border border-gray-300 rounded"></div>
                          <span>Positive Net Flow</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-4 h-4 bg-red-50 border border-gray-300 rounded"></div>
                          <span>Negative Net Flow</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-4 h-4 bg-blue-50 border-2 border-blue-500 rounded"></div>
                          <span>Today</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cash in Bank Account Balance Projection */}
              {(() => {
                // Get Cash in Bank balance from cashFlowData
                // This comes from B4 cell in Financial Resources sheet
                let currentBalance = 0;
                
                // Try to get from directCells.cashInBank first (B4 specifically)
                if (cashFlowData?.directCells?.cashInBank) {
                  currentBalance = parseFloat(cashFlowData.directCells.cashInBank) || 0;
                  console.log('Using cashInBank from directCells (B4):', currentBalance);
                } 
                // Fallback to cashAvailable (B4 + B6)
                else if (cashFlowData?.directCells?.cashAvailable) {
                  currentBalance = parseFloat(cashFlowData.directCells.cashAvailable) || 0;
                  console.log('Using cashAvailable from directCells:', currentBalance);
                }
                // Try cashAccounts array
                else if (cashFlowData?.financialResources?.cashAccounts?.length > 0) {
                  const cashAccount = cashFlowData.financialResources.cashAccounts.find(
                    acc => acc.account && acc.account.toLowerCase().includes('cash in bank')
                  );
                  if (cashAccount) {
                    currentBalance = parseFloat(cashAccount.available?.toString().replace(/[^0-9.-]+/g, '') || 0);
                    console.log('Using Cash in Bank from cashAccounts:', currentBalance);
                  }
                }
                // Fallback to totalCash
                else if (cashFlowData?.financialResources?.totalCash) {
                  currentBalance = parseFloat(cashFlowData.financialResources.totalCash) || 0;
                  console.log('Using totalCash:', currentBalance);
                }
                
                console.log('Final currentBalance for projection:', currentBalance);

                if (currentBalance === 0 || !cashFlowData) {
                  return (
                    <Card className="border-2 border-orange-200">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <TrendingUp className="h-5 w-5 text-orange-600" />
                          <span>Cash in Bank Balance Projection</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-8 text-gray-500">
                          <div className="mb-4">Unable to load Cash in Bank balance</div>
                          <div className="text-sm text-gray-600">
                            Please check that the Financial Resources sheet has data in cell B4
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }

                // Build daily projection for next 30 days
                const projectionData = [];
                const today = new Date();
                let runningBalance = currentBalance;

                for (let i = 0; i <= 30; i++) {
                  const projectionDate = addDays(today, i);
                  let dailyIncoming = 0;
                  let dailyOutgoing = 0;

                  // Calculate incoming for this day (from invoices ≥$200)
                  if (invoicesData) {
                    const twentyDaysAgo = subDays(today, 20);
                    invoicesData.forEach(invoice => {
                      if (invoice && invoice.DueDate) {
                        const dueDate = new Date(invoice.DueDate);
                        if (isSameDay(dueDate, projectionDate) && dueDate >= twentyDaysAgo) {
                          const amount = parseFloat(invoice.AmountDue?.replace(/[^0-9.-]+/g, '') || 0);
                          if (amount >= 200) {
                            dailyIncoming += amount;
                          }
                        }
                      }
                    });
                  }

                  // Calculate outgoing for this day (from expenses)
                  if (upcomingExpenses) {
                    upcomingExpenses.forEach(expense => {
                      let dateStr;
                      let amount;

                      if (Array.isArray(expense)) {
                        dateStr = expense[3];
                        amount = parseFloat((expense[2] || '0').toString().replace(/[$,]/g, ''));
                      } else if (expense && typeof expense === 'object') {
                        dateStr = expense.Date || expense.dueDate;
                        const amountValue = expense.Amount || expense.amount || 0;
                        amount = parseFloat(amountValue.toString().replace(/[$,]/g, ''));
                      }

                      if (dateStr && !isNaN(amount)) {
                        const dueDate = new Date(dateStr);
                        if (!isNaN(dueDate.getTime()) && isSameDay(dueDate, projectionDate)) {
                          dailyOutgoing += amount;
                        }
                      }
                    });
                  }

                  // Update running balance
                  runningBalance += dailyIncoming - dailyOutgoing;

                  projectionData.push({
                    date: format(projectionDate, 'MMM dd'),
                    fullDate: format(projectionDate, 'MMM dd, yyyy'),
                    balance: Math.round(runningBalance),
                    incoming: Math.round(dailyIncoming),
                    outgoing: Math.round(dailyOutgoing),
                    netChange: Math.round(dailyIncoming - dailyOutgoing),
                    dayNumber: i
                  });
                }

                const lowestBalance = Math.min(...projectionData.map(d => d.balance));
                const highestBalance = Math.max(...projectionData.map(d => d.balance));

                return (
                  <Card className="border-2 border-blue-200">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        <span>Cash in Bank Balance Projection</span>
                      </CardTitle>
                      <div className="text-sm text-gray-600 mt-1">
                        30-day projection based on incoming invoices (≥$200) and upcoming expenses
                      </div>
                      <div className="flex items-center space-x-6 mt-3">
                        <div>
                          <div className="text-xs text-gray-600">Current Balance</div>
                          <div className="text-xl font-bold text-blue-700">{formatCurrency(currentBalance)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600">Projected (Day 30)</div>
                          <div className={`text-xl font-bold ${projectionData[30].balance >= currentBalance ? 'text-green-700' : 'text-red-700'}`}>
                            {formatCurrency(projectionData[30].balance)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600">Net Change</div>
                          <div className={`text-xl font-bold ${projectionData[30].netChange >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {projectionData[30].balance >= currentBalance ? '+' : ''}{formatCurrency(projectionData[30].balance - currentBalance)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600">Lowest Point</div>
                          <div className={`text-lg font-bold ${lowestBalance < 0 ? 'text-red-700' : 'text-orange-700'}`}>
                            {formatCurrency(lowestBalance)}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={projectionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#666"
                            style={{ fontSize: '12px' }}
                          />
                          <YAxis 
                            stroke="#666"
                            style={{ fontSize: '12px' }}
                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #ccc',
                              borderRadius: '8px',
                              padding: '12px'
                            }}
                            formatter={(value, name) => {
                              if (name === 'balance') return [formatCurrency(value), 'Balance'];
                              if (name === 'incoming') return [formatCurrency(value), 'Incoming'];
                              if (name === 'outgoing') return [formatCurrency(value), 'Outgoing'];
                              return [formatCurrency(value), name];
                            }}
                            labelFormatter={(label) => {
                              const dataPoint = projectionData.find(d => d.date === label);
                              return dataPoint ? dataPoint.fullDate : label;
                            }}
                          />
                          <Legend 
                            wrapperStyle={{ paddingTop: '20px' }}
                            iconType="line"
                          />
                          <ReferenceLine 
                            y={0} 
                            stroke="red" 
                            strokeDasharray="3 3" 
                            label={{ value: 'Zero', position: 'right', fill: 'red', fontSize: 12 }}
                          />
                          <ReferenceLine 
                            y={currentBalance} 
                            stroke="blue" 
                            strokeDasharray="3 3"
                            label={{ value: 'Current', position: 'right', fill: 'blue', fontSize: 12 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="balance" 
                            stroke="#2563eb" 
                            strokeWidth={3}
                            dot={{ fill: '#2563eb', r: 4 }}
                            activeDot={{ r: 6 }}
                            name="Account Balance"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="incoming" 
                            stroke="#16a34a" 
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={false}
                            name="Incoming"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="outgoing" 
                            stroke="#dc2626" 
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={false}
                            name="Outgoing"
                          />
                        </LineChart>
                      </ResponsiveContainer>

                      {/* Warning if balance goes negative */}
                      {lowestBalance < 0 && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                            <div>
                              <div className="font-semibold text-red-800">Cash Flow Warning</div>
                              <div className="text-sm text-red-700">
                                Account balance is projected to go negative (lowest: {formatCurrency(lowestBalance)}) during this period. 
                                Consider adjusting spending or accelerating collections.
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Info about projection */}
                      <div className="mt-4 text-xs text-gray-500 text-center">
                        <p>Projection includes invoices ≥$200 (max 20 days overdue) and all scheduled expenses.</p>
                        <p>Actual balance may vary based on payment timing and unscheduled transactions.</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CashFlowPlanner;