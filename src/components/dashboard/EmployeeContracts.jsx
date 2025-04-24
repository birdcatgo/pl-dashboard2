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

const ContractPreview = ({ content, employee, onDownload }) => {
  if (!employee) {
    return (
      <div className="p-4 text-center text-gray-500">
        Select an employee to preview the contract
      </div>
    );
  }

  const formattedContent = content
    .replace(/\[DATE\]/g, new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }))
    .replace(/\[EMPLOYEE_NAME\]/g, employee.name)
    .replace(/\[BASE_PAY\]/g, formatCurrency(employee.basePay))
    .replace(/\[FREQUENCY\]/g, employee.frequency)
    .replace(/\[COMMISSION\]/g, employee.commission)
    .replace(/\[START_DATE\]/g, new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }))
    .replace(/\[STATE\]/g, 'Florida')
    .replace(/\[POSITION\]/g, 'Media Buyer')
    .replace(/\[EMAIL\]/g, employee.email || '')
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

const EmployeeContracts = ({ employeeData }) => {
  const [selectedContract, setSelectedContract] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const generateContract = (employee, contractType) => {
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
      .replace(/\[EMPLOYEE_NAME\]/g, employee.name)
      .replace(/\[BASE_PAY\]/g, formatCurrency(employee.basePay))
      .replace(/\[FREQUENCY\]/g, employee.frequency)
      .replace(/\[COMMISSION\]/g, employee.commission)
      .replace(/\[START_DATE\]/g, formattedDate)
      .replace(/\[STATE\]/g, 'Florida')
      .replace(/\[POSITION\]/g, 'Media Buyer')
      .replace(/\[EMAIL\]/g, employee.email || '')
      .replace(/Company Representative: ________________________/, 'Company Representative: Nick Torson');
  };

  const handleDownload = (employee, contractType) => {
    const content = isEditing ? editedContent : generateContract(employee, contractType);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${employee.name}-${contractType}-contract.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
              setSelectedContract({ employee: row, type: 'nda' });
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
              setSelectedContract({ employee: row, type: 'mediaBuyer' });
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
              setSelectedContract({ employee: row, type: 'thirtyDay' });
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
              setSelectedContract({ employee: row, type: 'postThirtyDay' });
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
      <Card>
        <CardHeader>
          <CardTitle>Employee Information</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={employeeData || []}
          />
        </CardContent>
      </Card>

      <Dialog open={!!selectedContract} onOpenChange={() => setSelectedContract(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedContract?.employee?.name} - {selectedContract?.type === 'nda' ? 'NDA' : 
                selectedContract?.type === 'mediaBuyer' ? 'Media Buyer Agreement' :
                selectedContract?.type === 'thirtyDay' ? '30 Day Contract' : 'Post 30 Day Contract'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? <Eye className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                {isEditing ? 'Preview' : 'Edit'}
              </Button>
              <Button onClick={() => handleDownload(selectedContract.employee, selectedContract.type)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
            {isEditing ? (
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[500px] font-mono text-sm"
              />
            ) : (
              <div className="whitespace-pre-wrap font-mono text-sm border p-4 rounded-md min-h-[500px]">
                {editedContent}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeContracts;