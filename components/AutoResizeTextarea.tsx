import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { TextFormattingMenu } from "./TextFormattingMenu";
import { applyCustomStyle, applyFontSize, getCurrentFontSize } from "../utils/textFormatting";

interface AutoResizeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  minWidth?: number;
  enableFormatting?: boolean;
}

export function AutoResizeTextarea({ value, className, minWidth = 50, enableFormatting = true, onChange, ...props }: AutoResizeTextareaProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [currentFontSize, setCurrentFontSize] = useState<string | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const adjustSize = () => {
    if (enableFormatting && editorRef.current) {
      // ContentEditable auto-sizes based on content
      return;
    }
    
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
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
    if (!editorRef.current) return;

    // Select all text in the editor before applying formatting
    const range = document.createRange();
    range.selectNodeContents(editorRef.current);
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }

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

  const handleMenuOpen = () => {
    setShowMenu(true);
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

  const handleMouseLeave = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    hideTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
      setShowMenu(false);
    }, 3000);
  };

  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    setIsHovered(true);
  };

  const handleMenuMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
  };

  const handleMenuMouseLeave = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    hideTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
      setShowMenu(false);
    }, 2000);
  };

  if (enableFormatting) {
    return (
      <div
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onPaste={handlePaste}
          className={className}
          style={{
            minHeight: "auto",
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
            outline: "none",
          }}
          {...(props as any)}
        />
        {isHovered && (
          <div className="absolute left-full top-0 ml-1 z-[9998] pointer-events-auto">
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
            <TextFormattingMenu onFormat={handleFormat} show={showMenu} currentFontSize={currentFontSize} onMouseEnter={handleMenuMouseEnter} onMouseLeave={handleMenuMouseLeave} />
          </div>
        )}
      </div>
    );
  }

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      className={className}
      onInput={adjustSize}
      style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', width: '100%' }}
      {...props}
    />
  );
}