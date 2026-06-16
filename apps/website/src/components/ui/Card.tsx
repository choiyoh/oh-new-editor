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
        'group relative flex flex-col rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/60 dark:bg-zinc-900/30 p-6 md:p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand-500/5 dark:hover:shadow-brand-500/10 backdrop-blur-md',
        href && 'cursor-pointer',
        className,
      )}
    >
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-50 to-indigo-50/50 text-brand-600 dark:from-brand-950/40 dark:to-indigo-950/20 dark:text-brand-400 border border-brand-100/30 dark:border-brand-900/20">
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
