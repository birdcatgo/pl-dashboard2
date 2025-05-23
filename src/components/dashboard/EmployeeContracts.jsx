import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DataTable from '@/components/ui/DataTable';
import { FileText, Download, Eye, Edit, Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { NDA_TEMPLATE, MEDIA_BUYER_CONTRACTOR_AGREEMENT, APPENDIX_A_FIRST_30_DAYS, APPENDIX_B_POST_30_DAYS } from '@/lib/contract-templates';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { jsPDF } from 'jspdf';

const ContractPreview = ({ content, contractor, onDownload }) => {
  if (!contractor) {
    return (
      <div className="p-4 text-center text-gray-500">
        Select a contractor to preview the contract
      </div>
    );
  }

  const formattedContent = content
    .replace(/\[DATE\]/g, new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }))
    .replace(/\[EMPLOYEE_NAME\]/g, contractor.name)
    .replace(/\[BASE_PAY\]/g, formatCurrency(contractor.basePay))
    .replace(/\[FREQUENCY\]/g, contractor.frequency)
    .replace(/\[COMMISSION\]/g, contractor.commission)
    .replace(/\[START_DATE\]/g, new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }))
    .replace(/\[STATE\]/g, 'California')
    .replace(/\[POSITION\]/g, 'Media Buyer')
    .replace(/\[EMAIL\]/g, contractor.email || '')
    .replace(/Company Representative: ________________________/, 'Company Representative: Nick Torson');

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={onDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>
      <div className="whitespace-pre-wrap font-mono text-sm border p-4 rounded-md min-h-[500px]">
        {formattedContent}
      </div>
    </div>
  );
};

// Debug: Log the imported templates
console.log('Imported Templates:', {
  NDA_TEMPLATE: typeof NDA_TEMPLATE,
  MEDIA_BUYER_CONTRACTOR_AGREEMENT: typeof MEDIA_BUYER_CONTRACTOR_AGREEMENT,
  APPENDIX_A_FIRST_30_DAYS: typeof APPENDIX_A_FIRST_30_DAYS,
  APPENDIX_B_POST_30_DAYS: typeof APPENDIX_B_POST_30_DAYS
});

const formatCurrency = (value) => {
  if (!value) return '$0';
  const numericValue = value.toString().replace(/[^0-9.]/g, '');
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numericValue);
};

const ContractorContracts = ({ contractorData }) => {
  const [selectedContract, setSelectedContract] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  const emailTemplate = `Hi [EMPLOYEE_NAME],

Hope you're doing well! When you have a moment, could you please review and sign the following three documents:

Media Buyer Contractor Agreement
NDA (Non-Disclosure Agreement)
Post 30-Day Agreement

Let me know if you have any questions or need clarification on anything. If possible, it'd be great to have them signed and back to us by [DATE] so we can keep everything on track.

Thanks heaps,`;

  const generateContract = (contractor, contractType) => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let template;
    switch (contractType) {
      case 'nda':
        template = NDA_TEMPLATE;
        break;
      case 'mediaBuyer':
        template = MEDIA_BUYER_CONTRACTOR_AGREEMENT;
        break;
      case 'thirtyDay':
        template = APPENDIX_A_FIRST_30_DAYS;
        break;
      case 'postThirtyDay':
        template = APPENDIX_B_POST_30_DAYS;
        break;
      default:
        return '';
    }

    return template
      .replace(/\[DATE\]/g, formattedDate)
      .replace(/\[EMPLOYEE_NAME\]/g, contractor.name)
      .replace(/\[BASE_PAY\]/g, formatCurrency(contractor.basePay))
      .replace(/\[FREQUENCY\]/g, contractor.frequency)
      .replace(/\[COMMISSION\]/g, contractor.commission)
      .replace(/\[START_DATE\]/g, formattedDate)
      .replace(/\[STATE\]/g, 'California')
      .replace(/\[POSITION\]/g, 'Media Buyer')
      .replace(/\[EMAIL\]/g, contractor.email || '')
      .replace(/Company Representative: ________________________/, 'Company Representative: Nick Torson');
  };

  const handleDownload = (contractor, contractType) => {
    const content = isEditing ? editedContent : generateContract(contractor, contractType);
    
    // Create new PDF document
    const doc = new jsPDF();
    
    // Set font size and type
    doc.setFontSize(12);
    
    // Split the content into lines that fit the page width
    const lines = doc.splitTextToSize(content, 180);
    
    // Initialize variables for pagination
    let currentPage = 1;
    let yPosition = 20;
    const lineHeight = 7;
    
    // Add lines to PDF, creating new pages as needed
    lines.forEach(line => {
      // If we're near the bottom of the page, create a new one
      if (yPosition > 270) {
        doc.addPage();
        currentPage++;
        yPosition = 20;
      }
      
      // Add the line of text
      doc.text(line, 15, yPosition);
      yPosition += lineHeight;
    });

    // Save the PDF
    doc.save(`${contractor.name}-${contractType}-contract.pdf`);
  };

  const columns = [
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Base Pay",
      accessorKey: "basePay",
      cell: (row) => formatCurrency(row.basePay)
    },
    {
      header: "Frequency",
      accessorKey: "frequency",
      cell: (row) => row.frequency
    },
    {
      header: "Commission",
      accessorKey: "commission",
      cell: (row) => row.commission
    },
    {
      header: "Contract Type",
      accessorKey: "contractType",
      cell: (row) => row.contractType
    },
    {
      header: "Email",
      accessorKey: "email",
      cell: (row) => row.email
    },
    {
      header: "NDA Signed",
      accessorKey: "ndaSigned",
      cell: (row) => (
        <div className="flex justify-center">
          {row.ndaSigned ? (
            <Check className="h-5 w-5 text-green-500" />
          ) : (
            <X className="h-5 w-5 text-red-500" />
          )}
        </div>
      )
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: (row) => (
        <div className="flex justify-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setSelectedContract({ contractor: row, type: 'nda' });
              setEditedContent(generateContract(row, 'nda'));
              setIsEditing(false);
            }}
          >
            <FileText className="h-4 w-4 mr-2" />
            NDA
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setSelectedContract({ contractor: row, type: 'mediaBuyer' });
              setEditedContent(generateContract(row, 'mediaBuyer'));
              setIsEditing(false);
            }}
          >
            <FileText className="h-4 w-4 mr-2" />
            Media Buyer
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setSelectedContract({ contractor: row, type: 'thirtyDay' });
              setEditedContent(generateContract(row, 'thirtyDay'));
              setIsEditing(false);
            }}
          >
            <FileText className="h-4 w-4 mr-2" />
            30 Day
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setSelectedContract({ contractor: row, type: 'postThirtyDay' });
              setEditedContent(generateContract(row, 'postThirtyDay'));
              setIsEditing(false);
            }}
          >
            <FileText className="h-4 w-4 mr-2" />
            Post 30 Day
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {showInstructions && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Instructions</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowInstructions(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Process Overview:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Select a contractor from the table below</li>
                <li>Generate required contracts using the action buttons (NDA, Media Buyer, 30 Day, Post 30 Day)</li>
                <li>Review each contract and edit if necessary using the Edit button</li>
                <li>Download the contracts as PDFs using the Download button</li>
                <li>Send contracts to the contractor for signature</li>
              </ol>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Email Template:</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <pre className="text-sm whitespace-pre-wrap">{emailTemplate}</pre>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => navigator.clipboard.writeText(emailTemplate)}
                >
                  Copy Template
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Contract Types:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>NDA:</strong> Required for all employees before starting</li>
                <li><strong>Media Buyer Agreement:</strong> Main contractor agreement</li>
                <li><strong>30 Day Contract:</strong> Initial trial period agreement</li>
                <li><strong>Post 30 Day:</strong> Long-term agreement after trial period</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Contractor Information</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={contractorData || []}
          />
        </CardContent>
      </Card>

      <Dialog open={!!selectedContract} onOpenChange={() => setSelectedContract(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-4">
          <DialogHeader className="pb-2">
            <DialogTitle>
              {selectedContract?.contractor?.name} - {selectedContract?.type === 'nda' ? 'NDA' : 
                selectedContract?.type === 'mediaBuyer' ? 'Media Buyer Agreement' :
                selectedContract?.type === 'thirtyDay' ? '30 Day Contract' : 'Post 30 Day Contract'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="sticky top-0 bg-white z-10 flex justify-end gap-2 py-2 border-b">
              <Button onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? <Eye className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                {isEditing ? 'Preview' : 'Edit'}
              </Button>
              <Button onClick={() => handleDownload(selectedContract.contractor, selectedContract.type)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto mt-2">
              {isEditing ? (
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[500px] font-mono text-sm"
                />
              ) : (
                <div className="whitespace-pre-wrap font-mono text-sm border p-2 rounded-md min-h-[500px]">
                  {editedContent}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractorContracts;