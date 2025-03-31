import React from 'react';
import { 
  TrendingUp, 
  Users, 
  Target, 
  AlertCircle, 
  DollarSign, 
  BarChart2,
  ArrowRight
} from 'lucide-react';

const ShortcutSection = ({ title, items }) => (
  <div className="mb-6">
    <h3 className="text-sm font-medium text-[#6B7280] mb-3">{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((item, index) => (
        <a
          key={index}
          href={item.href}
          className="group flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${item.iconBg}`}>
              {item.icon}
            </div>
            <div>
              <div className="text-sm font-medium text-[#6B7280] group-hover:text-gray-900 transition-colors duration-200">
                {item.title}
              </div>
              <div className="text-xs text-gray-400">{item.description}</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" />
        </a>
      ))}
    </div>
  </div>
);

const ShortcutArea = () => {
  const sections = [
    {
      title: "Top Offers",
      items: [
        {
          title: "Best Performing",
          description: "Highest ROI offers",
          icon: <TrendingUp className="w-5 h-5 text-[#2ECC71]" />,
          iconBg: "bg-green-50",
          href: "#top-offers"
        },
        {
          title: "Media Buyer Stats",
          description: "Performance by buyer",
          icon: <Users className="w-5 h-5 text-[#4A90E2]" />,
          iconBg: "bg-blue-50",
          href: "#media-buyers"
        }
      ]
    },
    {
      title: "Performance Flags",
      items: [
        {
          title: "ROI Alerts",
          description: "Offers below target",
          icon: <AlertCircle className="w-5 h-5 text-[#E74C3C]" />,
          iconBg: "bg-red-50",
          href: "#roi-alerts"
        },
        {
          title: "Spend Trends",
          description: "Daily spend analysis",
          icon: <DollarSign className="w-5 h-5 text-[#1ABC9C]" />,
          iconBg: "bg-teal-50",
          href: "#spend-trends"
        }
      ]
    },
    {
      title: "Quick Analytics",
      items: [
        {
          title: "Profit Overview",
          description: "Monthly profit trends",
          icon: <BarChart2 className="w-5 h-5 text-[#4A90E2]" />,
          iconBg: "bg-blue-50",
          href: "#profit"
        },
        {
          title: "Network Performance",
          description: "Offer performance by network",
          icon: <Target className="w-5 h-5 text-[#2ECC71]" />,
          iconBg: "bg-green-50",
          href: "#network"
        }
      ]
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Access</h2>
      {sections.map((section, index) => (
        <ShortcutSection key={index} {...section} />
      ))}
    </div>
  );
};

export default ShortcutArea; 