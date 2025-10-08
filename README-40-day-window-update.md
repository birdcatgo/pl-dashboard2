# 40-Day Window Update - 20 Days Overdue to 20 Days Future

## Summary
Updated the Cash Flow Planner to show a 40-day window: from 20 days overdue in the past through 20 days in the future. This provides a complete view of recent overdue invoices plus upcoming payments.

---

## What Changed

### New Window Definition
**Before:** 60 days ago → 20 days future (80-day window, too much old data)
**After:** 20 days ago → 20 days future (40-day window, focused and actionable)

### The 40-Day Window Includes:
- **Past (20 days):** Overdue invoices up to 20 days old
- **Present:** Today's due invoices
- **Future (20 days):** Invoices due in the next 20 days

This creates a balanced view of recent past and near future.

---

## Visual Indicators

### Invoice Types & Colors

**1. Overdue Invoices (≥$200)**
- 🔴 **Red background** (`bg-red-50`)
- 🔴 **Red text** for network name
- 🔴 **Red badge:** "🔴 Overdue"
- 🔴 **Red bold amount**
- 🔴 Shows "X days overdue" instead of "X days"
- ✅ **Included in total**

**2. Future Invoices (≥$200)**
- 🟢 **Green hover effect**
- ⚫ **Dark text** for network name
- 🟢 **Green bold amount**
- 🟢 Shows "X days" until due
- ✅ **Included in total**

**3. Below Threshold (<$200)**
- ⚪ **Gray background** with border
- ⚪ **Gray text** (muted)
- ⚠️ **Orange warning:** "Below threshold"
- ~~**Strikethrough amount**~~ in gray
- 💬 Note: "Likely won't be paid out"
- ❌ **Excluded from total**

---

## Examples

### Invoice #1: $850 Due Oct 15, 2025
- **Status:** Future invoice (7 days from now)
- **Display:** Normal green styling
- **Amount:** **$850** (green, bold)
- **Badge:** None
- **Included:** ✅ YES

### Invoice #2: $1,200 Due Sep 28, 2025 (10 days overdue)
- **Status:** Overdue but within 20-day window
- **Display:** Red background
- **Amount:** **$1,200** (red, bold)
- **Badge:** 🔴 Overdue
- **Days:** "10 days overdue"
- **Included:** ✅ YES

### Invoice #3: $175 Due Oct 20, 2025
- **Status:** Future but below threshold
- **Display:** Gray background
- **Amount:** ~~$175~~ (strikethrough, gray)
- **Badge:** ⚠️ Below threshold
- **Note:** "Likely won't be paid out"
- **Included:** ❌ NO

### Invoice #4: $500 Due Sep 10, 2025 (28 days overdue)
- **Status:** Too old (beyond 20-day overdue window)
- **Display:** Not shown at all
- **Included:** ❌ NO

### Invoice #5: $300 Due Nov 5, 2025 (28 days in future)
- **Status:** Too far in future
- **Display:** Not shown at all
- **Included:** ❌ NO

---

## Labels Updated

### Summary Card
```
Incoming Money (20 days)
$45,000
≥$200 threshold • 3 below threshold • 20 days overdue max
```

### Detail Panel Header
```
Incoming Money
From 20 days overdue to 20 days in future (≥$200 threshold)
```

### Section Title
```
Cash Flow Details - 40-Day Window
Showing from 20 days overdue through 20 days in the future
```

### Calendar View
```
20-Day Cash Flow Calendar
Visual timeline of incoming (≥$200, max 20 days overdue) and outgoing cash
```

---

## Business Logic Flow

```
For each invoice:
  ├─ Check due date
  │  ├─ > 20 days overdue? → HIDE (too old)
  │  ├─ > 20 days in future? → HIDE (too far out)
  │  └─ Within 40-day window? → CONTINUE
  │
  ├─ Check amount
  │  ├─ < $200? → SHOW GRAYED OUT (below threshold)
  │  └─ ≥ $200? → SHOW NORMALLY
  │
  └─ Check if overdue
     ├─ Due date < today? → RED STYLING + "Overdue" badge
     └─ Due date ≥ today? → GREEN STYLING
```

---

## Code Changes Summary

### 1. Window Calculation (Lines 188-201)
```javascript
const twentyDaysFromNow = addDays(today, 20);
const twentyDaysAgo = subDays(today, 20);

// Only include invoices that are:
// 1. Not more than 20 days overdue (>= twentyDaysAgo), AND
// 2. Due within the next 20 days (<= twentyDaysFromNow)
// This creates a 40-day window: 20 days past, today, 20 days future
if (dueDate >= twentyDaysAgo && dueDate <= twentyDaysFromNow) {
  // Process invoice...
}
```

### 2. Overdue Detection (Lines 1270, 1286-1306)
```javascript
const isOverdue = daysUntil < 0;

// Red background for overdue
className={`${isOverdue ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-green-50'}`}

// Show overdue badge
{isOverdue && !isBelowThreshold && (
  <span className="text-red-600 font-semibold">
    🔴 Overdue
  </span>
)}

// Show "X days overdue" instead of "X days"
({Math.abs(daysUntil)} {isOverdue ? 'days overdue' : 'days'})
```

### 3. Calendar Updates (Lines 1457-1461)
```javascript
const twentyDaysAgo = subDays(new Date(), 20);
if (isSameDay(dueDate, day) && dueDate >= twentyDaysAgo) {
  // Include in calendar if within window
}
```

---

## Benefits

✅ **Balanced View** - See recent overdue plus near future
✅ **Actionable** - 40-day window is manageable and realistic
✅ **Clear Priority** - Overdue items stand out in red
✅ **Accurate Totals** - Only count reliable money (≥$200, within window)
✅ **No Clutter** - Old invoices (>20 days overdue) hidden

---

## Testing Checklist

### Summary Card
- [ ] Shows "20 days overdue max" in subtitle
- [ ] Total includes overdue invoices ≥$200 within 20-day window
- [ ] Total excludes invoices <$200

### Detail Panel  
- [ ] Shows overdue invoices (within 20 days) with red background
- [ ] Shows "🔴 Overdue" badge on overdue items
- [ ] Shows "X days overdue" for past due dates
- [ ] Shows future invoices with green hover
- [ ] Shows below-threshold invoices grayed out
- [ ] Doesn't show invoices >20 days overdue
- [ ] Doesn't show invoices >20 days in future

### Calendar View
- [ ] Shows overdue invoice amounts (≥$200) on past dates
- [ ] Shows future invoice amounts (≥$200) on future dates
- [ ] Doesn't show amounts for below-threshold invoices
- [ ] Doesn't show invoices outside 40-day window

### Edge Cases
- [ ] Invoice exactly 20 days overdue (should show)
- [ ] Invoice 21 days overdue (should not show)
- [ ] Invoice due today (should show)
- [ ] Invoice due in exactly 20 days (should show)
- [ ] Invoice due in 21 days (should not show)
- [ ] Invoice for $200 exactly (should show normally)
- [ ] Invoice for $199.99 (should be grayed out)

---

**Date:** October 8, 2025  
**Author:** AI Assistant  
**Request:** Show invoices from 20 days overdue to 20 days in future

