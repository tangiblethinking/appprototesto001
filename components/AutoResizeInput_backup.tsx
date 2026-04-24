import { useRef, useEffect, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { TextFormattingMenu } from "./TextFormattingMenu";
import { applyCustomStyle, applyFontSize, getCurrentFontSize } from "../utils/textFormatting";

interface AutoResizeInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  minWidth?: number;
  bold?: boolean;
  enableFormatting?: boolean;
}

export function AutoResizeInput({ value, className, minWidth = 50, bold = false, style, enableFormatting = true, onChange, ...props }: AutoResizeInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [currentFontSize, setCurrentFontSize] = useState<string | null>(null);

  const adjustSize = () => {
    if (enableFormatting && editorRef.current) {
      // ContentEditable handles its own sizing
      return;
    }

    if (spanRef.current && inputRef.current) {
      const computedStyle = window.getComputedStyle(inputRef.current);
      const font = `${computedStyle.fontSize} ${computedStyle.fontFamily}`;
      const fontWeight = computedStyle.fontWeight;
      const letterSpacing = computedStyle.letterSpacing;
      const padding = parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
      
      spanRef.current.style.font = font;
      spanRef.current.style.fontWeight = fontWeight;
      spanRef.current.style.letterSpacing = letterSpacing;
      
      const textWidth = spanRef.current.offsetWidth + padding + 8;
      const newWidth = Math.max(textWidth, minWidth);
      
      inputRef.current.style.width = `${newWidth}px`;
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustSize();
  }, [value]);

  useEffect(() => {
    if (enableFormatting && editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value, enableFormatting]);

  const handleFormat = (command: string, formatValue?: string) => {
    if (command === "customStyle" && formatValue) {
      applyCustomStyle(formatValue);
      editorRef.current?.focus();
      handleInput();
    } else if (command === "applyFontSize" && formatValue) {
      applyFontSize(formatValue);
      editorRef.current?.focus();
      handleInput();
    } else {
      document.execCommand(command, false, formatValue);
      editorRef.current?.focus();
      handleInput();
    }
  };

  const handleInput = () => {
    if (enableFormatting && editorRef.current && onChange) {
      const event = {
        target: { value: editorRef.current.innerHTML },
      } as React.ChangeEvent<HTMLTextAreaElement>;
      onChange(event);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  const handleMenuOpen = () => {
    setShowMenu(true);
    // Detect current font size when menu opens
    const fontSize = getCurrentFontSize();
    setCurrentFontSize(fontSize);
  };

  const handleSelectionChange = () => {
    if (showMenu) {
      const fontSize = getCurrentFontSize();
      setCurrentFontSize(fontSize);
    }
  };

  useEffect(() => {
    if (enableFormatting) {
      document.addEventListener('selectionchange', handleSelectionChange);
      return () => {
        document.removeEventListener('selectionchange', handleSelectionChange);
      };
    }
  }, [showMenu, enableFormatting]);

  if (enableFormatting) {
    return (
      <div
        className="relative inline-block"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setShowMenu(false);
        }}
      >
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          className={className}
          style={{
            minWidth: `${minWidth + 20}px`,
            fontWeight: bold ? 'bold' : 'normal',
            color: 'black',
            resize: 'none',
            overflow: 'hidden',
            lineHeight: '1.2',
            padding: '2px 4px',
            minHeight: 'auto',
            outline: 'none',
            display: 'inline-block',
            whiteSpace: 'nowrap',
            ...style,
          }}
          {...(props as any)}
        />
        {isHovered && (
          <div className="absolute right-0 top-0 z-[9998]">
            <button
              onMouseEnter={handleMenuOpen}
              className="p-1 bg-white hover:bg-gray-100 rounded shadow-sm border border-gray-300"
              onClick={(e) => {
                e.stopPropagation();
                handleMenuOpen();
              }}
            >
              <MoreHorizontal className="h-3 w-3 text-gray-600" />
            </button>
            <TextFormattingMenu onFormat={handleFormat} show={showMenu} currentFontSize={currentFontSize} />
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <textarea
        ref={inputRef}
        value={value}
        onChange={onChange}
        className={className}
        style={{ width: `${minWidth + 20}px`, fontWeight: bold ? 'bold' : 'normal', color: 'black', resize: 'none', overflow: 'hidden', lineHeight: '1.2', padding: '2px 4px', minHeight: 'auto', ...style }}
        onInput={adjustSize}
        rows={1}
        {...props}
      />
      <span
        ref={spanRef}
        style={{
          position: 'absolute',
          visibility: 'hidden',
          whiteSpace: 'pre',
          pointerEvents: 'none',
        }}
      >
        {value || ' '}
      </span>
    </>
  );
}
