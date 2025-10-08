import React from 'react';
import { Wrench } from 'lucide-react';
import { Button } from "@/components/ui/button";
import PageHeader from '../../ui/PageHeader';
import DailyUpdate from '../DailyUpdate';
import DailyPLUpdate from '../DailyPLUpdate';
import TimezoneConverter from '../TimezoneConverter';
import CashFlowPlanner from '../CashFlowPlanner';
import NetworkPayTerms from '../NetworkPayTerms';
import NetworkCapsTab from '../NetworkCapsTab';
import ScheduledTasksManager from '../ScheduledTasksManager';
import MediaBuyerEODManager from '../MediaBuyerEODManager';
import ActiveFanpagesManager from '../ActiveFanpagesManager';
import DailySpendCalculatorTab from '../DailySpendCalculatorTab';


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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {/* Daily Operations */}
          <Button
            variant={toolsSubview === 'daily-update' ? 'default' : 'outline'}
            onClick={() => setToolsSubview('daily-update')}
            className="text-sm"
          >
            Daily Updates
          </Button>
          <Button
            variant={toolsSubview === 'daily-pl-update' ? 'default' : 'outline'}
            onClick={() => setToolsSubview('daily-pl-update')}
            className="text-sm"
          >
            Daily P&L Update
          </Button>
          
          {/* Media Buyer Management */}
          <Button
            variant={toolsSubview === 'media-buyer-eod' ? 'default' : 'outline'}
            onClick={() => setToolsSubview('media-buyer-eod')}
            className="text-sm"
          >
            Media Buyer EOD
          </Button>
          <Button
            variant={toolsSubview === 'active-fanpages' ? 'default' : 'outline'}
            onClick={() => setToolsSubview('active-fanpages')}
            className="text-sm"
          >
            Active Fanpages
          </Button>
          
          {/* Network Management */}
          <Button
            variant={toolsSubview === 'network-caps' ? 'default' : 'outline'}
            onClick={() => setToolsSubview('network-caps')}
            className="text-sm"
          >
            Network Caps
          </Button>
          <Button
            variant={toolsSubview === 'network-pay-terms' ? 'default' : 'outline'}
            onClick={() => setToolsSubview('network-pay-terms')}
            className="text-sm"
          >
            Network Pay Terms
          </Button>
          
          {/* Financial Tools */}
          <Button
            variant={toolsSubview === 'cash-flow-planner' ? 'default' : 'outline'}
            onClick={() => setToolsSubview('cash-flow-planner')}
            className="text-sm"
          >
            Cash Flow Planner
          </Button>
          <Button
            variant={toolsSubview === 'daily-spend-calculator' ? 'default' : 'outline'}
            onClick={() => setToolsSubview('daily-spend-calculator')}
            className="text-sm"
          >
            Daily Spend Calculator
          </Button>
          
          {/* Task Management */}
          <Button
            variant={toolsSubview === 'scheduled-tasks' ? 'default' : 'outline'}
            onClick={() => setToolsSubview('scheduled-tasks')}
            className="text-sm"
          >
            Scheduled Tasks
          </Button>
          
          {/* Utilities */}
          <Button
            variant={toolsSubview === 'timezone' ? 'default' : 'outline'}
            onClick={() => setToolsSubview('timezone')}
            className="text-sm"
          >
            Timezone Converter
          </Button>
        </div>
      </div>

      {/* Render the appropriate subview content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        {toolsSubview === 'daily-update' && <DailyUpdate />}
        {toolsSubview === 'daily-pl-update' && <DailyPLUpdate performanceData={performanceData} />}
        {toolsSubview === 'network-caps' && (
          <NetworkCapsTab 
            networkTerms={networkTermsData || []}
          />
        )}
        {toolsSubview === 'timezone' && <TimezoneConverter />}
        {toolsSubview === 'cash-flow-planner' && (
          <CashFlowPlanner 
            performanceData={performanceData?.data ? { data: performanceData.data } : { data: [] }}
            creditCardData={[
              ...(cashFlowData?.financialResources?.cashAccounts || []),
              ...(cashFlowData?.financialResources?.creditCards || [])
            ]}
            upcomingExpenses={expenseData || []}
            invoicesData={invoiceData || []}
            networkExposureData={networkTermsData || []}
            cashFlowData={cashFlowData}
          />
        )}
        {toolsSubview === 'network-pay-terms' && <NetworkPayTerms performanceData={performanceData} />}
        {toolsSubview === 'daily-spend-calculator' && (
          <DailySpendCalculatorTab 
            cashManagementData={cashFlowData}
            performanceData={performanceData?.data || []}
            offerCaps={networkTermsData || []}
          />
        )}
        {toolsSubview === 'scheduled-tasks' && <ScheduledTasksManager />}
        {toolsSubview === 'media-buyer-eod' && <MediaBuyerEODManager />}
        {toolsSubview === 'active-fanpages' && <ActiveFanpagesManager />}
      </div>
    </div>
  );
};

export default ToolsView; 