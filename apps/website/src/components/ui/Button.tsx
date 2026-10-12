import * as React from 'react';
import { cn } from '../../lib/utils';
import { siteHref } from '../../lib/routing';

type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  as?: React.ElementType;
  children?: React.ReactNode;
  className?: string;
  href?: string;
  [key: string]: unknown;
};

export function Button({
  variant = 'primary',
  size = 'md',
  as: Component = 'button',
  className = '',
  children,
  href,
  ...props
}: ButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center rounded-full font-semibold transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900';

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/10 hover:shadow-lg hover:shadow-brand-500/25 dark:shadow-brand-950/30',
    secondary:
      'border border-zinc-200/60 dark:border-zinc-800/60 bg-white/40 dark:bg-zinc-900/30 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40 backdrop-blur-sm shadow-sm hover:shadow-md',
    ghost:
      'bg-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800',
  };

  const sizeClasses = {
    sm: 'px-4 py-1.5 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3 text-lg',
  };

  return (
    <Component
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
      {...(href ? { href: siteHref(href) } : {})}
    >
      {children}
    </Component>
  );
}
