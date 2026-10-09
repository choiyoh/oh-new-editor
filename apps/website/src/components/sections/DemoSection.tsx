import { useRef, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatedSection } from '../AnimatedSection';
import { Button } from '../ui/Button';
import { SectionTitle } from '../ui/SectionTitle';
import { useDemoEditor } from '../../hooks/useDemoEditor';
import { useSiteTheme } from '../../hooks/useSiteTheme';
import { cn, handleSiteLinkClick } from '../../lib/utils';

type DemoMode = 'toolbar' | 'notion';
type DemoTheme = 'light' | 'dark';

export function DemoSection() {
  const { t, i18n } = useTranslation('demo');
  const [mode, setMode] = useState<DemoMode>('toolbar');
  // Follows the site theme until the visitor picks one for the demo.
  const siteDark = useSiteTheme();
  const [themeOverride, setDemoTheme] = useState<DemoTheme | null>(null);
  const demoTheme: DemoTheme = themeOverride ?? (siteDark ? 'dark' : 'light');

  const hostRef = useRef<HTMLDivElement>(null);
  const { markdownContent, setStyle } = useDemoEditor(hostRef, {
    mode,
    language: i18n.resolvedLanguage ?? i18n.language,
    placeholder: t('placeholder'),
  });

  // Sync mode changes to editor
  useEffect(() => {
    setStyle(mode);
  }, [mode, setStyle]);

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
                <span id="demo-mode-label" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {t('modeLabel')}
                </span>
                <div className="mt-2 flex flex-col gap-2" role="group" aria-labelledby="demo-mode-label">
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
                <span id="demo-theme-label" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {t('themeLabel')}
                </span>
                <div className="mt-2 flex flex-col gap-2" role="group" aria-labelledby="demo-theme-label">
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
            {/* No overflow clipping here: menus and popovers extend past the editor. */}
            <div data-demo-container data-theme={demoTheme} className="rounded-2xl">
              <div ref={hostRef} className="min-h-[320px]" aria-label={t('title')} />
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
          <Button
            as="a"
            href="/docs"
            variant="secondary"
            onClick={(event: React.MouseEvent<HTMLAnchorElement>) => handleSiteLinkClick(event, '/docs')}
          >
            {t('readDocs')}
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
      aria-pressed={active}
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
