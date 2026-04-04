// src/pages/EPC/components/DraggableSectionList.tsx
// Draggable items with confirm/remove and drag-drop between sections

import { useState } from "react";
import { FaCheck, FaTimes, FaGripVertical } from "react-icons/fa";
import type { SectionName } from "../hooks/useEpcCorrections";

interface DraggableSectionListProps {
  sectionName: SectionName;
  items: string[];
  onItemsChange: (items: string[]) => void;
  onItemDropped?: (item: string, fromSection: SectionName, toSection: SectionName) => void;
  onItemRemoved?: (item: string, fromSection: SectionName) => void;
  onItemConfirmed?: (item: string, section: SectionName) => void;
}

export default function DraggableSectionList({
  sectionName,
  items,
  onItemsChange,
  onItemDropped,
  onItemRemoved,
  onItemConfirmed,
}: DraggableSectionListProps) {
  const [confirmedItems, setConfirmedItems] = useState<Set<string>>(new Set());
  const [dragOverActive, setDragOverActive] = useState(false);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  const handleConfirm = (item: string, idx: number) => {
    const newConfirmed = new Set(confirmedItems);
    if (newConfirmed.has(item)) {
      newConfirmed.delete(item);
    } else {
      newConfirmed.add(item);
      onItemConfirmed?.(item, sectionName);
    }
    setConfirmedItems(newConfirmed);
  };

  const handleRemove = (item: string, idx: number) => {
    const newItems = items.filter((_, i) => i !== idx);
    onItemsChange(newItems);
    onItemRemoved?.(item, sectionName);
  };

  const handleDragStart = (e: React.DragEvent, item: string, idx: number) => {
    e.dataTransfer.setData("text/plain", item);
    e.dataTransfer.setData("application/x-section", sectionName);
    e.dataTransfer.setData("application/x-index", String(idx));
    e.dataTransfer.effectAllowed = "move";
    setDraggingIdx(idx);
  };

  const handleDragEnd = () => {
    setDraggingIdx(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverActive(false);

    const itemText = e.dataTransfer.getData("text/plain");
    const fromSection = e.dataTransfer.getData("application/x-section") as SectionName;

    if (!itemText || !fromSection) return;
    if (fromSection === sectionName) return;

    const newItems = [...items, itemText];
    onItemsChange(newItems);
    onItemDropped?.(itemText, fromSection, sectionName);
  };

  if (!items.length) {
    return (
      <div
        className={`section-drop-zone ${dragOverActive ? "drag-over" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        —
      </div>
    );
  }

  return (
    <div
      className={`section-drop-zone ${dragOverActive ? "drag-over" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {items.map((item, idx) => {
        const isConfirmed = confirmedItems.has(item);
        const isDragging = draggingIdx === idx;

        return (
          <div
            key={`${sectionName}-item-${idx}`}
            className={`section-item ${isConfirmed ? "confirmed" : ""} ${isDragging ? "dragging" : ""}`}
            draggable
            onDragStart={(e) => handleDragStart(e, item, idx)}
            onDragEnd={handleDragEnd}
          >
            <span className="drag-handle" title="Arrastrar a otra seccion">
              <FaGripVertical />
            </span>
            <button
              type="button"
              className={`item-btn item-btn-check ${isConfirmed ? "active" : ""}`}
              title={isConfirmed ? "Desmarcar" : "Confirmar item"}
              onClick={() => handleConfirm(item, idx)}
            >
              <FaCheck />
            </button>
            <button
              type="button"
              className="item-btn item-btn-remove"
              title="Eliminar item"
              onClick={() => handleRemove(item, idx)}
            >
              <FaTimes />
            </button>
            <span className="section-item-text">{"\u2022"} {item.replace(/^•\s*/, "")}</span>
          </div>
        );
      })}
    </div>
  );
}
