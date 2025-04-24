import React from 'react';

const DataTable = ({
  columns,
  data,
  onRowClick,
  className = '',
  headerClassName = '',
  rowClassName = '',
  cellClassName = '',
  frozenColumns = 0,
  showZebra = true
}) => {
  const renderCell = (column, row) => {
    if (typeof column.cell === 'function') {
      return column.cell(row);
    }
    if (column.cell?.render) {
      return column.cell.render(row);
    }
    return row[column.accessorKey || column.key];
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  scope="col"
                  className={`
                    px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider
                    ${index < frozenColumns ? 'sticky left-0 bg-gray-50 z-10' : ''}
                    ${headerClassName}
                  `}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick?.(row)}
                className={`
                  hover:bg-[#F9FAFB] cursor-pointer transition-colors duration-150
                  ${showZebra && rowIndex % 2 === 0 ? 'bg-gray-50/50' : ''}
                  ${rowClassName}
                `}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={`
                      px-6 py-4 whitespace-nowrap text-sm
                      ${colIndex < frozenColumns ? 'sticky left-0 bg-inherit z-10' : ''}
                      ${cellClassName}
                    `}
                  >
                    {renderCell(column, row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable; 