import { google } from 'googleapis';
import { processCashFlowData } from '@/lib/cash-flow-processor';
import _ from 'lodash';

async function processPLData(batchResponse) {
  try {
    const valueRanges = batchResponse.data.valueRanges;
    const monthlyData = {};
    const summaryData = [];

    // Get the Summary sheet data
    const summarySheet = valueRanges.find(range => range.range.includes('Summary'));
    console.log('Summary sheet data:', summarySheet?.values);

    if (!summarySheet?.values) {
      console.error('No summary sheet data found');
      return { summary: [], monthly: {} };
    }

    // Process summary data
    const summaryRows = summarySheet.values.slice(1).filter(row => row.length);
    summaryRows.forEach(row => {
      summaryData.push({
        Month: row[0] || '',
        Income: parseFloat((row[1] || '0').replace(/[$,]/g, '')),
        Cash_Injection: parseFloat((row[2] || '0').replace(/[$,]/g, '')),
        Payroll: parseFloat((row[3] || '0').replace(/[$,]/g, '')),
        Advertising: parseFloat((row[4] || '0').replace(/[$,]/g, '')),
        Software: parseFloat((row[5] || '0').replace(/[$,]/g, '')),
        Training: parseFloat((row[6] || '0').replace(/[$,]/g, '')),
        Once_Off: parseFloat((row[7] || '0').replace(/[$,]/g, '')),
        Memberships: parseFloat((row[8] || '0').replace(/[$,]/g, '')),
        Contractors: parseFloat((row[9] || '0').replace(/[$,]/g, '')),
        Tax: parseFloat((row[10] || '0').replace(/[$,]/g, '')),
        Bank_Fees: parseFloat((row[11] || '0').replace(/[$,]/g, '')),
        Utilities: parseFloat((row[12] || '0').replace(/[$,]/g, '')),
        Travel: parseFloat((row[13] || '0').replace(/[$,]/g, '')),
        Capital_One: parseFloat((row[14] || '0').replace(/[$,]/g, '')),
        Barclay: parseFloat((row[15] || '0').replace(/[$,]/g, '')),
        Business_Loan: parseFloat((row[16] || '0').replace(/[$,]/g, '')),
        'Unknown Expense': parseFloat((row[17] || '0').replace(/[$,]/g, '')),
        Net_Rev: parseFloat((row[18] || '0').replace(/[$,]/g, '')),
        'Net%': row[19] ? row[19].replace('%', '') : '0'
      });
    });

    // Process monthly detail sheets
    const monthSheets = valueRanges.filter(range => {
      const isMonthSheet = /^(June|July|August|September|October|November|December)!/.test(range.range);
      console.log('Checking range:', range.range, 'isMonthSheet:', isMonthSheet);
      return isMonthSheet;
    });

    console.log('Found month sheets:', monthSheets.map(sheet => sheet.range));

    monthSheets.forEach(monthSheet => {
      const monthName = monthSheet.range.split('!')[0];
      console.log('Processing month:', monthName);
      
      if (monthSheet.values) {
        const headers = monthSheet.values[0] || [];
        const monthlyRows = monthSheet.values.slice(1).map(row => ({
          DESCRIPTION: row[0] || '',
          AMOUNT: row[1] || '',
          CATEGORY: row[2] || '',
          'Income/Expense': row[3] || ''
        }));

        monthlyData[monthName] = {
          rows: monthlyRows,
          totalExpenses: monthlyRows
            .filter(row => row['Income/Expense'] === 'Expense')
            .reduce((sum, row) => sum + parseFloat((row.AMOUNT || '0').replace(/[$,]/g, '')), 0)
        };
      } else {
        console.log('No values found for month:', monthName);
      }
    });

    // Log the final monthly data structure
    console.log('Processed monthly data:', Object.keys(monthlyData));

    console.log('Processed P&L data:', { summary: summaryData, monthly: monthlyData });
    return { summary: summaryData, monthly: monthlyData };
  } catch (error) {
    console.error('Error processing P&L data:', error);
    return { summary: [], monthly: {} };
  }
}

async function processBankStructureData(bankStructureResponse) {
  try {
    if (!bankStructureResponse?.values || bankStructureResponse.values.length < 2) {
      console.log('Bank Structure Response:', bankStructureResponse?.values);
      return null;
    }

    // Skip header row and get data row
    const data = bankStructureResponse.values[1];
    console.log('Bank Structure Data Row:', data);
    
    const processed = {
      operatingMin: parseFloat((data[2] || '0').replace(/[$,]/g, '')),
      operatingIdeal: parseFloat((data[3] || '0').replace(/[$,]/g, '')),
      taxReservePercent: 0.25,
      emergencyMin: parseFloat((data[4] || '0').replace(/[$,]/g, '')),
      emergencyIdeal: parseFloat((data[5] || '0').replace(/[$,]/g, '')),
      growthFundPercent: 0.30
    };

    console.log('Processed Bank Structure:', processed);
    return processed;
  } catch (error) {
    console.error('Error processing bank structure data:', error);
    return null;
  }
}

export default async function handler(req, res) {
  try {
    // Add request method check
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // Log the spreadsheet ID
    console.log('Spreadsheet ID:', process.env.SHEET_ID);

    // Log the ranges we're requesting
    console.log('Requesting sheet ranges:', [
      'Main Sheet!A:L',
      'Financial Resources!A:D',
      'Payroll!A:D',
      'Media Buyer Spend!A:B',
      'Summary!A:U',
      'Bank Structure!A:M',
      'Network Payment Schedule!A:H',
      'Invoices!A:G',
      'December!A:D',
      'November!A:D',
      'October!A:D',
      'September!A:D',
      'August!A:D',
      'July!A:D',
      'June!A:D',
      "'Network Terms'!A2:I"
    ]);

    const batchResponse = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: process.env.SHEET_ID,
      ranges: [
        'Main Sheet!A:L',
        'Financial Resources!A:D',
        'Payroll!A:D',
        'Media Buyer Spend!A:B',
        'Summary!A:U',
        'Bank Structure!A:M',
        'Network Payment Schedule!A:H',
        'Invoices!A:G',
        'December!A:D',
        'November!A:D',
        'October!A:D',
        'September!A:D',
        'August!A:D',
        'July!A:D',
        'June!A:D',
        "'Network Terms'!A2:I",
      ],
    });

    // Log the full response structure
    console.log('Batch response ranges:', {
      totalRanges: batchResponse.data.valueRanges.length,
      ranges: batchResponse.data.valueRanges.map(range => ({
        range: range.range,
        hasValues: !!range.values,
        rowCount: range?.values?.length
      }))
    });

    // Find Network Terms data
    const networkTermsResponse = batchResponse.data.valueRanges.find(
      range => range.range.includes('Network Terms')
    );

    console.log('Network Terms Response:', {
      found: !!networkTermsResponse,
      range: networkTermsResponse?.range,
      hasValues: !!networkTermsResponse?.values,
      valueCount: networkTermsResponse?.values?.length,
      values: networkTermsResponse?.values
    });

    // Extract array positions for debugging
    const [
      mainResponse,
      financialResponse,
      payrollResponse,
      mediaBuyerResponse,
      summaryResponse,
      bankStructureResponse,
      networkPaymentsResponse,
      invoicesResponse,
      decemberResponse,
      novemberResponse,
      octoberResponse,
      septemberResponse,
      augustResponse,
      julyResponse,
      juneResponse,
      networkTermsResponse2,
    ] = batchResponse.data.valueRanges || [];

    console.log('Array position check:', {
      networkTermsPosition: batchResponse.data.valueRanges.length - 1,
      lastItem: networkTermsResponse2?.range,
      hasValues: !!networkTermsResponse2?.values,
      valueCount: networkTermsResponse2?.values?.length
    });

    // Add this logging
    console.log('Raw invoices response:', {
      range: invoicesResponse?.range,
      hasValues: !!invoicesResponse?.values,
      rowCount: invoicesResponse?.values?.length,
      firstRow: invoicesResponse?.values?.[0],
      secondRow: invoicesResponse?.values?.[1]
    });

    // Initialize result object with empty arrays
    let result = {
      performanceData: [],
      cashFlowData: {},
      networkPaymentsData: [],
      plData: {},
      rawData: {
        financialResources: [],
        invoices: [],
        payroll: [],
        mediaBuyerSpend: [],
      },
      networkTerms: []
    };

    // Process Financial Resources
    try {
      const financialResourcesResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: 'Financial Resources!A:D',
        valueRenderOption: 'UNFORMATTED_VALUE'  // Get raw values
      });

      // Add error checking and logging
      if (!financialResourcesResponse?.data?.values) {
        console.error('No financial resources data received');
        result.rawData.financialResources = [];
        result.cashFlowData = {
          availableCash: 0,
          creditAvailable: 0,
          totalAvailable: 0,
          financialResources: []
        };
      } else {
        // Process the financial resources
        result.rawData.financialResources = financialResourcesResponse.data.values
          .slice(1)  // Skip header row
          .filter(row => row[0] && row[0] !== 'Account Name')
          .map(row => ({
            account: row[0]?.trim(),
            available: parseFloat((row[1] || '0').toString().replace(/[$,]/g, '')),
            owing: parseFloat((row[2] || '0').toString().replace(/[$,]/g, '')),
            limit: parseFloat((row[3] || '0').toString().replace(/[$,]/g, ''))
          }));

        // Calculate the totals for Available Resources
        const cashAccounts = ['Cash in Bank', 'Slash Account', 'Business Savings (JP MORGAN)'];

        result.cashFlowData = {
          availableCash: result.rawData.financialResources
            .filter(r => cashAccounts.includes(r.account))
            .reduce((sum, r) => sum + r.available, 0),
          creditAvailable: result.rawData.financialResources
            .filter(r => !cashAccounts.includes(r.account))
            .reduce((sum, r) => sum + r.available, 0),
          financialResources: result.rawData.financialResources
        };

        result.cashFlowData.totalAvailable = result.cashFlowData.availableCash + result.cashFlowData.creditAvailable;
      }
    } catch (error) {
      console.error('Error processing financial resources:', error);
      result.rawData.financialResources = [];
      result.cashFlowData = {
        availableCash: 0,
        creditAvailable: 0,
        totalAvailable: 0,
        financialResources: []
      };
    }

    // Process Invoices
    result.rawData.invoices = Array.isArray(invoicesResponse?.values)
      ? invoicesResponse.values.slice(1).map(row => ({
          Network: row[0]?.trim() || '',
          PeriodStart: row[1]?.trim() || '',
          PeriodEnd: row[2]?.trim() || '',
          DueDate: row[3]?.trim() || '',
          Amount: parseFloat((row[4] || '0').replace(/[$,]/g, '')),
          InvoiceNumber: row[5]?.trim() || '',
          Status: row[6]?.trim() || 'Unpaid'
        }))
      : [];

    console.log('Processed invoices:', result.rawData.invoices);

    // Process Payroll
    result.rawData.payroll = Array.isArray(payrollResponse?.values)
      ? payrollResponse.values.slice(1).map(row => ({
          Type: row[0]?.trim() || '',
          Description: row[1]?.trim() || '',
          Amount: parseFloat((row[2] || '0').replace(/[$,]/g, '')),
          DueDate: row[3]?.trim() || ''
        }))
      : [];

    // Process Media Buyer Spend
    result.rawData.mediaBuyerSpend = mediaBuyerResponse?.values || [];

    // Process P&L Data
    result.plData = await processPLData(batchResponse);

    // Process performance data
    if (mainResponse?.values) {
      const headers = mainResponse.values[0];
      
      // Log the raw data distribution
      console.log('Raw Data Analysis:', {
        totalRows: mainResponse.values.length,
        rowLengths: mainResponse.values.slice(1).reduce((acc, row) => {
          acc[row.length] = (acc[row.length] || 0) + 1;
          return acc;
        }, {}),
        dateRange: {
          first: mainResponse.values[1]?.[0],
          last: mainResponse.values[mainResponse.values.length - 1]?.[0]
        }
      });

      const performanceData = mainResponse.values
        .slice(1)  // Skip header row
        .map((row) => {
          // Log any potentially problematic rows
          if (row.length < 10) {
            console.log('Short row:', { length: row.length, data: row });
          }

          const processed = {
            Date: row[0] || '',
            Network: row[1] || '',
            Offer: row[2] || '',
            'Media Buyer': row[3] || '',
            'Ad Spend': parseFloat((row[4] || '0').replace(/[$,]/g, '')) || 0,
            'Ad Revenue': parseFloat((row[5] || '0').replace(/[$,]/g, '')) || 0,
            'Comment Revenue': parseFloat((row[6] || '0').replace(/[$,]/g, '')) || 0,
            'Total Revenue': parseFloat((row[7] || '0').replace(/[$,]/g, '')) || 0,
            Margin: parseFloat((row[8] || '0').replace(/[$,]/g, '')) || 0,
            'Expected Payment': row[9] || '',
            'Running Balance': parseFloat((row[10] || '0').replace(/[$,]/g, '')) || 0,
          };
          return processed;
        })
        .filter(row => row.Date); // Only filter out rows without dates

      result.performanceData = performanceData;
    }
    if (invoicesResponse?.values) {
      result.rawData.invoices = invoicesResponse.values.slice(1)
        .filter(row => row.length >= 7)
        .map(row => ({
          Network: row[0],
          PeriodStart: row[1],
          PeriodEnd: row[2],
          DueDate: row[3],
          Amount: parseFloat((row[4] || '0').replace(/[$,]/g, '')),
          InvoiceNumber: row[5],
          Status: row[6] || 'Unpaid'
        }));
    }


    // Process Network Payments
    const networkPayments = Array.isArray(networkPaymentsResponse?.values)
      ? networkPaymentsResponse.values.slice(1).map(row => ({
          network: row[0]?.trim() || '',
          offer: row[1]?.trim() || '',
          paymentTerms: row[2]?.trim() || '',
          dailyCap: parseFloat((row[3] || '0').replace(/[$,]/g, '')),
          dailyBudget: parseFloat((row[4] || '0').replace(/[$,]/g, '')),
          currentExposure: parseFloat((row[5] || '0').replace(/[$,]/g, '')),
          availableBudget: parseFloat((row[6] || '0').replace(/[$,]/g, '')),
          riskLevel: row[7]?.trim() || ''  // Ensure this has a default value
        }))
      : [];

    // Add it to the result
    result.networkPaymentsData = networkPayments;

    // Process Network Terms data with validation
    const networkTerms = networkTermsResponse2?.values?.map(row => {
      if (!row || row.length < 9) {
        console.log('Skipping invalid row:', row);
        return null;
      }

      const runningTotal = parseFloat((row[7] || '0').replace(/[$,]/g, ''));
      
      // Skip if running total is 0
      if (runningTotal <= 0) {
        return null;
      }

      // Get the last date from performance data
      const lastDate = mainResponse?.values
        ?.slice(1) // Skip header row
        ?.sort((a, b) => new Date(b[0]) - new Date(a[0]))?.[0]?.[0];

      // Get spend for the last date for this network-offer combination
      const lastDateSpend = mainResponse?.values
        ?.filter(perfRow => 
          perfRow[0] === lastDate && 
          perfRow[1] === row[0]?.trim() && // network
          perfRow[2] === row[1]?.trim()    // offer
        )
        ?.reduce((sum, perfRow) => {
          const spend = parseFloat(perfRow[4]?.replace(/[$,]/g, '') || '0');
          return sum + (isNaN(spend) ? 0 : spend);
        }, 0) || 0;

      // Calculate cap utilization
      const dailyCap = row[8] === 'Uncapped' ? null : 
                      row[8] === 'N/A' ? null :
                      row[8] === 'TBC' ? null :
                      parseFloat((row[8] || '0').replace(/[$,]/g, ''));
      
      // Only calculate utilization if we have a valid daily cap
      const capUtilization = (dailyCap && dailyCap > 0) 
        ? (lastDateSpend / dailyCap * 100)
        : null;

      return {
        network: row[0]?.trim() || '',
        offer: row[1]?.trim() || '',
        payPeriod: row[2]?.trim() || '',
        netTerms: row[3]?.trim() || '',
        periodStart: row[4]?.trim() || '',
        periodEnd: row[5]?.trim() || '',
        invoiceDue: row[6]?.trim() || '',
        runningTotal,
        dailyCap: row[8] === 'Uncapped' ? 'Uncapped' : 
                 row[8] === 'N/A' ? 'N/A' :
                 row[8] === 'TBC' ? 'TBC' :
                 dailyCap,
        lastDateSpend: lastDateSpend || 0,
        capUtilization: capUtilization,
        lastDate // Include the date for reference
      };
    }).filter(Boolean);

    // Sort by running total
    networkTerms?.sort((a, b) => b.runningTotal - a.runningTotal);

    console.log('Final Network Terms:', {
      count: networkTerms?.length || 0,
      sample: networkTerms?.[0],
      allData: networkTerms
    });

    // Add to result
    result.networkTerms = networkTerms || [];

    // Log final result structure
    console.log('API Response Structure:', {
      hasNetworkTerms: !!result.networkTerms,
      networkTermsCount: result.networkTerms.length,
      allKeys: Object.keys(result)
    });

    // In your API route where you first get the data from Google Sheets
    console.log('Raw Sheet Response:', {
      totalRows: mainResponse?.values?.length,
      firstRow: mainResponse?.values?.[1],
      lastRow: mainResponse?.values?.[mainResponse?.values?.length - 1],
      dateRange: {
        first: mainResponse?.values?.[1]?.[0],
        last: mainResponse?.values?.[mainResponse?.values?.length - 1]?.[0]
      }
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Server Error', details: error.message });
  }
}
