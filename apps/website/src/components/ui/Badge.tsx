import { cn } from '../../lib/utils';

type BadgeProps = {
  variant?: 'core' | 'plugin' | 'ui' | 'adapter' | 'paid';
  children: React.ReactNode;
  className?: string;
};

export function Badge({
  variant = 'core',
  children,
  className = '',
}: BadgeProps) {
  const variants = {
    core: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300',
    plugin:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    ui: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    adapter:
      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    paid: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
