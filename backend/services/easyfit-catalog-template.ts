/**
 * The public catalog page members open from a shared link (redesign.md §5.8): server-rendered,
 * in the Studio look, in Hebrew (right to left) when the browser prefers Hebrew, else English.
 * Every value from the database is HTML-escaped.
 */

export type CatalogLang = "en" | "he";

export interface CatalogProductView {
  name: string;
  description: string;
  price: number;
  categoryID: number;
  imgUrl: string | null;
}

export interface CatalogPageView {
  gymName: string | null;
  gymPhone: string | null;
  expiresAt: Date;
  products: CatalogProductView[];
}

const TEXT: Record<CatalogLang, Record<string, string>> = {
  en: {
    title: "Our products",
    validUntil: "Valid until {date}",
    order: "To order, ask at the front desk or call",
    orderNoPhone: "To order, ask at the front desk.",
    empty: "This catalog has no products.",
    notFoundTitle: "This catalog wasn't found",
    notFoundBody: "The link may be wrong, or the catalog was deleted. Ask the gym for a new link.",
    expiredTitle: "This catalog has expired",
    expiredBody: "Its offers are no longer available. Ask the gym for a new link.",
    pageTitleSuffix: "catalog",
  },
  he: {
    title: "המוצרים שלנו",
    validUntil: "בתוקף עד {date}",
    order: "להזמנה: פנו לקבלה או התקשרו",
    orderNoPhone: "להזמנה: פנו לקבלה.",
    empty: "אין מוצרים בקטלוג הזה.",
    notFoundTitle: "הקטלוג לא נמצא",
    notFoundBody: "ייתכן שהקישור שגוי או שהקטלוג נמחק. בקשו מחדר הכושר קישור חדש.",
    expiredTitle: "תוקף הקטלוג פג",
    expiredBody: "המבצעים שבו כבר לא זמינים. בקשו מחדר הכושר קישור חדש.",
    pageTitleSuffix: "קטלוג",
  },
};

const CATEGORIES: Record<CatalogLang, Record<number, string>> = {
  en: { 1: "Protein", 2: "BCAA", 3: "Glutamine", 4: "Creatine", 5: "Clothes" },
  he: { 1: "חלבון", 2: "BCAA", 3: "גלוטמין", 4: "קריאטין", 5: "ביגוד" },
};

/** Pastel tiles behind product photos (and in their place when there is none). */
const TILES: string[] = ["#E8ECFE", "#E4F5EC", "#FDF1D8", "#FDE8E4", "#EFE7FD", "#E2F3F7"];

/** Hebrew when the browser lists it before English (Accept-Language), else English. */
export function catalogLanguage(acceptLanguage: string | undefined): CatalogLang {
  const langs: string[] = (acceptLanguage || "")
    .split(",")
    .map((part: string) => part.split(";")[0].trim().toLowerCase());
  const he: number = langs.findIndex((l: string) => l === "he" || l.startsWith("he-") || l === "iw");
  const en: number = langs.findIndex((l: string) => l === "en" || l.startsWith("en-"));
  return he >= 0 && (en < 0 || he < en) ? "he" : "en";
}

function escapeHtml(value: unknown): string {
  return String(value === null || value === undefined ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function t(lang: CatalogLang, key: string, params: Record<string, string> = {}): string {
  return Object.keys(params).reduce((text: string, name: string) => text.split(`{${name}}`).join(params[name]), TEXT[lang][key]);
}

function money(value: number): string {
  return `₪${(Number(value) || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

/** "Mon, 5 Oct" · "יום ב׳, 5 באוק׳" */
function shortDay(date: Date, lang: CatalogLang): string {
  return new Intl.DateTimeFormat(lang === "he" ? "he-IL" : "en-GB", { weekday: "short", day: "numeric", month: "short" }).format(date);
}

function initials(name: string): string {
  const words: string[] = name.trim().split(/\s+/).filter((w: string) => w.length > 0).slice(0, 2);
  return words.map((w: string) => w.charAt(0)).join("").toUpperCase() || "G";
}

const STYLE = `
:root{--canvas:#F5F4F0;--surface:#FFFFFF;--muted:#F1F0EC;--ink:#1B1C20;--ink2:#44464C;--ink3:#6B6E76;--ink4:#8A8D94;--accent:#2F4BF0;--ok-bg:#E3F4EA;--ok:#17693F;--shadow:0 1px 2px rgba(27,28,32,.05),0 6px 20px rgba(27,28,32,.05)}
*{box-sizing:border-box}
body{margin:0;background:var(--canvas);color:var(--ink);font-family:'Plus Jakarta Sans','Rubik',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.page{max-width:720px;min-height:100vh;margin:0 auto;padding:20px 16px 24px;display:flex;flex-direction:column;gap:16px}
.top{display:flex;align-items:center;justify-content:space-between;gap:12px}
.gym{display:flex;align-items:center;gap:10px;min-width:0}
.gym-tile{width:36px;height:36px;flex-shrink:0;border-radius:10px;background:var(--ink);color:#fff;font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center}
.gym-name{font-size:15px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.brand{display:flex;align-items:baseline;gap:2px;font-weight:800;font-size:15px;letter-spacing:-.5px;color:var(--ink4)}
.brand i{width:5px;height:5px;border-radius:3px;background:var(--accent);display:inline-block}
h1{margin:0;font-size:30px;font-weight:800;line-height:1.15;letter-spacing:-1px}
[dir=rtl] h1{letter-spacing:0}
.pill{align-self:flex-start;font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px;background:var(--ok-bg);color:var(--ok)}
.list{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr;gap:12px}
@media (min-width:640px){.list{grid-template-columns:repeat(2,minmax(0,1fr))}}
.card{background:var(--surface);border-radius:20px;padding:12px;display:flex;gap:14px;box-shadow:var(--shadow);min-width:0}
.photo{position:relative;width:96px;height:96px;flex-shrink:0;border-radius:14px;overflow:hidden;display:flex;align-items:center;justify-content:center;color:var(--ink4)}
.photo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.info{display:flex;flex-direction:column;gap:4px;min-width:0;flex-grow:1}
.cat{align-self:flex-start;font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;background:var(--muted);color:#55585F}
.name{font-size:16px;font-weight:800;overflow-wrap:anywhere}
.desc{font-size:13px;color:var(--ink3);line-height:1.35;overflow-wrap:anywhere}
.price{margin-top:auto;font-size:18px;font-weight:800}
.foot{margin-top:auto;display:flex;flex-direction:column;gap:10px;padding-top:8px}
.foot p{margin:0;font-size:13px;color:var(--ink2);text-align:center}
.call{height:48px;border-radius:24px;background:var(--accent);color:#fff;font-size:15px;font-weight:700;display:flex;align-items:center;justify-content:center;text-decoration:none}
.call:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.message{flex-grow:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:10px;padding:40px 8px}
.message h1{font-size:26px}
.message p{margin:0;font-size:15px;color:var(--ink3);max-width:40ch;line-height:1.5}
.empty{background:var(--surface);border-radius:20px;padding:24px;text-align:center;color:var(--ink3);box-shadow:var(--shadow)}
`;

const BAG_ICON = `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0"></path></svg>`;

function shell(lang: CatalogLang, title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="${lang}" dir="${lang === "he" ? "rtl" : "ltr"}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapeHtml(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Rubik:wght@400;500;600;700;800&display=swap">
<style>${STYLE}</style>
</head>
<body>
<main class="page">
${body}
</main>
</body>
</html>`;
}

function header(view: { gymName: string | null }): string {
  const gym: string = view.gymName
    ? `<div class="gym"><span class="gym-tile" aria-hidden="true">${escapeHtml(initials(view.gymName))}</span><span class="gym-name" dir="auto">${escapeHtml(view.gymName)}</span></div>`
    : `<span></span>`;
  return `<header class="top">${gym}<span class="brand" dir="ltr">easyfit<i aria-hidden="true"></i></span></header>`;
}

export function renderCatalogPage(view: CatalogPageView, lang: CatalogLang): string {
  const cards: string = view.products
    .map((product: CatalogProductView, index: number) => {
      const category: string = CATEGORIES[lang][product.categoryID] || "";
      const photo: string = product.imgUrl
        ? `<img src="${escapeHtml(product.imgUrl)}" alt="" loading="lazy" onerror="this.remove()">`
        : "";
      return `<li class="card">
<span class="photo" style="background:${TILES[index % TILES.length]}">${BAG_ICON}${photo}</span>
<div class="info">
${category ? `<span class="cat">${escapeHtml(category)}</span>` : ""}
<span class="name" dir="auto">${escapeHtml(product.name)}</span>
<span class="desc" dir="auto">${escapeHtml(product.description)}</span>
<span class="price" dir="ltr">${escapeHtml(money(product.price))}</span>
</div>
</li>`;
    })
    .join("\n");
  const phone: string = (view.gymPhone || "").trim();
  const footer: string = phone
    ? `<footer class="foot"><p>${escapeHtml(t(lang, "order"))}</p><a class="call" href="tel:${escapeHtml(phone.replace(/[^\d+]/g, ""))}"><bdi dir="ltr">${escapeHtml(phone)}</bdi></a></footer>`
    : `<footer class="foot"><p>${escapeHtml(t(lang, "orderNoPhone"))}</p></footer>`;
  const title: string = view.gymName ? `${view.gymName} · ${t(lang, "pageTitleSuffix")}` : t(lang, "title");
  return shell(
    lang,
    title,
    `${header(view)}
<section style="display:flex;flex-direction:column;gap:8px">
<h1>${escapeHtml(t(lang, "title"))}</h1>
<span class="pill">${escapeHtml(t(lang, "validUntil", { date: shortDay(view.expiresAt, lang) }))}</span>
</section>
${view.products.length ? `<ul class="list">\n${cards}\n</ul>` : `<p class="empty">${escapeHtml(t(lang, "empty"))}</p>`}
${footer}`
  );
}

/** The page for a catalog link that doesn't exist (`notFound`) or has run out (`expired`). */
export function renderCatalogMessagePage(kind: "notFound" | "expired", lang: CatalogLang): string {
  const title: string = t(lang, `${kind}Title`);
  return shell(
    lang,
    title,
    `${header({ gymName: null })}
<section class="message">
<h1>${escapeHtml(title)}</h1>
<p>${escapeHtml(t(lang, `${kind}Body`))}</p>
</section>`
  );
}
