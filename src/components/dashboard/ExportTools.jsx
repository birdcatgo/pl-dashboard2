import React, { useState } from 'react';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import { pdf } from '@react-pdf/renderer';
import { Download, Clock } from 'lucide-react';

const ExportButton = ({ icon: Icon, label, onClick }) => (
  <button 
    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
    onClick={onClick}
  >
    <Icon className="w-5 h-5" />
    <span>{label}</span>
  </button>
);

const createPDFDocument = (data) => {
  return {
    content: [
      { text: 'Dashboard Report', style: 'header' },
      ...Object.entries(data).map(([key, value]) => ({
        text: `${key}: ${JSON.stringify(value, null, 2)}`,
      })),
    ],
    styles: {
      header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
    },
  };
};

const ExportTools = ({ data }) => {
  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    
    Object.entries(data).forEach(([sheetName, sheetData]) => {
      const worksheet = workbook.addWorksheet(sheetName);
      
      // Add headers
      const headers = Object.keys(sheetData[0] || {});
      worksheet.addRow(headers);
      
      // Add data
      sheetData.forEach(row => {
        worksheet.addRow(Object.values(row));
      });
    });
    
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'dashboard_export.xlsx');
  };

  const handleExportPDF = async () => {
    const MyDoc = createPDFDocument(data);
    const blob = await pdf(MyDoc).toBlob();
    saveAs(blob, 'dashboard_report.pdf');
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-medium mb-4">Export Options</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <ExportButton icon={Download} label="Export Excel" onClick={handleExportExcel} />
        <ExportButton icon={Download} label="Export PDF" onClick={handleExportPDF} />
        <ExportButton icon={Clock} label="Schedule Reports" onClick={() => console.log('Schedule modal')} />
      </div>
    </div>
  );
};

export default ExportTools;
