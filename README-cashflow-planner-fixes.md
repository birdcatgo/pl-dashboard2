# Cash Flow Planner Fixes

## Issues Identified and Resolved

### 1. **Incorrect Data Structure Being Passed (PRIMARY ISSUE)**

**Problem:**
The `CashFlowPlanner` component was receiving an **object** instead of an **array** for the `creditCardData` prop.

**Root Cause:**
In `ToolsView.jsx` (line 126), the code was passing:
```javascript
creditCardData={cashFlowData?.financialResources || []}
```

The `financialResources` object has this structure:
```javascript
{
  cashAccounts: [...],
  creditCards: [...],
  totalCash: 0,
  totalCreditAvailable: 0,
  ...
}
```

But the `CashFlowPlanner` component expects `creditCardData` to be an array:
```javascript
if (!Array.isArray(creditCardData)) {
  console.log('Invalid credit card data format');
  return { totalLimit: 0, totalUsed: 0, availableCredit: 0 };
}
```

**Solution:**
Changed the data being passed to combine both `cashAccounts` and `creditCards` arrays:
```javascript
creditCardData={[
  ...(cashFlowData?.financialResources?.cashAccounts || []),
  ...(cashFlowData?.financialResources?.creditCards || [])
]}
```

**Files Modified:**
- `src/components/dashboard/views/ToolsView.jsx` (line 126-129)
- `src/components/dashboard/DashboardLayout.jsx` (lines 387-390 and 419)

---

### 2. **Expense Amount Parsing Bug**

**Problem:**
The `CashFlowPlanner` component had inconsistent handling of expense amounts:
- For **array format**: It properly removed dollar signs and commas using `.replace(/[$,]/g, '')`
- For **object format**: It did NOT remove these characters, causing potential parsing errors

**Root Cause:**
Line 158 in the original code:
```javascript
amount = parseFloat(expense.amount || expense.Amount || 0);
```

This would fail if `expense.Amount` contained values like `"$1,234.56"` because `parseFloat("$1,234.56")` returns `NaN`.

**Solution:**
Added proper string cleaning for object format:
```javascript
const amountValue = expense.amount || expense.Amount || 0;
amount = parseFloat(amountValue.toString().replace(/[$,]/g, ''));
```

**Files Modified:**
- `src/components/dashboard/CashFlowPlanner.jsx` (lines 158-159)
- `src/components/backup/CashFlowPlanner.jsx` (lines 39-68)

---

## Data Flow Summary

```
API (/api/sheets)
  └─> Fetches from Google Sheets
      └─> Creates cashFlowData structure:
          {
            financialResources: {
              cashAccounts: [{account, available, owing, limit}, ...],
              creditCards: [{account, available, owing, limit}, ...],
              totalCash: number,
              totalCreditAvailable: number
            }
          }

Dashboard (pages/index.js)
  └─> Receives cashFlowData
      └─> Passes to DashboardLayout

DashboardLayout
  └─> Passes cashFlowData to ToolsView

ToolsView
  └─> NOW CORRECTLY combines arrays and passes to CashFlowPlanner:
      [
        ...cashAccounts,
        ...creditCards
      ]

CashFlowPlanner
  ✓ Receives proper array format
  ✓ Processes financial resources correctly
  ✓ Calculates metrics properly
```

---

## Expected Results

After these fixes, the Cash Flow Planner should now:

1. ✅ Display the **Total Credit Limit** correctly
2. ✅ Show **Available Credit** from all accounts (cash + credit cards)
3. ✅ Calculate **Incoming Money** from invoices
4. ✅ Process **Upcoming Expenses** with proper amount parsing
5. ✅ Display the **Team Performance Overview** table
6. ✅ Show **Media Buyer Performance & Budget Allocation**
7. ✅ Calculate **Spending Scenarios** correctly
8. ✅ Display the **Financial Resources Breakdown** when expanded

---

## Testing Checklist

To verify the fixes are working:

1. Navigate to **Tools** → **Cash Flow Planner**
2. Verify that the three summary cards at the top show non-zero values:
   - Total Credit Limit
   - Incoming Money (30 days)
   - Upcoming Expenses (30 days)
3. Click on "Total Available Funds" to expand and verify all accounts are listed
4. Check that the "Team Performance Overview" table shows data
5. Verify that "Media Buyer Performance & Budget Allocation" table populates
6. Confirm that "Spending Scenarios Overview" calculates correctly

---

## Related Components Using financialResources

These components were already handling the data structure correctly:
- `CashPosition.jsx` - Uses `cashAccounts` and `creditCards` separately
- `CreditLine.jsx` - Accesses `creditCards` array directly
- `ProfitDistribution.jsx` - Combines both arrays like we now do

---

**Date:** October 7, 2025  
**Author:** AI Assistant  
**Issue:** Cash Flow Planner not working on dashboard

