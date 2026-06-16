import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

const languages = [
  { code: 'en', label: 'EN' },
  { code: 'ko', label: 'KO' },
  { code: 'zh-CN', label: '中文' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation('common');
  const current = i18n.language;

  return (
    <div className="flex items-center gap-1 rounded-full border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
      {languages.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => i18n.changeLanguage(lang.code)}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium transition-colors',
            current === lang.code
              ? 'bg-brand-600 text-white'
              : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800',
          )}
          aria-label={lang.label}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
