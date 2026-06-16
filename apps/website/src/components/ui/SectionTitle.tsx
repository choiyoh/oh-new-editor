import { cn } from '../../lib/utils';

type SectionTitleProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  centered?: boolean;
  className?: string;
};

export function SectionTitle({
  title,
  subtitle,
  centered = true,
  className = '',
}: SectionTitleProps) {
  return (
    <div className={cn(centered && 'text-center', className)}>
      <h2 className="font-display text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 md:text-5xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400 md:text-xl">
          {subtitle}
        </p>
      )}
    </div>
  );
}
