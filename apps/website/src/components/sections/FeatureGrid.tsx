import { useTranslation } from 'react-i18next';
import { AnimatedSection } from '../AnimatedSection';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { SectionTitle } from '../ui/SectionTitle';

const features = [
  { key: 'frameworkAgnostic', icon: 'puzzle', badge: 'core' as const },
  { key: 'richTextEditing', icon: 'type', badge: 'core' as const },
  { key: 'markdownSupport', icon: 'markdown', badge: 'plugin' as const },
  { key: 'tableEditing', icon: 'table', badge: 'plugin' as const },
  { key: 'notionStyle', icon: 'layout', badge: 'plugin' as const },
  { key: 'aiReady', icon: 'sparkles', badge: 'plugin' as const },
];

const icons: Record<string, React.ReactNode> = {
  puzzle: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
      />
    </svg>
  ),
  type: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 6h16M4 12h16m-7 6h7"
      />
    </svg>
  ),
  markdown: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
      />
    </svg>
  ),
  table: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  ),
  layout: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
      />
    </svg>
  ),
  sparkles: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    </svg>
  ),
};

export function FeatureGrid() {
  const { t } = useTranslation('features');

  return (
    <AnimatedSection
      id="features"
      className="bg-zinc-50 py-20 dark:bg-zinc-900/50 md:py-28 lg:py-32"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle title={t('title')} subtitle={t('subtitle')} />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 md:mt-16">
          {features.map((item) => (
            <Card
              key={item.key}
              className="hover:-translate-y-1"
              icon={icons[item.icon]}
              badge={
                <Badge variant={item.badge}>
                  {t(`items.${item.key}.badge`)}
                </Badge>
              }
              title={t(`items.${item.key}.title`)}
              description={t(`items.${item.key}.description`)}
            />
          ))}
        </div>

        <div className="mt-12 text-center">
          <a
            href="#features"
            className="inline-flex items-center text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
          >
            {t('showAll')}
          </a>
        </div>
      </div>
    </AnimatedSection>
  );
}
