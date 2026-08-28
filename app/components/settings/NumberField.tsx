interface NumberFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  error?: string
  step?: string
  min?: string
  max?: string
  hint?: string
}

/**
 * Labeled numeric input for the settings form, with inline validation error
 * display. `value`/`onChange` are the raw typed text, not a parsed number —
 * callers own the text/number split (see SettingsClient's handleNumberChange)
 * so the field can be freely cleared and retyped.
 */
export function NumberField({
  label,
  value,
  onChange,
  onBlur,
  error,
  step,
  min,
  max,
  hint,
}: NumberFieldProps) {
  return (
    <div>
      <label className="text-xs text-gray-600 mb-1 block">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        step={step}
        min={min}
        max={max}
        aria-invalid={!!error}
        className={`w-full border rounded px-2 py-1.5 text-base ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      />
      {error ? (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      ) : hint ? (
        <p className="text-xs text-gray-500 mt-1">{hint}</p>
      ) : null}
    </div>
  )
}
