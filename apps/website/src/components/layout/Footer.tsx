import { useTranslation } from 'react-i18next';
import { ISSUES_URL, LICENSE_URL, NPM_URL, RELEASES_URL, REPO_URL } from '../../lib/site';
import { handleSiteLinkClick } from '../../lib/utils';

type FooterLink = { label: string; href: string };

export function Footer() {
  const { t } = useTranslation('common');

  const columns: Array<{ title: string; links: FooterLink[] }> = [
    {
      title: t('footer.product'),
      links: [
        { label: t('footer.features'), href: '#features' },
        { label: t('footer.packages'), href: '#packages' },
        { label: t('nav.demo'), href: '#demo' },
        { label: t('footer.docs'), href: '/docs' },
      ],
    },
    {
      title: t('footer.resources'),
      links: [
        { label: t('footer.github'), href: REPO_URL },
        { label: t('footer.npm'), href: NPM_URL },
        { label: t('footer.releases'), href: RELEASES_URL },
        { label: t('footer.issues'), href: ISSUES_URL },
      ],
    },
    {
      title: t('footer.legal'),
      links: [{ label: t('footer.license'), href: LICENSE_URL }],
    },
  ];

  return (
    <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => {
                  const external = link.href.startsWith('http');
                  return (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        {...(external
                          ? { target: '_blank', rel: 'noreferrer' }
                          : { onClick: (event: React.MouseEvent<HTMLAnchorElement>) => handleSiteLinkClick(event, link.href) })}
                        className="text-sm text-zinc-600 transition-colors hover:text-brand-600 dark:text-zinc-400 dark:hover:text-brand-400"
                      >
                        {link.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-zinc-200 pt-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          {t('footer.copyright')}
        </div>
      </div>
    </footer>
  );
}
