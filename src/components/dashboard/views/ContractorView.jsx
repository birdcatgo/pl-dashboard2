import React from 'react';
import { UserCheck } from 'lucide-react';
import { Button } from "@/components/ui/button";
import PageHeader from '../../ui/PageHeader';
import ContractorContracts from '../ContractorContracts';
import { NDA_TEMPLATE, APPENDIX_A_FIRST_30_DAYS, APPENDIX_B_POST_30_DAYS, MEDIA_BUYER_CONTRACTOR_AGREEMENT } from '@/lib/contract-templates';

const ContractorView = ({ 
  contractorSubview, 
  setContractorSubview,
  employeeData
}) => {
  return (
    <div className="space-y-8">
      <PageHeader 
        title="Contractor Information" 
        subtitle="Manage contractor contracts and documentation"
        icon={UserCheck}
      />
      
      {/* Contractor Information Subviews Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex space-x-4">
          <Button
            variant={contractorSubview === 'contracts' ? 'default' : 'outline'}
            onClick={() => setContractorSubview('contracts')}
          >
            Contractor Contracts
          </Button>
          <Button
            variant={contractorSubview === 'nda' ? 'default' : 'outline'}
            onClick={() => setContractorSubview('nda')}
          >
            NDA Template
          </Button>
          <Button
            variant={contractorSubview === 'media-buyer' ? 'default' : 'outline'}
            onClick={() => setContractorSubview('media-buyer')}
          >
            Media Buyer Agreement
          </Button>
          <Button
            variant={contractorSubview === '30-day' ? 'default' : 'outline'}
            onClick={() => setContractorSubview('30-day')}
          >
            30 Day Contract
          </Button>
          <Button
            variant={contractorSubview === 'post-30-day' ? 'default' : 'outline'}
            onClick={() => setContractorSubview('post-30-day')}
          >
            Post 30 Day Contract
          </Button>
        </div>
      </div>

      {/* Render the appropriate subview content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        {contractorSubview === 'contracts' && (
          <ContractorContracts contractorData={employeeData} />
        )}
        {contractorSubview === 'nda' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Non-Disclosure Agreement Template</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap font-mono text-sm">
                {NDA_TEMPLATE}
              </pre>
            </div>
          </div>
        )}
        {contractorSubview === 'media-buyer' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Media Buyer Agreement Template</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap font-mono text-sm">
                {MEDIA_BUYER_CONTRACTOR_AGREEMENT}
              </pre>
            </div>
          </div>
        )}
        {contractorSubview === '30-day' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">30 Day Contract Template</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap font-mono text-sm">
                {APPENDIX_A_FIRST_30_DAYS}
              </pre>
            </div>
          </div>
        )}
        {contractorSubview === 'post-30-day' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Post 30 Day Contract Template</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap font-mono text-sm">
                {APPENDIX_B_POST_30_DAYS}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractorView; 