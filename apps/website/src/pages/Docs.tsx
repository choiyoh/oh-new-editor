import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { docsData } from '../data/docsData';
import { cn } from '../lib/utils';

export function Docs() {
  const { i18n, t } = useTranslation('common');
  const currentLang = i18n.language.startsWith('ko') ? 'ko' : 'en';
  const chapters = docsData[currentLang];

  const [activeChapterId, setActiveChapterId] = useState(chapters[0]?.id || 'getting-started');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync state if language changes
  useEffect(() => {
    if (chapters.length > 0 && !chapters.some(c => c.id === activeChapterId)) {
      setActiveChapterId(chapters[0].id);
    }
  }, [currentLang, chapters, activeChapterId]);

  const activeChapter = chapters.find((c) => c.id === activeChapterId) || chapters[0];

  const handleChapterSelect = (id: string) => {
    setActiveChapterId(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative mx-auto flex max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      {/* Mobile Menu Toggle Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-500/30 transition-transform active:scale-95 lg:hidden"
        aria-label="Toggle Menu"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
      </button>

      {/* Sidebar Navigation */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 transform border-r border-zinc-200/50 bg-white/80 p-6 transition-transform duration-300 ease-in-out dark:border-zinc-800/50 dark:bg-zinc-950/80 lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] lg:translate-x-0 lg:rounded-2xl lg:border lg:bg-white/40 lg:backdrop-blur-md lg:dark:bg-zinc-900/30",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between lg:hidden mb-6">
          <span className="font-display text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {t('nav.docs')}
          </span>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col gap-1.5 overflow-y-auto">
          {chapters.map((chapter) => (
            <button
              key={chapter.id}
              onClick={() => handleChapterSelect(chapter.id)}
              className={cn(
                "w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition-all",
                activeChapterId === chapter.id
                  ? "bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 font-semibold"
                  : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900/50"
              )}
            >
              {chapter.title}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Document Body */}
      <article className="flex-1 min-w-0 py-4">
        {activeChapter ? (
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Oh New Editor Docs
            </span>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
              {activeChapter.title}
            </h1>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed border-b border-zinc-200/50 dark:border-zinc-800/50 pb-6">
              {activeChapter.description}
            </p>

            <div className="mt-8 space-y-12">
              {activeChapter.sections.map((section, idx) => (
                <section key={idx} className="scroll-mt-24" id={`section-${idx}`}>
                  <h2 className="font-display text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    {section.title}
                  </h2>
                  {section.description && (
                    <p className="mt-2 text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {section.description}
                    </p>
                  )}
                  {section.code && <CodeBlock code={section.code} />}
                </section>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center text-zinc-500">Loading document...</div>
        )}
      </article>

      {/* Table of Contents (TOC) */}
      <aside className="hidden xl:block w-48 sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-4">
          On This Page
        </h3>
        <nav className="flex flex-col gap-2.5">
          {activeChapter?.sections.map((section, idx) => (
            <a
              key={idx}
              href={`#section-${idx}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(`section-${idx}`)?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
            >
              {section.title}
            </a>
          ))}
        </nav>
      </aside>
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group mt-4">
      <button
        onClick={handleCopy}
        className="absolute right-3 top-3 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-500 opacity-0 transition-opacity hover:bg-zinc-50 group-hover:opacity-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <pre className="overflow-x-auto rounded-xl border border-zinc-200/50 bg-zinc-50/50 p-4 font-mono text-xs text-zinc-800 dark:border-zinc-800/50 dark:bg-zinc-950/40 dark:text-zinc-300 backdrop-blur-[2px] leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}
