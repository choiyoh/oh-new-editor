import { useRef, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatedSection } from '../AnimatedSection';
import { Button } from '../ui/Button';
import { SectionTitle } from '../ui/SectionTitle';
import { useDemoEditor } from '../../hooks/useDemoEditor';
import { cn } from '../../lib/utils';

type DemoMode = 'toolbar' | 'notion';
type DemoTheme = 'light' | 'dark';

export function DemoSection() {
  const { t } = useTranslation('demo');
  const [mode, setMode] = useState<DemoMode>('toolbar');
  const [demoTheme, setDemoTheme] = useState<DemoTheme>('light');

  const hostRef = useRef<HTMLDivElement>(null);
  const { markdownContent, setStyle } = useDemoEditor(hostRef);

  // Sync mode changes to editor
  useEffect(() => {
    setStyle(mode);
  }, [mode, setStyle]);

  // Sync demo theme to data-theme attribute
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const container = host.closest('[data-demo-container]');
    if (container) {
      (container as HTMLElement).dataset.theme = demoTheme;
    }
  }, [demoTheme]);

  const handleModeChange = useCallback((nextMode: DemoMode) => {
    setMode(nextMode);
  }, []);

  return (
    <AnimatedSection
      id="demo"
      className="bg-zinc-50 py-20 dark:bg-zinc-900/50 md:py-28 lg:py-32"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle title={t('title')} subtitle={t('subtitle')} />

        <div className="mt-12 grid gap-6 lg:grid-cols-12 md:mt-16">
          {/* Controls sidebar */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
              <div className="mb-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
                  {t('modeLabel')}
                </label>
                <div className="mt-2 flex flex-col gap-2">
                  <DemoToggleButton
                    active={mode === 'toolbar'}
                    onClick={() => handleModeChange('toolbar')}
                  >
                    {t('modes.toolbar')}
                  </DemoToggleButton>
                  <DemoToggleButton
                    active={mode === 'notion'}
                    onClick={() => handleModeChange('notion')}
                  >
                    {t('modes.notion')}
                  </DemoToggleButton>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
                  {t('themeLabel')}
                </label>
                <div className="mt-2 flex flex-col gap-2">
                  <DemoToggleButton
                    active={demoTheme === 'light'}
                    onClick={() => setDemoTheme('light')}
                  >
                    {t('themes.light')}
                  </DemoToggleButton>
                  <DemoToggleButton
                    active={demoTheme === 'dark'}
                    onClick={() => setDemoTheme('dark')}
                  >
                    {t('themes.dark')}
                  </DemoToggleButton>
                </div>
              </div>
            </div>
          </div>

          {/* Editor */}
          <div className="lg:col-span-6">
            <div
              data-demo-container
              className={cn(
                'overflow-hidden rounded-2xl border border-zinc-200 shadow-sm dark:border-zinc-800',
                demoTheme === 'dark'
                  ? 'bg-zinc-900 text-zinc-100'
                  : 'bg-white text-zinc-900',
              )}
            >
              <div className="border-b border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
                {mode === 'toolbar' ? t('modes.toolbar') : t('modes.notion')}
              </div>
              <div
                ref={hostRef}
                className="min-h-[320px] p-4"
              />
            </div>
          </div>

          {/* Markdown Preview */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {t('previewLabel')}
              </h3>
              <pre className="mt-3 max-h-[320px] overflow-auto whitespace-pre-wrap font-mono text-sm text-zinc-600 dark:text-zinc-400">
                {markdownContent || t('placeholder')}
              </pre>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button as="a" href="/playground" variant="secondary">
            {t('tryPlayground')}
          </Button>
        </div>
      </div>
    </AnimatedSection>
  );
}

function DemoToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors',
        active
          ? 'bg-brand-600 text-white'
          : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800',
      )}
    >
      {children}
    </button>
  );
}
