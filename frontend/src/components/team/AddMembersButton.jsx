import React from 'react';
import Button from '../ui/Button';
import { FiPlus } from 'react-icons/fi';

export default function AddMembersButton({ onClick }) {
  return (
    <Button variant="primary" className="flex items-center gap-1 px-3 py-1 text-sm font-semibold" onClick={onClick}>
      <FiPlus /> Add members
    </Button>
  );
} 