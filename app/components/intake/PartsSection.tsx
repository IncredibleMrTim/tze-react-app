"use client";
import { useMemo } from "react";
import { useItems } from "@/hooks/useItems";
import { useIntakeStore } from "@/store/useIntakeStore";
import type { IItem } from "@/types/interfaces";
import { Input } from "@/components/ui/input";

/**
 * Parts editor section of the Enter Job sheet.
 *
 * Lets the user add up to 15 parts, with inventory autocomplete on the part
 * code field. Items are restricted to the selected customer unless the job
 * is internal.
 */
export function PartsSection() {
  const {
    customer,
    isInternal,
    parts,
    partSearchIndex,
    partSearchTerm,
    setPartSearchIndex,
    setPartSearchTerm,
    updatePart,
    addPart,
    removePart,
  } = useIntakeStore();

  const { data: ITEMS = [] } = useItems(customer?.account ?? "");

  const handlePartCodeChange = (index: number, value: string) => {
    updatePart(index, "code", value);
    setPartSearchIndex(index);
    setPartSearchTerm(value);
  };

  const selectItem = (index: number, item: IItem) => {
    updatePart(index, "code", item.code);
    updatePart(index, "desc", item.desc);
    updatePart(index, "price", item.price);
    setPartSearchIndex(null);
    setPartSearchTerm("");
  };

  /**
   * Filter items based on search term and customer restrictions
   *
   * Returns items that match the search term (in code or description) AND are
   * allowed for the selected customer. For internal jobs, all items are allowed.
   * Requires minimum 2 characters to search.
   *
   * @returns Filtered array of items matching search criteria
   */
  const getFilteredItems = useMemo(() => {
    if (!partSearchTerm || partSearchTerm.length < 2) return [];

    const term = partSearchTerm.toLowerCase();
    return ITEMS.filter((item) => {
      const matchesTerm =
        item.code.toLowerCase().includes(term) ||
        item.desc.toLowerCase().includes(term);

      const matchesCustomer =
        !customer || isInternal || item.customer === customer.account;

      return matchesTerm && matchesCustomer;
    });
  }, [partSearchTerm, ITEMS, customer, isInternal]);

  return (
    <div className="mb-5">
      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
        PARTS ({parts.length}/15)
      </label>

      {!customer && !isInternal && (
        <div className="text-center py-6 text-gray-400 text-sm bg-gray-50 rounded-lg border border-gray-200">
          Select a customer first
        </div>
      )}

      {(customer || isInternal) && (
        <div>
          {parts.map((part, i) => (
            <div
              key={i}
              className="border border-gray-200 rounded-lg p-3 mb-3 bg-gray-50"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-500 uppercase">
                  Part {i + 1}
                </span>

                <button
                  onClick={() => removePart(i)}
                  className="text-red-600 hover:text-red-800 font-semibold text-sm"
                >
                  Remove
                </button>
              </div>

              <div className="relative mb-2">
                <label className="text-xs text-gray-600 mb-1 block">
                  Part code
                </label>
                <Input
                  type="text"
                  value={part.code}
                  onChange={(e) => handlePartCodeChange(i, e.target.value)}
                  onFocus={() => {
                    setPartSearchIndex(i);
                    setPartSearchTerm(part.code);
                  }}
                  onBlur={() => {
                    setTimeout(() => {
                      setPartSearchIndex(null);
                      setPartSearchTerm("");
                    }, 200);
                  }}
                  placeholder="Type code or description..."
                  className="w-full border-2 border-primary rounded px-3 py-2 text-sm outline-none focus:border-primary"
                />

                {partSearchIndex === i && getFilteredItems.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border-2 border-primary border-t-0 rounded-b-lg max-h-[300px] overflow-y-auto z-[500] shadow-lg">
                    {getFilteredItems.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => selectItem(i, item)}
                        className="px-3 py-2 cursor-pointer hover:bg-green-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-semibold text-sm text-gray-900">
                          {item.code}
                        </div>
                        <div className="text-xs text-gray-600">
                          {item.desc} — ${item.price.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Input
                type="text"
                value={part.desc}
                onChange={(e) => updatePart(i, "desc", e.target.value)}
                placeholder="Search or type description..."
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-2 outline-none focus:border-primary"
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">
                    Price per part ($)
                  </label>
                  <Input
                    type="number"
                    value={part.price}
                    onChange={(e) =>
                      updatePart(i, "price", parseFloat(e.target.value) || 0)
                    }
                    placeholder="0.00"
                    step="0.01"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">
                    Quantity
                  </label>
                  <Input
                    type="number"
                    value={part.qty}
                    onChange={(e) =>
                      updatePart(i, "qty", parseInt(e.target.value) || 1)
                    }
                    placeholder="1"
                    min="1"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addPart}
            disabled={parts.length >= 15}
            className="w-full bg-white border-2 border-dashed border-gray-300 rounded-lg py-3 text-gray-600 font-medium hover:border-primary hover:text-primary disabled:opacity-50"
          >
            + Add part
          </button>
        </div>
      )}
    </div>
  );
}
