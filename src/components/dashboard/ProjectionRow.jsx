import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import CustomTooltip from './CustomTooltip'; // Ensure path is correct
import { format } from 'date-fns';

const formatCurrency = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const ProjectionRow = ({ day }) => {
  const [tooltipData, setTooltipData] = useState({ content: '', position: { x: 0, y: 0 } });
  const [showTooltip, setShowTooltip] = useState(false);

  const handleMouseEnter = (event, content) => {
    const rect = event.target.getBoundingClientRect();
    setTooltipData({
      content,
      position: { x: rect.left + window.scrollX, y: rect.top + window.scrollY + 20 },
    });
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <>
      <tr>
        <td className="px-6 py-4 text-sm text-gray-900">
          {day.date ? format(day.date, 'MMM dd, yyyy') : 'Invalid Date'}
        </td>
        {/* Invoice Payment Column */}
        <td
          className="px-6 py-4 text-sm text-right text-green-600 cursor-pointer"
          onMouseEnter={(e) =>
            handleMouseEnter(
              e,
              day.inflows
                ?.map((inflow) => `${inflow.network}: ${formatCurrency(inflow.amount)}`)
                .join('\n') || 'No data'
            )
          }
          onMouseLeave={handleMouseLeave}
        >
          {day.invoicePayment > 0 ? formatCurrency(day.invoicePayment) : '-'}
        </td>
        {/* Payroll Column */}
        <td
          className="px-6 py-4 text-sm text-right text-red-600 cursor-pointer"
          onMouseEnter={(e) =>
            handleMouseEnter(
              e,
              day.outflows
                ?.filter((outflow) => outflow.type === 'payroll')
                .map((outflow) => `${outflow.description}: ${formatCurrency(outflow.amount)}`)
                .join('\n') || 'No data'
            )
          }
          onMouseLeave={handleMouseLeave}
        >
          {day.payroll > 0 ? formatCurrency(day.payroll) : '-'}
        </td>
        {/* Credit Card Payment Column */}
        <td
          className="px-6 py-4 text-sm text-right text-red-600 cursor-pointer"
          onMouseEnter={(e) =>
            handleMouseEnter(
              e,
              day.outflows
                ?.filter((outflow) => outflow.type === 'credit_card')
                .map((outflow) => `${outflow.description}: ${formatCurrency(outflow.amount)}`)
                .join('\n') || 'No data'
            )
          }
          onMouseLeave={handleMouseLeave}
        >
          {day.creditCardPayment > 0 ? formatCurrency(day.creditCardPayment) : '-'}
        </td>
        <td className="px-6 py-4 text-sm text-right font-medium">
          {formatCurrency(day.balance)}
        </td>
      </tr>
      {showTooltip &&
        ReactDOM.createPortal(
          <CustomTooltip
            content={tooltipData.content}
            style={{
              position: 'absolute',
              left: `${tooltipData.position.x}px`,
              top: `${tooltipData.position.y}px`,
              zIndex: 1000,
            }}
          />,
          document.body // Ensures the tooltip renders in a valid location
        )}
    </>
  );
};

export default ProjectionRow;
