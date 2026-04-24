import { Button } from "./ui/button";
import { Plus, Minus, GripVertical } from "lucide-react";
import { AutoResizeInput } from "./AutoResizeInput";
import { useEffect, useState, useRef } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

interface ChecklistTableProps {
  headers: string[];
  rows: string[][];
  onUpdateRows: (rows: string[][]) => void;
  onUpdateHeaders: (headers: string[]) => void;
}

interface DraggableRowProps {
  row: string[];
  rowIndex: number;
  actualRowIndex: number;
  moveRow: (dragIndex: number, hoverIndex: number) => void;
  handleCellChange: (rowIndex: number, cellIndex: number, value: string) => void;
  hasRowNumbers: boolean;
  displayRowNumber: number;
  isAlternate: boolean;
}

const DraggableRow = ({ 
  row, 
  rowIndex, 
  actualRowIndex, 
  moveRow, 
  handleCellChange, 
  hasRowNumbers, 
  displayRowNumber,
  isAlternate 
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
      {row.map((cell, cellIndex) => (
        <td
          key={`cell-${actualRowIndex}-${cellIndex}`}
          className={`border border-[#ddd] px-2.5 py-2.5 text-left align-top ${cellIndex === 0 && hasRowNumbers ? 'w-12' : ''}`}
        >
          {cellIndex === 0 ? (
            <div className="flex items-center gap-1">
              <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
              {hasRowNumbers ? (
                <div className="px-2 py-1 text-gray-500">
                  {displayRowNumber}
                </div>
              ) : (
                <AutoResizeInput
                  value={cell}
                  onChange={(e) => handleCellChange(actualRowIndex, cellIndex, e.target.value)}
                  className="w-full bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none rounded px-2"
                  minWidth={80}
                />
              )}
            </div>
          ) : cellIndex === 0 && hasRowNumbers ? (
            <div className="px-2 py-1 text-gray-500">
              {displayRowNumber}
            </div>
          ) : (
            <AutoResizeInput
              value={cell}
              onChange={(e) => handleCellChange(actualRowIndex, cellIndex, e.target.value)}
              className="w-full bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none rounded px-2"
              minWidth={80}
            />
          )}
        </td>
      ))}
    </tr>
  );
};

function ChecklistTableContent({ headers, rows, onUpdateRows, onUpdateHeaders }: ChecklistTableProps) {
  const [rowOrder, setRowOrder] = useState<number[]>([]);

  // Initialize row order only when length changes (add/remove rows)
  useEffect(() => {
    if (rowOrder.length !== rows.length) {
      setRowOrder(rows.map((_, index) => index));
    }
  }, [rows.length, rowOrder.length]);
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
      const newRows = rows.slice(0, -1);
      onUpdateRows(newRows);
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
      <div className="mb-2 flex gap-2">
        <Button
          onClick={addColumn}
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          Add Column
        </Button>
        <Button
          onClick={removeColumn}
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          disabled={headers.length <= 1}
        >
          <Minus className="h-4 w-4" />
          Remove Column
        </Button>
      </div>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th
                key={`header-${index}`}
                className={`border border-[#ddd] px-2.5 py-2.5 text-left align-top bg-[#f4f6f9] text-[#2c3e50] ${index === 0 && hasRowNumbers ? 'w-fit whitespace-nowrap' : ''}`}
              >
                {index === 0 && hasRowNumbers ? (
                  <div className="px-2" style={{ fontWeight: 'bold' }}>
                    {header}
                  </div>
                ) : (
                  <AutoResizeInput
                    value={header}
                    onChange={(e) => handleHeaderChange(index, e.target.value)}
                    className="w-full bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none rounded px-2"
                    minWidth={150}
                    bold={true}
                  />
                )}
              </th>
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
                moveRow={moveRow}
                handleCellChange={handleCellChange}
                hasRowNumbers={hasRowNumbers}
                displayRowNumber={displayRowIndex + 1}
                isAlternate={displayRowIndex % 2 === 1}
              />
            );
          })}
        </tbody>
      </table>
      <div className="mt-2 flex gap-2">
        <Button
          onClick={addRow}
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          Add Row
        </Button>
        <Button
          onClick={removeRow}
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          disabled={rows.length <= 1}
        >
          <Minus className="h-4 w-4" />
          Remove Row
        </Button>
      </div>
    </div>
  );
}

export function ChecklistTable(props: ChecklistTableProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <ChecklistTableContent {...props} />
    </DndProvider>
  );
}