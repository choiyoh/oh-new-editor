import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { docsData } from '../data/docsData';
import { cn } from '../lib/utils';

type Framework = 'vanilla' | 'react' | 'vue' | 'svelte';

export function Docs() {
  const { i18n, t } = useTranslation('common');
  const currentLang = i18n.language.startsWith('ko') ? 'ko' : i18n.language.startsWith('zh') ? 'zh-CN' : 'en';
  const chapters = docsData[currentLang];

  const [activeChapterId, setActiveChapterId] = useState(chapters[0]?.id || 'overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFramework, setActiveFramework] = useState<Framework>('vanilla');

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
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-500/30 transition-transform active:scale-95 lg:hidden animate-bounce"
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
                "w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition-all duration-200",
                activeChapterId === chapter.id
                  ? "bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 font-semibold shadow-sm"
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
                  <section key={idx} className="scroll-mt-24 group/section" id={`section-${idx}`}>
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

  // Syntax highlighting helper function
  const getHighlightedHtml = (codeStr: string) => {
    let html = codeStr
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 1. Strings
    html = html.replace(/(['"`])(.*?)\1/g, '<span class="text-rose-500 dark:text-amber-400">$1$2$1</span>');

    // 2. Comments (// ...)
    html = html.replace(/(\/\/.*)/g, '<span class="text-zinc-400 dark:text-zinc-600">$1</span>');

    // 3. Keywords
    const keywords = ['const', 'let', 'var', 'import', 'export', 'from', 'default', 'function', 'interface', 'class', 'return', 'type', 'as', 'await', 'async', 'new', 'if', 'else', 'throw', 'try', 'catch', 'readonly', 'extends'];
    keywords.forEach(kw => {
      const regex = new RegExp(`\\b${kw}\\b`, 'g');
      html = html.replace(regex, `<span class="text-brand-600 dark:text-brand-400 font-semibold">${kw}</span>`);
    });

    // 4. Types
    const types = ['string', 'boolean', 'void', 'number', 'HTMLElement', 'Editor', 'EditorOptions', 'EditorMarkdownSupport', 'EditorTableSupport', 'EditorToolbarSupport', 'EditorAIOptions', 'EditorAIController', 'File', 'Promise', 'Schema', 'Plugin', 'OhNewEditorRef'];
    types.forEach(t => {
      const regex = new RegExp(`\\b${t}\\b`, 'g');
      html = html.replace(regex, `<span class="text-indigo-600 dark:text-indigo-300">${t}</span>`);
    });

    // 5. API Methods and hooks
    const apis = ['createEditor', 'createMarkdownSupport', 'createTableSupport', 'createToolbarSupport', 'createNotionSupport', 'createEditorSchema', 'getContent', 'setContent', 'setOutputFormat', 'setReadOnly', 'setStyle', 'getStyle', 'on', 'off', 'destroy', 'focus', 'blur', 'insertTable', 'setHeading', 'toggleBold', 'toggleItalic', 'toggleUnderline', 'toggleStrike', 'toggleCode', 'insertCodeBlock', 'toggleBlockquote', 'toggleBulletList', 'toggleOrderedList', 'insertHR', 'insertParagraph', 'toggleLink', 'insertImage', 'liftCurrentListItem', 'sinkCurrentListItem', 'sanitizeHtml', 'isSafeHref', 'OhNewEditor', 'uploadImageFiles', 'generate', 'cancel', 'getContext'];
    apis.forEach(api => {
      const regex = new RegExp(`\\b${api}\\b`, 'g');
      html = html.replace(regex, `<span class="text-emerald-600 dark:text-emerald-400 font-medium">${api}</span>`);
    });

    return html;
  };

  return (
    <div className="relative group mt-4">
      <button
        onClick={handleCopy}
        className="absolute right-3 top-3 rounded-lg border border-zinc-200 bg-white/80 px-2.5 py-1 text-xs font-semibold text-zinc-500 opacity-0 transition-opacity hover:bg-zinc-50 group-hover:opacity-100 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400 dark:hover:bg-zinc-800 backdrop-blur-sm cursor-pointer shadow-sm active:scale-95"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <pre className="overflow-x-auto rounded-xl border border-zinc-200/50 bg-zinc-50/30 p-4 font-mono text-xs text-zinc-800 dark:border-zinc-800/40 dark:bg-zinc-950/40 dark:text-zinc-300 backdrop-blur-[2px] leading-relaxed shadow-inner">
        <code dangerouslySetInnerHTML={{ __html: getHighlightedHtml(code) }} />
      </pre>
    </div>
  );
}
