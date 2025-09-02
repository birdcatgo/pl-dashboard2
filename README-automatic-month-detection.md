# Automatic Month Detection Implementation

## Overview
This implementation adds automatic detection of new months in the Google Sheets to dynamically update the Expense Review, Expense Categories Trend, and Cash View components without requiring manual code changes.

## Changes Made

### 1. API Layer (`src/pages/api/sheets.js`)
- **Dynamic Month Detection**: Replaced hardcoded month ranges with automatic detection of month sheets using regex pattern matching
- **Sheet Name Fetching**: Added logic to fetch all sheet names and filter for month patterns (`Month YYYY`)
- **Processing Updates**: Updated `processPLData` function to dynamically process all detected month sheets

### 2. Expense Review Component (`src/components/dashboard/ExpenseReview.jsx`)
- **Dynamic Month Parsing**: Replaced hardcoded month weights with dynamic `parseMonthYear` function
- **Automatic Recent Month Selection**: Now automatically selects the most recent month from available data

### 3. Expense Categories Trend (`src/components/dashboard/PLWrapper.jsx`)
- **Dynamic Month Sorting**: Updated `ExpenseCategoriesTrend` component to use dynamic month parsing
- **Cash View Updates**: Updated `getMonthWeight` function to parse months dynamically
- **Year Extraction**: Improved `getYearForMonth` function to handle any year format

### 4. Expense Category Component (`src/components/dashboard/ExpenseCategory.jsx`)
- **Dynamic Trend Calculation**: Updated month sorting for trend calculations to work with any month/year combination

### 5. Expense Overview (`src/components/dashboard/ExpenseOverview.jsx`)
- **Dynamic Recent Months**: Replaced hardcoded target months with dynamic `getRecentMonths` function

### 6. Additional Components Updated
- **ImprovedPLDashboard.jsx**: Updated month weight calculation for dynamic sorting
- **ExportModal.jsx**: Updated CSV export to use dynamically detected available months

### 7. Utility Functions (`src/lib/month-utils.js`)
- **Created reusable utility functions** for month parsing, sorting, and year extraction
- **Standardized month handling** across the application

## Key Features

### Automatic Month Detection
- The system now automatically detects any new month sheets added to the Google Spreadsheet
- Month pattern: `"Month YYYY"` (e.g., "August 2025", "January 2026")
- No manual code updates required when new months are added

### Dynamic Sorting
- All components now sort months chronologically regardless of year
- Most recent months appear first in dropdowns and displays
- Supports unlimited future years (2025, 2026, etc.)

### Backward Compatibility
- All changes are backward compatible with existing data
- Existing month formats continue to work
- Graceful fallbacks for edge cases

### Components Affected
1. **Expense Review**: Shows most recent month's expenses automatically
2. **Expense Categories Trend**: Displays last 6 months dynamically
3. **Cash View (Money In/Out)**: Month selector includes all available months automatically

## Testing
After adding "August 2025" to the main sheet:
1. The API will automatically detect and include it in data fetching
2. Expense Review will show August 2025 data if it's the most recent
3. Expense Categories Trend will include August 2025 in the 6-month view
4. Cash View dropdown will include August 2025 as an option

## Usage
No manual intervention required. Simply add new month sheets to the Google Spreadsheet following the naming convention `"Month YYYY"` and the system will automatically:
- Detect the new month
- Include it in data processing
- Update all relevant components
- Sort months chronologically

## Future Considerations
- The utility functions in `month-utils.js` can be used for any new components that need month handling
- Consider migrating existing hardcoded month references to use these utilities
- The system is ready for years beyond 2025 without any code changes required
