import { useRef, useEffect } from "react";
import { Textarea002 } from "./textarea002";

interface Textarea001Props extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  minWidth?: number;
  customFontSize?: string;
  customFontWeight?: string;
  customColor?: string;
  customLineHeight?: string;
  customFontFamily?: string;
  autoResize?: 'width' | 'height' | 'both';
}

export function Textarea001({ 
  value, 
  className, 
  minWidth = 50, 
  customFontSize = '16px',
  customFontWeight = 'normal',
  customColor = 'black',
  customLineHeight = '1.2',
  customFontFamily = 'inherit',
  autoResize = 'both',
  style, 
  ...props 
}: Textarea001Props) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);

  const adjustSize = () => {
    if (inputRef.current) {
      if (autoResize === 'width' || autoResize === 'both') {
        if (spanRef.current) {
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
        }
      }
      
      if (autoResize === 'height' || autoResize === 'both') {
        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
      }
    }
  };

  useEffect(() => {
    adjustSize();
  }, [value]);

  return (
    <>
      <Textarea002
        value={value}
        className={className}
        minWidth={minWidth}
        customFontSize={customFontSize}
        customFontWeight={customFontWeight}
        customColor={customColor}
        customLineHeight={customLineHeight}
        customFontFamily={customFontFamily}
        autoResize={autoResize}
        style={style}
        {...props}
      />
      {(autoResize === 'width' || autoResize === 'both') && (
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
      )}
    </>
  );
}
