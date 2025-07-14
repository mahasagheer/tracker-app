import React from 'react';

export default function DateRangePicker() {
  return (
    <input
      type="text"
      className="bg-accent border border-accent rounded px-3 py-1 text-sm text-dark focus:outline-none w-48"
      value="Dec 27, 2022 - Jan 03, 2023"
      readOnly
    />
  );
} 