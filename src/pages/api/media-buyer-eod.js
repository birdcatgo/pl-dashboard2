export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const MONDAY_API_TOKEN = process.env.MONDAY_API_TOKEN;

    if (!MONDAY_API_TOKEN) {
      return res.status(500).json({ error: 'Monday.com API token not configured' });
    }

    // Media buyer board configurations
    const mediaBuyerBoards = [
      { name: 'Mike', boardId: '6246187884' },
      { name: 'Sam', boardId: '8723102608' },
      { name: 'Daniel', boardId: '8755928304' },
      { name: 'Bikki', boardId: '8723232910' },
      { name: 'Rutvik', boardId: '8758397188' },
      { name: 'Aakash', boardId: '8758417073' },
      { name: 'Emil', boardId: '8758377191' },
      { name: 'Ishaan', boardId: '8723210527' }
    ];

    // First, get the EOD report data for comparison
    let latestEODDate = null;
    let eodData = [];
    try {
      // Check cache first
      const eodCacheKey = 'eod_report_data';
      const cachedEODData = global[eodCacheKey];
      const eodCacheTime = global[`${eodCacheKey}_time`];
      
      // Use cache if it's less than 5 minutes old
      if (cachedEODData && eodCacheTime && (Date.now() - eodCacheTime) < 5 * 60 * 1000) {
        console.log('Using cached EOD data');
        latestEODDate = cachedEODData.latestEODDate;
        eodData = cachedEODData.eodData || [];
      } else {
        const eodResponse = await fetch('http://localhost:3000/api/eod-report-data');
        if (eodResponse.ok) {
          const eodResponseData = await eodResponse.json();
          latestEODDate = eodResponseData.latestEODDate;
          eodData = eodResponseData.eodData || [];
          
          // Update cache
          global[eodCacheKey] = eodResponseData;
          global[`${eodCacheKey}_time`] = Date.now();
        }
      }
      console.log('Latest EOD report date for comparison:', latestEODDate);
      console.log('EOD data items for comparison:', eodData.length);
    } catch (eodError) {
      console.error('Error fetching EOD report data for comparison:', eodError);
    }

    // Helper function to fetch data for a single buyer
    const fetchBuyerData = async (buyer) => {
      try {
        console.log(`Fetching data for ${buyer.name} (Board: ${buyer.boardId})`);

        // Check cache first
        const cacheKey = `monday_board_${buyer.boardId}`;
        const cachedData = global[cacheKey];
        const cacheTime = global[`${cacheKey}_time`];
        
        // Use cache if it's less than 5 minutes old
        if (cachedData && cacheTime && (Date.now() - cacheTime) < 5 * 60 * 1000) {
          console.log(`Using cached data for ${buyer.name}`);
          return cachedData;
        }

        // GraphQL query to fetch items with subitems
        const query = `
          query {
            boards(ids: ${buyer.boardId}) {
              items_page(limit: 50) {
                items {
                  id
                  name
                  column_values {
                    id
                    type
                    value
                    text
                  }
                  subitems {
                    id
                    name
                    column_values {
                      id
                      type
                      value
                      text
                    }
                  }
                }
              }
            }
          }
        `;

        const response = await fetch('https://api.monday.com/v2', {
          method: 'POST',
          headers: {
            'Authorization': MONDAY_API_TOKEN,
            'Content-Type': 'application/json',
            'API-Version': '2023-10'
          },
          body: JSON.stringify({ query })
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.errors) {
          throw new Error('Monday.com API returned errors');
        }

        // Update cache
        global[cacheKey] = data;
        global[`${cacheKey}_time`] = Date.now();
        
        return data;
      } catch (error) {
        console.error(`Error fetching data for ${buyer.name}:`, error);
        return {
          name: buyer.name,
          boardId: buyer.boardId,
          error: error.message,
          items: []
        };
      }
    };

    // Fetch all media buyer data in parallel
    const buyerDataPromises = mediaBuyerBoards.map(buyer => fetchBuyerData(buyer));
    const buyerDataResults = await Promise.all(buyerDataPromises);

    const results = buyerDataResults.map((data, index) => {
      const buyer = mediaBuyerBoards[index];
      
      try {
        if (data.error) {
          return {
            name: buyer.name,
            boardId: buyer.boardId,
            error: data.error,
            items: []
          };
        }

        const items = data.data.boards[0]?.items_page?.items || [];
        
        // Process items to find the most recent day and extract subitems
        const processedItems = items.map(item => {
          // Look for date-related columns
          const dateColumn = item.column_values.find(col => 
            col.type === 'date' || 
            col.type === 'timeline' ||
            col.id === 'date' ||
            col.id === 'timeline__1' ||
            col.id === 'date4'
          );

          // Extract subitems with the specific columns we need
          const processedSubitems = item.subitems?.map(subitem => {
            // Get all dropdown columns and sort them by position to find vertical/network
            const dropdownColumns = subitem.column_values.filter(col => col.type === 'dropdown' && col.text);
            
            // First dropdown column is usually vertical, second is usually network
            // Ad Account is the dropdown with id 'dropdown'
            const adAccountColumn = subitem.column_values.find(col => 
              col.id === 'dropdown' && col.type === 'dropdown'
            );
            
            // Remove ad account from other dropdowns to get vertical/network
            const otherDropdowns = dropdownColumns.filter(col => col.id !== 'dropdown');
            
            // Assign based on typical patterns or position
            let verticalColumn = null;
            let networkColumn = null;
            
            if (otherDropdowns.length >= 2) {
              // Usually first dropdown is vertical, second is network
              verticalColumn = otherDropdowns[0];
              networkColumn = otherDropdowns[1];
            } else if (otherDropdowns.length === 1) {
              // If only one, assume it's vertical
              verticalColumn = otherDropdowns[0];
            } else {
              // Fallback: Check for status columns (like Mike's board)
              const statusColumns = subitem.column_values.filter(col => col.type === 'status' && col.text);
              if (statusColumns.length >= 2) {
                verticalColumn = statusColumns[0]; // status8 is usually vertical
                networkColumn = statusColumns[1];  // status2 is usually network
              } else if (statusColumns.length === 1) {
                verticalColumn = statusColumns[0];
              }
            }
            
            // Fanpage Name is in the text column
            const fanpageNameColumn = subitem.column_values.find(col => 
              col.id === 'text' && col.type === 'text'
            );
            
            // Revenue is usually in numbers4 column
            const adRevColumn = subitem.column_values.find(col => 
              col.id === 'numbers4' && col.type === 'numbers'
            );
            
            // Spend is usually in numbers column
            const adSpendColumn = subitem.column_values.find(col => 
              col.id === 'numbers' && col.type === 'numbers'
            );

            return {
              id: subitem.id,
              name: subitem.name,
              vertical: verticalColumn?.text || 'N/A',
              network: networkColumn?.text || 'N/A',
              adAccount: adAccountColumn?.text || 'N/A',
              fanpageName: fanpageNameColumn?.text || 'N/A',
              offer: verticalColumn?.text || 'N/A', // Use vertical as offer for now
              adRev: adRevColumn?.text || 'N/A',
              adSpend: adSpendColumn?.text || 'N/A',
              rawColumns: subitem.column_values.map(col => ({
                id: col.id,
                type: col.type,
                text: col.text,
                value: col.value
              }))
            };
          }) || [];

          return {
            id: item.id,
            name: item.name,
            date: dateColumn?.text || 'No date',
            rawDateValue: dateColumn?.value || null,
            subitems: processedSubitems,
            subitemCount: processedSubitems.length
          };
        });

        // Sort items by date to find the most recent
        const sortedItems = processedItems.sort((a, b) => {
          const dateA = a.rawDateValue ? new Date(JSON.parse(a.rawDateValue).date) : new Date(0);
          const dateB = b.rawDateValue ? new Date(JSON.parse(b.rawDateValue).date) : new Date(0);
          return dateB - dateA; // Most recent first
        });

        const mostRecentItem = sortedItems[0];
        
        // Check if the media buyer's latest date matches the EOD report date
        const isCompleted = latestEODDate && mostRecentItem?.date && 
                           mostRecentItem.date.includes(latestEODDate.split(' ')[0]); // Compare date part only

        // Create comparison data with latest available data (regardless of date match)
        const comparisonData = [];
        const datesMatch = isCompleted;
        
        if (mostRecentItem?.subitems && eodData.length > 0) {
          mostRecentItem.subitems.forEach(subitem => {
            // Try to find matching EOD item based on Media Buyer + Ad Account + Network + Offer
            console.log(`Looking for match for ${buyer.name}'s item:`, {
              name: subitem.name,
              adAccount: subitem.adAccount,
              network: subitem.network,
              vertical: subitem.vertical
            });
            const matchingEODItem = eodData.find(eodItem => {
              // Extract media buyer name from EOD item name (e.g., "Transparent - Snap Degree EDU Aakash AC1 - Aakash")
              const eodMediaBuyer = eodItem.name.split(' - ').pop()?.trim() || '';
              
              // Match by Media Buyer (case insensitive)
              const mediaBuyerMatch = eodMediaBuyer && buyer.name && 
                                    eodMediaBuyer.toLowerCase().includes(buyer.name.toLowerCase()) ||
                                    buyer.name.toLowerCase().includes(eodMediaBuyer.toLowerCase());
              
              // Match by Ad Account (case insensitive)
              const accountMatch = eodItem.adAccount && subitem.adAccount && 
                                 eodItem.adAccount.toLowerCase().includes(subitem.adAccount.toLowerCase()) ||
                                 subitem.adAccount.toLowerCase().includes(eodItem.adAccount.toLowerCase());
              
              // Match by Network (case insensitive)
              const networkMatch = eodItem.network && subitem.network && 
                                 eodItem.network.toLowerCase().includes(subitem.network.toLowerCase()) ||
                                 subitem.network.toLowerCase().includes(eodItem.network.toLowerCase());
              
              // Match by Offer (case insensitive) - extract from EOD item name
              const eodOffer = eodItem.name.split(' - ')[1]?.trim() || '';
              
              // Create normalized versions for better matching (remove spaces, special chars)
              const normalizeForMatching = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
              const normalizedEODOffer = normalizeForMatching(eodOffer);
              const normalizedSubitemName = normalizeForMatching(subitem.name);
              const normalizedVertical = normalizeForMatching(subitem.vertical || '');
              
              // Try multiple matching approaches
              const offerMatch = eodOffer && subitem.name && (
                // Direct includes (original logic)
                eodOffer.toLowerCase().includes(subitem.name.toLowerCase()) ||
                subitem.name.toLowerCase().includes(eodOffer.toLowerCase()) ||
                // Normalized matching (handles spacing issues)
                normalizedEODOffer.includes(normalizedSubitemName) ||
                normalizedSubitemName.includes(normalizedEODOffer) ||
                // Match against vertical field
                normalizedEODOffer.includes(normalizedVertical) ||
                normalizedVertical.includes(normalizedEODOffer)
              );
              
              // All four criteria must match: Media Buyer + Ad Account + Network + Offer
              const matches = mediaBuyerMatch && accountMatch && networkMatch && offerMatch;
              if (matches) {
                console.log('Found matching EOD item:', {
                  eodName: eodItem.name,
                  eodAccount: eodItem.adAccount,
                  eodNetwork: eodItem.network,
                  eodOffer: eodOffer,
                  adRev: eodItem.adRev,
                  adSpend: eodItem.adSpend
                });
              }
              return matches;
            });

            // Helper function to check if numbers are within 10% of each other
            const isWithin10Percent = (num1, num2) => {
              if (!num1 || !num2 || num1 === 'N/A' || num2 === 'N/A') return false;
              
              const val1 = parseFloat(num1.toString().replace(/[^0-9.-]+/g, ''));
              const val2 = parseFloat(num2.toString().replace(/[^0-9.-]+/g, ''));
              
              if (isNaN(val1) || isNaN(val2) || val1 === 0 || val2 === 0) return false;
              
              const difference = Math.abs(val1 - val2);
              const average = (val1 + val2) / 2;
              const percentageDifference = (difference / average) * 100;
              
              return percentageDifference <= 10;
            };

            // We have matching data if we found a matching EOD item, regardless of date match
            const hasMatchingData = !!matchingEODItem;
            // Only compare numbers if dates match
            const adRevMatch = datesMatch && hasMatchingData ? isWithin10Percent(subitem.adRev, matchingEODItem.adRev) : false;
            const adSpendMatch = datesMatch && hasMatchingData ? isWithin10Percent(subitem.adSpend, matchingEODItem.adSpend) : false;
            
            // Overall match: dates match AND data exists AND both revenue and spend are within 10%
            const isMatched = datesMatch && hasMatchingData && adRevMatch && adSpendMatch;

            comparisonData.push({
              mediaBuyerData: {
                name: subitem.name, // Campaign name
                fanpageName: subitem.fanpageName,
                vertical: subitem.vertical,
                network: subitem.network,
                adAccount: subitem.adAccount,
                offer: subitem.offer, // Add offer from media buyer data
                adRev: subitem.adRev,
                adSpend: subitem.adSpend
              },
              eodData: matchingEODItem ? {
                itemName: matchingEODItem.name,
                adAccount: matchingEODItem.adAccount,
                network: matchingEODItem.network,
                offer: matchingEODItem.offer,
                adRev: matchingEODItem.adRev,
                adSpend: matchingEODItem.adSpend
              } : null,
              isMatched: isMatched,
              hasMatchingData: hasMatchingData,
              adRevMatch: adRevMatch,
              adSpendMatch: adSpendMatch
            });
          });
        }

        return {
          name: buyer.name,
          boardId: buyer.boardId,
          success: true,
          mostRecentDate: mostRecentItem?.date || 'No date found',
          mostRecentItem: mostRecentItem?.name || 'No items found',
          subitems: mostRecentItem?.subitems || [],
          comparisonData: comparisonData,
          totalItems: items.length,
          allItems: sortedItems.slice(0, 5), // Keep last 5 items for debugging
          isCompleted: isCompleted || false,
          datesMatch: datesMatch,
          latestEODDate: latestEODDate
        };

      } catch (error) {
        console.error(`Error processing ${buyer.name}:`, error);
        return {
          name: buyer.name,
          boardId: buyer.boardId,
          error: error.message,
          items: []
        };
      }
    });

    res.status(200).json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching media buyer EOD data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch media buyer EOD data',
      details: error.message 
    });
  }
}