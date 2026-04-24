export function applyFontSize(size: string) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  const selectedText = range.toString();
  
  if (!selectedText) return;

  // Remove the selected content
  range.deleteContents();

  // Create a span with the font size
  const wrapper = document.createElement("span");
  wrapper.style.fontSize = size;
  wrapper.textContent = selectedText;

  range.insertNode(wrapper);
  
  // Move cursor after the inserted element
  range.setStartAfter(wrapper);
  range.setEndAfter(wrapper);
  selection.removeAllRanges();
  selection.addRange(range);
}

export function getCurrentFontSize(): string | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  if (range.collapsed) return null; // No text selected

  // Get the parent element of the selection
  let element = range.startContainer.parentElement;
  
  if (!element) return null;

  // Check if the selection is inside a styled span
  if (element.tagName === 'SPAN' && element.style.fontSize) {
    return element.style.fontSize;
  }

  // Check if there's a common ancestor with fontSize
  const commonAncestor = range.commonAncestorContainer;
  if (commonAncestor.nodeType === Node.ELEMENT_NODE) {
    const ancestorElement = commonAncestor as HTMLElement;
    if (ancestorElement.style.fontSize) {
      return ancestorElement.style.fontSize;
    }
  }

  // Get computed style
  const computedStyle = window.getComputedStyle(element);
  return computedStyle.fontSize;
}

export function applyCustomStyle(style: string) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  const selectedText = range.toString();
  
  if (!selectedText) return;

  // Remove the selected content
  range.deleteContents();

  let wrapper: HTMLElement;

  switch (style) {
    case "monostyled":
      wrapper = document.createElement("span");
      wrapper.style.fontFamily = "monospace";
      wrapper.style.fontSize = "12px";
      wrapper.style.backgroundColor = "#f3f4f6";
      wrapper.style.padding = "2px 4px";
      wrapper.style.borderRadius = "3px";
      wrapper.textContent = selectedText;
      break;

    case "bulleted":
      const bulletedLines = selectedText.split('\n').filter(line => line.trim());
      wrapper = document.createElement("div");
      bulletedLines.forEach(line => {
        const lineDiv = document.createElement("div");
        lineDiv.style.paddingLeft = "0";
        lineDiv.style.fontSize = "14px";
        lineDiv.innerHTML = `• ${line}`;
        wrapper.appendChild(lineDiv);
      });
      break;

    case "dashed":
      const dashedLines = selectedText.split('\n').filter(line => line.trim());
      wrapper = document.createElement("div");
      dashedLines.forEach(line => {
        const lineDiv = document.createElement("div");
        lineDiv.style.paddingLeft = "0";
        lineDiv.style.fontSize = "14px";
        lineDiv.innerHTML = `– ${line}`;
        wrapper.appendChild(lineDiv);
      });
      break;

    case "numbered":
      const numberedLines = selectedText.split('\n').filter(line => line.trim());
      wrapper = document.createElement("div");
      numberedLines.forEach((line, index) => {
        const lineDiv = document.createElement("div");
        lineDiv.style.paddingLeft = "0";
        lineDiv.style.fontSize = "14px";
        lineDiv.innerHTML = `${index + 1}. ${line}`;
        wrapper.appendChild(lineDiv);
      });
      break;

    case "blockquote":
      wrapper = document.createElement("div");
      wrapper.style.backgroundColor = "#f3f4f6";
      wrapper.style.borderLeft = "4px solid #6b7280";
      wrapper.style.padding = "8px 12px";
      wrapper.style.fontSize = "14px";
      wrapper.style.color = "#374151";
      wrapper.style.marginTop = "4px";
      wrapper.style.marginBottom = "4px";
      wrapper.textContent = selectedText;
      break;

    default:
      return;
  }

  range.insertNode(wrapper);
  
  // Move cursor after the inserted element
  range.setStartAfter(wrapper);
  range.setEndAfter(wrapper);
  selection.removeAllRanges();
  selection.addRange(range);
}
