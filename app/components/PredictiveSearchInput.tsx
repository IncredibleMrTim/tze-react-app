"use client";

import { useEffect, useRef, useState } from "react";

interface PredictableJob {
  id: string;
  po_number: string;
  customer_name: string;
}

interface PredictiveSearchInputProps<T extends PredictableJob> {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  predictions: T[];
  onSelect: (job: T) => void;
  renderMeta?: (job: T) => React.ReactNode;
}

/**
 * A search input with a floating predictive dropdown of the top matches —
 * same interaction pattern as intake's JobSearch (arrow-key nav, Enter to
 * select, Escape/click-outside to close), reused wherever a list needs a
 * quick-jump search box on top of its own filtered results.
 */
export function PredictiveSearchInput<T extends PredictableJob>({
  value,
  onChange,
  placeholder,
  predictions,
  onSelect,
  renderMeta,
}: PredictiveSearchInputProps<T>) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (job: T) => {
    onSelect(job);
    setShowDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || predictions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % predictions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(
        (prev) => (prev - 1 + predictions.length) % predictions.length,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (predictions[selectedIndex]) {
        handleSelect(predictions[selectedIndex]);
        inputRef.current?.blur();
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowDropdown(e.target.value.length > 0);
          setSelectedIndex(0);
        }}
        onFocus={() => value && setShowDropdown(true)}
        onKeyDown={handleKeyDown}
        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-base outline-none focus:border-primary"
        autoComplete="off"
      />

      {showDropdown && predictions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {predictions.map((job, idx) => (
            <div
              key={job.id}
              onClick={() => handleSelect(job)}
              className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                idx === selectedIndex ? "bg-blue-50" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-sm text-gray-900">
                    {job.po_number}
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5">
                    {job.customer_name}
                  </div>
                </div>
                {renderMeta && <div className="ml-3">{renderMeta(job)}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
