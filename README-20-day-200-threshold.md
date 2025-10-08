# 20-Day Window & $200 Threshold Update

## Summary
Updated the Cash Flow Planner to show a 20-day window (instead of 30) and mark invoices below $200 as likely not to be paid out due to payment threshold.

---

## What Changed

### 1. **Window Changed: 30 Days → 20 Days**

The incoming money view now focuses on a shorter, more actionable timeframe:
- **Before:** Next 30 days
- **After:** Next 20 days

This provides a tighter, more realistic view of incoming cash that's truly imminent.

### 2. **$200 Minimum Threshold Added**

Invoices under $200 are now clearly marked as below the payment threshold:
- **Visual indicators:** Gray background, strikethrough amount, warning icon
- **Excluded from totals:** Only invoices ≥$200 count toward the main total
- **Still visible:** Below-threshold invoices are shown but grayed out

### 3. **Enhanced Tracking**

The system now tracks:
- **Main total:** Only invoices ≥$200
- **Below threshold count:** How many invoices are under $200
- **Total with threshold:** All invoices (for reference)

---

## Visual Changes

### Summary Card (Top)
**Before:**
```
Incoming Money (30 days)
$45,000
Across 4 weeks
```

**After:**
```
Incoming Money (20 days)
$42,000
≥$200 threshold • 3 below threshold • Excludes 60+ day old
```

### Detail Panel - Invoice List

**Invoices ≥$200** (Normal display):
- ✅ Regular green hover effect
- ✅ Dark text
- ✅ Bold green amount
- ✅ Included in total

**Invoices <$200** (Below threshold):
- 🔴 Gray background with border
- 🔴 Grayed out text
- 🔴 Strikethrough amount in gray
- 🔴 Warning icon: ⚠️ Below threshold
- 🔴 Italic note: "Likely won't be paid out"
- 🔴 Excluded from total

### Calendar View
- Only shows incoming amounts for invoices ≥$200
- Below-threshold invoices don't appear on calendar dates
- 20-day view instead of 30-day

---

## Examples

### Invoice #1: $850 - Network X
**Status:** ✅ **Above Threshold**
- Due: Oct 15, 2025 (7 days from today)
- Display: Regular green styling
- Amount: **$850** (bold, green)
- Included in total: YES
- Shows on calendar: YES

### Invoice #2: $175 - Network Y
**Status:** ⚠️ **Below Threshold**
- Due: Oct 12, 2025 (4 days from today)
- Display: Gray background, muted colors
- Amount: ~~$175~~ (strikethrough, gray)
- Warning: "⚠️ Below threshold"
- Note: "Likely won't be paid out"
- Included in total: NO
- Shows on calendar: NO

### Invoice #3: $50 - Network Z
**Status:** ⚠️ **Below Threshold**
- Due: Oct 10, 2025 (2 days from today)
- Display: Gray background, muted colors
- Amount: ~~$50~~ (strikethrough, gray)
- Warning: "⚠️ Below threshold"
- Note: "Likely won't be paid out"
- Included in total: NO
- Shows on calendar: NO

---

## Business Logic

### Filtering Rules (In Order)
1. ❌ Invoice older than 60 days → **EXCLUDED**
2. ❌ Invoice due more than 20 days from now → **EXCLUDED**
3. ⚠️ Invoice amount < $200 → **SHOWN BUT GRAYED OUT**
4. ✅ Invoice amount ≥ $200 → **INCLUDED IN TOTAL**

### Example Scenario
You have 10 invoices:
- 2 invoices older than 60 days → Not shown at all
- 3 invoices due in 25+ days → Not shown at all
- 5 invoices within 20 days and recent:
  - 3 invoices ≥$200 ($500, $850, $1,200) → Shown normally, included in total
  - 2 invoices <$200 ($75, $150) → Shown grayed out, excluded from total

**Result:**
- Total displayed: $2,550 (only the 3 above threshold)
- Note: "2 below threshold"
- Users can see all 5 invoices but understand which ones will actually pay out

---

## Code Changes

### 1. Calculation Logic (Lines 181-217)
```javascript
// Only include invoices that are:
// 1. Due within the next 20 days, AND
// 2. Not older than 60 days
if (dueDate <= twentyDaysFromNow && dueDate >= sixtyDaysAgo) {
  const amount = parseFloat(invoice.AmountDue?.replace(/[^0-9.-]+/g, '') || 0);
  
  // Track total including below threshold
  acc.totalWithBelowThreshold += amount;
  
  // Only add to main total if above $200 threshold
  if (amount >= 200) {
    acc.total += amount;
    acc.byWeek[weekNumber] = (acc.byWeek[weekNumber] || 0) + amount;
  } else {
    acc.belowThresholdCount++;
  }
}
```

### 2. Display Logic (Lines 1268-1305)
```javascript
const isBelowThreshold = amount < 200;

// Different styling based on threshold
className={`
  ${isBelowThreshold 
    ? 'bg-gray-50 border border-gray-200 hover:bg-gray-100' 
    : 'hover:bg-green-50'
  }
`}

// Show warning for below threshold
{isBelowThreshold && (
  <span className="ml-2 text-xs text-orange-600 font-normal">
    ⚠️ Below threshold
  </span>
)}

// Strikethrough amount if below threshold
<div className={`font-bold ${
  isBelowThreshold 
    ? 'text-gray-400 line-through' 
    : 'text-green-700'
}`}>
```

### 3. Calendar Logic (Lines 1440-1455)
```javascript
// Only count invoices >= $200 threshold
if (amount >= 200) {
  incoming += amount;
}
```

---

## User Impact

### Positive Changes
✅ **More realistic totals** - Don't count money that likely won't come
✅ **Better planning** - Focus on the next 20 days (more actionable)
✅ **Clear visibility** - Can still see below-threshold invoices, just marked clearly
✅ **Reduced confusion** - Less likely to plan around money that won't arrive

### Things to Note
⚠️ **Total will be lower** - Because we're excluding small invoices
⚠️ **Shorter window** - 20 days instead of 30 means less in the pipeline
⚠️ **Below threshold still visible** - They appear grayed out for awareness

---

## Testing Checklist

### Summary Card
- [ ] Shows "Incoming Money (20 days)" title
- [ ] Total only includes invoices ≥$200
- [ ] Shows "≥$200 threshold" in subtitle
- [ ] Shows count of below-threshold invoices if any exist
- [ ] Shows "Excludes 60+ day old" text

### Detail Panel
- [ ] Title says "Next 20 days"
- [ ] Subtitle mentions "≥$200 threshold"
- [ ] Invoices ≥$200 show with normal green styling
- [ ] Invoices <$200 show with gray background
- [ ] Below-threshold invoices have warning icon
- [ ] Below-threshold invoices show "Likely won't be paid out"
- [ ] Below-threshold amounts are strikethrough
- [ ] Total at top matches summary card
- [ ] Only shows invoices within 20 days

### Calendar View
- [ ] Title says "20-Day Cash Flow Calendar"
- [ ] Subtitle mentions "≥$200" qualifier
- [ ] Calendar spans correct date range
- [ ] Only invoices ≥$200 show green amounts on dates
- [ ] Below-threshold invoices don't appear on calendar
- [ ] Net flow calculations are correct

### Edge Cases
- [ ] Invoice for exactly $200 (should be included)
- [ ] Invoice for $199.99 (should be grayed out)
- [ ] Invoice for $0 (should be grayed out)
- [ ] Invoice due in exactly 20 days (should be included)
- [ ] Invoice due in 21 days (should not show)
- [ ] Invoice exactly 60 days old (should be included)
- [ ] Invoice 61 days old (should not show)

---

## Configuration

Currently hardcoded values:
- **Days window:** 20 days
- **Threshold:** $200
- **Age cutoff:** 60 days

These could be made configurable in the future if needed.

---

## Related Files

**Modified:**
- `src/components/dashboard/CashFlowPlanner.jsx`

**No changes needed:**
- Other invoice-related components continue to show all invoices
- This is specific to the Cash Flow Planner view only

---

**Date:** October 8, 2025  
**Author:** AI Assistant  
**Request:** Change to 20-day window and indicate invoices below $200 threshold

