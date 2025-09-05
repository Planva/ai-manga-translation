// components/GlassSelect.tsx
'use client';
import React from 'react';

export default function GlassSelect({
  label,
  value,
  onValueChange,
  items,
}: {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  items: { label: string; value: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm opacity-80">{label}</span>
      <select
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className="w-full rounded-xl bg-white/10 backdrop-blur px-3 py-2 outline-none
                   border border-white/15 focus:border-indigo-300/70 transition"
      >
        {items.map((it) => (
          <option key={it.value} value={it.value}>
            {it.label}
          </option>
        ))}
      </select>
    </label>
  );
}
