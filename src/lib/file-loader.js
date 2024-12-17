export async function loadPLFiles() {
  try {
    const months = ['June', 'July', 'August', 'September', 'October', 'November 1'];
    const results = [];
    
    for (const month of months) {
      try {
        const fileName = `Cash Flow Projections Extended 2024   ${month}.csv`;
        const content = await window.fs.readFile(fileName, { encoding: 'utf8' });
        results.push({ name: fileName, content });
      } catch (err) {
        console.error(`Error loading ${month} file:`, err);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error in loadPLFiles:', error);
    return [];
  }
}