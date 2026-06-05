import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** @deprecated Use padding via className instead. Hover effects removed for institutional feel. */
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 shadow-xs transition-colors ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
