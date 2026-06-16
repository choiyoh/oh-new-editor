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
      className="relative min-h-screen overflow-hidden bg-white dark:bg-[#09090b]"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] h-[600px] w-[600px] rounded-full bg-brand-500/10 blur-[120px] dark:bg-brand-600/15" />
        <div className="absolute top-[20%] right-[5%] h-[500px] w-[500px] rounded-full bg-pink-500/5 blur-[100px] dark:bg-indigo-500/10" />
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
            <div className="relative w-full max-w-md rounded-2xl border border-zinc-200/50 bg-white/40 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.06)] backdrop-blur-md dark:border-zinc-800/40 dark:bg-zinc-900/40 dark:shadow-[0_20px_50px_rgba(0,0,0,0.25)]">
              <div className="flex items-center justify-between border-b border-zinc-200/50 pb-4 dark:border-zinc-800/50">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-400/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-400/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400/80" />
                </div>
                <div className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  editor.tsx
                </div>
              </div>
              
              <div className="mt-6 space-y-3.5 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                <div className="flex gap-2">
                  <span className="text-zinc-400 dark:text-zinc-600">1</span>
                  <span className="text-brand-600 dark:text-brand-400">const</span>
                  <span className="text-indigo-600 dark:text-indigo-300">editor</span>
                  <span className="text-zinc-500">=</span>
                  <span className="text-emerald-600 dark:text-emerald-400">createEditor</span>
                  <span className="text-zinc-500">()</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-zinc-400 dark:text-zinc-600">2</span>
                  <span className="text-zinc-500">editor.</span>
                  <span className="text-amber-600 dark:text-amber-400">use</span>
                  <span className="text-zinc-500">(</span>
                  <span className="text-violet-600 dark:text-violet-400">markdown</span>
                  <span className="text-zinc-500">)</span>
                </div>
                <div className="flex gap-2 pl-4">
                  <span className="text-zinc-400 dark:text-zinc-600">3</span>
                  <span className="text-zinc-400 dark:text-zinc-600">// Notion-style slash ready</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-zinc-400 dark:text-zinc-600">4</span>
                  <span className="text-zinc-500">editor.</span>
                  <span className="text-amber-600 dark:text-amber-400">render</span>
                  <span className="text-zinc-500">(</span>
                  <span className="text-teal-600 dark:text-teal-400">"#app"</span>
                  <span className="text-zinc-500">)</span>
                </div>
              </div>

              <div className="mt-8 flex gap-2">
                <div className="h-8 flex-1 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center text-xs font-semibold transition-colors cursor-pointer">
                  Run Demo
                </div>
                <div className="h-8 flex-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 flex items-center justify-center text-xs font-semibold transition-colors cursor-pointer">
                  View Code
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
