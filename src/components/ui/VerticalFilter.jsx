import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const VerticalFilter = ({ 
  selectedVertical, 
  onVerticalChange, 
  showAllOption = true,
  className = "",
  placeholder = "All Verticals"
}) => {
  // Define the standard verticals used across the platform
  const standardVerticals = [
    'Solar',
    'Roofing', 
    'FuturHealth',
    'Mediva',
    'FE',
    'Education',
    'Auto',
    'Weight Loss',
    'Health Insurance',
    'Other'
  ];

  const getVerticalColor = (vertical) => {
    switch (vertical?.toLowerCase()) {
      case 'solar':
        return 'bg-yellow-100 text-yellow-800';
      case 'roofing':
        return 'bg-orange-100 text-orange-800';
      case 'futurhealth':
        return 'bg-blue-100 text-blue-800';
      case 'mediva':
        return 'bg-purple-100 text-purple-800';
      case 'fe':
        return 'bg-green-100 text-green-800';
      case 'education':
      case 'edu':
        return 'bg-indigo-100 text-indigo-800';
      case 'auto':
        return 'bg-red-100 text-red-800';
      case 'weight loss':
        return 'bg-pink-100 text-pink-800';
      case 'health insurance':
      case 'health':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={className}>
      <label className="text-sm font-medium mb-2 block">Vertical</label>
      <Select value={selectedVertical} onValueChange={onVerticalChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {showAllOption && (
            <SelectItem value="all">
              <div className="flex items-center space-x-2">
                <span>All Verticals</span>
                <Badge variant="outline" className="text-xs">All</Badge>
              </div>
            </SelectItem>
          )}
          {standardVerticals.map(vertical => (
            <SelectItem key={vertical} value={vertical}>
              <div className="flex items-center space-x-2">
                <span>{vertical}</span>
                <Badge className={`text-xs ${getVerticalColor(vertical)}`}>
                  {vertical}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default VerticalFilter; 