import React, { useState } from 'react';
import { DateRangePicker } from 'react-date-range'; // Import DateRangePicker
import Select from 'react-select'; // Import Select

const ReportBuilder = ({ config, onExport }) => {
    const [selectedSections, setSelectedSections] = useState([]);
    const [dateRange, setDateRange] = useState({ start: null, end: null });
    const [format, setFormat] = useState('pdf');
   
    const sections = [
      { id: 'overview', label: 'Overview Metrics' },
      { id: 'cashflow', label: 'Cash Flow Analysis' },
      { id: 'buyers', label: 'Media Buyer Performance' },
      { id: 'networks', label: 'Network Performance' },
      { id: 'projections', label: 'Financial Projections' }
    ];
   
    return (
      <div className="space-y-4">
        <div>
          <h5 className="text-sm font-medium mb-2">Select Sections</h5>
          <div className="grid grid-cols-2 gap-2">
            {sections.map(section => (
              <label key={section.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedSections.includes(section.id)}
                  onChange={() => toggleSection(section.id)}
                  className="rounded border-gray-300"
                />
                <span>{section.label}</span>
              </label>
            ))}
          </div>
        </div>
   
        <div className="grid grid-cols-2 gap-4">
          <DateRangePicker
            ranges={[dateRange]}
            onChange={(ranges) => setDateRange(ranges.selection)}
          />
          <Select
            value={format}
            onChange={(selectedOption) => setFormat(selectedOption.value)}
            options={[
              { value: 'pdf', label: 'PDF Report' },
              { value: 'excel', label: 'Excel Workbook' },
              { value: 'csv', label: 'CSV Archive' }
            ]}
          />
        </div>
   
        <button
          onClick={() => onExport({ sections: selectedSections, dateRange, format })}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
        >
          Generate Custom Report
        </button>
      </div>
    );
};

export default ReportBuilder;
