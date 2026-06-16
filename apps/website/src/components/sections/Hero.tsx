import { useTranslation } from 'react-i18next';
import { AnimatedSection } from '../AnimatedSection';
import { Button } from '../ui/Button';

const stats = [
  { key: 'stars', value: '2.4k+' },
  { key: 'downloads', value: '180k+' },
  { key: 'frameworks', value: '3' },
];

export function Hero() {
  const { t } = useTranslation('hero');

  return (
    <AnimatedSection
      initialInView
      className="relative min-h-screen overflow-hidden bg-white dark:bg-zinc-950"
    >
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[600px] w-[600px] rounded-full bg-brand-400/10 blur-3xl dark:bg-brand-600/10" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full bg-brand-100 px-4 py-1.5 text-sm font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
              {t('badge')}
            </span>

            <h1 className="mt-6 font-display text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 md:text-6xl lg:text-7xl">
              {t('title')}
              <br />
              <span className="text-brand-600 dark:text-brand-400">
                {t('titleHighlight')}
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400 md:text-xl">
              {t('subtitle')}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button as="a" href="#demo" size="lg">
                {t('primaryCta')}
              </Button>
              <Button
                as="a"
                href="https://github.com"
                variant="secondary"
                size="lg"
              >
                {t('secondaryCta')}
              </Button>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-8">
              {stats.map((stat) => (
                <div key={stat.key}>
                  <div className="font-display text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                    {stat.value}
                  </div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-500">
                    {t(`stats.${stat.key}`)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden items-center justify-center lg:flex">
            <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white/80 p-6 shadow-2xl backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
              <div className="flex items-center gap-2 border-b border-zinc-200 pb-4 dark:border-zinc-800">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-emerald-400" />
              </div>
              <div className="mt-4 space-y-3">
                <div className="h-3 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3 w-5/6 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
              <div className="mt-6 flex gap-2">
                <div className="h-8 flex-1 rounded-lg bg-brand-100 dark:bg-brand-900/30" />
                <div className="h-8 flex-1 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
