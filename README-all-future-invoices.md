# All Future Invoices Update

## Summary
Updated the Cash Flow Planner to show ALL future invoices without any date limit, while maintaining the 20-day overdue limit for past invoices.

---

## What Changed

### Window Definition

**Before:** 20 days overdue → 20 days future (40-day window)

**After:** 20 days overdue → ALL FUTURE (unlimited future)

### The New Window Includes:
- **Past (20 days):** Overdue invoices up to 20 days old
- **Present:** Today's due invoices
- **Future (NO LIMIT):** ALL invoices not yet due, regardless of how far in the future

---

## Why This Change?

✅ **Complete visibility** - See all future expected income
✅ **Better long-term planning** - Not limited to just 20 days ahead
✅ **No missed invoices** - Future invoices 30, 60, 90+ days out are all visible
✅ **Still focused on recent past** - Old overdue invoices (>20 days) remain hidden

---

## Visual Examples

### Invoice #1: $850 Due Oct 15, 2025 (7 days)
- **Status:** ✅ Future invoice
- **Display:** Green styling
- **Included:** YES

### Invoice #2: $1,200 Due Sep 28, 2025 (10 days overdue)
- **Status:** 🔴 Overdue (within 20-day window)
- **Display:** Red background, "Overdue" badge
- **Included:** YES

### Invoice #3: $500 Due Dec 15, 2025 (68 days)
- **Status:** ✅ Future invoice
- **Display:** Green styling
- **Included:** **YES** (Previously would have been hidden)

### Invoice #4: $300 Due Feb 1, 2026 (116 days)
- **Status:** ✅ Future invoice
- **Display:** Green styling
- **Included:** **YES** (Previously would have been hidden)

### Invoice #5: $600 Due Sep 10, 2025 (28 days overdue)
- **Status:** ❌ Too old
- **Display:** Hidden (outside 20-day overdue window)
- **Included:** NO

---

## Updated Labels

### Summary Card
```
Incoming Money (All Future)
$125,000
≥$200 threshold • 3 below threshold • Max 20 days overdue
```

### Detail Panel Header
```
Incoming Money
From 20 days overdue to all future invoices (≥$200 threshold)
```

### Section Title
```
Cash Flow Details
Showing from 20 days overdue through all future invoices
```

### Calendar View
```
30-Day Cash Flow Calendar
Visual timeline of incoming (≥$200, max 20 days overdue) and outgoing cash
```
*Note: Calendar still shows 30-day view for practical visualization*

---

## Code Changes

### Main Calculation (Lines 196-200)
```javascript
// Only include invoices that are:
// 1. Not more than 20 days overdue (>= twentyDaysAgo), AND
// 2. Any future date (no upper limit)
// This shows: 20 days past + today + all future invoices
if (dueDate >= twentyDaysAgo) {
  // Process invoice...
}
```

**Key Change:** Removed the `dueDate <= twentyDaysFromNow` condition, allowing all future dates.

### Filter Logic (Lines 1260-1261)
```javascript
const twentyDaysAgo = subDays(today, 20);
// Show invoices from 20 days overdue to all future
return dueDate >= twentyDaysAgo;
```

**Key Change:** Single condition - only checking past limit, no future limit.

---

## Benefits

✅ **Complete Financial Picture**
- See all expected future income
- Plan for long-term cash flow
- Understand total receivables

✅ **Still Manageable**
- Old overdue invoices (>20 days) are hidden
- Below-threshold invoices (<$200) are grayed out
- List sorted by date for easy scanning

✅ **Practical Calendar View**
- Calendar shows 30-day window for visualization
- Detail list shows ALL future invoices for planning

---

## Impact on Display

### Summary Card
- Total will likely be **higher** (includes all future invoices ≥$200)
- More accurate representation of total expected income

### Detail Panel
- **More invoices visible** in scrollable list
- Still sorted by date (overdue first, then future)
- May need to scroll to see far-future invoices

### Calendar View
- Unchanged (still shows 30-day window)
- Shows incoming amounts for near-term invoices
- Complements the full list in detail panel

---

## Example Scenarios

### Scenario 1: Network with Net 60 Terms
**Invoice:** $2,500 due in 55 days
- **Before:** Hidden (beyond 20-day window)
- **After:** ✅ **Visible** in list, included in total

### Scenario 2: Large Future Payment
**Invoice:** $10,000 due in 90 days  
- **Before:** Hidden (beyond 20-day window)
- **After:** ✅ **Visible** in list, included in total

### Scenario 3: Recent Overdue
**Invoice:** $800, 15 days overdue
- **Before:** ✅ Visible (within 20-day window)
- **After:** ✅ **Still visible** (no change)

### Scenario 4: Old Overdue
**Invoice:** $600, 25 days overdue
- **Before:** ❌ Hidden (beyond 20-day overdue window)
- **After:** ❌ **Still hidden** (no change)

---

## Testing Checklist

### Summary Card
- [ ] Shows "Incoming Money (All Future)"
- [ ] Total includes all future invoices ≥$200
- [ ] Total includes overdue invoices ≥$200 (within 20 days)
- [ ] Subtitle shows "Max 20 days overdue"

### Detail Panel
- [ ] Shows all future invoices (30, 60, 90+ days out)
- [ ] Shows overdue invoices within 20-day window
- [ ] Doesn't show overdue invoices >20 days old
- [ ] List sorted by date (oldest/most overdue first)
- [ ] Overdue items have red background
- [ ] Future items have green hover
- [ ] Below-threshold items grayed out

### Calendar View
- [ ] Shows 30-day window
- [ ] Displays amounts for invoices within calendar range
- [ ] Still respects 20-day overdue limit
- [ ] Still respects $200 threshold

### Edge Cases
- [ ] Invoice 20 days overdue (should show)
- [ ] Invoice 21 days overdue (should not show)
- [ ] Invoice due in 30 days (should show)
- [ ] Invoice due in 90 days (should show)
- [ ] Invoice due in 365 days (should show)
- [ ] Invoice for $199 due in future (should show grayed out)

---

## User Experience

### What Users Will Notice
1. **Higher totals** - All future invoices are now included
2. **Longer list** - More invoices visible in detail panel
3. **Better planning** - Can see long-term expected income
4. **Same calendar** - 30-day visual timeline unchanged

### What Stays the Same
- 20-day overdue cutoff (old invoices still hidden)
- $200 threshold logic (below-threshold still grayed out)
- Red styling for overdue invoices
- Calendar visualization (30-day window)

---

**Date:** October 8, 2025  
**Author:** AI Assistant  
**Request:** Show all future invoices without 20-day limit

