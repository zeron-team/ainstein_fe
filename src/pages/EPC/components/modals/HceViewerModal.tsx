// src/pages/EPC/components/modals/HceViewerModal.tsx
// HCE viewer modal with search highlighting

import { useState } from "react";
import {
  FaBookMedical,
  FaTimes,
  FaSearch,
  FaChevronUp,
  FaChevronDown,
  FaCopy,
  FaBrain,
} from "react-icons/fa";

interface HceViewerModalProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  text: string;
  registros: number;
  setToastOk: (v: string | null) => void;
}

export default function HceViewerModal({
  open, onClose, loading, text, registros, setToastOk,
}: HceViewerModalProps) {
  const [search, setSearch] = useState("");
  const [searchIdx, setSearchIdx] = useState(0);

  if (!open) return null;

  const handleClose = () => {
    setSearch("");
    setSearchIdx(0);
    onClose();
  };

  const scrollToActive = () => {
    setTimeout(() => {
      const el = document.querySelector(".hce-highlight-active");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  const getTotal = () => {
    if (!search) return 0;
    return text.toLowerCase().split(search.toLowerCase()).length - 1;
  };

  return (
    <div className="modal-overlay hce-modal-overlay" onClick={handleClose}>
      <div className="modal-dialog hce-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h4>
            <FaBookMedical /> Historia Clinica Electronica
            {registros > 0 && (
              <span className="hce-registros-badge">{registros} registros</span>
            )}
          </h4>
          <button type="button" className="modal-close" onClick={handleClose}>
            <FaTimes />
          </button>
        </div>
        {!loading && (
          <div className="hce-search-bar">
            <FaSearch className="hce-search-icon" />
            <input
              type="text"
              className="hce-search-input"
              placeholder="Buscar en la HCE..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSearchIdx(0); }}
              onKeyDown={(e) => {
                if (!search) return;
                const total = getTotal();
                if (total === 0) return;
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  const next = (searchIdx + 1) % total;
                  setSearchIdx(next);
                  scrollToActive();
                } else if (e.key === "Enter" && e.shiftKey) {
                  e.preventDefault();
                  const prev = (searchIdx - 1 + total) % total;
                  setSearchIdx(prev);
                  scrollToActive();
                }
              }}
              autoFocus
            />
            {search && (() => {
              const total = getTotal();
              return total > 0 ? (
                <>
                  <button
                    className="hce-search-nav"
                    title="Anterior (Shift+Enter)"
                    onClick={() => {
                      const prev = (searchIdx - 1 + total) % total;
                      setSearchIdx(prev);
                      scrollToActive();
                    }}
                  >
                    <FaChevronUp />
                  </button>
                  <span className="hce-search-count">
                    {searchIdx + 1} / {total}
                  </span>
                  <button
                    className="hce-search-nav"
                    title="Siguiente (Enter)"
                    onClick={() => {
                      const next = (searchIdx + 1) % total;
                      setSearchIdx(next);
                      scrollToActive();
                    }}
                  >
                    <FaChevronDown />
                  </button>
                </>
              ) : (
                <span className="hce-search-count hce-search-none">0 coincidencias</span>
              );
            })()}
            {search && (
              <button className="hce-search-clear" onClick={() => { setSearch(""); setSearchIdx(0); }}>
                <FaTimes />
              </button>
            )}
          </div>
        )}
        <div className="modal-body hce-modal-body">
          {loading ? (
            <div className="hce-loading">
              <FaBrain className="spin" /> Cargando Historia Clinica...
            </div>
          ) : (
            <pre className="hce-text-content">
              {search ? (
                (() => {
                  const q = search;
                  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                  const regex = new RegExp(`(${escaped})`, "gi");
                  const parts = text.split(regex);
                  let matchIdx = -1;
                  return parts.map((part, i) => {
                    if (regex.test(part)) {
                      matchIdx++;
                      const isActive = matchIdx === searchIdx;
                      return (
                        <mark
                          key={i}
                          className={`hce-highlight ${isActive ? "hce-highlight-active" : ""}`}
                          ref={isActive ? (el) => { if (el && matchIdx === searchIdx) { el.scrollIntoView({ behavior: "smooth", block: "center" }); } } : undefined}
                        >
                          {part}
                        </mark>
                      );
                    }
                    return <span key={i}>{part}</span>;
                  });
                })()
              ) : (
                text
              )}
            </pre>
          )}
        </div>
        <div className="modal-footer">
          <button
            className="btn secondary"
            onClick={() => {
              navigator.clipboard.writeText(text);
              setToastOk("HCE copiada al portapapeles");
              setTimeout(() => setToastOk(null), 2000);
            }}
          >
            <FaCopy /> Copiar
          </button>
          <button className="btn primary" onClick={handleClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
