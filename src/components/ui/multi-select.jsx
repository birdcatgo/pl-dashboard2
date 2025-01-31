import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown } from "lucide-react";

const MultiSelect = ({ options, selected, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        className="w-full px-3 py-2 border rounded-md bg-white min-h-[38px] cursor-pointer flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1 items-center flex-1">
          {selected.length === 0 && (
            <span className="text-gray-500">{placeholder}</span>
          )}
          {selected.includes('all') ? (
            <span className="text-gray-900">All Selected</span>
          ) : (
            <span className="text-gray-900">{selected.length} selected</span>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </div>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <div
              key={option}
              className={`px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center justify-between ${
                selected.includes(option) ? 'bg-blue-50' : ''
              }`}
              onClick={(e) => {
                e.stopPropagation();
                if (option === 'all') {
                  onChange(['all']);
                } else {
                  const newSelected = selected.includes(option)
                    ? selected.filter(s => s !== option)
                    : [...selected.filter(s => s !== 'all'), option];
                  onChange(newSelected.length ? newSelected : ['all']);
                }
              }}
            >
              <span>{option === 'all' ? 'All' : option}</span>
              {selected.includes(option) && (
                <Check className="h-4 w-4 text-blue-600" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiSelect; 