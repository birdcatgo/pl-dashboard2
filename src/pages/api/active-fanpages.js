export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const MONDAY_API_TOKEN = process.env.MONDAY_API_TOKEN;

    if (!MONDAY_API_TOKEN) {
      return res.status(500).json({ error: 'Monday.com API token not configured' });
    }

    // Check for cached results first
    const resultsCacheKey = 'active_fanpages_results';
    const cachedResults = global[resultsCacheKey];
    const cacheTime = global[`${resultsCacheKey}_time`];
    
    // Use cache if it's less than 5 minutes old
    if (cachedResults && cacheTime && (Date.now() - cacheTime) < 5 * 60 * 1000) {
      console.log('Using cached final results');
      return res.status(200).json({
        success: true,
        ...cachedResults,
        fromCache: true
      });
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

        // GraphQL query optimized for latest data only
        const query = `
          query {
            boards(ids: ${buyer.boardId}) {
              items_page(limit: 1, query_params: {order_by: {column_id: "date4", direction: desc}}) {
                items {
                  id
                  name
                  column_values(ids: ["date4"]) {
                    id
                    type
                    value
                    text
                  }
                  subitems {
                    id
                    name
                    column_values(ids: ["status8", "status2", "dropdown", "numbers4", "numbers"]) {
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

    // Process data in chunks to avoid timeouts
    const chunkSize = 2;
    const allActiveFanpages = [];

    for (let i = 0; i < mediaBuyerBoards.length; i += chunkSize) {
      const chunk = mediaBuyerBoards.slice(i, i + chunkSize);
      const chunkPromises = chunk.map(buyer => fetchBuyerData(buyer));
      const chunkResults = await Promise.all(chunkPromises);

      // Process chunk results
      chunkResults.forEach((data, index) => {
        const buyer = chunk[index];
        
        try {
          if (data.error) {
            console.error(`Error processing ${buyer.name}:`, data.error);
            return;
          }

          const items = data.data.boards[0]?.items_page?.items || [];
          const mostRecentItem = items[0]; // We only fetch the most recent item now

          if (mostRecentItem) {
            const dateColumn = mostRecentItem.column_values[0]; // We only fetch date4 column
            
            // Process subitems
            mostRecentItem.subitems?.forEach(subitem => {
              const columns = subitem.column_values;
              const vertical = columns.find(col => col.id === 'status8')?.text || 'N/A';
              const network = columns.find(col => col.id === 'status2')?.text || 'N/A';
              const adAccount = columns.find(col => col.id === 'dropdown')?.text || 'N/A';
              const adRev = columns.find(col => col.id === 'numbers4')?.text || '0';
              const adSpend = columns.find(col => col.id === 'numbers')?.text || '0';

              // Only add if there's active spend
              const spend = parseFloat(adSpend.replace(/[^0-9.-]+/g, '') || 0);
              if (spend > 0) {
                allActiveFanpages.push({
                  id: subitem.id,
                  name: subitem.name, // Campaign name
                  vertical,
                  network,
                  adAccount,
                  adRev,
                  adSpend,
                  mediaBuyer: buyer.name,
                  reportDate: dateColumn?.text || 'No date'
                });
              }
            });
          }
        } catch (error) {
          console.error(`Error processing ${buyer.name}:`, error);
        }
      });
    }

    // Remove duplicates and sort
    const uniqueFanpages = allActiveFanpages.filter((fanpage, index, self) => 
      index === self.findIndex(f => 
        f.name === fanpage.name && f.mediaBuyer === fanpage.mediaBuyer
      )
    );

    const sortedFanpages = uniqueFanpages.sort((a, b) => {
      const spendA = parseFloat(a.adSpend.replace(/[^0-9.-]+/g, '') || 0);
      const spendB = parseFloat(b.adSpend.replace(/[^0-9.-]+/g, '') || 0);
      return spendB - spendA;
    });

    // Cache the final results
    const results = {
      activeFanpages: sortedFanpages,
      totalActiveFanpages: sortedFanpages.length,
      timestamp: new Date().toISOString()
    };

    global[resultsCacheKey] = results;
    global[`${resultsCacheKey}_time`] = Date.now();

    res.status(200).json({
      success: true,
      ...results
    });

  } catch (error) {
    console.error('Error fetching active fanpages:', error);
    res.status(500).json({ 
      error: 'Failed to fetch active fanpages',
      details: error.message 
    });
  }
}