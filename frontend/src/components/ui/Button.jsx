import React from 'react';

const base = 'px-4 py-2 rounded-full font-semibold transition focus:outline-none focus:ring-2';
const variants = {
  primary: 'bg-primary text-dark hover:bg-dark hover:text-white focus:ring-primary',
  secondary: 'bg-white border border-primary text-dark hover:bg-primary hover:text-dark focus:ring-primary',
  dark: 'bg-dark text-white hover:bg-primary hover:text-dark focus:ring-dark',
  outline: 'bg-white border border-dark text-dark hover:bg-dark hover:text-white focus:ring-dark',
};

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  fullWidth = false,
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={[
        base,
        variants[variant] || variants.primary,
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  );
} 