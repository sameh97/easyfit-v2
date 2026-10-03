import { Lang } from 'src/app/services/language.service';

/**
 * ngx-translate has no plural rules, so every counted string has three forms in the
 * translation files: `one`, `two` and `other` (Hebrew has a dual: יומיים, חודשיים).
 * English never picks `two`; its `two` form repeats the `other` wording.
 */
export type PluralForm = 'one' | 'two' | 'other';

const rulesCache: Partial<Record<Lang, Intl.PluralRules>> = {};

export function pluralForm(count: number, lang: Lang): PluralForm {
  const rules: Intl.PluralRules = rulesCache[lang] ?? (rulesCache[lang] = new Intl.PluralRules(lang));
  const category: string = rules.select(count);
  // Older ICU data gives Hebrew a `many` form (20, 30…); it reads like `other`.
  return category === 'one' || category === 'two' ? category : 'other';
}
