import { useState, useEffect, useRef } from "react";
import { InteractionTable } from "./components/InteractionTable";
import { ChecklistTable } from "./components/ChecklistTable";
import { Button } from "./components/ui/button";
import { AutoResizeInput } from "./components/AutoResizeInput";
import { Textarea001 } from "./components/textarea001";
import { Textarea_1 } from "./components/textarea_1";
import { Textarea_2 } from "./components/textarea_2";
import { Textarea_3 } from "./components/textarea_3";
import { Textarea_4 } from "./components/textarea_4";
import { Textarea_5 } from "./components/textarea_5";
import { Textarea_6 } from "./components/textarea_6";
import { Plus, Minus, Pencil, ChevronLeft, ChevronRight, Save, Share2, GripVertical, RotateCcw, FileText, Code } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";
import pako from "pako";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import * as html2pdfLib from "html2pdf.js";
import { FABTooltip } from "./components/FABTooltip";

interface TableData {
  id: number;
  label: string;
  headers: string[];
  rows: string[][];
  columnWidths?: { [key: number]: number };
}

interface SectionData {
  id: number;
  title: string;
  tables: TableData[];
  type: "interaction" | "checklist";
  images: string[];
}

interface DraggableImageContainerProps {
  imageUrl: string;
  imageIndex: number;
  sectionId: number;
  moveImage: (sectionId: number, dragIndex: number, hoverIndex: number) => void;
  updateSectionImage: (sectionId: number, imageIndex: number, imageUrl: string) => void;
  setExpandedImage: (data: { sectionId: number; imageIndex: number; url: string } | null) => void;
}

function DraggableImageContainer({ 
  imageUrl, 
  imageIndex, 
  sectionId, 
  moveImage, 
  updateSectionImage, 
  setExpandedImage 
}: DraggableImageContainerProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: `image-${sectionId}`,
    item: { index: imageIndex },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: `image-${sectionId}`,
    hover: (item: { index: number }) => {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = imageIndex;

      if (dragIndex === hoverIndex) {
        return;
      }

      moveImage(sectionId, dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  drag(drop(ref));

  return (
    <div 
      ref={ref} 
      className="w-[300px] h-[500px] border-2 border-[#3498db] bg-gray-50 flex items-center justify-center relative group overflow-hidden cursor-move"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`Section image ${imageIndex + 1}`}
          className="w-full h-full object-cover cursor-pointer"
          onClick={() => setExpandedImage({ sectionId, imageIndex, url: imageUrl })}
        />
      ) : (
        <span className="text-gray-400">300px × 500px Image Container</span>
      )}
      <div className="absolute top-2 left-2 p-1 bg-white border border-gray-300 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
        <GripVertical className="h-4 w-4 text-gray-600" />
      </div>
      <button
        onClick={() => {
          const url = window.prompt("Enter image URL:", imageUrl || "");
          if (url !== null) {
            updateSectionImage(sectionId, imageIndex, url);
          }
        }}
        className="absolute top-2 right-2 p-2 bg-white border border-gray-300 rounded-md hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
        title="Edit image"
      >
        <Pencil className="h-4 w-4 text-gray-600" />
      </button>
    </div>
  );
}

interface DraggableButtonProps {
  section: SectionData;
  index: number;
  moveButton: (dragIndex: number, hoverIndex: number) => void;
  isActive: boolean;
  stickyBarHeight: number;
}

function DraggableButton({ section, index, moveButton, isActive, stickyBarHeight }: DraggableButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: "button",
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: "button",
    hover: (item: { index: number }) => {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      moveButton(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  drag(drop(ref));

  // Strip HTML tags to get plain text for button display
  const getPlainText = (html: string) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  return (
    <button
      ref={ref}
      onClick={() => {
        const element = document.getElementById(`section-${section.id}`);
        if (element) {
          const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = elementPosition - stickyBarHeight - 16;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }}
      className={`px-4 py-2 text-white rounded-md transition-colors flex items-center gap-2 cursor-move ${
        isActive ? 'bg-[#202DBC]' : 'bg-[#3498db] hover:bg-[#2980b9]'
      }`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <GripVertical className="h-4 w-4" />
      {getPlainText(section.title)}
    </button>
  );
}

interface DraggableChartProps {
  table: TableData;
  tableIndex: number;
  sectionId: number;
  sectionType: "interaction" | "checklist";
  tablesLength: number;
  moveChart: (sectionId: number, dragIndex: number, hoverIndex: number) => void;
  updateTableLabel: (sectionId: number, tableId: number, newLabel: string) => void;
  updateTableRows: (sectionId: number, tableId: number, newRows: string[][]) => void;
  updateTableHeaders: (sectionId: number, tableId: number, newHeaders: string[]) => void;
  updateTableColumnWidths: (sectionId: number, tableId: number, columnWidths: { [key: number]: number }) => void;
  removeTable: (sectionId: number, tableId: number) => void;
}

function DraggableChart({
  table,
  tableIndex,
  sectionId,
  sectionType,
  tablesLength,
  moveChart,
  updateTableLabel,
  updateTableRows,
  updateTableHeaders,
  updateTableColumnWidths,
  removeTable,
}: DraggableChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: `chart-${sectionId}`,
    item: { index: tableIndex },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: `chart-${sectionId}`,
    hover: (item: { index: number }) => {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = tableIndex;

      if (dragIndex === hoverIndex) {
        return;
      }

      moveChart(sectionId, dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  // Apply drag only to the drag handle, drop to the entire container
  drag(dragHandleRef);
  drop(ref);

  return (
    <div ref={ref} className="mb-4 relative" style={{ opacity: isDragging ? 0.5 : 1 }}>
      {tablesLength > 1 && (
        <div className="flex items-center gap-2 mb-2">
          <div ref={dragHandleRef} className="cursor-move p-1 hover:bg-gray-100 rounded">
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
          <AutoResizeInput
            value={table.label || `Chart ${tableIndex + 1}`}
            onChange={(e) => updateTableLabel(sectionId, table.id, e.target.value)}
            className="text-sm text-gray-600 bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none rounded px-2 flex-1"
            placeholder={`Chart ${tableIndex + 1}`}
          />
        </div>
      )}
      {sectionType === "interaction" ? (
        <InteractionTable
          headers={table.headers}
          rows={table.rows}
          onUpdateRows={(newRows) => updateTableRows(sectionId, table.id, newRows)}
          onUpdateHeaders={(newHeaders) => updateTableHeaders(sectionId, table.id, newHeaders)}
          columnWidths={table.columnWidths}
          onUpdateColumnWidths={(widths) => updateTableColumnWidths(sectionId, table.id, widths)}
        />
      ) : (
        <ChecklistTable
          headers={table.headers}
          rows={table.rows}
          onUpdateRows={(newRows) => updateTableRows(sectionId, table.id, newRows)}
          onUpdateHeaders={(newHeaders) => updateTableHeaders(sectionId, table.id, newHeaders)}
        />
      )}
      {tablesLength > 1 && (
        <Button
          onClick={() => removeTable(sectionId, table.id)}
          variant="outline"
          size="sm"
          className="flex items-center gap-1 mt-2"
        >
          <Minus className="h-4 w-4" />
          Remove Chart
        </Button>
      )}
    </div>
  );
}

interface DraggableSectionProps {
  section: SectionData;
  index: number;
  actualIndex: number;
  moveSection: (dragIndex: number, hoverIndex: number) => void;
  updateSectionTitle: (sectionId: number, newTitle: string) => void;
  removeSection: (sectionId: number) => void;
  sectionsLength: number;
  updateSectionImage: (sectionId: number, imageIndex: number, imageUrl: string) => void;
  setExpandedImage: (data: { sectionId: number; imageIndex: number; url: string } | null) => void;
  addImage: (sectionId: number) => void;
  removeImage: (sectionId: number) => void;
  moveImage: (sectionId: number, dragIndex: number, hoverIndex: number) => void;
  updateTableLabel: (sectionId: number, tableId: number, newLabel: string) => void;
  updateTableRows: (sectionId: number, tableId: number, newRows: string[][]) => void;
  updateTableHeaders: (sectionId: number, tableId: number, newHeaders: string[]) => void;
  updateTableColumnWidths: (sectionId: number, tableId: number, columnWidths: { [key: number]: number }) => void;
  removeTable: (sectionId: number, tableId: number) => void;
  addTable: (sectionId: number, defaultHeaders: string[]) => void;
  addSection: (sectionId: number) => void;
  moveChart: (sectionId: number, dragIndex: number, hoverIndex: number) => void;
}

function DraggableSection({
  section,
  index,
  actualIndex,
  moveSection,
  updateSectionTitle,
  removeSection,
  sectionsLength,
  updateSectionImage,
  setExpandedImage,
  addImage,
  removeImage,
  moveImage,
  updateTableLabel,
  updateTableRows,
  updateTableHeaders,
  updateTableColumnWidths,
  removeTable,
  addTable,
  addSection,
  moveChart,
}: DraggableSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: "section",
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: "section",
    hover: (item: { index: number }) => {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      moveSection(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  // Apply drag only to the drag handle, drop to the entire section
  drag(dragHandleRef);
  drop(ref);

  return (
    <section
      ref={ref}
      id={`section-${section.id}`}
      className={`mt-8 scroll-mt-64 ${isDragging ? 'opacity-50' : ''}`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-1">
          <div ref={dragHandleRef} className="cursor-move">
            <GripVertical className="h-5 w-5 text-gray-400 flex-shrink-0" />
          </div>
          <h2 className="text-[#2c3e50] border-b-2 border-[#3498db] pb-1.5 flex-1 font-normal">
            <AutoResizeInput
              value={section.title}
              onChange={(e) => updateSectionTitle(section.id, e.target.value)}
              className="w-full bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none rounded px-2"
              style={{ fontWeight: 'bold', color: '#2c3e50', fontStyle: 'normal' }}
            />
          </h2>
        </div>
        {sectionsLength > 1 && (
          <Button
            onClick={() => removeSection(section.id)}
            variant="outline"
            size="sm"
            className="flex items-center gap-1 ml-4"
          >
            <Minus className="h-4 w-4" />
            Remove Section
          </Button>
        )}
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => addImage(section.id)}
            className="p-1 hover:bg-gray-100 rounded border border-gray-300 transition-colors"
            title="Add image"
          >
            <Plus className="h-4 w-4" />
          </button>
          <span className="text-sm text-gray-700">Image</span>
          <button
            onClick={() => removeImage(section.id)}
            className="p-1 hover:bg-gray-100 rounded border border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Remove image"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-4 flex-wrap">
          {section.images.map((imageUrl, imageIndex) => (
            <DraggableImageContainer
              key={imageIndex}
              imageUrl={imageUrl}
              imageIndex={imageIndex}
              sectionId={section.id}
              moveImage={moveImage}
              updateSectionImage={updateSectionImage}
              setExpandedImage={setExpandedImage}
            />
          ))}
        </div>
      </div>

      {section.tables.map((table, tableIndex) => (
        <DraggableChart
          key={table.id}
          table={table}
          tableIndex={tableIndex}
          sectionId={section.id}
          sectionType={section.type}
          tablesLength={section.tables.length}
          moveChart={moveChart}
          updateTableLabel={updateTableLabel}
          updateTableRows={updateTableRows}
          updateTableHeaders={updateTableHeaders}
          updateTableColumnWidths={updateTableColumnWidths}
          removeTable={removeTable}
        />
      ))}

      <div className="flex gap-2">
        <Button
          onClick={() => addTable(section.id, section.tables[0].headers)}
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          Add Chart
        </Button>
        <Button
          onClick={() => addSection(section.id)}
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          Add Section
        </Button>
      </div>
    </section>
  );
}

export default function App() {
  const [title, setTitle] = useState("N/A");
  const [authorLabel, setAuthorLabel] = useState("Author:");
  const [author, setAuthor] = useState("Ecommerce UX Research Team");
  const [dateLabel, setDateLabel] = useState("Date:");
  const [date, setDate] = useState("October 29, 2025");
  const [versionLabel, setVersionLabel] = useState("Version:");
  const [version, setVersion] = useState("247.0");
  const [purposeLabel, setPurposeLabel] = useState("Purpose:");
  const [purpose, setPurpose] = useState("This document defines the minimum viable and expected interactions for a high-converting, frustration-free site search experience.");
  const [audienceLabel, setAudienceLabel] = useState("Audience:");
  const [audience, setAudience] = useState("Product Managers, UX Designers, Developers, Merchandising Teams, MLM & DTC Brands.");
  const [expandedImage, setExpandedImage] = useState<{ sectionId: number; imageIndex: number; url: string } | null>(null);

  const stickyContentsRef = useRef<HTMLDivElement>(null);
  const [stickyBarHeight, setStickyBarHeight] = useState(0);

  const [sections, setSections] = useState<SectionData[]>([
    {
      id: 1,
      title: "1. Pre-Search: Search Bar Discovery & Initiation",
      type: "interaction",
      images: [""],
      tables: [
        {
          id: 1,
          label: "",
          headers: ["#", "User Action"],
          rows: [
            ["1", "Lands on any page"],
          ]
        }
      ]
    }
  ]);

  const [proTips, setProTips] = useState([
    {
      id: 1,
      label: "Pro Tip for MLM & Subscription Brands:",
      content: "Add **\"Find your starter kit\"** or **\"Search by rank/goal\"** as **pinned autocomplete suggestions** — turns search into a **recruitment + sales funnel**."
    }
  ]);

  const [references, setReferences] = useState([
    "Zoovu 2025 State of Ecommerce Search Report",
    "Baymard Institute: Ecommerce Search UX (2024–2025)",
    "Google PageSpeed Insights: Core Web Vitals",
  ]);

  const [links, setLinks] = useState<{ url: string; displayText: string }[]>([
    { url: "https://example.com", displayText: "Example Link" }
  ]);

  const [footerCopyright, setFooterCopyright] = useState("© 2025 Ecommerce UX Research Team | For internal use & distribution");
  const [footerGenerated, setFooterGenerated] = useState("Generated for download on October 29, 2025");
  const [sectionOrder, setSectionOrder] = useState<number[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<number | null>(null);
  
  // Code Import/Export Dialog State
  const [isCodeDialogOpen, setIsCodeDialogOpen] = useState(false);
  const [codeContent, setCodeContent] = useState("");

  // Initialize section order only if empty - FIXED: Store IDs not indices
  useEffect(() => {
    if (sectionOrder.length === 0) {
      setSectionOrder(sections.map((section) => section.id));
    }
  }, [sections.length]);

  // Measure sticky bar height
  useEffect(() => {
    if (stickyContentsRef.current) {
      const height = stickyContentsRef.current.getBoundingClientRect().height;
      setStickyBarHeight(height);
    }
  }, [sections, sectionOrder]);

  // Scroll spy - detect which section is 16px below sticky header
  useEffect(() => {
    if (stickyBarHeight === 0) return;

    const handleScroll = () => {
      const targetLine = stickyBarHeight + 16;
      let activeId: number | null = null;
      let closestDistance = Infinity;

      sections.forEach((section) => {
        const element = document.getElementById(`section-${section.id}`);
        if (!element) return;

        const rect = element.getBoundingClientRect();
        const sectionTop = rect.top;
        
        // Calculate distance from target line (16px below sticky bar)
        const distance = Math.abs(sectionTop - targetLine);
        
        // Find section closest to target line that's above or at it
        if (sectionTop <= targetLine + 50 && distance < closestDistance) {
          closestDistance = distance;
          activeId = section.id;
        }
      });

      if (activeId !== null && activeId !== activeSectionId) {
        setActiveSectionId(activeId);
      }
    };

    // Run on mount and scroll
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [sections, stickyBarHeight, activeSectionId]);

  const moveSection = (dragIndex: number, hoverIndex: number) => {
    const newOrder = [...sectionOrder];
    const [removed] = newOrder.splice(dragIndex, 1);
    newOrder.splice(hoverIndex, 0, removed);
    setSectionOrder(newOrder);
  };

  const moveButton = (dragIndex: number, hoverIndex: number) => {
    const newOrder = [...sectionOrder];
    const [removed] = newOrder.splice(dragIndex, 1);
    newOrder.splice(hoverIndex, 0, removed);
    setSectionOrder(newOrder);
  };

  const moveImage = (sectionId: number, dragIndex: number, hoverIndex: number) => {
    setSections(prevSections => 
      prevSections.map(section => {
        if (section.id === sectionId) {
          const newImages = [...section.images];
          const [removed] = newImages.splice(dragIndex, 1);
          newImages.splice(hoverIndex, 0, removed);
          return { ...section, images: newImages };
        }
        return section;
      })
    );
  };

  const moveChart = (sectionId: number, dragIndex: number, hoverIndex: number) => {
    setSections(prevSections => 
      prevSections.map(section => {
        if (section.id === sectionId) {
          const newTables = [...section.tables];
          const [removed] = newTables.splice(dragIndex, 1);
          newTables.splice(hoverIndex, 0, removed);
          return { ...section, tables: newTables };
        }
        return section;
      })
    );
  };

  // Helper functions for managing sections
  const addSection = (sectionId: number) => {
    const sectionToClone = sections.find(s => s.id === sectionId);
    if (!sectionToClone) return;

    const newId = Math.max(...sections.map(s => s.id), 0) + 1;
    const newSection: SectionData = {
      id: newId,
      title: sectionToClone.title + " (Copy)",
      type: sectionToClone.type,
      images: [...sectionToClone.images],
      tables: sectionToClone.tables.map((table, index) => ({
        id: newId * 1000 + index + 1,
        label: table.label,
        headers: [...table.headers],
        rows: table.rows.map(row => [...row])
      }))
    };

    const sectionIndex = sections.findIndex(s => s.id === sectionId);
    const newSections = [...sections];
    newSections.splice(sectionIndex + 1, 0, newSection);
    setSections(newSections);
    
    // FIXED: Update sectionOrder to include the new section ID
    const orderIndex = sectionOrder.findIndex(id => id === sectionId);
    const newOrder = [...sectionOrder];
    newOrder.splice(orderIndex + 1, 0, newId);
    setSectionOrder(newOrder);
  };

  const removeSection = (sectionId: number) => {
    if (sections.length > 1) {
      setSections(sections.filter(s => s.id !== sectionId));
      
      // FIXED: Update sectionOrder to remove the section ID
      setSectionOrder(sectionOrder.filter(id => id !== sectionId));
    }
  };

  const updateSectionTitle = (sectionId: number, newTitle: string) => {
    setSections(sections.map(s => s.id === sectionId ? { ...s, title: newTitle } : s));
  };

  const updateSectionImage = (sectionId: number, imageIndex: number, imageUrl: string) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        const newImages = [...s.images];
        newImages[imageIndex] = imageUrl;
        return { ...s, images: newImages };
      }
      return s;
    }));
  };

  const addImage = (sectionId: number) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        return { ...s, images: [...s.images, ""] };
      }
      return s;
    }));
  };

  const removeImage = (sectionId: number) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        return { ...s, images: s.images.slice(0, -1) };
      }
      return s;
    }));
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (!expandedImage) return;

    const section = sections.find(s => s.id === expandedImage.sectionId);
    if (!section) return;

    const currentIndex = expandedImage.imageIndex;
    let newIndex: number;

    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : section.images.length - 1;
    } else {
      newIndex = currentIndex < section.images.length - 1 ? currentIndex + 1 : 0;
    }

    const newUrl = section.images[newIndex];
    if (newUrl) {
      setExpandedImage({ sectionId: section.id, imageIndex: newIndex, url: newUrl });
    }
  };

  // Helper functions for managing tables within sections
  const addTable = (sectionId: number, defaultHeaders: string[]) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        const newTableId = Math.max(...section.tables.map(t => t.id), 0) + 1;
        const newTable: TableData = {
          id: newTableId,
          label: "",
          headers: ["N/A"],
          rows: [["N/A"]]
        };
        return { ...section, tables: [...section.tables, newTable] };
      }
      return section;
    }));
  };

  const removeTable = (sectionId: number, tableId: number) => {
    setSections(sections.map(section => {
      if (section.id === sectionId && section.tables.length > 1) {
        return { ...section, tables: section.tables.filter(t => t.id !== tableId) };
      }
      return section;
    }));
  };

  const updateTableRows = (sectionId: number, tableId: number, newRows: string[][]) => {
    setSections(prevSections => prevSections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          tables: section.tables.map(t => t.id === tableId ? { ...t, rows: newRows } : t)
        };
      }
      return section;
    }));
  };

  const updateTableHeaders = (sectionId: number, tableId: number, newHeaders: string[]) => {
    setSections(prevSections => prevSections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          tables: section.tables.map(t => t.id === tableId ? { ...t, headers: newHeaders } : t)
        };
      }
      return section;
    }));
  };

  const updateTableLabel = (sectionId: number, tableId: number, newLabel: string) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          tables: section.tables.map(t => t.id === tableId ? { ...t, label: newLabel } : t)
        };
      }
      return section;
    }));
  };

  const updateTableColumnWidths = (sectionId: number, tableId: number, columnWidths: { [key: number]: number }) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          tables: section.tables.map(t => t.id === tableId ? { ...t, columnWidths } : t)
        };
      }
      return section;
    }));
  };

  // Helper functions for managing pro tips
  const addProTip = () => {
    const newId = Math.max(...proTips.map(p => p.id), 0) + 1;
    const newProTip = {
      id: newId,
      label: "Pro Tip:",
      content: "Enter your pro tip here..."
    };
    setProTips([...proTips, newProTip]);
  };

  const removeProTip = (id: number) => {
    if (proTips.length > 1) {
      setProTips(proTips.filter(p => p.id !== id));
    }
  };

  const updateProTipLabel = (id: number, newLabel: string) => {
    setProTips(proTips.map(p => p.id === id ? { ...p, label: newLabel } : p));
  };

  const updateProTipContent = (id: number, newContent: string) => {
    setProTips(proTips.map(p => p.id === id ? { ...p, content: newContent } : p));
  };

  // Save all state to localStorage
  const saveToLocalStorage = () => {
    // Increment version by 0.1, with logic to go from X.9 to (X+1).0
    const currentVersion = parseFloat(version) || 0;
    const incremented = Math.round((currentVersion + 0.1) * 10) / 10;
    
    // Check if we've reached X.10, if so, round up to next whole number
    const newVersion = incremented % 1 === 0 ? incremented.toFixed(1) : incremented.toFixed(1);
    const finalVersion = parseFloat(newVersion) >= Math.floor(currentVersion) + 1 ? 
      (Math.floor(currentVersion) + 1).toFixed(1) : 
      newVersion;
    
    setVersion(finalVersion);
    
    const state = {
      title,
      authorLabel,
      author,
      dateLabel,
      date,
      versionLabel,
      version: finalVersion,
      purposeLabel,
      purpose,
      audienceLabel,
      audience,
      sections,
      sectionOrder,
      proTips,
      references,
      links,
      footerCopyright,
      footerGenerated,
    };
    localStorage.setItem('ecommerceSearchDoc', JSON.stringify(state));
    toast.success('All changes saved!');
  };

  // Generate shareable link (modified to return URL)
  const generateShareableLink = (silent = false) => {
    const state = {
      title,
      authorLabel,
      author,
      dateLabel,
      date,
      versionLabel,
      version,
      purposeLabel,
      purpose,
      audienceLabel,
      audience,
      sections,
      sectionOrder,
      proTips,
      references,
      links,
      footerCopyright,
      footerGenerated,
    };
    
    try {
      console.log('State being shared:', state);
      const jsonString = JSON.stringify(state);
      console.log('JSON length:', jsonString.length);
      
      // Use pako to compress
      const compressed = pako.deflate(jsonString, { level: 9 });
      // Convert to base64
      const base64 = btoa(String.fromCharCode.apply(null, Array.from(compressed)));
      // Make it URL-safe
      const urlSafe = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      
      console.log('Compressed length:', urlSafe.length);
      const shareableUrl = `${window.location.origin}${window.location.pathname}?share=${urlSafe}`;
      console.log('Full URL:', shareableUrl);
      
      if (!silent) {
        navigator.clipboard.writeText(shareableUrl).then(() => {
          toast.success('Shareable link copied to clipboard!');
        }).catch((err) => {
          console.error('Clipboard error:', err);
          toast.error('Failed to copy link to clipboard');
        });
      }
      
      return shareableUrl;
    } catch (err) {
      console.error('Error generating share link:', err);
      if (!silent) {
        toast.error('Failed to generate shareable link');
      }
      return '';
    }
  };

  // Download as PDF using browser print
  const downloadAsPDF = () => {
    // Auto-save first
    saveToLocalStorage();
    
    // Generate share URL
    const shareUrl = generateShareableLink(true);
    
    if (!shareUrl) {
      toast.error('Failed to generate shareable link for PDF');
      return;
    }
    
    // Wrap all section images in clickable links (for PDF)
    const sectionImages = document.querySelectorAll('.w-\\[300px\\].h-\\[500px\\] img');
    const imageWrappers: { img: HTMLImageElement; link: HTMLAnchorElement; parent: HTMLElement }[] = [];
    
    sectionImages.forEach((img) => {
      const imageElement = img as HTMLImageElement;
      if (imageElement.src && imageElement.parentElement) {
        const link = document.createElement('a');
        link.href = imageElement.src;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.display = 'block';
        link.style.width = '100%';
        link.style.height = '100%';
        
        const parent = imageElement.parentElement;
        parent.insertBefore(link, imageElement);
        link.appendChild(imageElement);
        
        imageWrappers.push({ img: imageElement, link, parent });
      }
    });
    
    // Add "View Online" link temporarily
    const viewOnlineDiv = document.createElement('div');
    viewOnlineDiv.id = 'pdf-view-online-link';
    viewOnlineDiv.style.textAlign = 'center';
    viewOnlineDiv.style.marginTop = '40px';
    viewOnlineDiv.style.paddingTop = '20px';
    viewOnlineDiv.style.borderTop = '1px solid #ddd';
    viewOnlineDiv.innerHTML = `<a href="${shareUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration: underline; color: #3498db; font-size: 14px;">View Online</a>`;
    viewOnlineDiv.classList.add('print-only');
    
    const mainContent = document.querySelector('.max-w-5xl.mx-auto');
    if (mainContent) {
      mainContent.appendChild(viewOnlineDiv);
    }
    
    // Trigger browser print dialog
    window.print();
    
    // Unwrap images after printing
    setTimeout(() => {
      imageWrappers.forEach(({ img, link, parent }) => {
        if (link.parentElement === parent) {
          parent.insertBefore(img, link);
          parent.removeChild(link);
        }
      });
      
      // Remove the "View Online" link
      if (viewOnlineDiv.parentElement) {
        viewOnlineDiv.parentElement.removeChild(viewOnlineDiv);
      }
    }, 1000);
    
    toast.success('Print dialog opened! Save as PDF to download.');
  };

  // Reset to defaults
  const resetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all data to defaults? This will clear all your changes.')) {
      // Clear localStorage
      localStorage.removeItem('ecommerceSearchDoc');
      
      // Reset all state to default values
      setTitle("N/A");
      setAuthorLabel("Author:");
      setAuthor("Ecommerce UX Research Team");
      setDateLabel("Date:");
      setDate("October 29, 2025");
      setVersionLabel("Version:");
      setVersion("1.0");
      setPurposeLabel("Purpose:");
      setPurpose("This document defines the minimum viable and expected interactions for a high-converting, frustration-free site search experience.");
      setAudienceLabel("Audience:");
      setAudience("Product Managers, UX Designers, Developers, Merchandising Teams, MLM & DTC Brands.");
      setSections([
        {
          id: 1,
          title: "1. Pre-Search: Search Bar Discovery & Initiation",
          type: "interaction",
          images: [""],
          tables: [
            {
              id: 1,
              label: "",
              headers: ["#", "User Action"],
              rows: [
                ["1", "Lands on any page"],
              ]
            }
          ]
        }
      ]);
      setSectionOrder([1]);
      setProTips([
        {
          id: 1,
          label: "Pro Tip for MLM & Subscription Brands:",
          content: "Add **\"Find your starter kit\"** or **\"Search by rank/goal\"** as **pinned autocomplete suggestions** — turns search into a **recruitment + sales funnel**."
        }
      ]);
      setReferences([
        "Zoovu 2025 State of Ecommerce Search Report",
        "Baymard Institute: Ecommerce Search UX (2024–2025)",
        "Google PageSpeed Insights: Core Web Vitals",
      ]);
      setLinks([
        { url: "https://example.com", displayText: "Example Link" }
      ]);
      setFooterCopyright("© 2025 Ecommerce UX Research Team | For internal use & distribution");
      setFooterGenerated("Generated for download on October 29, 2025");
      
      toast.success('App reset to defaults!');
    }
  };

  // Open Code Dialog and populate with current state
  const openCodeDialog = () => {
    const state = {
      title,
      authorLabel,
      author,
      dateLabel,
      date,
      versionLabel,
      version,
      purposeLabel,
      purpose,
      audienceLabel,
      audience,
      sections,
      sectionOrder,
      proTips,
      references,
      links,
      footerCopyright,
      footerGenerated,
    };
    
    const prettyJson = JSON.stringify(state, null, 2);
    setCodeContent(prettyJson);
    setIsCodeDialogOpen(true);
  };

  // Apply code from dialog
  const applyCode = () => {
    try {
      const state = JSON.parse(codeContent);
      
      // Validate required fields
      if (!state.title || !state.sections || !Array.isArray(state.sections)) {
        toast.error('Invalid code structure: Missing required fields');
        return;
      }
      
      // Apply all state
      setTitle(state.title || "N/A");
      setAuthorLabel(state.authorLabel || "Author:");
      setAuthor(state.author || "Ecommerce UX Research Team");
      setDateLabel(state.dateLabel || "Date:");
      setDate(state.date || "October 29, 2025");
      setVersionLabel(state.versionLabel || "Version:");
      setVersion(state.version || "1.0");
      setPurposeLabel(state.purposeLabel || "Purpose:");
      setPurpose(state.purpose || "This document defines the minimum viable and expected interactions for a high-converting, frustration-free site search experience.");
      setAudienceLabel(state.audienceLabel || "Audience:");
      setAudience(state.audience || "Product Managers, UX Designers, Developers, Merchandising Teams, MLM & DTC Brands.");
      setSections(state.sections);
      
      if (state.sectionOrder && Array.isArray(state.sectionOrder)) {
        setSectionOrder(state.sectionOrder);
      } else {
        setSectionOrder(state.sections.map((s: SectionData) => s.id));
      }
      
      if (state.proTips && Array.isArray(state.proTips)) {
        setProTips(state.proTips);
      }
      
      if (state.references && Array.isArray(state.references)) {
        setReferences(state.references);
      }
      
      if (state.links && Array.isArray(state.links)) {
        setLinks(state.links);
      }
      
      setFooterCopyright(state.footerCopyright || "© 2025 Ecommerce UX Research Team | For internal use & distribution");
      setFooterGenerated(state.footerGenerated || "Generated for download on October 29, 2025");
      
      setIsCodeDialogOpen(false);
      toast.success('Code applied successfully!');
    } catch (error) {
      console.error('Failed to parse code:', error);
      toast.error('Failed to parse JSON. Please check your code syntax.');
    }
  };

  // Load state from URL query parameter or localStorage on mount
  useEffect(() => {
    // First, check if there's shared data in URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const shareData = urlParams.get('share');
    console.log('Share parameter:', shareData ? 'Present (length: ' + shareData.length + ')' : 'Empty');
    
    if (shareData) {
      try {
        console.log('Attempting to decompress shared data...');
        
        // Restore URL-safe characters
        let base64 = shareData.replace(/-/g, '+').replace(/_/g, '/');
        // Add padding if needed
        while (base64.length % 4) {
          base64 += '=';
        }
        
        // Decode base64
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Decompress
        const decompressed = pako.inflate(bytes, { to: 'string' });
        console.log('Decompressed:', decompressed ? 'Success (length: ' + decompressed.length + ')' : 'Failed');
        
        if (decompressed) {
          const state = JSON.parse(decompressed);
          console.log('Parsed state:', state);
          setTitle(state.title);
          setAuthorLabel(state.authorLabel);
          setAuthor(state.author);
          setDateLabel(state.dateLabel);
          setDate(state.date);
          setVersionLabel(state.versionLabel);
          setVersion(state.version);
          setPurposeLabel(state.purposeLabel);
          setPurpose(state.purpose);
          setAudienceLabel(state.audienceLabel);
          setAudience(state.audience);
          setSections(state.sections);
          if (state.sectionOrder) {
            setSectionOrder(state.sectionOrder);
          }
          setProTips(state.proTips);
          setReferences(state.references);
          if (state.links) {
            setLinks(state.links);
          }
          setFooterCopyright(state.footerCopyright);
          setFooterGenerated(state.footerGenerated);
          toast.success('Shared document loaded!');
          return;
        }
      } catch (error) {
        console.error('Failed to load shared state:', error);
        toast.error('Failed to load shared document');
      }
    }

    // If no share data, load from localStorage
    const savedState = localStorage.getItem('ecommerceSearchDoc');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        setTitle(state.title);
        setAuthorLabel(state.authorLabel);
        setAuthor(state.author);
        setDateLabel(state.dateLabel);
        setDate(state.date);
        setVersionLabel(state.versionLabel);
        setVersion(state.version);
        setPurposeLabel(state.purposeLabel);
        setPurpose(state.purpose);
        setAudienceLabel(state.audienceLabel);
        setAudience(state.audience);
        setSections(state.sections);
        if (state.sectionOrder) {
          setSectionOrder(state.sectionOrder);
        }
        setProTips(state.proTips);
        setReferences(state.references);
        if (state.links) {
          setLinks(state.links);
        }
        setFooterCopyright(state.footerCopyright);
        setFooterGenerated(state.footerGenerated);
        toast.success('Previous changes loaded!');
      } catch (error) {
        console.error('Failed to load saved state:', error);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Toaster />
      <div className="max-w-5xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-[#2c3e50] mb-2 text-[32px] flex justify-center">
            <Textarea_5
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-center bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none rounded px-2 resize-none"
            />
          </h1>
          <div className="text-[#7f8c8d] text-sm mt-5 flex items-center justify-center">
            <AutoResizeInput
              value={authorLabel}
              onChange={(e) => setAuthorLabel(e.target.value)}
              className="bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none rounded px-1"
              bold={true}
            />{" "}
            <AutoResizeInput
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none rounded px-1"
            />
            {" "}&nbsp;|&nbsp;{" "}
            <AutoResizeInput
              value={dateLabel}
              onChange={(e) => setDateLabel(e.target.value)}
              className="bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none rounded px-1"
              bold={true}
            />{" "}
            <span className="px-1">
              {new Date().toLocaleString('en-US', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit', 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit',
                hour12: false 
              })}
            </span>
            {" "}&nbsp;|&nbsp;{" "}
            <AutoResizeInput
              value={versionLabel}
              onChange={(e) => setVersionLabel(e.target.value)}
              className="bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none rounded px-1"
              bold={true}
            />{" "}
            <AutoResizeInput
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none rounded px-1 w-16"
            />
          </div>
        </div>

        {/* Purpose */}
        <div className="mb-5 font-normal text-[16px]">
          <strong>
            <Textarea_1
              value={purposeLabel}
              onChange={(e) => setPurposeLabel(e.target.value)}
              className="bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none rounded px-1"
              autoResize="width"
              customFontSize="16px"
              customFontWeight="bold"
              customColor="black"
              customLineHeight="1.2"
              customFontFamily="inherit"
            />
          </strong>
          <br />
          <Textarea_2
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="w-full bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none rounded px-2 resize-none"
            autoResize="height"
            customFontSize="16px"
            customFontWeight="normal"
            customColor="black"
            customLineHeight="1.5"
            customFontFamily="inherit"
          />
        </div>

        {/* Audience */}
        <div className="mb-5 font-normal text-[16px]">
          <strong>
            <Textarea_3
              value={audienceLabel}
              onChange={(e) => setAudienceLabel(e.target.value)}
              className="bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none rounded px-1"
              autoResize="width"
              customFontSize="16px"
              customFontWeight="bold"
              customColor="black"
              customLineHeight="1.2"
              customFontFamily="inherit"
            />
          </strong>
          <br />
          <Textarea_4
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="w-full bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none rounded px-2"
            autoResize="height"
            customFontSize="16px"
            customFontWeight="normal"
            customColor="black"
            customLineHeight="1.5"
            customFontFamily="inherit"
          />
        </div>

        <hr className="border-t border-gray-300 my-6" />

        {/* Contents Section */}
        <div className="sticky top-0 z-10 bg-white mb-8 py-4" ref={stickyContentsRef}>
          <h2 className="text-[#2c3e50] mb-4">Contents</h2>
          <DndProvider backend={HTML5Backend}>
            <div className="flex flex-wrap gap-2">
              {sectionOrder.map((actualIndex, displayIndex) => {
                const section = sections.find(s => s.id === actualIndex);
                if (!section) return null;
                return (
                  <DraggableButton
                    key={section.id}
                    section={section}
                    index={displayIndex}
                    moveButton={moveButton}
                    isActive={activeSectionId === section.id}
                    stickyBarHeight={stickyBarHeight}
                  />
                );
              })}
            </div>
          </DndProvider>
        </div>

        <hr className="border-t border-gray-300 my-6" />

        {/* Sections */}
        <DndProvider backend={HTML5Backend}>
          {sectionOrder.map((actualIndex, displayIndex) => {
            const section = sections.find(s => s.id === actualIndex);
            if (!section) return null;
            return (
              <DraggableSection
                key={section.id}
                section={section}
                index={displayIndex}
                actualIndex={actualIndex}
                moveSection={moveSection}
                updateSectionTitle={updateSectionTitle}
                removeSection={removeSection}
                sectionsLength={sections.length}
                updateSectionImage={updateSectionImage}
                setExpandedImage={setExpandedImage}
                addImage={addImage}
                removeImage={removeImage}
                moveImage={moveImage}
                updateTableLabel={updateTableLabel}
                updateTableRows={updateTableRows}
                updateTableHeaders={updateTableHeaders}
                updateTableColumnWidths={updateTableColumnWidths}
                removeTable={removeTable}
                addTable={addTable}
                addSection={addSection}
                moveChart={moveChart}
              />
            );
          })}
        </DndProvider>

        {/* Pro Tips */}
        {proTips.map((tip) => (
          <div key={tip.id} className="bg-[#fef9e7] px-3 py-3 border-l-4 border-[#f39c12] my-5 italic">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <AutoResizeInput
                  value={tip.label}
                  onChange={(e) => updateProTipLabel(tip.id, e.target.value)}
                  className="bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none rounded px-1"
                  style={{ fontWeight: 'bold', fontStyle: 'normal' }}
                />
                <br />
                <Textarea_6
                  value={tip.content}
                  onChange={(e) => updateProTipContent(tip.id, e.target.value)}
                  className="w-full bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none rounded px-2 resize-none mt-1"
                  style={{ fontWeight: 'normal', fontStyle: 'italic' }}
                />
              </div>
              {proTips.length > 1 && (
                <Button
                  onClick={() => removeProTip(tip.id)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Minus className="h-4 w-4" />
                  Remove
                </Button>
              )}
            </div>
          </div>
        ))}
        <Button
          onClick={addProTip}
          variant="outline"
          size="sm"
          className="flex items-center gap-1 mb-8"
        >
          <Plus className="h-4 w-4" />
          Add Pro Tip
        </Button>

        {/* References and Links */}
        <section className="mt-8">
          <h2 className="text-[#2c3e50] border-b-2 border-[#3498db] pb-1.5 mb-4">
            <AutoResizeInput
              value="References & Links"
              onChange={() => {}}
              className="w-full bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none rounded px-2"
            />
          </h2>
          <div className="grid grid-cols-2 gap-8">
            {/* Left column: References */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => setReferences([...references, "New Reference"])}
                  className="p-1 hover:bg-gray-100 rounded border border-gray-300 transition-colors"
                  title="Add reference"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-700">Reference</span>
                <button
                  onClick={() => {
                    if (references.length > 0) {
                      setReferences(references.slice(0, -1));
                    }
                  }}
                  className="p-1 hover:bg-gray-100 rounded border border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={references.length === 0}
                  title="Remove reference"
                >
                  <Minus className="h-4 w-4" />
                </button>
              </div>
              <ul className="list-disc pl-5 space-y-1">
                {references.map((ref, index) => (
                  <li key={index}>
                    <input
                      value={ref}
                      onChange={(e) => {
                        const newRefs = [...references];
                        newRefs[index] = e.target.value;
                        setReferences(newRefs);
                      }}
                      className="w-full bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none rounded px-2"
                    />
                  </li>
                ))}
              </ul>
            </div>

            {/* Right column: Links */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => {
                    const url = prompt("Enter the URL:");
                    if (url) {
                      const displayText = prompt("Enter the display text:");
                      if (displayText) {
                        setLinks([...links, { url, displayText }]);
                      }
                    }
                  }}
                  className="p-1 hover:bg-gray-100 rounded border border-gray-300 transition-colors"
                  title="Add link"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-700">Link</span>
                <button
                  onClick={() => {
                    if (links.length > 0) {
                      setLinks(links.slice(0, -1));
                    }
                  }}
                  className="p-1 hover:bg-gray-100 rounded border border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={links.length === 0}
                  title="Remove link"
                >
                  <Minus className="h-4 w-4" />
                </button>
              </div>
              <ul className="space-y-1">
                {links.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {link.displayText}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-12 text-xs text-[#95a5a6] text-center">
          <div className="w-full text-center">
            UX Research Team | For internal use & distribution
          </div>
          <br />
          <em>
            <div className="w-full text-center">
              {new Date().toLocaleString('en-US', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit', 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit',
                hour12: false 
              })}
            </div>
          </em>
        </div>
      </div>

      {/* Full Screen Image Modal */}
      {expandedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}
        >
          {/* Close button at the top */}
          <button
            onClick={() => setExpandedImage(null)}
            className="bg-white text-black px-4 py-2 rounded-md hover:bg-gray-200 transition-colors mb-4"
          >
            Close
          </button>
          
          {/* Image with side navigation */}
          <div className="flex items-center gap-6" onClick={(e) => e.stopPropagation()}>
            {/* Previous Arrow */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigateImage('prev');
              }}
              className="bg-white text-black p-3 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0"
              title="Previous image"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            
            {/* Image */}
            <img 
              src={expandedImage.url} 
              alt="Expanded view" 
              className="max-w-[80vw] max-h-[80vh] object-contain"
            />
            
            {/* Next Arrow */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigateImage('next');
              }}
              className="bg-white text-black p-3 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0"
              title="Next image"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}

      {/* Code Import/Export Dialog */}
      {isCodeDialogOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsCodeDialogOpen(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dialog Header */}
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Code Import/Export</h2>
              <button
                onClick={() => setIsCodeDialogOpen(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            
            {/* Dialog Body */}
            <div className="flex-1 p-6 overflow-auto">
              <p className="text-sm text-gray-600 mb-4">
                Edit the JSON code below to bulk update all form data. Make sure the JSON is valid before applying.
              </p>
              <textarea
                value={codeContent}
                onChange={(e) => setCodeContent(e.target.value)}
                className="w-full h-[500px] p-4 font-mono text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                spellCheck={false}
              />
            </div>
            
            {/* Dialog Footer */}
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsCodeDialogOpen(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={applyCode}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Apply Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Buttons for Save and Share */}
      {/* ========== EDIT TOOLTIP TEXT BELOW (Lines 1690-1694) ========== */}
      {(() => {
        const TOOLTIP_CODE = "Code template to import your code.";
        const TOOLTIP_SHARE = "Generates a link, then copies it, then takes you to TinyURL";
        const TOOLTIP_SAVE = "Saves All Changes";
        const TOOLTIP_RESET = "CAUTION: Clears all entered data.🫣";
        const TOOLTIP_PDF = "Download as PDF";
        
        return (
          <div className="fixed bottom-8 right-8 flex flex-col gap-3 z-40">
            <FABTooltip text={TOOLTIP_CODE}>
              <button
                onClick={openCodeDialog}
                className="bg-[#9b59b6] text-white p-4 rounded-full shadow-lg hover:bg-[#8e44ad] transition-all hover:scale-110"
              >
                <Code className="h-6 w-6" />
              </button>
            </FABTooltip>
            
            <FABTooltip text={TOOLTIP_SHARE}>
              <button
                onClick={() => {
                  generateShareableLink();
                  window.open("https://tinyurl.com/", "_blank", "noopener,noreferrer");
                }}
                className="bg-[#27ae60] text-white p-4 rounded-full shadow-lg hover:bg-[#229954] transition-all hover:scale-110"
              >
                <Share2 className="h-6 w-6" />
              </button>
            </FABTooltip>

            <FABTooltip text={TOOLTIP_SAVE}>
              <button
                onClick={saveToLocalStorage}
                className="bg-[#3498db] text-white p-4 rounded-full shadow-lg hover:bg-[#2980b9] transition-all hover:scale-110"
              >
                <Save className="h-6 w-6" />
              </button>
            </FABTooltip>
            
            <FABTooltip text={TOOLTIP_RESET}>
              <button
                onClick={resetToDefaults}
                className="bg-[#e74c3c] text-white p-4 rounded-full shadow-lg hover:bg-[#c0392b] transition-all hover:scale-110"
              >
                <RotateCcw className="h-6 w-6" />
              </button>
            </FABTooltip>
            
            <FABTooltip text={TOOLTIP_PDF}>
              <button
                onClick={() => {
                  // Save current state as Version 216
                  const currentVersion = parseFloat(version) || 0;
                  const incremented = Math.round((currentVersion + 0.1) * 10) / 10;
                  const newVersion = incremented % 1 === 0 ? incremented.toFixed(1) : incremented.toFixed(1);
                  const finalVersion = parseFloat(newVersion) >= Math.floor(currentVersion) + 1 ? 
                    (Math.floor(currentVersion) + 1).toFixed(1) : 
                    newVersion;
                  
                  setVersion(finalVersion);
                  
                  const state = {
                    title,
                    authorLabel,
                    author,
                    dateLabel,
                    date,
                    versionLabel,
                    version: finalVersion,
                    purposeLabel,
                    purpose,
                    audienceLabel,
                    audience,
                    sections,
                    sectionOrder,
                    proTips,
                    references,
                    links,
                    footerCopyright,
                    footerGenerated,
                  };
                  localStorage.setItem('ecommerceSearchDoc', JSON.stringify(state));
                  toast.success(`Version ${finalVersion} saved!`);
                  
                  // Then proceed with PDF download
                  downloadAsPDF();
                }}
                className="bg-[#34495e] text-white p-4 rounded-full shadow-lg hover:bg-[#2c3e50] transition-all hover:scale-110"
              >
                <FileText className="h-6 w-6" />
              </button>
            </FABTooltip>
          </div>
        );
      })()}
    </div>
  );
}
