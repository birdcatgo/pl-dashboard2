import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DataTable from '@/components/ui/DataTable';
import { FileText, Download, Eye, Edit, Check, X, Plus } from 'lucide-react';
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
import AddContractor from './AddContractor';

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
    .replace(/\[CONTRACTOR_NAME\]/g, contractor.name)
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

const ContractorContracts = () => {
  const [contractors, setContractors] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  const handleAddContractor = (newContractor) => {
    setContractors([...contractors, newContractor]);
  };

  const handleGenerateAllContracts = (contractor) => {
    const contracts = [
      { type: 'nda', name: 'NDA' },
      { type: 'mediaBuyer', name: 'Media Buyer Agreement' },
      { type: 'thirtyDay', name: '30-Day Contract' },
      { type: 'postThirtyDay', name: 'Post 30-Day Contract' }
    ];

    contracts.forEach(contract => {
      handleDownload(contractor, contract.type);
    });
  };

  const emailTemplate = `Hi [CONTRACTOR_NAME],

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
      .replace(/\[CONTRACTOR_NAME\]/g, contractor.name)
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
    
    // Set default font to Arial
    doc.setFont('helvetica');
    
    // Add document title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    let title = '';
    switch (contractType) {
      case 'nda':
        title = 'Non-Disclosure Agreement';
        break;
      case 'mediaBuyer':
        title = 'Media Buyer Contractor Agreement';
        break;
      case 'thirtyDay':
        title = 'Appendix A – First 30 Days Contractor Agreement';
        break;
      case 'postThirtyDay':
        title = 'Appendix B – Post 30 Days Contractor Agreement';
        break;
    }
    doc.text(title, 105, 20, { align: 'center' });
    
    // Add company information
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Convert 2 Freedom LLC', 105, 30, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text('4801 Laguna Blvd Ste 105 #751', 105, 35, { align: 'center' });
    doc.text('Elk Grove, CA 95758', 105, 40, { align: 'center' });
    
    // Add date
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.setFont('helvetica', 'bold');
    doc.text('Date:', 20, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(today, 40, 50);
    
    // Add contractor information
    if (contractType === 'nda') {
      doc.setFont('helvetica', 'bold');
      doc.text('Contractor:', 20, 60);
      doc.setFont('helvetica', 'normal');
      doc.text(contractor.name, 50, 60);
      doc.setFont('helvetica', 'bold');
      doc.text('Email:', 20, 65);
      doc.setFont('helvetica', 'normal');
      doc.text(contractor.email || 'N/A', 50, 65);
    } else if (contractType !== 'mediaBuyer') {
      // Only add the agreement text for non-NDA and non-Media Buyer contracts
      doc.text('This Agreement is made and entered into as of the above date by and between:', 20, 60);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Contractor:', 20, 70);
      doc.setFont('helvetica', 'normal');
      doc.text(contractor.name, 50, 70);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Position:', 20, 75);
      doc.setFont('helvetica', 'normal');
      doc.text('Media Buyer', 50, 75);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Compensation:', 20, 80);
      doc.setFont('helvetica', 'normal');
      doc.text(`${contractor.commission}% of net profit`, 50, 80);
    } else {
      // Media Buyer contract - just basic info
      doc.setFont('helvetica', 'bold');
      doc.text('Contractor:', 20, 60);
      doc.setFont('helvetica', 'normal');
      doc.text(contractor.name, 50, 60);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Position:', 20, 65);
      doc.setFont('helvetica', 'normal');
      doc.text('Media Buyer', 50, 65);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Compensation:', 20, 70);
      doc.setFont('helvetica', 'normal');
      doc.text(`${contractor.commission}% of net profit`, 50, 70);
    }
    
    // Add a line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(20, contractType === 'nda' ? 70 : (contractType === 'mediaBuyer' ? 75 : 85), 190, contractType === 'nda' ? 70 : (contractType === 'mediaBuyer' ? 75 : 85));
    
    // Format the content with proper styling
    const formattedContent = content
      .replace(/^(\d+\.\s+[A-Z][^:\n]+):/gm, (match) => {
        return '\n\n' + match; // Double line before section headers
      })
      .replace(/^([A-Z][^:\n]+):/gm, (match) => {
        return '\n\n' + match; // Double line before non-numbered headers
      })
      .replace(/^\s*•\s*/gm, '    • '); // Indent bullet points
    
    // Remove any duplicate signature blocks and redundant sections
    const cleanedContent = formattedContent
      // Remove duplicate signature blocks
      .replace(/(IN WITNESS WHEREOF.*?Company Representative:.*?Date:.*?)(?=\n\nIN WITNESS WHEREOF|$)/gs, '$1')
      // Remove redundant intro text for Media Buyer contract
      .replace(/This Agreement is made and entered into as of the above date by and between:.*?Media Buyer Contractor Agreement/gs, 'Media Buyer Contractor Agreement')
      // Remove duplicate contractor info in NDA
      .replace(/Contractor:.*?Email:.*?(?=\n\n\d+\.\s+Definition)/gs, '');
    
    // Split the content into lines that fit the page width
    const lines = doc.splitTextToSize(cleanedContent, 170);
    
    // Initialize variables for pagination
    let currentPage = 1;
    let yPosition = contractType === 'nda' ? 80 : (contractType === 'mediaBuyer' ? 85 : 95); // Start content below header info
    const lineHeight = 7; // Standard line height
    
    // Add lines to PDF, creating new pages as needed
    lines.forEach(line => {
      // If we're near the bottom of the page, create a new one
      if (yPosition > 270) {
        doc.addPage();
        currentPage++;
        yPosition = 20;
      }
      
      // Style section headers
      if (line.match(/^\d+\.\s+[A-Z][^:\n]+:/) || line.match(/^[A-Z][^:\n]+:/)) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
      }
      
      // Add the line of text
      doc.text(line, 20, yPosition);
      yPosition += lineHeight;
    });

    // Add a line separator before signature section
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPosition + 5, 190, yPosition + 5);
    
    // Add "IN WITNESS WHEREOF" section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.', 20, yPosition + 20);
    
    // Add signature blocks
    const signatureY = yPosition + 35;
    
    // Contractor signature block
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('Contractor Signature: ________________________', 20, signatureY);
    doc.text('Date: ________________________', 20, signatureY + 10);
    
    // Company signature block
    doc.text('Company Representative: Nick Torson', 20, signatureY + 25);
    doc.text(`Date: ${today}`, 20, signatureY + 35);
    
    // Add signature image
    doc.addImage('/signatures/nick-signature.png', 'PNG', 20, signatureY + 20, 40, 20);

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
      cell: (row) => `${row.commission}%`
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
            onClick={() => handleGenerateAllContracts(row)}
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate All
          </Button>
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
            30-Day
          </Button>
        </div>
      )
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contractor Contracts</CardTitle>
      </CardHeader>
      <CardContent>
        <AddContractor onAdd={handleAddContractor} />
        
        <DataTable
          columns={columns}
          data={contractors}
          searchable
          pagination
        />

        <Dialog open={!!selectedContract} onOpenChange={() => setSelectedContract(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {selectedContract?.type === 'nda' && 'NDA Preview'}
                {selectedContract?.type === 'mediaBuyer' && 'Media Buyer Agreement Preview'}
                {selectedContract?.type === 'thirtyDay' && '30-Day Contract Preview'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex justify-end mb-4">
              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
                className="mr-2"
              >
                {isEditing ? 'Preview' : 'Edit'}
              </Button>
              <Button
                onClick={() => handleDownload(selectedContract?.contractor, selectedContract?.type)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>

            {isEditing ? (
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[500px] font-mono"
              />
            ) : (
              <ContractPreview
                content={editedContent}
                contractor={selectedContract?.contractor}
                onDownload={() => handleDownload(selectedContract?.contractor, selectedContract?.type)}
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ContractorContracts;