import { cn } from '../../lib/utils';

type CardProps = {
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  title: React.ReactNode;
  description: React.ReactNode;
  href?: string;
  className?: string;
  children?: React.ReactNode;
};

export function Card({
  icon,
  badge,
  title,
  description,
  href,
  className = '',
  children,
}: CardProps) {
  const Wrapper = href ? 'a' : 'div';

  return (
    <Wrapper
      href={href}
      className={cn(
        'group relative flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 md:p-8 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl dark:hover:shadow-2xl dark:hover:shadow-brand-900/20',
        href && 'cursor-pointer',
        className,
      )}
    >
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
          {icon}
        </div>
      )}
      {badge && <div className="mb-3">{badge}</div>}
      <h3 className="font-sans text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        {title}
      </h3>
      <p className="mt-2 text-base text-zinc-600 dark:text-zinc-400">
        {description}
      </p>
      {children}
    </Wrapper>
  );
}
