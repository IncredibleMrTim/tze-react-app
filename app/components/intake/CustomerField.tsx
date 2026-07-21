"use client";
import { useMemo } from "react";
import { useContacts } from "@/hooks/useContacts";
import { useIntakeStore } from "@/store/useIntakeStore";
import { Input } from "@/components/ui/input";

/**
 * Customer search field with autocomplete dropdown for the Enter Job sheet.
 */
export function CustomerField() {
  const { data: CONTACTS = [] } = useContacts();

  const {
    customer,
    customerInput,
    showCustomerDropdown,
    currentJob,
    setCustomer,
    setCustomerInput,
    setShowCustomerDropdown,
  } = useIntakeStore();

  const isEditable = !currentJob?.poComplete;

  const filteredCustomers = useMemo(
    () =>
      CONTACTS.filter(
        (c) =>
          c.name.toLowerCase().includes(customerInput.toLowerCase()) ||
          c.account.toLowerCase().includes(customerInput.toLowerCase()),
      ),
    [CONTACTS, customerInput],
  );

  return (
    <div className="mb-5">
      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
        CUSTOMER
      </label>
      <div className="relative">
        <Input
          type="text"
          disabled={!isEditable}
          value={customerInput}
          onChange={(e) => {
            setCustomerInput(e.target.value);
            setShowCustomerDropdown(true);
          }}
          onFocus={() => setShowCustomerDropdown(true)}
          placeholder="Search customer..."
          className="w-full border-2 border-gray-200 rounded-lg px-3 py-3 text-base outline-none focus:border-primary"
        />
        {showCustomerDropdown && filteredCustomers.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border-2 border-gray-200 border-t-0 rounded-b-lg max-h-[200px] overflow-y-auto z-[500] shadow-lg">
            {filteredCustomers.map((c) => (
              <div
                key={c.account}
                onClick={() => {
                  setCustomer(c);
                  setCustomerInput(c.name);
                  setShowCustomerDropdown(false);
                }}
                className="px-3 py-3 cursor-pointer border-b border-gray-100 hover:bg-green-50 active:bg-primary-bg"
              >
                <div className="text-[15px]">{c.name}</div>
                <div className="text-[12px] text-gray-500">{c.account}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {customer && (
        <div className="text-[12px] text-emerald-900 mt-2 px-2 py-1.5 bg-primary-bg rounded">
          ✓ {customer.name} ({customer.account})
        </div>
      )}
    </div>
  );
}
