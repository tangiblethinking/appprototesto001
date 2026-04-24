import { useState } from "react";
import { Bold, Italic, Underline, Strikethrough, Highlighter, Circle } from "lucide-react";

interface TextFormattingMenuProps {
  onFormat: (command: string, value?: string) => void;
  show: boolean;
  currentFontSize?: string | null;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const fontSizes = [
  { label: "Title", size: "32px", style: "normal" },
  { label: "Heading", size: "24px", style: "normal" },
  { label: "Subheading", size: "18px", style: "normal" },
  { label: "Body", size: "14px", style: "normal" },
  { label: "Monostyled", size: "12px", style: "monostyled" },
  { label: "• Bulleted List", size: "14px", style: "bulleted" },
  { label: "– Dashed List", size: "14px", style: "dashed" },
  { label: "1. Numbered List", size: "14px", style: "numbered" },
  { label: "| Block Quote", size: "14px", style: "blockquote" },
];

const colors = [
  { label: "Purple", value: "#a855f7" },
  { label: "Pink", value: "#ec4899" },
  { label: "Orange", value: "#f97316" },
  { label: "Mint", value: "#2dd4bf" },
  { label: "Blue", value: "#3b82f6" },
];

export function TextFormattingMenu({ onFormat, show, currentFontSize, onMouseEnter, onMouseLeave }: TextFormattingMenuProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  if (!show) return null;

  const handleFontSizeClick = (font: typeof fontSizes[0]) => {
    if (font.style === "normal") {
      onFormat("applyFontSize", font.size);
    } else {
      onFormat("customStyle", font.style);
    }
  };

  // Helper function to check if current font size matches
  const isCurrentSize = (targetSize: string) => {
    if (!currentFontSize) return false;
    
    // Normalize font sizes for comparison (convert to px if needed)
    const normalizeSize = (size: string) => {
      if (!size) return null;
      // Remove 'px' and convert to number for comparison
      const match = size.match(/(\d+\.?\d*)/);
      return match ? parseFloat(match[1]) : null;
    };

    const current = normalizeSize(currentFontSize);
    const target = normalizeSize(targetSize);
    
    if (current === null || target === null) return false;
    
    // Allow small variance for rounding errors
    return Math.abs(current - target) < 1;
  };

  return (
    <div className="absolute right-0 top-6 z-[9999] bg-[#1f1f1f] text-white rounded-lg shadow-xl py-2 min-w-[180px]" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      {/* Formatting buttons */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-700">
        <button
          onClick={() => onFormat("bold")}
          className="p-1 hover:bg-gray-700 rounded"
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          onClick={() => onFormat("italic")}
          className="p-1 hover:bg-gray-700 rounded"
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          onClick={() => onFormat("underline")}
          className="p-1 hover:bg-gray-700 rounded"
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </button>
        <button
          onClick={() => onFormat("strikeThrough")}
          className="p-1 hover:bg-gray-700 rounded"
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </button>
        <button
          onClick={() => onFormat("backColor", "#add8e6")}
          className="p-1 hover:bg-gray-700 rounded"
          title="Highlight"
        >
          <Highlighter className="h-4 w-4" />
        </button>
        <div className="relative">
          <button
            onMouseEnter={() => setShowColorPicker(true)}
            onMouseLeave={() => setShowColorPicker(false)}
            className="p-1 hover:bg-gray-700 rounded"
            title="Text Color"
          >
            <Circle className="h-4 w-4 fill-orange-500 text-orange-500" />
          </button>
          {showColorPicker && (
            <div
              onMouseEnter={() => setShowColorPicker(true)}
              onMouseLeave={() => setShowColorPicker(false)}
              className="absolute left-full top-0 ml-1 bg-[#1f1f1f] rounded-lg shadow-xl py-1 px-2"
            >
              {colors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => onFormat("foreColor", color.value)}
                  className="flex items-center gap-2 px-2 py-1 hover:bg-gray-700 rounded w-full text-left text-sm"
                >
                  <Circle className="h-3 w-3 fill-current" style={{ color: color.value }} />
                  <span>{color.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Font sizes */}
      <div className="py-1">
        {fontSizes.map((font, index) => {
          const isMonostyled = font.style === "monostyled";
          const isBlockQuote = font.style === "blockquote";
          const showCheck = font.style === "normal" && isCurrentSize(font.size);
          
          return (
            <button
              key={font.label}
              onClick={() => handleFontSizeClick(font)}
              className="w-full text-left px-3 py-1 hover:bg-gray-700 flex items-center gap-2"
              style={{ 
                fontSize: font.size,
                fontFamily: isMonostyled ? 'monospace' : 'inherit',
                backgroundColor: (isMonostyled || isBlockQuote) ? '#f3f4f6' : 'transparent',
                color: (isMonostyled || isBlockQuote) ? '#1f1f1f' : 'inherit',
                borderLeft: isBlockQuote ? '3px solid #6b7280' : 'none',
                paddingLeft: isBlockQuote ? '12px' : undefined,
              }}
            >
              {showCheck && <span className="text-xs">✓</span>}
              {!showCheck && <span className="w-3"></span>}
              <span>{font.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}