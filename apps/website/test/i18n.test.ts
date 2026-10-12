import { afterEach, describe, expect, it } from 'vitest';

import i18n from '../src/i18n';
import enCommon from '../src/i18n/locales/en/common.json';
import koCommon from '../src/i18n/locales/ko/common.json';
import zhCommon from '../src/i18n/locales/zh-CN/common.json';

afterEach(async () => {
  await i18n.changeLanguage('en');
});

describe('site language resolution', () => {
  it.each([
    ['en-US', 'en', enCommon.nav.docs],
    ['ko-KR', 'ko', koCommon.nav.docs],
    ['zh-CN', 'zh-CN', zhCommon.nav.docs],
  ])('resolves %s to the bundled %s translations', async (language, resolved, label) => {
    await i18n.changeLanguage(language);
    expect(i18n.resolvedLanguage).toBe(resolved);
    expect(i18n.t('nav.docs')).toBe(label);
    expect(document.documentElement.lang).toBe(resolved);
  });
});
