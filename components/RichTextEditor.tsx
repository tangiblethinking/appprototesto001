import { useRef, useEffect, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { TextFormattingMenu } from "./TextFormattingMenu";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  style?: React.CSSProperties;
  multiline?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  className = "",
  placeholder = "",
  style = {},
  multiline = true,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Initialize content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!multiline && e.key === "Enter") {
      e.preventDefault();
    }
  };

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
        onKeyDown={handleKeyDown}
        className={className}
        style={{
          minHeight: multiline ? "auto" : "1.2em",
          whiteSpace: multiline ? "pre-wrap" : "nowrap",
          outline: "none",
          ...style,
        }}
        data-placeholder={placeholder}
      />
      {isHovered && (
        <div className="absolute right-0 top-0 z-40">
          <button
            onMouseEnter={() => setShowMenu(true)}
            className="p-1 bg-white hover:bg-gray-100 rounded shadow-sm border border-gray-300"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
          >
            <MoreHorizontal className="h-3 w-3 text-gray-600" />
          </button>
          <TextFormattingMenu onFormat={handleFormat} show={showMenu} />
        </div>
      )}
    </div>
  );
}
