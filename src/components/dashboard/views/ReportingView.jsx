import React from 'react';
import { LineChart } from 'lucide-react';
import { Button } from "@/components/ui/button";
import PageHeader from '../../ui/PageHeader';
import CompactDateSelector from '../../ui/CompactDateSelector';
import EODReport from '../EODReport';
import OfferPerformance from '../OfferPerformance';
import EnhancedOfferPerformance from '../EnhancedOfferPerformance';
import ThirtyDayChallenge from '../ThirtyDayChallenge';
import MediaBuyerPerformance from '../MediaBuyerPerformance';
import Highlights from '../Highlights';

const ReportingView = ({ 
  reportingSubview, 
  setReportingSubview, 
  performanceData, 
  dateRange, 
  handleDateChange,
  getLatestDataDate,
  networkTermsData 
}) => {
  return (
    <div className="space-y-8">
      <PageHeader 
        title="Reporting" 
        subtitle="Performance metrics and analytics"
        icon={LineChart}
      />
      
      {/* Reporting Subviews Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex space-x-4">
          <Button
            variant={reportingSubview === 'eod-report' ? 'default' : 'outline'}
            onClick={() => setReportingSubview('eod-report')}
          >
            EOD Report
          </Button>
          <Button
            variant={reportingSubview === 'offer-performance' ? 'default' : 'outline'}
            onClick={() => setReportingSubview('offer-performance')}
          >
            Offer Performance
          </Button>
          <Button
            variant={reportingSubview === 'media-buyers' ? 'default' : 'outline'}
            onClick={() => setReportingSubview('media-buyers')}
          >
            Media Buyers
          </Button>
          <Button
            variant={reportingSubview === 'highlights' ? 'default' : 'outline'}
            onClick={() => setReportingSubview('highlights')}
          >
            Highlights
          </Button>
        </div>
      </div>

      {/* Date Selector only for Offer Performance and Media Buyers views */}
      {(reportingSubview === 'offer-performance' || reportingSubview === 'media-buyers') && (
        <div className="mb-6">
          <CompactDateSelector 
            onDateChange={handleDateChange}
            selectedPeriod={dateRange.period}
            latestDate={getLatestDataDate(performanceData?.data)}
          />
        </div>
      )}

      {/* Render the appropriate subview content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        {reportingSubview === 'eod-report' && (
          <EODReport 
            performanceData={performanceData?.data || []}
          />
        )}
        {reportingSubview === 'offer-performance' && (
          <div className="space-y-8">
            {/* Enhanced Offer Performance with Scaling Recommendations */}
            <EnhancedOfferPerformance 
              performanceData={performanceData?.data || []}
              dateRange={dateRange}
            />
            
            {/* Divider */}
            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-600">Additional Analysis</h3>
            </div>
            
            {/* Original Detailed Analysis */}
            <OfferPerformance 
              performanceData={performanceData?.data || []}
              dateRange={dateRange}
            />
          </div>
        )}
        {reportingSubview === 'media-buyers' && (
          <div className="space-y-8">
            <ThirtyDayChallenge 
              performanceData={performanceData?.data || []} 
              commissions={performanceData?.commissions || []}
            />
            <div className="mt-8 pt-8 border-t">
              <h3 className="text-lg font-semibold mb-4">Performance Summary</h3>
              <MediaBuyerPerformance 
                performanceData={performanceData?.data || []}
                dateRange={dateRange}
                commissions={performanceData?.commissions || []}
              />
            </div>
          </div>
        )}
        {reportingSubview === 'highlights' && (
          <div className="space-y-6">
            <Highlights 
              performanceData={performanceData?.data || []}
              dateRange={dateRange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportingView; 