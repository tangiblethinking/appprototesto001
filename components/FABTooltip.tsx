import { useState, ReactNode } from "react";

interface FABTooltipProps {
  text: string;
  children: ReactNode;
}

export function FABTooltip({ text, children }: FABTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap shadow-lg z-50 pointer-events-none">
          {text}
          <div className="absolute left-full top-1/2 -translate-y-1/2 -ml-[1px] w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-gray-900" />
        </div>
      )}
    </div>
  );
}
