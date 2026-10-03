import { AppConsts } from 'src/app/common/consts';
import { Catalog } from 'src/app/model/catalog';

const DAY_MS: number = 24 * 60 * 60 * 1000;

/** The public link members open (server-rendered page). */
export function catalogUrl(catalog: Pick<Catalog, 'uuid'>): string {
  return `${AppConsts.BASE_URL}/api/catalog-url/${catalog.uuid}`;
}

/** The backend's rule: a catalog works until createdAt + durationDays. */
export function catalogExpiresAt(catalog: Catalog): Date {
  return new Date(new Date(catalog.createdAt).getTime() + Number(catalog.durationDays) * DAY_MS);
}

export function catalogIsActive(catalog: Catalog, now: Date = new Date()): boolean {
  return catalogExpiresAt(catalog).getTime() >= now.getTime();
}

/** The message with the link in place of {link} (or after it, when the text has no {link}). */
export function messageWithLink(message: string, link: string): string {
  return message.includes('{link}') ? message.split('{link}').join(link) : `${message.trim()} ${link}`;
}

/** Israeli mobile "054-1234567" → "972541234567" for wa.me; null when it isn't a usable number. */
export function whatsappNumber(phone: string | null | undefined): string | null {
  const digits: string = (phone ?? '').replace(/\D/g, '');
  if (/^0\d{8,9}$/.test(digits)) {
    return `972${digits.slice(1)}`;
  }
  return /^972\d{8,9}$/.test(digits) ? digits : null;
}

/** Opens WhatsApp (app or web) with the text filled in for that number. */
export function whatsappLink(number: string, text: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
