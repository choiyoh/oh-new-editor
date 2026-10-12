import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePathname } from '../../hooks/usePathname';
import { cn, handleSiteLinkClick } from '../../lib/utils';
import { siteHref } from '../../lib/routing';
import { Button } from '../ui/Button';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';

const menuIcon = (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
);

const closeIcon = (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

export function Nav() {
  const { t } = useTranslation('common');
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentPath = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  const navLinks = [
    { label: t('nav.features'), href: '#features' },
    { label: t('nav.packages'), href: '#packages' },
    { label: t('nav.demo'), href: '#demo' },
    { label: t('nav.docs'), href: '/docs' },
  ];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => handleSiteLinkClick(e, href);

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'border-b border-zinc-200/40 bg-white/70 backdrop-blur-lg dark:border-zinc-800/40 dark:bg-[#09090b]/70 shadow-sm'
            : 'bg-transparent',
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a
            href={siteHref('/')}
            onClick={(e) => handleSiteLinkClick(e, '/')}
            className="font-display text-xl font-bold text-zinc-900 dark:text-zinc-100"
          >
            Oh New Editor
          </a>

          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => {
              const isActive = link.href === '/docs' && currentPath.startsWith('/docs');
              return (
                <a
                  key={link.href}
                  href={siteHref(link.href)}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={(e) => handleLinkClick(e, link.href)}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-brand-600 dark:hover:text-brand-400",
                    isActive
                      ? "text-brand-600 dark:text-brand-400 font-semibold"
                      : "text-zinc-600 dark:text-zinc-400"
                  )}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button
              as="a"
              href="#demo"
              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleLinkClick(e, '#demo')}
              size="sm"
            >
              {t('nav.getStarted')}
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-zinc-700 dark:text-zinc-300 md:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
          >
            {mobileOpen ? closeIcon : menuIcon}
          </button>
        </div>

        {mobileOpen && (
          <div id="mobile-nav" className="border-t border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-[#09090b] md:hidden">
            <nav className="flex flex-col gap-3">
              {navLinks.map((link) => {
                const isActive = link.href === '/docs' && currentPath.startsWith('/docs');
                return (
                  <a
                    key={link.href}
                    href={siteHref(link.href)}
                    className={cn(
                      "text-base font-medium transition-colors",
                      isActive
                        ? "text-brand-600 dark:text-brand-400 font-semibold"
                        : "text-zinc-700 dark:text-zinc-300"
                    )}
                    onClick={(e) => {
                      setMobileOpen(false);
                      handleLinkClick(e, link.href);
                    }}
                  >
                    {link.label}
                  </a>
                );
              })}
            </nav>
            <div className="mt-4 flex items-center gap-3">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
            <div className="mt-4">
              <Button
                as="a"
                href="#demo"
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  setMobileOpen(false);
                  handleLinkClick(e, '#demo');
                }}
                className="w-full"
              >
                {t('nav.getStarted')}
              </Button>
            </div>
          </div>
        )}
      </header>

      <div className="h-16" />
    </>
  );
}
