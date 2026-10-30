"use client";

import { useState } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// The "All …" choice. Never submitted: the hidden input sends an empty value, which the server reads as no filter.
const ALL = "__all";

/** A filter for GET forms, on the kit's Select (not the browser's). The value travels in a hidden input, so URLs stay the same. */
export function FilterSelect({
  name,
  label,
  value,
  allLabel,
  options,
}: {
  name: string;
  label: string;
  value?: string;
  allLabel: string;
  options: { value: string; label: string }[];
}) {
  const id = `filter-${name}`;
  const items = [{ value: ALL, label: allLabel }, ...options];
  // A value no longer offered (a filter held back for small groups, say) falls back to "All".
  const [selected, setSelected] = useState(value && options.some((o) => o.value === value) ? value : ALL);
  return (
    <div className="grid min-w-0 gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium">
        {label}
      </label>
      <Select items={items} value={selected} onValueChange={(v) => setSelected((v as string | null) ?? ALL)}>
        <SelectTrigger id={id} className="w-full min-w-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <input type="hidden" name={name} value={selected === ALL ? "" : selected} />
    </div>
  );
}
