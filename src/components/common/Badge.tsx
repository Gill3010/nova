import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'outline';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = React.memo(({ children, variant = 'default', className = '' }) => {
  const base = 'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium transition-colors';

  const variants: Record<string, string> = {
    default:
      'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
    success:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
    warning:
      'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
    destructive:
      'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400',
    outline:
      'bg-transparent text-zinc-600 border border-zinc-200 dark:text-zinc-400 dark:border-zinc-700',
  };

  return (
    <span className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';
