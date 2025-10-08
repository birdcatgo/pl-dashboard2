# Cash Flow Planner Redesign

## Summary of Changes

The Cash Flow Planner has been reorganized to focus on cash flow visualization and tracking, while the Daily Spend Calculator has been moved to its own dedicated tab under Tools.

---

## What Changed

### 1. **Cash Flow Planner - New Layout**

**Location:** Tools → Cash Flow Planner

The Cash Flow Planner now has a streamlined focus on cash flow management with three main sections:

#### Section 1: Summary Cards (Unchanged)
- **Total Credit Limit** - Shows total credit with available balance
- **Incoming Money (30 days)** - Expected payments over the next month  
- **Upcoming Expenses (30 days)** - Scheduled payments coming due

#### Section 2: Cash Flow Details - NEW ✨
Two side-by-side detailed panels showing:

**Incoming Money (Left Panel)**
- Detailed list of all incoming payments in the next 30 days
- Sorted by due date
- Shows:
  - Network name
  - Due date with days until payment
  - Amount expected
  - Visual highlighting for payments due within 7 days (green)
- Scrollable list with totals

**Upcoming Expenses (Right Panel)**
- Detailed list of all expenses in the next 30 days
- Sorted by due date
- Shows:
  - Category
  - Description
  - Due date with days until payment
  - Amount due
  - Visual highlighting for payments due within 7 days (red)
- Scrollable list with totals

#### Section 3: 30-Day Cash Flow Calendar - NEW ✨
Visual calendar showing cash flow at a glance:
- **Calendar Grid** - Traditional month view with 7 columns (Sun-Sat)
- **Color Coding:**
  - 🟢 Green background = Positive net flow (more incoming than outgoing)
  - 🔴 Red background = Negative net flow (more outgoing than incoming)
  - 🔵 Blue border = Today's date
  - Gray = Days outside current/next month
- **Daily Details:**
  - Green numbers = Incoming payments
  - Red numbers = Outgoing payments
  - Shows actual amounts on each day
- **Legend** at the bottom for easy reference

---

### 2. **Daily Spend Calculator - New Separate Tab**

**Location:** Tools → Daily Spend Calculator

The Daily Spend Calculator is now in its own dedicated tab with ALL the original functionality:

- **Team Performance Overview** - Network-offer performance across time periods
  - Yesterday ROI, 7-Day ROI, MTD ROI
  - Yesterday Spend
  - Payment terms indicators
  
- **Total Available Funds Summary**
  - Cash + Available Credit total
  - Expandable financial resources breakdown
  - Account-by-account details with utilization percentages

- **Spending Scenarios Overview**
  - Latest Day's Actual spend
  - Target Daily spend calculator
  - Coverage projections (how many days funds will last)
  - Visual scenario comparison cards

- **Media Buyer Performance & Budget Allocation**
  - Detailed network-offer combinations by media buyer
  - ROI tracking per offer
  - Budget input fields
  - Payment terms highlighting (Weekly offers prioritized)
  - Support for both active and inactive buyers
  - Planning mode for inactive buyers with all available network-offers

---

## Navigation Changes

**Before:**
```
Tools
  ├─ Daily Updates
  ├─ Daily P&L Update
  ├─ Network Caps
  ├─ Cash Flow Planner (contained Daily Spend Calculator)
  ├─ Network Pay Terms
  ├─ Scheduled Tasks
  └─ Timezone Converter
```

**After:**
```
Tools
  ├─ Daily Updates
  ├─ Daily P&L Update
  ├─ Media Buyer EOD
  ├─ Active Fanpages
  ├─ Network Caps
  ├─ Network Pay Terms
  ├─ Cash Flow Planner (NEW: focused on cash flow visualization)
  ├─ Daily Spend Calculator (NEW: dedicated tab)
  ├─ Scheduled Tasks
  └─ Timezone Converter
```

---

## Benefits of This Design

### For Cash Flow Management
1. **Better Visibility** - Side-by-side comparison of incoming vs outgoing makes it easy to spot cash crunches
2. **Calendar View** - Visual timeline helps you plan ahead and see patterns
3. **Priority Highlighting** - Urgent items (≤7 days) are highlighted in both lists
4. **Detailed Breakdown** - Drill into specific invoices and expenses with descriptions

### For Daily Spend Planning
1. **Dedicated Focus** - Daily Spend Calculator has its own space without cluttering cash flow view
2. **Full Functionality** - All original features remain intact
3. **Cleaner Workflow** - Separate tools for separate purposes

### Overall UX Improvements
1. **Logical Separation** - Cash flow tracking vs. spend planning are distinct workflows
2. **Less Scrolling** - Each tool is more focused and compact
3. **Faster Navigation** - Click directly to the tool you need
4. **Maintained Context** - All data still comes from the same sources

---

## Technical Changes

### Files Modified

1. **`src/components/dashboard/CashFlowPlanner.jsx`**
   - Removed Daily Spend Calculator sections (~700 lines)
   - Added Incoming Money & Upcoming Expenses detail panels
   - Added 30-Day Cash Flow Calendar with visual indicators
   - Maintained all existing calculations (no data logic changed)

2. **`src/components/dashboard/views/ToolsView.jsx`**
   - Added import for `DailySpendCalculatorTab`
   - Added new button for "Daily Spend Calculator"
   - Added rendering logic for `daily-spend-calculator` subview
   - Passes all required props (`cashFlowData`, `performanceData`, `networkTermsData`)

### Data Flow (Unchanged)
```
API (/api/sheets)
  └─> Dashboard (pages/index.js)
      └─> DashboardLayout
          └─> ToolsView
              ├─> CashFlowPlanner (invoicesData, expenseData, creditCardData)
              └─> DailySpendCalculatorTab (cashFlowData, performanceData, networkTermsData)
```

---

## Testing Checklist

### Cash Flow Planner
- [ ] Summary cards show correct totals
- [ ] Incoming Money list shows all invoices due in next 30 days
- [ ] Upcoming Expenses list shows all expenses due in next 30 days
- [ ] Items are sorted by due date
- [ ] Items due ≤7 days are highlighted
- [ ] Calendar displays current month + next 30 days
- [ ] Calendar shows green/red backgrounds for net positive/negative days
- [ ] Today's date has blue border
- [ ] Clicking days shows tooltips with amounts
- [ ] Calendar amounts match detail panels

### Daily Spend Calculator
- [ ] Tab appears in Tools navigation
- [ ] Team Performance Overview table populates
- [ ] Total Available Funds calculation is correct
- [ ] Financial Resources breakdown expands/collapses
- [ ] Spending Scenarios calculate correctly
- [ ] Media Buyer allocations show for all buyers
- [ ] Budget inputs work and update totals
- [ ] Inactive buyers can expand to show all available offers
- [ ] Weekly payment terms are highlighted in green

---

## Future Enhancement Ideas

### For Cash Flow Planner
1. **Net Flow Summary** - Add running total showing cumulative cash position
2. **Week View Toggle** - Option to view by week instead of month
3. **Export Function** - Download cash flow calendar as PDF/Excel
4. **Historical Comparison** - Compare current month to previous months
5. **Cash Runway Indicator** - Visual gauge showing days until cash runs out at current burn rate

### For Daily Spend Calculator  
1. **Save Budget Templates** - Store common budget allocations
2. **Budget vs Actual Tracking** - Compare planned spend to actual
3. **ROI Alerts** - Notify when ROI drops below thresholds
4. **Auto-Budget Recommendations** - ML-based suggestions based on historical performance

---

**Date:** October 7, 2025  
**Changes By:** AI Assistant  
**Request:** Reorganize Cash Flow Planner and move Daily Spend Calculator to separate tab

