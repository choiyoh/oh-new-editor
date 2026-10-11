import { useTranslation } from 'react-i18next';
import { AnimatedSection } from '../AnimatedSection';
import { REPO_URL } from '../../lib/site';
import { Button } from '../ui/Button';

export function CTABanner() {
  const { t } = useTranslation('common');

  return (
    <AnimatedSection className="relative overflow-hidden bg-brand-600 py-20 md:py-28 lg:py-32">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-white blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="font-display text-4xl font-bold tracking-tight text-white md:text-5xl">
          {t('banner.title')}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-brand-100 md:text-xl">
          {t('banner.subtitle')}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button
            as="a"
            href="#demo"
            variant="primary"
            className="bg-white text-brand-600 hover:bg-brand-50 hover:text-brand-700"
          >
            {t('cta.getStarted')}
          </Button>
          <Button
            as="a"
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            variant="ghost"
            className="text-white hover:bg-white/10"
          >
            {t('cta.viewOnGithub')}
          </Button>
        </div>
      </div>
    </AnimatedSection>
  );
}
