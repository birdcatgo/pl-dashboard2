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

    // Helper function to fetch data for a single buyer
    const fetchBuyerData = async (buyer) => {
      try {
        console.log(`Fetching active fanpages for ${buyer.name} (Board: ${buyer.boardId})`);

        // Check cache first
        const cacheKey = `monday_fanpages_${buyer.boardId}`;
        const cachedData = global[cacheKey];
        const cacheTime = global[`${cacheKey}_time`];
        
        // Use cache if it's less than 5 minutes old
        if (cachedData && cacheTime && (Date.now() - cacheTime) < 5 * 60 * 1000) {
          console.log(`Using cached fanpage data for ${buyer.name}`);
          return cachedData;
        }

        // GraphQL query to fetch items with subitems
        const query = `
          query {
            boards(ids: ${buyer.boardId}) {
              items_page(limit: 100) {
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

    const allActiveFanpages = [];

    // Process results
    buyerDataResults.forEach((data, index) => {
      const buyer = mediaBuyerBoards[index];
      
      try {
        if (data.error) {
          console.error(`Error processing ${buyer.name}:`, data.error);
          return;
        }

        const items = data.data.boards[0]?.items_page?.items || [];
        
        // Process items to find recent data and extract subitems
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
            // Look for vertical in status columns (usually status8)
            const verticalColumn = subitem.column_values.find(col => 
              col.id === 'status8' || // Common pattern
              col.id === 'dropdown_mkpaq84e' || // Emil's board
              col.id === 'dropdown_mkpaeznw' || // Ishaan's board
              col.id === 'dropdown_mkpa4e2z' || // Another board pattern
              col.text?.toLowerCase().includes('vertical') ||
              col.text?.toLowerCase().includes('network')
            );
            
            // Look for network/fanpage name in status columns (usually status2)
            const networkColumn = subitem.column_values.find(col => 
              col.id === 'status2' || // Common pattern
              col.id === 'dropdown_mkpav0b' || // Emil's board
              col.id === 'dropdown_mkpa7y8m' || // Ishaan's board
              col.id === 'dropdown_mkpa3858' || // Another board pattern
              col.text?.toLowerCase().includes('facebook') ||
              col.text?.toLowerCase().includes('page')
            );
            
            // Look for dropdown column (usually ad account)
            const adAccountColumn = subitem.column_values.find(col => 
              col.id === 'dropdown' ||
              col.text?.toLowerCase().includes('ad account') ||
              col.text?.toLowerCase().includes('account')
            );
            
            // Look for text column (usually fanpage name)
            const fanpageNameColumn = subitem.column_values.find(col => 
              col.type === 'text' ||
              col.text?.toLowerCase().includes('fanpage') ||
              col.text?.toLowerCase().includes('page')
            );
            
            // Revenue is usually in numbers4 column
            const adRevColumn = subitem.column_values.find(col => 
              col.id === 'numbers4' ||
              col.text?.toLowerCase().includes('ad rev') ||
              col.text?.toLowerCase().includes('revenue')
            );
            
            // Spend is usually in numbers column
            const adSpendColumn = subitem.column_values.find(col => 
              col.id === 'numbers' ||
              col.text?.toLowerCase().includes('ad spend') ||
              col.text?.toLowerCase().includes('spend')
            );

            return {
              id: subitem.id,
              name: subitem.name, // This is the campaign name
              vertical: verticalColumn?.text || 'N/A',
              network: networkColumn?.text || 'N/A',
              adAccount: adAccountColumn?.text || 'N/A',
              fanpageName: fanpageNameColumn?.text || 'N/A',
              adRev: adRevColumn?.text || '0',
              adSpend: adSpendColumn?.text || '0',
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

        // Sort items by date to find the most recent one
        const sortedItems = processedItems.sort((a, b) => {
          const dateA = a.rawDateValue ? new Date(JSON.parse(a.rawDateValue).date) : new Date(0);
          const dateB = b.rawDateValue ? new Date(JSON.parse(b.rawDateValue).date) : new Date(0);
          return dateB - dateA; // Most recent first
        });

        // Get only the most recent item
        const mostRecentItem = sortedItems[0];
        
        if (mostRecentItem && mostRecentItem.rawDateValue) {
          // Extract all subitems from the most recent item and check for active spend
          mostRecentItem.subitems.forEach(subitem => {
            const spend = parseFloat(subitem.adSpend?.replace(/[^0-9.-]+/g, '') || 0);
            if (spend > 0) {
              allActiveFanpages.push({
                ...subitem,
                mediaBuyer: buyer.name,
                boardId: buyer.boardId,
                reportDate: mostRecentItem.date,
                itemId: mostRecentItem.id
              });
            }
          });
        }

      } catch (error) {
        console.error(`Error processing ${buyer.name}:`, error);
      }
    });

    // Remove duplicates based on fanpage name and media buyer
    const uniqueFanpages = allActiveFanpages.filter((fanpage, index, self) => 
      index === self.findIndex(f => 
        f.name === fanpage.name && f.mediaBuyer === fanpage.mediaBuyer
      )
    );

    // Sort by spend (highest first)
    const sortedFanpages = uniqueFanpages.sort((a, b) => {
      const spendA = parseFloat(a.adSpend?.replace(/[^0-9.-]+/g, '') || 0);
      const spendB = parseFloat(b.adSpend?.replace(/[^0-9.-]+/g, '') || 0);
      return spendB - spendA;
    });

    // Cache the final results
    const resultsCacheKey = 'active_fanpages_results';
    global[resultsCacheKey] = {
      activeFanpages: sortedFanpages,
      totalActiveFanpages: sortedFanpages.length,
      timestamp: new Date().toISOString()
    };
    global[`${resultsCacheKey}_time`] = Date.now();

    res.status(200).json({
      success: true,
      activeFanpages: sortedFanpages,
      totalActiveFanpages: sortedFanpages.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching active fanpages:', error);
    res.status(500).json({ 
      error: 'Failed to fetch active fanpages',
      details: error.message 
    });
  }
}