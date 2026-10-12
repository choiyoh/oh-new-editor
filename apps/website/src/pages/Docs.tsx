import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { docsData } from '../data/docsData';
import { usePathname } from '../hooks/usePathname';
import { highlightCode } from '../lib/highlight';
import { cn, navigate, prefersReducedMotion } from '../lib/utils';
import { siteHref } from '../lib/routing';

type Framework = 'vanilla' | 'react' | 'vue' | 'svelte';
const DESKTOP_QUERY = '(min-width: 1024px)';

export function Docs() {
  const { i18n, t } = useTranslation('common');
  const currentLang = i18n.language.startsWith('ko') ? 'ko' : i18n.language.startsWith('zh') ? 'zh-CN' : 'en';
  const chapters = docsData[currentLang];

  // The chapter lives in the URL (/docs/<chapter>) so it can be shared and
  // the back button walks through chapters.
  const pathname = usePathname();
  const chapterFromPath = pathname.replace(/^\/docs\/?/, '').split('/')[0];
  const activeChapter = chapters.find((c) => c.id === chapterFromPath) || chapters[0];
  const activeChapterId = activeChapter?.id;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia(DESKTOP_QUERY).matches);
  const sidebarRef = useRef<HTMLElement>(null);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const [activeFramework, setActiveFramework] = useState<Framework>('vanilla');
  const [activeSection, setActiveSection] = useState(0);

  const handleChapterSelect = (id: string) => {
    setMobileMenuOpen(false);
    if (id !== activeChapterId) navigate(`/docs/${id}`);
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_QUERY);
    const update = () => {
      setIsDesktop(media.matches);
      if (media.matches) setMobileMenuOpen(false);
    };
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!mobileMenuOpen || isDesktop || !sidebar) return;
    const focusable = () => Array.from(sidebar.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]'));
    focusable()[0]?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMobileMenuOpen(false);
      } else if (event.key === 'Tab') {
        const items = focusable();
        const first = items[0];
        const last = items[items.length - 1];
        if (!sidebar.contains(document.activeElement) || (event.shiftKey ? document.activeElement === first : document.activeElement === last)) {
          event.preventDefault();
          (event.shiftKey ? last : first)?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (!window.matchMedia(DESKTOP_QUERY).matches) menuToggleRef.current?.focus();
    };
  }, [mobileMenuOpen, isDesktop]);

  useEffect(() => {
    if (activeChapter) document.title = `${activeChapter.title} · Oh New Editor Docs`;
  }, [activeChapter]);

  // Hash routes contain a second fragment for a shared document section.
  useEffect(() => {
    const scrollToSection = () => {
      const section = /#(section-\d+)$/.exec(window.location.hash)?.[1];
      if (section) document.getElementById(section)?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    };
    scrollToSection();
    window.addEventListener('hashchange', scrollToSection);
    window.addEventListener('popstate', scrollToSection);
    return () => {
      window.removeEventListener('hashchange', scrollToSection);
      window.removeEventListener('popstate', scrollToSection);
    };
  }, [activeChapterId, currentLang]);

  // Highlight the "On this page" entry for the section being read.
  useEffect(() => {
    setActiveSection(0);
    if (typeof IntersectionObserver === 'undefined') return;
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-doc-section]'));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length) setActiveSection(Number((visible[0].target as HTMLElement).dataset.docSection));
      },
      { rootMargin: '-96px 0px -60% 0px' },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [activeChapterId, currentLang]);

  const frameworks: Array<{ id: Framework; name: string }> = [
    { id: 'vanilla', name: 'Vanilla JS' },
    { id: 'react', name: 'React' },
    { id: 'vue', name: 'Vue 3' },
    { id: 'svelte', name: 'Svelte' },
  ];

  return (
    <div className="relative mx-auto flex max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      {/* Mobile Menu Toggle Button */}
      <button
        ref={menuToggleRef}
        type="button"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-500/30 transition-transform active:scale-95 lg:hidden"
        aria-label={t('nav.docs')}
        aria-expanded={mobileMenuOpen}
        aria-controls="docs-sidebar"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
      </button>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 top-16 z-40 bg-zinc-950/30 lg:hidden"
          aria-hidden="true"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation: below the fixed 4rem header on mobile. */}
      <aside
        ref={sidebarRef}
        id="docs-sidebar"
        inert={!isDesktop && !mobileMenuOpen}
        aria-hidden={!isDesktop && !mobileMenuOpen ? true : undefined}
        className={cn(
          "fixed bottom-0 left-0 top-16 z-50 flex w-72 max-w-[85vw] transform flex-col border-r border-zinc-200/50 bg-white p-6 shadow-xl transition-transform duration-300 ease-in-out motion-reduce:transition-none dark:border-zinc-800/50 dark:bg-zinc-950 lg:sticky lg:top-24 lg:z-auto lg:h-[calc(100vh-8rem)] lg:w-64 lg:translate-x-0 lg:rounded-2xl lg:border lg:bg-white/40 lg:shadow-none lg:backdrop-blur-md lg:dark:bg-zinc-900/30",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between lg:hidden mb-6">
          <span className="font-display text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {t('nav.docs')}
          </span>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close"
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex min-h-0 flex-col gap-1.5 overflow-y-auto" aria-label={t('nav.docs')}>
          {chapters.map((chapter) => (
            <a
              key={chapter.id}
              href={siteHref(`/docs/${chapter.id}`)}
              aria-current={activeChapterId === chapter.id ? 'page' : undefined}
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
                event.preventDefault();
                handleChapterSelect(chapter.id);
              }}
              className={cn(
                "w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition-all duration-200",
                activeChapterId === chapter.id
                  ? "bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 font-semibold shadow-sm"
                  : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900/50"
              )}
            >
              {chapter.title}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main Document Body */}
      <article className="flex-1 min-w-0 py-4">
        {activeChapter ? (
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-500/5 dark:bg-brand-500/10 px-2.5 py-1 rounded-full">
              Oh New Editor Docs
            </span>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl lg:text-5xl">
              {activeChapter.title}
            </h1>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed border-b border-zinc-200/50 dark:border-zinc-800/50 pb-6">
              {activeChapter.description}
            </p>

            <div className="mt-8 space-y-12">
              {activeChapter.sections.map((section, idx) => {
                const hasFrameworkCodes = !!section.codes;
                const activeCode = section.codes ? section.codes[activeFramework] : section.code;

                return (
                  <section key={idx} className="scroll-mt-24 group/section" id={`section-${idx}`} data-doc-section={idx}>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <h2 className="font-display text-xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-2xl group-hover/section:text-brand-600 dark:group-hover/section:text-brand-400 transition-colors duration-200">
                        {section.title}
                      </h2>

                      {/* Framework Selector Switch tabs */}
                      {hasFrameworkCodes && (
                        <div className="flex rounded-full border border-zinc-200 bg-zinc-50/50 p-0.5 dark:border-zinc-800 dark:bg-zinc-950/40 backdrop-blur-sm">
                          {frameworks.map((fw) => (
                            <button
                              key={fw.id}
                              type="button"
                              aria-pressed={activeFramework === fw.id}
                              onClick={() => setActiveFramework(fw.id)}
                              className={cn(
                                "rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200",
                                activeFramework === fw.id
                                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-white"
                                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                              )}
                            >
                              {fw.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {section.description && (
                      <p className="mt-3 text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm sm:text-base">
                        {section.description}
                      </p>
                    )}

                    {/* Alert Box Rendering */}
                    {section.tip && (
                      <div className="mt-4 flex gap-3 rounded-xl border border-brand-500/20 bg-brand-500/5 p-4 text-sm text-brand-800 dark:text-brand-300">
                        <svg className="h-5 w-5 flex-shrink-0 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <div>
                          <span className="font-semibold uppercase tracking-wider text-xs block mb-0.5 text-brand-600 dark:text-brand-400">Tip</span>
                          {section.tip}
                        </div>
                      </div>
                    )}

                    {section.warning && (
                      <div className="mt-4 flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-800 dark:text-amber-300">
                        <svg className="h-5 w-5 flex-shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                          <span className="font-semibold uppercase tracking-wider text-xs block mb-0.5 text-amber-600 dark:text-amber-400">Warning</span>
                          {section.warning}
                        </div>
                      </div>
                    )}

                    {/* Code Block rendering with Highlighter */}
                    {activeCode && <CodeBlock code={activeCode} />}
                  </section>
                );
              })}
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
              href={siteHref(`/docs/${activeChapterId}#section-${idx}`)}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                e.preventDefault();
                navigate(`/docs/${activeChapterId}#section-${idx}`);
              }}
              aria-current={activeSection === idx ? 'location' : undefined}
              className={cn(
                "text-xs font-medium transition-colors hover:text-zinc-900 dark:hover:text-zinc-100",
                activeSection === idx ? "text-brand-600 dark:text-brand-400" : "text-zinc-500 dark:text-zinc-400"
              )}
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="relative group mt-4">
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-3 top-3 rounded-lg border border-zinc-200 bg-white/80 px-2.5 py-1 text-xs font-semibold text-zinc-600 transition-opacity hover:bg-zinc-50 focus-visible:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-800 backdrop-blur-sm cursor-pointer shadow-sm active:scale-95"
      >
        <span aria-live="polite">{copied ? 'Copied!' : 'Copy'}</span>
      </button>
      <pre className="overflow-x-auto rounded-xl border border-zinc-200/50 bg-zinc-50/30 p-4 font-mono text-xs text-zinc-800 dark:border-zinc-800/40 dark:bg-zinc-950/40 dark:text-zinc-300 backdrop-blur-[2px] leading-relaxed shadow-inner">
        <code dangerouslySetInnerHTML={{ __html: highlightCode(code) }} />
      </pre>
    </div>
  );
}
