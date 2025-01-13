import React from "react";

const Progress = React.forwardRef(({ className, value, indicatorClassName, ...props }, ref) => (
  <div
    ref={ref}
    className={`w-full h-2 bg-gray-200 rounded-full overflow-hidden ${className}`}
    {...props}
  >
    <div
      className={`h-full transition-all duration-300 ease-in-out ${indicatorClassName}`}
      style={{ width: `${value || 0}%` }}
    />
  </div>
));

Progress.displayName = "Progress";

export { Progress };