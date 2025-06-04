import React from 'react';
import { Wrench } from 'lucide-react';
import { Button } from "@/components/ui/button";
import PageHeader from '../../ui/PageHeader';
import DailyUpdate from '../DailyUpdate';
import DailyPLUpdate from '../DailyPLUpdate';
import AdAccounts from '../AdAccounts';
import TimezoneConverter from '../TimezoneConverter';
import CashFlowPlanner from '../CashFlowPlanner';
import NetworkPayTerms from '../NetworkPayTerms';
import NetworkCapsTab from '../NetworkCapsTab';

const ToolsView = ({ 
  toolsSubview, 
  setToolsSubview,
  performanceData,
  cashFlowData,
  expenseData,
  invoiceData,
  networkTermsData
}) => {
  return (
    <div className="space-y-8">
      <PageHeader 
        title="Tools" 
        subtitle="Utility tools and helpers"
        icon={Wrench}
      />
      
      {/* Tools Subviews Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex space-x-4">
          <Button
            variant={toolsSubview === 'daily-update' ? 'default' : 'outline'}
            onClick={() => setToolsSubview('daily-update')}
          >
            Daily Updates
          </Button>
          <Button
            variant={toolsSubview === 'daily-pl-update' ? 'default' : 'outline'}
            onClick={() => setToolsSubview('daily-pl-update')}
          >
            Daily P&L Update
          </Button>
          <Button
            variant={toolsSubview === 'ad-accounts' ? 'default' : 'outline'}
            onClick={() => setToolsSubview('ad-accounts')}
          >
            Ad Accounts
          </Button>
          <Button
            variant={toolsSubview === 'network-caps' ? 'default' : 'outline'}
            onClick={() => setToolsSubview('network-caps')}
          >
            Network Caps
          </Button>
          <Button
            variant={toolsSubview === 'timezone' ? 'default' : 'outline'}
            onClick={() => setToolsSubview('timezone')}
          >
            Timezone Converter
          </Button>
          <Button
            variant={toolsSubview === 'cash-flow-planner' ? 'default' : 'outline'}
            onClick={() => setToolsSubview('cash-flow-planner')}
          >
            Cash Flow Planner
          </Button>
          <Button
            variant={toolsSubview === 'network-pay-terms' ? 'default' : 'outline'}
            onClick={() => setToolsSubview('network-pay-terms')}
          >
            Network Pay Terms
          </Button>
        </div>
      </div>

      {/* Render the appropriate subview content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        {toolsSubview === 'daily-update' && <DailyUpdate />}
        {toolsSubview === 'daily-pl-update' && <DailyPLUpdate performanceData={performanceData} />}
        {toolsSubview === 'ad-accounts' && <AdAccounts />}
        {toolsSubview === 'network-caps' && (
          <NetworkCapsTab 
            networkTerms={networkTermsData || []}
          />
        )}
        {toolsSubview === 'timezone' && <TimezoneConverter />}
        {toolsSubview === 'cash-flow-planner' && (
          <CashFlowPlanner 
            performanceData={performanceData?.data ? { data: performanceData.data } : { data: [] }}
            creditCardData={cashFlowData?.financialResources || []}
            upcomingExpenses={expenseData || []}
            invoicesData={invoiceData || []}
            networkExposureData={networkTermsData || []}
          />
        )}
        {toolsSubview === 'network-pay-terms' && <NetworkPayTerms performanceData={performanceData} />}
      </div>
    </div>
  );
};

export default ToolsView; 