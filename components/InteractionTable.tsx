import { Button } from "./ui/button";
import { Plus, Minus, GripVertical } from "lucide-react";
import { AutoResizeTextarea } from "./AutoResizeTextarea";
import { AutoResizeInput } from "./AutoResizeInput";
import { useEffect, useState, useRef } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

interface InteractionTableProps {
  headers: string[];
  rows: string[][];
  onUpdateRows: (rows: string[][]) => void;
  onUpdateHeaders: (headers: string[]) => void;
  columnWidths?: { [key: number]: number };
  onUpdateColumnWidths?: (columnWidths: { [key: number]: number }) => void;
}

interface DraggableHeaderProps {
  header: string;
  index: number;
  actualIndex: number;
  moveColumn: (dragIndex: number, hoverIndex: number) => void;
  handleHeaderChange: (index: number, value: string) => void;
  isFirstColumn: boolean;
  columnWidth: number;
  onResizeColumn: (actualIndex: number, width: number) => void;
}

interface DraggableRowProps {
  row: string[];
  rowIndex: number;
  actualRowIndex: number;
  columnOrder: number[];
  moveRow: (dragIndex: number, hoverIndex: number) => void;
  handleCellChange: (rowIndex: number, cellIndex: number, value: string) => void;
  hasRowNumbers: boolean;
  displayRowNumber: number;
  isAlternate: boolean;
  columnWidths: { [key: number]: number };
}

const DraggableHeader = ({ header, index, actualIndex, moveColumn, handleHeaderChange, isFirstColumn, columnWidth, onResizeColumn }: DraggableHeaderProps) => {
  const ref = useRef<HTMLTableCellElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  const [{ isDragging }, drag] = useDrag({
    type: "column",
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: () => !isResizing,
  });

  const [, drop] = useDrop({
    accept: "column",
    hover: (item: { index: number }) => {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      moveColumn(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  // Apply drag only to the drag handle, drop to the entire th
  drag(dragHandleRef);
  drop(ref);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = columnWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const diff = moveEvent.clientX - startX;
      const newWidth = Math.max(50, startWidth + diff);
      onResizeColumn(actualIndex, newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <th
      ref={ref}
      className={`border border-[#ddd] px-2.5 py-2.5 text-left align-top bg-[#f4f6f9] text-[#2c3e50] ${isDragging ? 'opacity-50' : ''} relative`}
      style={{ 
        opacity: isDragging ? 0.5 : 1,
        width: `${columnWidth}px`,
        minWidth: `${columnWidth}px`,
        maxWidth: `${columnWidth}px`
      }}
    >
      <div className="flex items-center gap-1">
        <div ref={dragHandleRef} className="cursor-move">
          <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
        </div>
        <AutoResizeInput
          value={header}
          onChange={(e) => handleHeaderChange(actualIndex, e.target.value)}
          className="w-full bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none rounded px-2"
          minWidth={30}
          bold={true}
        />
      </div>
      <div
        className="absolute top-0 right-0 w-3 h-full cursor-col-resize hover:bg-blue-400 transition-colors"
        onMouseDown={handleMouseDown}
        style={{ zIndex: 10 }}
        title="Drag to resize column"
      />
    </th>
  );
};

const DraggableRow = ({ 
  row, 
  rowIndex, 
  actualRowIndex, 
  columnOrder, 
  moveRow, 
  handleCellChange, 
  hasRowNumbers, 
  displayRowNumber,
  isAlternate,
  columnWidths
}: DraggableRowProps) => {
  const ref = useRef<HTMLTableRowElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: "row",
    item: { index: rowIndex },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: "row",
    hover: (item: { index: number }) => {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = rowIndex;

      if (dragIndex === hoverIndex) {
        return;
      }

      moveRow(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  drag(drop(ref));

  return (
    <tr
      ref={ref}
      className={`${isAlternate ? "bg-[#f9f9fb]" : ""} ${isDragging ? 'opacity-50' : ''} cursor-move`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {columnOrder.map((actualIndex, displayIndex) => {
        const cellWidth = columnWidths[actualIndex] || 200;
        return (
          <td
            key={`cell-${actualRowIndex}-${actualIndex}`}
            className="border border-[#ddd] px-2.5 py-2.5 text-left align-top"
            style={{
              width: `${cellWidth}px`,
              minWidth: `${cellWidth}px`,
              maxWidth: `${cellWidth}px`
            }}
          >
            {displayIndex === 0 ? (
              <div className="flex items-center gap-1">
                <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
                {actualIndex === 0 && hasRowNumbers ? (
                  <div className="px-2 py-1 text-gray-500">
                    {displayRowNumber}
                  </div>
                ) : (
                  <AutoResizeTextarea
                    value={row[actualIndex]}
                    onChange={(e) => handleCellChange(actualRowIndex, actualIndex, e.target.value)}
                    className="w-full bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none rounded px-2 py-1 resize-none"
                  />
                )}
              </div>
            ) : actualIndex === 0 && hasRowNumbers ? (
              <div className="px-2 py-1 text-gray-500">
                {displayRowNumber}
              </div>
            ) : (
              <AutoResizeTextarea
                value={row[actualIndex]}
                onChange={(e) => handleCellChange(actualRowIndex, actualIndex, e.target.value)}
                className="w-full bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none rounded px-2 py-1 resize-none"
              />
            )}
          </td>
        );
      })}
    </tr>
  );
};

function InteractionTableContent({ headers, rows, onUpdateRows, onUpdateHeaders, columnWidths: externalColumnWidths, onUpdateColumnWidths }: InteractionTableProps) {
  const [columnOrder, setColumnOrder] = useState<number[]>([]);
  const [rowOrder, setRowOrder] = useState<number[]>([]);
  const [columnWidths, setColumnWidths] = useState<{ [key: number]: number }>(externalColumnWidths || {});

  // Initialize column order only when length changes (add/remove columns)
  useEffect(() => {
    if (columnOrder.length !== headers.length) {
      setColumnOrder(headers.map((_, index) => index));
    }
  }, [headers.length, columnOrder.length]);

  // Initialize row order only when length changes (add/remove rows)
  useEffect(() => {
    if (rowOrder.length !== rows.length) {
      setRowOrder(rows.map((_, index) => index));
    }
  }, [rows.length, rowOrder.length]);

  // Initialize column widths
  useEffect(() => {
    const initialWidths: { [key: number]: number } = {};
    headers.forEach((_, index) => {
      if (!(index in columnWidths)) {
        initialWidths[index] = index === 0 ? 80 : 200;
      }
    });
    if (Object.keys(initialWidths).length > 0) {
      setColumnWidths(prev => ({ ...prev, ...initialWidths }));
    }
  }, [headers.length]);

  // Check if first column is for row numbers
  const hasRowNumbers = headers[0] === "#" || headers[0].toLowerCase().includes("number");

  // Auto-update row numbers when rows change
  useEffect(() => {
    if (hasRowNumbers && rows.length > 0) {
      const needsUpdate = rows.some((row, index) => row[0] !== String(index + 1));
      if (needsUpdate) {
        const updatedRows = rows.map((row, index) => {
          const newRow = [...row];
          newRow[0] = String(index + 1);
          return newRow;
        });
        onUpdateRows(updatedRows);
      }
    }
  }, [rows.length, hasRowNumbers]);

  const handleCellChange = (rowIndex: number, cellIndex: number, value: string) => {
    // Prevent editing the first column if it contains row numbers
    if (cellIndex === 0 && hasRowNumbers) {
      return;
    }
    const newRows = [...rows];
    newRows[rowIndex][cellIndex] = value;
    onUpdateRows(newRows);
  };

  const handleHeaderChange = (headerIndex: number, value: string) => {
    const newHeaders = [...headers];
    newHeaders[headerIndex] = value;
    onUpdateHeaders(newHeaders);
  };

  const moveColumn = (dragIndex: number, hoverIndex: number) => {
    const newOrder = [...columnOrder];
    const [removed] = newOrder.splice(dragIndex, 1);
    newOrder.splice(hoverIndex, 0, removed);
    
    // Actually reorder the headers array
    const newHeaders = newOrder.map(index => headers[index]);
    
    // Reorder all row cells to match the new column order
    const newRows = rows.map(row => newOrder.map(index => row[index]));
    
    // Reset column order to default since data is now physically reordered
    setColumnOrder(newHeaders.map((_, index) => index));
    
    // Update parent with reordered data
    onUpdateHeaders(newHeaders);
    onUpdateRows(newRows);
  };

  const moveRow = (dragIndex: number, hoverIndex: number) => {
    const newOrder = [...rowOrder];
    const [removed] = newOrder.splice(dragIndex, 1);
    newOrder.splice(hoverIndex, 0, removed);
    
    // Actually reorder the rows array
    const newRows = newOrder.map(index => rows[index]);
    
    // Reset row order to default since data is now physically reordered
    setRowOrder(newRows.map((_, index) => index));
    
    // Update parent with reordered data
    onUpdateRows(newRows);
  };

  const handleResizeColumn = (actualIndex: number, width: number) => {
    const newWidths = { ...columnWidths, [actualIndex]: width };
    setColumnWidths(newWidths);
    if (onUpdateColumnWidths) {
      onUpdateColumnWidths(newWidths);
    }
  };

  const addRow = () => {
    const newRow = headers.map((_, index) => {
      if (index === 0 && hasRowNumbers) {
        return String(rows.length + 1);
      }
      return "";
    });
    onUpdateRows([...rows, newRow]);
  };

  const removeRow = () => {
    if (rows.length > 1) {
      // Remove the last row from the data array
      const newRows = rows.slice(0, -1);
      onUpdateRows(newRows);
      // rowOrder will be automatically reset by useEffect when rows.length changes
    }
  };

  const addColumn = () => {
    // Duplicate the last column header
    const lastHeaderIndex = headers.length - 1;
    const lastHeader = headers[lastHeaderIndex] || "";
    const newHeaders = [...headers, lastHeader];
    
    // Duplicate the last column cells for each row
    const newRows = rows.map(row => {
      const lastCellIndex = row.length - 1;
      const lastCell = row[lastCellIndex] || "";
      return [...row, lastCell];
    });
    
    // Update headers first, then rows
    onUpdateHeaders(newHeaders);
    onUpdateRows(newRows);
  };

  const removeColumn = () => {
    if (headers.length > 1) {
      // Remove last header
      const newHeaders = headers.slice(0, -1);
      onUpdateHeaders(newHeaders);
      
      // Remove last cell from each row
      const newRows = rows.map(row => row.slice(0, -1));
      onUpdateRows(newRows);
    }
  };

  return (
    <div className="overflow-visible my-4">
      <div className="mb-2 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={addColumn}
            className="p-1 hover:bg-gray-100 rounded border border-gray-300 transition-colors"
            title="Add column"
          >
            <Plus className="h-4 w-4" />
          </button>
          <span className="text-sm text-gray-700">Column</span>
          <button
            onClick={removeColumn}
            className="p-1 hover:bg-gray-100 rounded border border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={headers.length <= 1}
            title="Remove column"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>
        <span className="text-gray-400">|</span>
        <div className="flex items-center gap-2">
          <button
            onClick={addRow}
            className="p-1 hover:bg-gray-100 rounded border border-gray-300 transition-colors"
            title="Add row"
          >
            <Plus className="h-4 w-4" />
          </button>
          <span className="text-sm text-gray-700">Row</span>
          <button
            onClick={removeRow}
            className="p-1 hover:bg-gray-100 rounded border border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={rows.length <= 1}
            title="Remove row"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>
      </div>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {columnOrder.map((actualIndex, displayIndex) => (
              <DraggableHeader
                key={`header-${actualIndex}`}
                header={headers[actualIndex]}
                index={displayIndex}
                actualIndex={actualIndex}
                moveColumn={moveColumn}
                handleHeaderChange={handleHeaderChange}
                isFirstColumn={actualIndex === 0}
                columnWidth={columnWidths[actualIndex] || (actualIndex === 0 ? 80 : 200)}
                onResizeColumn={handleResizeColumn}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {rowOrder.map((actualRowIndex, displayRowIndex) => {
            const row = rows[actualRowIndex];
            if (!row) return null;
            return (
              <DraggableRow
                key={`row-${actualRowIndex}`}
                row={row}
                rowIndex={displayRowIndex}
                actualRowIndex={actualRowIndex}
                columnOrder={columnOrder}
                moveRow={moveRow}
                handleCellChange={handleCellChange}
                hasRowNumbers={hasRowNumbers}
                displayRowNumber={displayRowIndex + 1}
                isAlternate={displayRowIndex % 2 === 1}
                columnWidths={columnWidths}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function InteractionTable(props: InteractionTableProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <InteractionTableContent {...props} />
    </DndProvider>
  );
}