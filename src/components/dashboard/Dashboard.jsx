const tabs = [
  {
    id: 'overview',
    label: 'Overview',
    icon: '📊',
    content: <Overview />
  },
  {
    id: 'financial-overview',
    label: 'Financial Overview',
    icon: '💰',
    content: <FinancialOverview plData={plData} />
  },
  {
    id: 'highlights',
    label: 'Highlights',
    icon: '✨',
    content: <Highlights />
  },
  {
    id: 'cash-position',
    label: 'Cash Position',
    icon: '💵',
    content: <CashPosition />
  }
]; 