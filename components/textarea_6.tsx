import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { TextFormattingMenu } from "./TextFormattingMenu";
import { applyCustomStyle, applyFontSize, getCurrentFontSize } from "../utils/textFormatting";

interface Textarea_6Props extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  minWidth?: number;
  enableFormatting?: boolean;
}

export function Textarea_6({ value, className, minWidth = 50, enableFormatting = true, onChange, ...props }: Textarea_6Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [currentFontSize, setCurrentFontSize] = useState<string | null>(null);

  const adjustSize = () => {
    if (enableFormatting && editorRef.current) {
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

  if (enableFormatting) {
    return (
      <div
        className="relative"
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
          className={className}
          style={{
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            width: '100%',
            outline: 'none',
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