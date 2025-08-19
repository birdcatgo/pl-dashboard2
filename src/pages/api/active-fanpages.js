export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed',
      fanpages: [] 
    });
  }

  try {
    const MONDAY_API_TOKEN = process.env.MONDAY_API_TOKEN;

    if (!MONDAY_API_TOKEN) {
      return res.status(500).json({ 
        success: false,
        error: 'Monday.com API token not configured',
        fanpages: []
      });
    }

    // First, get the latest EOD report date to ensure data consistency
    const EOD_BOARD_ID = '9498909231'; // August 2025 Daily P&L Board
    let latestEODDate = null;
    
    try {
      console.log('Fetching latest EOD report date...');
      const eodQuery = `
        query {
          boards(ids: ${EOD_BOARD_ID}) {
            items_page(limit: 10) {
              items {
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
      `;

      const eodResponse = await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
          'Authorization': MONDAY_API_TOKEN,
          'Content-Type': 'application/json',
          'API-Version': '2023-10'
        },
        body: JSON.stringify({ query: eodQuery })
      });

      if (eodResponse.ok) {
        const eodData = await eodResponse.json();
        const eodItems = eodData.data?.boards?.[0]?.items_page?.items || [];
        
        // Sort EOD items by date to find the most recent
        const sortedEODItems = eodItems
          .map(item => {
            const dateColumn = item.column_values.find(col => 
              col.type === 'date' || 
              col.type === 'timeline' ||
              col.id === 'date' ||
              col.id === 'timeline__1' ||
              col.id === 'date4'
            );
            return {
              ...item,
              date: dateColumn?.text || 'No date',
              rawDateValue: dateColumn?.value || null
            };
          })
          .filter(item => item.date && item.date !== 'No date')
          .sort((a, b) => {
            const dateA = a.rawDateValue ? new Date(JSON.parse(a.rawDateValue).date) : new Date(0);
            const dateB = b.rawDateValue ? new Date(JSON.parse(b.rawDateValue).date) : new Date(0);
            return dateB - dateA; // Most recent first
          });

        if (sortedEODItems.length > 0) {
          latestEODDate = sortedEODItems[0].date;
          console.log('Latest EOD report date found:', latestEODDate);
        }
      }
    } catch (eodError) {
      console.error('Error fetching EOD report date:', eodError);
      // Continue without EOD date validation if it fails
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

        // Use the same GraphQL query structure as Media Buyer EOD
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
          console.error(`Monday.com API errors for ${buyer.name}:`, JSON.stringify(data.errors, null, 2));
          throw new Error(`Monday.com API returned errors: ${data.errors.map(e => e.message).join(', ')}`);
        }

        const items = data.data?.boards?.[0]?.items_page?.items || [];
        
        // Process items to find dates and sort them (same as Media Buyer EOD)
        const processedItems = items.map(item => {
          // Look for date-related columns (same logic as Media Buyer EOD)
          const dateColumn = item.column_values.find(col => 
            col.type === 'date' || 
            col.type === 'timeline' ||
            col.id === 'date' ||
            col.id === 'timeline__1' ||
            col.id === 'date4'
          );

          return {
            id: item.id,
            name: item.name,
            date: dateColumn?.text || 'No date',
            rawDateValue: dateColumn?.value || null,
            subitems: item.subitems || [],
            dateColumn
          };
        });

        // Sort items by date to find the most recent
        const sortedItems = processedItems.sort((a, b) => {
          if (!a.date || a.date === 'No date') return 1;
          if (!b.date || b.date === 'No date') return -1;
          return new Date(b.date) - new Date(a.date);
        });

        let targetItem = null;
        
        // First, try to find an item that matches the latest EOD date
        if (latestEODDate) {
          const eodDateFormatted = latestEODDate.split(' ')[0]; // Get just the date part
          targetItem = sortedItems.find(item => 
            item.date && item.date.includes(eodDateFormatted)
          );
          
          if (targetItem) {
            console.log(`Found EOD date match for ${buyer.name}: ${targetItem.date}, Item: ${targetItem.name}`);
          } else {
            console.log(`No EOD date match found for ${buyer.name} (EOD: ${latestEODDate}), using latest available`);
            targetItem = sortedItems[0];
          }
        } else {
          // Fallback to latest item if no EOD date available
          targetItem = sortedItems[0];
        }
        
        if (!targetItem || !targetItem.date || targetItem.date === 'No date') {
          console.log(`No items with valid dates found for ${buyer.name}`);
          return {
            name: buyer.name,
            boardId: buyer.boardId,
            data: { boards: [{ items_page: { items: [] } }] }
          };
        }

        console.log(`Using date for ${buyer.name}: ${targetItem.date}, Item: ${targetItem.name}${latestEODDate && !targetItem.date.includes(latestEODDate.split(' ')[0]) ? ' (NOT MATCHED TO EOD)' : ''}`);

        return {
          name: buyer.name,
          boardId: buyer.boardId,
          data: {
            boards: [{
              items_page: {
                items: [targetItem]
              }
            }]
          }
        };

      } catch (error) {
        console.error(`Error fetching data for ${buyer.name}:`, error);
        return {
          name: buyer.name,
          boardId: buyer.boardId,
          error: error.message
        };
      }
    };

    const fanpages = [];
    const errors = [];
    
    // Process all boards in parallel
    const responses = await Promise.all(mediaBuyerBoards.map(fetchBuyerData));

    for (const response of responses) {
      if (response.error) {
        errors.push(`${response.name}: ${response.error}`);
        continue;
      }

      const items = response.data?.boards?.[0]?.items_page?.items || [];
      console.log(`Found ${items.length} items for ${response.name}`);
      
      // Process the target item (either EOD-matched or latest)
      const targetItem = items[0];
      if (!targetItem) continue;

      console.log(`Processing target item for ${response.name}: ${targetItem.name}`);
      const subitems = targetItem.subitems || [];
      console.log(`Found ${subitems.length} subitems for target item`);
      
      for (const subitem of subitems) {
        console.log(`Processing subitem: ${subitem.name}`);
        
        // Apply the same column detection logic as Media Buyer EOD
        const columnValues = subitem.column_values || [];
        
        // Get all dropdown columns and sort them by position to find vertical/network
        const dropdownColumns = columnValues.filter(col => col.type === 'dropdown' && col.text);
        
        // First dropdown column is usually vertical, second is usually network
        // Ad Account is the dropdown with id 'dropdown'
        const adAccountColumn = columnValues.find(col => 
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
          const statusColumns = columnValues.filter(col => col.type === 'status' && col.text);
          if (statusColumns.length >= 2) {
            verticalColumn = statusColumns[0]; // status8 is usually vertical
            networkColumn = statusColumns[1];  // status2 is usually network
          } else if (statusColumns.length === 1) {
            verticalColumn = statusColumns[0];
          }
        }
        
        // Facebook Page Name is in the text column
        const facebookPageColumn = columnValues.find(col => 
          col.id === 'text' && col.type === 'text'
        );
        
        // Revenue is usually in numbers4 column
        const adRevColumn = columnValues.find(col => 
          col.id === 'numbers4' && col.type === 'numbers'
        );
        
        // Spend is usually in numbers column
        const adSpendColumn = columnValues.find(col => 
          col.id === 'numbers' && col.type === 'numbers'
        );

        const fanpage = {
          id: subitem.id,
          name: subitem.name,
          mediaBuyer: response.name,
          vertical: verticalColumn?.text || 'N/A',
          network: networkColumn?.text || 'N/A',
          adAccount: adAccountColumn?.text || 'N/A',
          facebookPage: facebookPageColumn?.text || 'N/A',
          revenue: parseFloat(adRevColumn?.text) || 0,
          spend: parseFloat(adSpendColumn?.text) || 0,
          boardId: response.boardId,
          itemId: targetItem.id
        };

        console.log(`Processed fanpage: ${JSON.stringify(fanpage, null, 2)}`);

        // Only include fanpages with spend
        if (fanpage.spend > 0) {
          console.log(`Adding fanpage with spend: ${fanpage.name}`);
          fanpages.push(fanpage);
        } else {
          console.log(`Skipping fanpage with no spend: ${fanpage.name} (spend: ${fanpage.spend})`);
        }
      }
    }

    console.log(`Found ${fanpages.length} active fanpages`);

    return res.status(200).json({
      success: true,
      fanpages,
      errors: errors.length > 0 ? errors : undefined,
      total: fanpages.length,
      latestEODDate: latestEODDate,
      dataSource: latestEODDate ? 'EOD-synchronized' : 'latest-available',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in active-fanpages API:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      fanpages: [],
      total: 0
    });
  }
}