import { useTranslation } from 'react-i18next';
import { AnimatedSection } from '../AnimatedSection';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { SectionTitle } from '../ui/SectionTitle';

const packages = [
  { key: 'core', variant: 'core' as const },
  { key: 'toolbar', variant: 'ui' as const },
  { key: 'notion', variant: 'ui' as const },
  { key: 'table', variant: 'plugin' as const },
  { key: 'markdown', variant: 'plugin' as const },
  { key: 'adapters', variant: 'adapter' as const },
];

export function PackageShowcase() {
  const { t } = useTranslation('packages');

  return (
    <AnimatedSection
      id="packages"
      className="bg-white py-20 dark:bg-zinc-950 md:py-28 lg:py-32"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle title={t('title')} subtitle={t('subtitle')} />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 md:mt-16">
          {packages.map((item) => (
            <Card
              key={item.key}
              badge={
                <Badge variant={item.variant}>
                  {t(`items.${item.key}.badge`)}
                </Badge>
              }
              title={
                <span className="font-mono text-sm">
                  {t(`items.${item.key}.title`)}
                </span>
              }
              description={t(`items.${item.key}.description`)}
              href="#demo"
            />
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}
