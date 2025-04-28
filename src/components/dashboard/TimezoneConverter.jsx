import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { DateTime } from 'luxon';
import { Clock, Sun, Moon, Globe, Search, ChevronRight, RotateCcw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const TimezoneConverter = () => {
  const [currentTime, setCurrentTime] = useState(DateTime.now());
  const [fromTime, setFromTime] = useState('');
  const [fromTimezone, setFromTimezone] = useState('NZT');
  const [toTimezone, setToTimezone] = useState('PST');
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentTimes, setCurrentTimes] = useState({});
  const [selectedTime, setSelectedTime] = useState('09:00 AM');
  const [isPM, setIsPM] = useState(false);
  const [selectedHour, setSelectedHour] = useState('09');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [currentDay, setCurrentDay] = useState(DateTime.now().toFormat('EEEE'));
  const [showCustomTime, setShowCustomTime] = useState(false);
  const [selectedTimeLabel, setSelectedTimeLabel] = useState('');

  const timezones = [
    { value: 'NZT', label: 'New Zealand Time (NZT)', offset: 12, icon: '🇳🇿' },
    { value: 'PST', label: 'Pacific Standard Time (PST)', offset: -8, icon: '🇺🇸' }
  ];

  const days = [
    { value: 'Monday', label: 'Mon' },
    { value: 'Tuesday', label: 'Tue' },
    { value: 'Wednesday', label: 'Wed' },
    { value: 'Thursday', label: 'Thu' },
    { value: 'Friday', label: 'Fri' },
    { value: 'Saturday', label: 'Sat' },
    { value: 'Sunday', label: 'Sun' }
  ];

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

  const commonTimes = [
    { label: 'Morning', time: '09:00', period: 'AM' },
    { label: 'Noon', time: '12:00', period: 'PM' },
    { label: 'Evening', time: '06:00', period: 'PM' },
    { label: 'Night', time: '09:00', period: 'PM' }
  ];

  // Generate time options in 15-minute intervals
  const timeOptions = useMemo(() => {
    const options = [];
    for (let hour = 1; hour <= 12; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(`${time} AM`);
        options.push(`${time} PM`);
      }
    }
    return options;
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(DateTime.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const updateCurrentTimes = () => {
      const times = {};
      
      timezones.forEach(tz => {
        // Use Luxon's DateTime for timezone handling
        const time = DateTime.now().setZone(tz.value === 'NZT' ? 'Pacific/Auckland' : 'America/Los_Angeles');
        const day = time.toFormat('EEEE');
        const hour = time.hour;
        const isDaytime = hour >= 6 && hour < 18;
        
        // Format time using Luxon
        const formattedTime = time.toFormat('h:mm');
        const period = time.toFormat('a');
        
        times[tz.value] = {
          time: formattedTime,
          day: day,
          isDaytime: isDaytime,
          period: period
        };
      });
      
      setCurrentTimes(times);
    };

    updateCurrentTimes();
    const interval = setInterval(updateCurrentTimes, 1000);
    return () => clearInterval(interval);
  }, []);

  const convertTime = () => {
    if (!fromTime) return '';

    const [hours, minutes] = fromTime.split(':').map(Number);
    const fromTz = timezones.find(tz => tz.value === fromTimezone);
    const toTz = timezones.find(tz => tz.value === toTimezone);

    if (!fromTz || !toTz) return '';

    // Create a DateTime object in the source timezone with proper AM/PM handling
    let sourceTime = DateTime.now()
      .setZone(fromTz.value === 'NZT' ? 'Pacific/Auckland' : 'America/Los_Angeles')
      .set({ 
        hour: isPM ? (hours % 12) + 12 : hours % 12,
        minute: minutes 
      });

    // Adjust for the selected day
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = sourceTime.toFormat('EEEE');
    const targetDayIndex = daysOfWeek.indexOf(selectedDay);
    const currentDayIndex = daysOfWeek.indexOf(currentDay);
    
    if (targetDayIndex !== currentDayIndex) {
      const dayDiff = targetDayIndex - currentDayIndex;
      sourceTime = sourceTime.plus({ days: dayDiff });
    }

    // Convert to target timezone
    const targetTime = sourceTime.setZone(toTz.value === 'NZT' ? 'Pacific/Auckland' : 'America/Los_Angeles');

    // Get the day of the week and formatted time
    const day = targetTime.toFormat('EEEE');
    const time = targetTime.toFormat('h:mm a');

    return `${day} ${time}`;
  };

  const getTimeDifference = () => {
    const fromTz = timezones.find(tz => tz.value === fromTimezone);
    const toTz = timezones.find(tz => tz.value === toTimezone);
    if (!fromTz || !toTz) return null;

    // Calculate the time difference in hours
    const fromTime = DateTime.now().setZone(fromTz.value === 'NZT' ? 'Pacific/Auckland' : 'America/Los_Angeles');
    const toTime = DateTime.now().setZone(toTz.value === 'NZT' ? 'Pacific/Auckland' : 'America/Los_Angeles');
    
    return toTime.hour - fromTime.hour;
  };

  const getDayIndicator = () => {
    const diff = getTimeDifference();
    if (!diff) return '';
    
    // Calculate if the day changes based on the time difference
    const fromTime = DateTime.now().setZone(fromTimezone === 'NZT' ? 'Pacific/Auckland' : 'America/Los_Angeles');
    const toTime = DateTime.now().setZone(toTimezone === 'NZT' ? 'Pacific/Auckland' : 'America/Los_Angeles');
    
    const fromDay = fromTime.day;
    const toDay = toTime.day;
    
    if (toDay > fromDay) return 'Tomorrow';
    if (toDay < fromDay) return 'Yesterday';
    return 'Same Day';
  };

  const convertedTime = convertTime();
  const timeDiff = getTimeDifference();
  const dayIndicator = getDayIndicator();

  const swapTimezones = () => {
    setFromTimezone(toTimezone);
    setToTimezone(fromTimezone);
  };

  const handleTimeChange = () => {
    const hour = parseInt(selectedHour);
    const minute = parseInt(selectedMinute);
    setFromTime(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
  };

  useEffect(() => {
    handleTimeChange();
  }, [selectedHour, selectedMinute, isPM]);

  const handleTimeSelect = (time, period) => {
    const [hour, minute] = time.split(':');
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setIsPM(period === 'PM');
    setShowCustomTime(false);
    setSelectedTimeLabel(`${time} ${period}`);
  };

  const handlePresetSelect = (preset) => {
    const [hour, minute] = preset.time.split(':');
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setIsPM(preset.period === 'PM');
    setShowCustomTime(false);
    setSelectedTimeLabel(`${preset.time} ${preset.period}`);
  };

  return (
    <div className={cn("space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg", isDarkMode ? "dark" : "")}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Timezone Converter</h1>
        <Button
          variant="outline"
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="flex items-center gap-2"
        >
          {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {isDarkMode ? "Light Mode" : "Dark Mode"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Times Section */}
        <Card className="bg-white/95 dark:bg-gray-800/95 shadow-lg">
          <CardHeader className="bg-gray-50/95 dark:bg-gray-700/95 border-b p-4">
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-white">Current Times</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-6">
              {timezones.map(tz => {
                const isDaytime = currentTimes[tz.value]?.isDaytime;
                return (
                  <div 
                    key={tz.value}
                    className={cn(
                      "p-6 rounded-lg border transition-all duration-300 min-h-[120px]",
                      isDaytime 
                        ? "bg-gradient-to-br from-blue-50/95 to-white/95 dark:from-blue-900/20 dark:to-gray-800/95" 
                        : "bg-gradient-to-br from-gray-50/95 to-white/95 dark:from-gray-900/20 dark:to-gray-800/95"
                    )}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{tz.icon}</span>
                      <h3 className="text-base font-medium text-gray-700 dark:text-gray-200">{tz.label}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {isDaytime ? <Sun className="h-4 w-4 text-yellow-500" /> : <Moon className="h-4 w-4 text-blue-500" />}
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {currentTimes[tz.value]?.day || 'Loading...'} {currentTimes[tz.value]?.time || 'Loading...'}
                      </p>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {currentTimes[tz.value]?.period || ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Converter Section */}
        <Card className="bg-white/95 dark:bg-gray-800/95 shadow-lg">
          <CardHeader className="bg-gray-50/95 dark:bg-gray-700/95 border-b p-4">
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-white">Convert Time</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="p-6 rounded-lg border transition-all duration-300 bg-gradient-to-br from-blue-50/95 to-white/95 dark:from-blue-900/20 dark:to-gray-800/95 min-h-[120px]">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{timezones.find(tz => tz.value === fromTimezone)?.icon}</span>
                      <h3 className="text-base font-medium text-gray-700 dark:text-gray-200">
                        {timezones.find(tz => tz.value === fromTimezone)?.label}
                      </h3>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={swapTimezones}
                      className="h-8 px-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between gap-1">
                      {days.map(day => (
                        <Button
                          key={day.value}
                          variant={selectedDay === day.value ? "default" : "outline"}
                          className={cn(
                            "h-8 px-2 py-1 font-medium transition-all duration-200 flex-1",
                            day.value === currentDay && "ring-2 ring-blue-500"
                          )}
                          onClick={() => setSelectedDay(day.value)}
                        >
                          {day.label}
                        </Button>
                      ))}
                    </div>
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {commonTimes.map((preset) => (
                          <Button
                            key={preset.label}
                            variant="outline"
                            size="sm"
                            className={cn(
                              "h-10 px-3 rounded-full transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20",
                              selectedTimeLabel === `${preset.time} ${preset.period}` && "bg-blue-100 dark:bg-blue-900/30"
                            )}
                            onClick={() => handlePresetSelect(preset)}
                          >
                            <div className="flex flex-col items-center">
                              <span className="font-medium">{preset.label}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {preset.time} {preset.period}
                              </span>
                            </div>
                          </Button>
                        ))}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "h-10 px-3 rounded-full transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20",
                              showCustomTime && "bg-blue-100 dark:bg-blue-900/30"
                            )}
                            onClick={() => setShowCustomTime(!showCustomTime)}
                          >
                            <div className="flex flex-col items-center">
                              <span className="font-medium">Custom</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Set specific time
                              </span>
                            </div>
                          </Button>
                          {showCustomTime && (
                            <>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="h-10 px-3 py-1 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md shadow-sm hover:bg-white/70 dark:hover:bg-gray-700/70"
                                  >
                                    <span className="font-mono font-medium">{selectedHour}:{selectedMinute}</span>
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg">
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-4 gap-2">
                                      {hours.map(hour => (
                                        <Button
                                          key={hour}
                                          variant={selectedHour === hour ? "default" : "outline"}
                                          className="h-8 px-3 py-1 font-mono font-medium"
                                          onClick={() => {
                                            setSelectedHour(hour);
                                            setSelectedTimeLabel(`${hour}:${selectedMinute} ${isPM ? 'PM' : 'AM'}`);
                                          }}
                                        >
                                          {hour}
                                        </Button>
                                      ))}
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                      {minutes.map(minute => (
                                        <Button
                                          key={minute}
                                          variant={selectedMinute === minute ? "default" : "outline"}
                                          className="h-8 px-3 py-1 font-mono font-medium"
                                          onClick={() => {
                                            setSelectedMinute(minute);
                                            setSelectedTimeLabel(`${selectedHour}:${minute} ${isPM ? 'PM' : 'AM'}`);
                                          }}
                                        >
                                          {minute}
                                        </Button>
                                      ))}
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant={!isPM ? "default" : "outline"}
                                  size="sm"
                                  className="h-10 px-3 rounded-md transition-all duration-200 hover:bg-blue-600 dark:hover:bg-blue-700"
                                  onClick={() => {
                                    setIsPM(false);
                                    setSelectedTimeLabel(`${selectedHour}:${selectedMinute} AM`);
                                  }}
                                >
                                  <span className="font-medium">AM</span>
                                </Button>
                                <Button
                                  variant={isPM ? "default" : "outline"}
                                  size="sm"
                                  className="h-10 px-3 rounded-md transition-all duration-200 hover:bg-blue-600 dark:hover:bg-blue-700"
                                  onClick={() => {
                                    setIsPM(true);
                                    setSelectedTimeLabel(`${selectedHour}:${selectedMinute} PM`);
                                  }}
                                >
                                  <span className="font-medium">PM</span>
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Selected time: {selectedTimeLabel || 'Not selected'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-lg border transition-all duration-300 bg-gradient-to-br from-blue-50/95 to-white/95 dark:from-blue-900/20 dark:to-gray-800/95 min-h-[120px]">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{timezones.find(tz => tz.value === toTimezone)?.icon}</span>
                  <h3 className="text-base font-medium text-gray-700 dark:text-gray-200">
                    {timezones.find(tz => tz.value === toTimezone)?.label}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-yellow-500" />
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {convertedTime || 'Select a time to convert'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TimezoneConverter; 