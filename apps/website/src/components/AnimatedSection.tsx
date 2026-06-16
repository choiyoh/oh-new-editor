import { useInView } from '../hooks/useInView';

type AnimatedSectionProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  initialInView?: boolean;
  id?: string;
};

export function AnimatedSection({
  children,
  className = '',
  delay = 0,
  initialInView = false,
  id,
}: AnimatedSectionProps) {
  const { ref, isInView } = useInView<HTMLElement>({ initialInView });

  return (
    <section
      ref={ref}
      id={id}
      className={className}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.6s ease-out ${delay}s, transform 0.6s ease-out ${delay}s`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </section>
  );
}
