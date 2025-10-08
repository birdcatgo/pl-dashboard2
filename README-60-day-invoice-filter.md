# 60-Day Invoice Filter Update

## Summary
Updated the Cash Flow Planner to exclude invoices older than 60 days from incoming money calculations and displays.

---

## What Changed

### Incoming Money Calculations
Previously, the Cash Flow Planner included **all invoices** due within the next 30 days, regardless of how old they were.

**Before:**
- Showed invoices due in next 30 days
- Included overdue invoices from any date (could be 1+ years old)

**After:**
- Shows invoices due in next 30 days
- **Excludes** any invoices with a due date older than 60 days
- More accurate representation of realistic incoming cash

### Why This Matters
Invoices older than 60 days are typically:
- Less likely to be collected
- May be in dispute
- Could be written off
- Shouldn't be counted as reliable incoming cash

By excluding them, the Cash Flow Planner shows a more realistic picture of expected cash inflow.

---

## Areas Updated

### 1. **Incoming Money Total Calculation** (Line 181-209)
```javascript
// Only include invoices that are:
// 1. Due within the next 30 days, AND
// 2. Not older than 60 days
if (dueDate <= thirtyDaysFromNow && dueDate >= sixtyDaysAgo) {
  // Include in total
}
```

### 2. **Incoming Money Detail List** (Line 1246-1254)
The detailed list now filters out invoices older than 60 days:
```javascript
.filter(invoice => {
  const dueDate = new Date(invoice.DueDate);
  const sixtyDaysAgo = subDays(today, 60);
  return dueDate <= thirtyDaysFromNow && dueDate >= sixtyDaysAgo;
})
```

### 3. **30-Day Calendar View** (Line 1412-1424)
Calendar now excludes old invoices from daily incoming amounts:
```javascript
const sixtyDaysAgo = subDays(new Date(), 60);
if (isSameDay(dueDate, day) && dueDate >= sixtyDaysAgo) {
  incoming += amount;
}
```

### 4. **User-Facing Labels** (Lines 1199, 1232)
Added clear indicators that old invoices are excluded:
- Summary card: "Excludes 60+ day old invoices"
- Detail panel: "Expected payments in the next 30 days (excludes invoices older than 60 days)"

---

## Examples

### Scenario 1: Normal Invoice
- **Invoice Due:** October 15, 2025 (7 days from today)
- **Today:** October 8, 2025
- **Result:** ✅ **Included** - Due date is within 30 days and not older than 60 days

### Scenario 2: Overdue Invoice (Recent)
- **Invoice Due:** September 25, 2025 (13 days ago)
- **Today:** October 8, 2025
- **Result:** ✅ **Included** - Due date is less than 60 days old

### Scenario 3: Overdue Invoice (Old)
- **Invoice Due:** July 20, 2025 (80 days ago)
- **Today:** October 8, 2025
- **Result:** ❌ **Excluded** - Due date is older than 60 days

### Scenario 4: Future Invoice (Far Out)
- **Invoice Due:** December 1, 2025 (54 days from now)
- **Today:** October 8, 2025
- **Result:** ❌ **Excluded** - Due date is beyond 30 days from now

---

## Technical Details

### Date Calculations
```javascript
const today = new Date();
const thirtyDaysFromNow = addDays(today, 30);      // Future cutoff
const sixtyDaysAgo = subDays(today, 60);            // Past cutoff

// Include invoice if:
// dueDate is between sixtyDaysAgo and thirtyDaysFromNow
if (dueDate >= sixtyDaysAgo && dueDate <= thirtyDaysFromNow) {
  // Include this invoice
}
```

### Functions Used
- `addDays(date, days)` - From `date-fns` library
- `subDays(date, days)` - From `date-fns` library
- `isSameDay(date1, date2)` - From `date-fns` library

---

## Testing Checklist

To verify the changes are working correctly:

1. **Check Summary Card**
   - [ ] "Incoming Money (30 days)" card shows reduced total (if old invoices existed)
   - [ ] Subtitle says "Excludes 60+ day old invoices"

2. **Check Detail Panel**
   - [ ] Incoming Money list doesn't show invoices with due dates older than 60 days
   - [ ] Subtitle mentions the exclusion
   - [ ] Total at top matches summary card

3. **Check Calendar View**
   - [ ] Days with old invoices don't show green amounts
   - [ ] Only recent/future invoices appear on calendar dates
   - [ ] Net flow calculations are accurate

4. **Edge Cases to Test**
   - [ ] Invoice due exactly 60 days ago (should be included)
   - [ ] Invoice due 61 days ago (should be excluded)
   - [ ] Invoice due today (should be included)
   - [ ] Invoice due 30 days from now (should be included)
   - [ ] Invoice due 31 days from now (should be excluded)

---

## Impact on Other Components

This change only affects the **Cash Flow Planner** component. Other components that use invoice data are **not affected**:

- ✅ Invoices Table - Still shows all invoices
- ✅ Accounts View - Still shows all invoices
- ✅ Other financial calculations - Unchanged

---

## Future Considerations

If needed, we could make the 60-day threshold configurable:
- Add a settings panel to adjust the cutoff (30, 60, 90 days)
- Add a toggle to show/hide old invoices
- Add a separate "Overdue Invoices" section to track them separately

---

**Date:** October 8, 2025  
**Author:** AI Assistant  
**Request:** Exclude invoices older than 60 days from incoming money calculations

