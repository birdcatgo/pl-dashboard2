import React, { useState } from 'react';
import { BarChart2, Settings, FileText, Users } from 'lucide-react';

const MobileNavigator = ({ activeSection, onNavigate }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const sections = [
    { id: 'overview', icon: BarChart2, label: 'Overview' },
    { id: 'reports', icon: FileText, label: 'Reports' },
    { id: 'users', icon: Users, label: 'Users' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white shadow-lg z-50">
      <div className="flex justify-between px-4 py-2">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = section.id === activeSection;

          return (
            <button
              key={section.id}
              className={`flex flex-col items-center px-3 py-2 ${
                isActive ? 'text-blue-500' : 'text-gray-600'
              }`}
              onClick={() => onNavigate(section.id)}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs">{section.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNavigator;
