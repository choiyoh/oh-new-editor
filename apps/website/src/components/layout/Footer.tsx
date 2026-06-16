import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation('common');

  const columns = [
    {
      title: t('footer.product'),
      links: [
        { label: t('footer.features'), href: '#features' },
        { label: t('footer.packages'), href: '#packages' },
        { label: t('footer.docs'), href: '#docs' },
        { label: t('footer.playground'), href: '#demo' },
      ],
    },
    {
      title: t('footer.resources'),
      links: [
        { label: t('footer.github'), href: 'https://github.com' },
        { label: t('footer.npm'), href: 'https://npmjs.com' },
        { label: t('footer.changelog'), href: '#changelog' },
      ],
    },
    {
      title: t('footer.community'),
      links: [
        { label: t('footer.discord'), href: '#discord' },
        { label: t('footer.twitter'), href: '#twitter' },
        { label: t('footer.blog'), href: '#blog' },
      ],
    },
    {
      title: t('footer.legal'),
      links: [
        { label: t('footer.privacy'), href: '#privacy' },
        { label: t('footer.terms'), href: '#terms' },
        { label: t('footer.license'), href: '#license' },
      ],
    },
  ];

  return (
    <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-zinc-600 transition-colors hover:text-brand-600 dark:text-zinc-400 dark:hover:text-brand-400"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-zinc-200 pt-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
          {t('footer.copyright')}
        </div>
      </div>
    </footer>
  );
}
