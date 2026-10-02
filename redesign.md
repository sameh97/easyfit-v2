# EasyFit Frontend Redesign Brief

> **How to use this file**
> Sections 1–6 describe the project **as it is today** (written from the code, Sept 2026).
> Fill in every `✏️` block with what you want, then hand this file to Claude in a new session:
> *"Read `redesign.md` and implement the redesign."*
> Delete anything you don't care about; leave a `✏️` empty to mean "your call, Claude".

---

## 1. Product overview

EasyFit is a **gym management web app** for gym owners and staff (not for gym members).

- **Gym users** (role `1`, "regular user") manage one gym: members, trainers, group classes, machines and their maintenance, product sales, and product catalogs sent to members over WhatsApp.
- **Admin** (role `2`, `Admin@easyfit.com`) creates gyms and the user accounts for each gym. The admin has a separate UI with its own layout.
- Every piece of data is scoped to a gym (`gymId`). A gym user only ever sees their own gym.
- Currency is ₪ (ILS). Phone and ID validation is Israeli-specific (`05X-XXXXXXX`, Israeli ID checksum). Names can be in Latin or Hebrew letters. The UI is English and left-to-right only.

---

## 2. Tech stack

### Frontend (`frontend/`)
| Area | Tech | Notes |
|---|---|---|
| Framework | **Angular 11.2.14**, TypeScript 4.0 | One `AppModule`, no lazy loading, no standalone components (they don't exist in v11) |
| Styling (new) | **Tailwind CSS 2.2** (JIT mode) + PostCSS 8 | Config in `frontend/tailwind.config.js`. Tailwind 3+ needs Angular 13+ |
| Styling (legacy) | **Angular Material 11** (`indigo-pink` prebuilt theme), **Bootstrap 4.3** (CSS from CDN + jQuery/Bootstrap JS), `@angular/flex-layout` | Most pages still use these |
| Icons | Google **Material Icons** font (`<span class="material-icons">name</span>`) | Loaded in `index.html` |
| Fonts | **Inter** (body), **Barlow Condensed** (display/headings), Roboto (legacy Material) | Google Fonts in `index.html` |
| Charts | **Chart.js 3.5** (used directly via `new Chart(canvas)`) | 4 charts on the dashboard |
| Date pickers | `@angular-material-components/datetime-picker`, `ng-pick-datetime` (Owl), Material datepicker | Three different libraries are in use |
| Multi-select | `ng-multiselect-dropdown` | Used for picking members, trainers, products and machines |
| Realtime | `socket.io-client` 4 | Live notification count in the top bar |
| Auth | JWT stored client-side, `@auth0/angular-jwt`, `AuthGuard` on routes | |
| Forms | Reactive forms; shared validators live in `shared/components/form-input/form-input.component.ts` | Components extend `FormInputComponent` |

### Backend (`backend/`)
Node.js with Express 4 and TypeScript, **Sequelize 5** with `sequelize-typescript` on **PostgreSQL 16**, Inversify for dependency injection, socket.io 4, `node-schedule` for machine maintenance jobs, AWS S3 for image uploads, `wbm` for WhatsApp sending, and JWT with bcrypt for auth.
The API lives under `/api/*`. Tables are created by `sequelize.sync()`; there are no migrations.

### Infra
- `docker-compose.yml` runs three services: `db` (Postgres), `backend` (API, internal only) and `frontend` (nginx on port 80). nginx serves the Angular build and proxies `/api` and `/socket.io` to the backend.
- Config comes from the root `.env` (see `.env.example`).
- Mock data: `docker compose exec backend node dist/scripts/seed-mock-data.js <email>`.

### Hard constraints for the redesign (from `CLAUDE.md` and the stack)
1. All new UI uses **Tailwind**, with a *modern, clean, athletic* look.
2. The TypeScript must be strictly typed.
3. Tailwind **preflight is disabled** so that Bootstrap and Material pages keep working. Unless all of them are migrated, new components must set their own base styles (margins on `h1`/`p`, button resets and so on).
4. Tailwind 2 syntax applies: `bg-opacity-*` (no `bg-black/50`), `transform` must be added before `translate-*`, and arbitrary values like `w-[37px]` work because JIT is on.
5. `ng serve` needs `NODE_OPTIONS=--openssl-legacy-provider` and `TAILWIND_MODE=watch`.

> ✏️ **Should the redesign also remove Bootstrap, jQuery and/or Angular Material entirely?** (Removing them would let Tailwind's preflight be turned back on and makes the bundle smaller. Material would still be useful for dialogs, datepickers and tables, restyled.)
>
> ✏️ **Upgrade Angular (to 17+) as part of this?** That unlocks Tailwind 3/4, standalone components, the new control flow (`@if`/`@for`) and signals. It's a big job; it can happen before or after the redesign.

---

## 3. Current design system (what's already built)

The first redesign pass is done for **Login**, the **app shell** (sidebar and top bar) and the **Dashboard**. Everything else is still the old Material + Bootstrap look.

### Tokens (in `frontend/tailwind.config.js`)
| Token | Value | Used for |
|---|---|---|
| `brand-*` | Tailwind `lime` palette (`brand-400` = `#a3e635`) | Accent: active nav item, primary buttons, logo mark, icon badges |
| `ink-*` | Tailwind `blueGray` palette (`ink-900` = `#0f172a`) | Sidebar, text, borders, page background (`ink-50`) |
| `font-sans` | Inter | Body text |
| `font-display` | Barlow Condensed, uppercase, bold | Page titles, logo, primary button labels |
| red-500/600 | Tailwind default | Errors, notification badge, destructive actions |

### Visual language so far
- **Shell:** a fixed dark sidebar (`ink-900`, 256px) with a logo (lime square containing a `fitness_center` icon, and "EASY**FIT**" where "FIT" is lime), and nav items with a Material icon. The active nav item gets a lime left border, a lighter background and a lime icon. Below `lg` the sidebar slides in over a dark backdrop.
- **Top bar:** white at 90% opacity with backdrop blur, sticky. It has a hamburger (mobile only), a notification bell with a red count badge, and an avatar with initials (lime circle) that opens a dropdown with Profile and Log out.
- **Login:** split screen. On the left (≥ `lg`) is a gym photo with a dark gradient, a big condensed-uppercase headline ("Run your gym. *Not your paperwork.*") and three feature chips. On the right is the form: icon-prefixed inputs, a show/hide password toggle, inline errors, and a full-width lime "SIGN IN" button with a spinner.
- **Dashboard:** a date eyebrow (lime, uppercase, tracking-wide), a "DASHBOARD" title in display font, and a 2×2 grid (1 column below `xl`) of white `rounded-2xl` cards. Each card has a dark rounded icon tile with a lime icon, a title and a subtitle, then a Chart.js chart.
- **Cards:** `bg-white rounded-2xl border border-ink-100 shadow-sm p-6`.
- **Inputs:** `rounded-lg border-ink-300`, with a lime focus ring (`focus:border-brand-500 focus:ring-2 focus:ring-brand-200`).
- **Charts:** still Chart.js default colors (pink, blue and yellow, a red/green income line), which don't match the brand yet.

> ✅ **Decision: replace this direction** with **"Studio"**: light, calm and premium, with rounded shapes. The dark slate + lime look, Barlow Condensed and the dark sidebar are all retired, and the already-redesigned Login, shell and Dashboard get redone in the new look. The full spec is in **§7.2**.
>
> ✏️ **Dark mode?** (none / toggle / follow the OS setting)

---

## 4. App structure

### Routes (`frontend/src/app/app.module.ts`)
| Route | Component | Who | Layout | Redesigned? |
|---|---|---|---|---|
| `/` | redirects to `/login` | – | – | – |
| `/login` | `LoginComponent` | everyone | full screen | ✅ |
| `/home` | `HomeComponent` (dashboard) | gym user | `app-nav` | ✅ |
| `/members` | `MembersPageComponent` | gym user | `app-nav` | ❌ |
| `/trainers` | `TrainersPageComponent` | gym user | `app-nav` | ❌ |
| `/group-trainings` | `DisplayTrainingsComponent` | gym user | `app-nav` | ❌ |
| `/machines` | `MachinesComponent` | gym user | `app-nav` | ❌ |
| `/scheduler` | `SchedulerPageComponent` (machine maintenance) | gym user | `app-nav` | ❌ |
| `/products` | `ProductsPageComponent` (+ bills tab) | gym user | `app-nav` | ❌ |
| `/catalog` | `CatalogPageComponent` | gym user | `app-nav` | ❌ |
| `/profile` | `UserProfileComponent` | gym user | `app-nav` | ❌ |
| `/admin` | `AdminPageComponent` (gyms) | admin | `app-admin-nav` | ❌ |
| `/users` | `UsersPageComponent` | admin | `app-admin-nav` | ❌ |
| – | `RegisterPageComponent` | declared but **not routed** (Bootstrap form) | – | ❌ |
| *(no route)* | 404 page | – | – | missing (a TODO in the code) |

After login, admins go to `/admin` and everyone else goes to `/home`. The admin routes only have `AuthGuard`, **with no admin role check** (another TODO).

### Layouts
- **`app-nav`** (gym user shell): the redesigned Tailwind shell. Pages put their content inside `<app-nav>…</app-nav>`.
- **`app-admin-nav`** (admin shell): the old `mat-sidenav` + `mat-toolbar`, with nav links for Gyms and Users.

> ✅ **Decision:** a floating sidebar with grouped items, a ⌘K command palette, and an AI panel that opens only when clicked. The full spec is in **§7.3**.
>
> ✏️ **Should the admin area use the same shell as the gym area** (with different nav items), or a visually distinct one?

---

## 5. Page-by-page inventory

Each page lists what it shows **today**, the data fields, the actions, and the dialogs it opens. All add/edit forms currently open in **Angular Material dialogs** (`NavigationHelperService.openDialog`, default width 350px; some open at 98% width). Deletes ask for confirmation in a yes/no `ConfirmationDialogComponent`. Success and error messages appear in a Material **snackbar**.

### 5.1 Dashboard `/home` ✅ redesigned
- Four chart cards: **New members** per month (bar, current year), **Monthly income** (line), **Products sold** per month (bar), **Member genders** (doughnut, male vs female).
- It has no KPI numbers, no "today" view and no quick actions.

> ✅ **Decision:** follow the mockup `docs/redesign/mockups/Final-Dashboard.dc.html`. From top to bottom:
> 1. **Greeting header:** "Good afternoon, {firstName}" (morning/afternoon/evening by local time). The subtitle is the date and gym name ("Wednesday, 30 September · Power House TLV"). On the right are the actions **Sell product** (secondary) and **Add member** (primary).
> 2. **4 KPI cards:** *Active members* (+ new this month), *Expiring this week* (+ how many within 3 days, amber "Action" chip), *Classes today* (+ remaining, next class name and time), *Revenue this month* (₪, + % vs last month, from bills).
> 3. **Row (2/3 + 1/3):** an **Income** bar chart by month for the current year. The current month's bar is the accent colour, past months use accent-soft, and each bar has a value label. Next to it is a **Today** list of group trainings: a dot, time, description, trainer, member count and an "Up next" tag. Past classes are dimmed to 55% opacity and the next class gets an accent-soft background. The income card has an **"Explain this"** button that opens the AI panel with a prefilled question.
> 4. **Row (1/3 × 3):** **Expiring soon** (avatar, name, "Expires in N days", **Renew** button), **Maintenance** (next 3 jobs by due date, with type and serial number, and "Due today" in red), **Low stock** (products with quantity ≤ 5, shown as "N left").
> - The four existing Chart.js charts (new members, products sold, genders) move out of the dashboard, or behind a segmented control on the income card (Members / Income / Products sold). Chart colours use the brand tokens only.
> - All KPI numbers need backend aggregate endpoints; see §7.6.

### 5.2 Members `/members`
- **Today:** a `mat-card` with a title, a mini FAB "+" button and a menu. Below it is a `mat-table` (`MembersTableComponent`) with a search box and paginator. Columns: first name, last name, phone, birthday, address, email, status (active/inactive), join date, end of membership, image, edit, delete.
- **Add/Edit member dialogs:** first/last name, phone, email, birthday, address, join date, end of membership, gender radio (male/female), image upload to S3. Every field has a `mat-form-field` with a prefix icon and hints.
- **Data:** `id, firstName, lastName, phone, birthDay, email, address, isActive, joinDate, endOfMembershipDate, gender (1 = male, 2 = female), imageURL, gymId`.

> ✏️ Your vision (table vs cards, avatars, status pills, "expiring soon" highlighting, filters by status/gender, member detail page/drawer, bulk actions…):

### 5.3 Trainers `/trainers`
- **Today:** the same layout as Members (`TrainersTableComponent`). Columns: name, phone, birthday, address, email, status, join date, certification date, image, edit, delete.
- **Add/Edit trainer dialogs:** the same fields as a member, plus certification date.
- **Data:** `id, firstName, lastName, phone, birthDay, email, address, isActive, joinDate, certificationDate, imageURL, gymId`, and the trainer has many group trainings.

> ✏️ Your vision (trainer profile cards with photo, classes they teach, schedule…):

### 5.4 Group trainings `/group-trainings`
- **Today:** a `mat-card` with a search box and a `mat-table`. Columns: training (trainer), start time, description, edit, delete.
- **Add/Edit dialog:** trainer (multiselect dropdown), members (multiselect), start date/time, description.
- **Show single training dialog:** the class details plus a table of participating members.
- **Data:** `id, startTime, description, trainerId, gymId`, with members joined through `MemberParticipate`. There's **no end time, capacity, class type or room field**.

> ✏️ Your vision (weekly calendar view? list grouped by day? capacity bars? class-type colors?). Note if you want new fields such as duration or capacity; those need backend changes.

### 5.5 Machines `/machines`
- **Today:** a `mat-card` with a search box, a "+" FAB and a virtual-scroll `mat-list`. Each item has a **250×250 image** on the left, then name, serial number, description, production year, price (₪), and buttons: *Notifications*, *Edit* and *Delete*.
- **Add/Edit dialogs:** name, serial number, description, production year, price and image, laid out in a `mat-grid-list`.
- **Machine notifications dialog:** a list of maintenance alerts for one machine (job type and time) with *Done* buttons and a "clear all" button.
- **Data:** `id, name, description, serialNumber, productionYear, imgUrl, price, gymId`.

> ✏️ Your vision (grid of equipment cards? status badge "needs cleaning / service due"?):

### 5.6 Scheduler (machine maintenance) `/scheduler`
- **Today:** a virtual-scroll `mat-list` of scheduled jobs. Each shows the job type (**Clean** or **Service**), active/inactive, start date, end date and "every N days", with buttons for *Machine details*, *Edit* and *Delete*.
- **Add/Edit dialog:** machine (multiselect), job type (select), start and end date/time (Owl + Material pickers), frequency in days, active toggle.
- When a job fires, the backend creates a notification and pushes it over socket.io. That drives the bell badge in the top bar.
- **Data:** `id, startTime, endTime, isActive, daysFrequency, jobID (1 = clean, 2 = service), machineSerialNumber, gymId`.

> ✏️ Your vision (timeline/calendar of upcoming maintenance? merge into the Machines page?):

### 5.7 Products `/products`
- **Today:** `mat-tab-group` with two tabs.
  - **Products tab:** a search box, a "+" FAB and a virtual-scroll list. Each item has a 250×250 image, then name, category, description, code, quantity and price, with buttons for *Sell*, *Edit* and *Delete*.
  - **Bills tab:** a list of sales showing product, customer name, customer ID, phone, quantity, total and date.
- **Add/Edit product dialog:** name, description, code, quantity, price, category (select) and image.
- **Sell product dialog:** customer ID, name, phone and quantity. This creates a bill and lowers the stock.
- **Categories** are hard-coded in the frontend: 1 protein, 2 BCAA, 3 Glutamine, 4 Creatine, 5 Clothes.
- **Data:** Product `id, name, description, code, quantity, price, imgUrl, categoryID, gymId`. Bill `id, coustomerID, coustomerName, coustomerPhone, productID, productName, quantity, totalCost, gymId, createdAt`. (`coustomer` is misspelled in the DB.)

> ✏️ Your vision (shop-style product grid, low-stock warnings, POS-like quick sell, sales table with totals/filters…):

### 5.8 Catalogs `/catalog`
- **Today:** a `mat-card` with a `mat-table`. Columns: link, duration (days), creation time, send on WhatsApp, edit, delete.
- **Add/Edit catalog dialog:** products (multiselect) and duration in days. This creates a **temporary public URL**.
- **Send catalog dialog:** pick member phones (chips) and send the link over WhatsApp. This **doesn't work in Docker** because `wbm` needs Chromium and a QR login.
- The **public catalog page** that members open is **server-rendered HTML** in `backend/services/easyfit-catalog-template.ts` and `backend/templates/` (not Angular). Include it in the redesign if you want.

> ✏️ Your vision (and should the public catalog page be redesigned too? Replace WhatsApp sending with "copy link" / share sheet?):

### 5.9 Profile `/profile`
- **Today:** a `mat-card` with first and last name, "member since", email and phone, plus an *Edit* button. It opens the **Edit profile dialog** (name, email, phone, birthday, address, password, image).

> ✏️ Your vision:

### 5.10 Notifications (top-bar bell)
- The redesigned bell badge shows the unread count, which updates live over socket.io.
- Clicking it opens the old **`NotificationsDropdownComponent`** as a Material dialog: cards grouped by machine, showing machine name, count and time, each with a *View* button.

> ✏️ Your vision (real dropdown panel under the bell? mark-all-read? link to the machine?):

### 5.11 Admin: Gyms `/admin`, Users `/users`
- **Today:** the old `mat-sidenav` shell. **Gyms** is a `mat-table` (name, phone, address, edit, delete) with add/edit gym dialogs. **Users** is a `mat-table` (first name, last name, email, phone, birthday, address, gym name, edit, delete) with add/edit user dialogs (all user fields plus a gym multiselect).

> ✏️ Your vision:

### 5.12 Missing pages
- A **404 page** (a TODO in the routes).
- **Register**: `RegisterPageComponent` exists but isn't routed.

> ✏️ Want a 404? Public landing/marketing page? Forgot password? Anything else new?

---

## 6. Shared UI patterns and known issues

**Patterns used across the app today**
- **Page header:** an `h1.mat-h1` title with a mini FAB "+" next to it. Every page builds its own header with its own CSS; there's no shared page-header component.
- **Lists:** tables (`mat-table` + `mat-paginator` + a search input using a custom `searchfilter` pipe), and virtual-scroll `mat-list` with big 250px images (machines, products, scheduler).
- **Dialogs:** every create/edit form is a Material dialog. They're mostly narrow (350px) and use `mat-grid-list` for layout.
- **Feedback:** Material snackbar, and `AppUtil.showError`.
- **Forms:** `mat-form-field` in outline style, with prefix icons and `mat-error`/`mat-hint`. Validation is in `FormInputComponent` (Israeli phone and ID, names, prices, dates and so on).
- **Images:** uploaded to S3. When there's no image, default images are used (`AppConsts.*_DEFULT_IMAGE`).

**Known UX and tech issues worth fixing during the redesign**
- There are no shared UI components: every page repeats its header, card, table and buttons. A small component kit would help (`PageHeader`, `Card`, `Button`, `Input`, `Table`, `Badge`, `EmptyState`, `Modal`).
- Three different date-picker libraries give three different looks.
- Pages have no empty states and no loading skeletons.
- The 250×250 inline-styled images make the machine and product lists very tall.
- Chart colors don't match the brand.
- Some tables and dialogs aren't mobile-friendly.
- Typos in the UI copy ("peer month" and similar).
- The UI is English left-to-right only (✏️ do you need Hebrew or Arabic right-to-left?).
- The admin routes have no role guard.

---

## 7. Your redesign spec ✏️

> **Visual reference.** The approved mockups are in `docs/redesign/mockups/` (see the README there). They are design references written as HTML with inline styles. Match their look, spacing and content, but build real Angular components with Tailwind; don't copy their markup.
> The live design canvas (owner-only link): https://claude.ai/artifact/2Evpr5z1AQHVnKsMgXEYFa (the "Final" row is the chosen design).

### 7.1 Goals
- It should feel like a **calm, premium fitness SaaS**. It should be modern, clean and light, not a generic admin template.
- Make the daily front-desk work fast: find a member, renew a membership, sell a product, see today's classes. **⌘K** reaches everything.
- Get the app **ready for AI**: an assistant panel that answers questions about the gym's data and documents, and can take actions after confirmation (§7.6).
- ✏️ Anything else (e.g. tablet at the reception desk)?

### 7.2 Brand and look: "Studio" ✅
**Mood:** calm, premium, friendly, confident. It uses soft rounded shapes, a warm off-white background, white cards with soft shadows, **one** strong accent colour and generous whitespace.

**Colour tokens** (replace `brand`/`ink` in `tailwind.config.js`; keep the names semantic):
| Token | Hex | Use |
|---|---|---|
| `canvas` | `#F5F4F0` | App background (warm off-white) |
| `surface` | `#FFFFFF` | Cards, sidebar, panels, inputs |
| `surface-subtle` | `#FAF9F6` | Inner rows, input fill, suggestion chips |
| `surface-muted` | `#F1F0EC` | Icon tiles, segmented-control track, progress track (`#EFEEE9`) |
| `line` | `#E7E5DF` | Default borders and dividers (`#EFEEE9` for dividers inside cards) |
| `line-strong` | `#D9D6CE` | Secondary-button border, input border |
| `ink` | `#1B1C20` | Primary text, dark buttons, avatar for the current user |
| `ink-2` | `#44464C` | Secondary text and nav items |
| `ink-3` | `#6B6E76` | Muted text, captions, placeholder |
| `ink-4` | `#8A8D94` | Section labels (uppercase 11px), chart axis |
| `accent` | `#2F4BF0` (cobalt) | Primary buttons, active nav, current-month bar, links, focus ring |
| `accent-soft` | `#E2E6FD` (accent mixed 86% with white) | Active nav background, highlighted rows, past chart bars, AI surfaces |
| `success` | bg `#E3F4EA` / text `#17693F` | "Active" pill, positive deltas |
| `warning` | bg `#FDEFD6` / text `#7A4F00` (`#8A5A00` for inline text) | "Expiring" pill, "Action" chip, expiry notes, progress bar `#E39A1C` |
| `danger` | text `#B4351F`, dot `#D9362B` | Due today, stock ≤ 2, notification dot, destructive actions |
| `neutral` | bg `#ECEBE6` / text `#55585F` | "Inactive" pill, neutral chips |

Accent alternatives the owner may switch to later: teal `#0F766E`, violet `#7C3AED`, rose `#BE123C`. Keep the accent in **one** token so switching is a one-line change.

**Avatar pastel pairs** (initials avatars, chosen by `id % 6`): `#E8ECFE/#2F4BF0`, `#FDE8E4/#B4351F`, `#E4F5EC/#17693F`, `#FDF1D8/#7A4F00`, `#EFE7FD/#6D3BD8`, `#E2F3F7/#0E6A80`. A real photo (S3 `imageURL`) replaces the initials when present.

**Typography:** **Plus Jakarta Sans** (400/500/600/700/800) for everything. It replaces Inter, Barlow Condensed and Roboto (remove them from `index.html`).
- Page title (h1): 32–36px / 800 / letter-spacing −1.2px / line-height 1.1, **sentence case**. No more uppercase titles.
- Card title (h2): 17–18px / 800 / −0.3px.
- KPI number: 34px / 800 / −1px.
- Body 14–15px / 500–600; captions 12–13px `ink-3`; section labels 11px / 700 / uppercase / letter-spacing 1.4px `ink-4`.

**Shape and depth:**
- Radius: cards **20px**; sidebar, AI panel and command palette **24px**; buttons, inputs, pills, segmented controls **fully rounded** (`rounded-full`); icon tiles and small square buttons **12px**; bars in charts 12px.
- Card shadow: `0 1px 2px rgba(27,28,32,.05), 0 6px 20px rgba(27,28,32,.05)`, with no border. Floating overlays (menus, palette): `0 20px 50px rgba(27,28,32,.16)`. Modal backdrop: `rgba(27,28,32,.38)`.
- Heights: buttons and inputs 44–46px (touch-friendly), small buttons 36px, icon buttons 44×44 round.

**Buttons:** primary = accent fill, white text, pill. Secondary = white, `line-strong` border, ink text. Dark = `ink` fill (used for "New" in the top row). Ghost icon = transparent, `ink-3`.

**Icons:** **Lucide**-style outline icons (24px grid, 2px stroke, round caps), shown at 17–20px. This replaces the Material Icons font. On Angular 11, use inline SVG via a small `<app-icon name="…">` component with an icon map. `lucide-angular` needs a newer Angular.

**Logo:** the wordmark **"easyfit"** in lowercase, Plus Jakarta Sans 800, 23–24px, letter-spacing −0.8px, followed by an 8px accent dot. The dumbbell tile is retired. ✏️ Or provide a logo file.

**Light / dark:** ✏️ undecided. The mockups are light only. If dark mode is wanted, define the tokens above as CSS variables so a dark set can be added.

### 7.3 Layout and navigation ✅
Reference: `mockups/Final-Dashboard.dc.html` (shell), `mockups/Nav-1-Sidebar-AI-Panel.dc.html` (AI panel open), `mockups/Nav-3-Rail-Command.dc.html` (command palette).

**App shell (desktop ≥ lg):** the canvas background with a **16px inset** all round. Left is the **floating sidebar** (256px, white, radius 24, card shadow). Right is the main column, with no top bar across the full width. When the AI panel is open, it appears as a third column (400px) on the right.

**Floating sidebar**, from top to bottom:
1. Wordmark + **collapse** button (panel icon). Collapsed = 72px icon-only rail with tooltips. Remember the state in `localStorage`.
2. **Gym card:** a dark 36px tile with the gym's initials, then the gym name and "N members". It's a static label today, and becomes a switcher if multi-gym is ever added.
3. **"Ask EasyFit AI"** button: full width, accent fill, sparkle icon, `⌘J` hint. It opens the AI panel.
4. **Grouped nav** with uppercase section labels:
   - *Overview*: Dashboard
   - *People*: Members (count badge), Trainers, Classes (= group trainings)
   - *Equipment*: Machines, Maintenance (= scheduler; the badge shows open alerts in warning colours)
   - *Shop*: Products (including the sales/bills tab), Catalogs
   - Item: 40px tall, radius 12, icon 19px plus label. Active = `accent-soft` background, accent text, 700 weight, `aria-current="page"`.
5. Bottom: current user (avatar, name, role), then a **settings** icon button that opens the profile/settings page. A menu has **Log out**.

**Main column top row** (on every page): the **⌘K search trigger** (a 380px pill button reading "Search or jump to…" with a `⌘K` badge; `Ctrl K` on Windows) on the left, and the **notification bell** (a round 44px button with a red dot; opens a dropdown panel, see §5.10) on the right. Below it is the page header: h1 plus the page's primary actions on the right.

**Command palette (⌘K / Ctrl K, or clicking the trigger):** a centred modal, 680px wide, radius 24, with a backdrop.
- Input with a sparkle icon. Results are grouped: **Ask AI** (sends the typed text to the assistant; the answer and action buttons appear inline), **Members / Trainers / Products / Classes** (live search), **Pages**, and **Actions** (Add member, Sell product, New class, Schedule maintenance, Renew membership…).
- Keyboard: ↑↓ to move, ↵ to open, Tab to ask AI, Esc to close. The footer shows these hints.

**AI panel:** **closed by default, opens only on click** (sidebar button, ⌘J, an "Explain this" button, or the palette's "Ask AI"). It's 400px, radius 24, and pushes the content to the side on ≥ xl; below xl it slides over the page.
- Header: sparkle tile, "EasyFit AI", "Beta" pill, new-chat and close buttons.
- Messages: the user's messages are dark `ink` bubbles on the right. Assistant answers are plain text on the left and can contain rich blocks (member rows, tables), **source chips** (e.g. "Members", "Sales · 1 bill", "Gym rules.pdf · page 2") and **action buttons** (e.g. "Draft WhatsApp reminders"). Actions always ask for confirmation before changing data.
- Footer: suggestion chips, then a composer (text input, attach-document button, round accent send button).
- Opening or closing it keeps the conversation for the session.

**Tablet (md–lg):** the sidebar starts collapsed (72px rail), and the AI panel overlays the page.
**Phone (< md):** the sidebar becomes an off-canvas drawer opened from a hamburger in the top row, and the AI panel and palette are full-screen sheets. ✏️ Confirm phone support is needed (§7.8).

### 7.4 Components and patterns
> ✏️ Modals vs side drawers vs full pages for create/edit?
>
> ✏️ Tables vs cards for lists?
>
> ✏️ One date picker to standardise on?
>
> ✏️ Toasts style/position?

### 7.5 Page priorities
> ✏️ Order to redesign in (e.g. Members → Classes → Products → Machines → Scheduler → Catalog → Profile → Admin):

### 7.6 New features or fields
**AI assistant ("EasyFit AI").** The UI is in §7.3. The backend has two separate capabilities, and they need different architectures:
1. **Questions about the gym's own data** (members, expirations, classes, sales, maintenance). Use **LLM tool calling** against a set of **read-only, typed API functions** (e.g. `findMembers(filter)`, `getExpiringMemberships(days)`, `getSales(range)`, `getMachineJobs(status)`). Every function is **scoped to the user's `gymId` on the server**. The model never writes raw SQL and never sees another gym's data. This part is *not* RAG.
2. **Questions about documents** (gym rules, price lists, policies, trainer notes). This is **RAG**: upload PDF/DOCX → split into chunks → embed → store in **Postgres with `pgvector`** (it runs on the existing Postgres 16, so no new database) → retrieve the top chunks → answer with **citations** (file name + page) shown as source chips.
- **Actions** proposed by the AI (send a reminder, renew a membership, mark a job done) go through the existing endpoints and **always need an explicit confirm click**.
- Stream answers to the panel (SSE or the existing socket.io).
- The API key and model choice come from `.env`. Log prompts for debugging with no personal data in the logs.
- ✏️ Which LLM provider? Which languages should the AI answer in (Hebrew)? Is the AI in scope for this redesign, or only its UI shell with a "coming soon" state?

**Dashboard aggregates** (for §5.1): an endpoint returning active members, new this month, expiring in 7/3 days, today's classes (from `startTime`), month revenue and % change (from bills), low-stock products (qty ≤ 5), and the next maintenance jobs.

✏️ Anything else that needs backend changes (class capacity/duration, member check-ins, payments/subscriptions, trainer schedules, membership price/renewal, …)?

### 7.7 Out of scope (must NOT change)
- **Backend API contracts and the DB schema.** Existing routes, request/response shapes and tables stay as they are. The only exceptions are the new **read-only** endpoints this file asks for (§7.6, §7.10). No destructive SQL (see `CLAUDE.md`).
- **Business rules and validation** in `FormInputComponent`: Israeli phone and ID checks, name rules, date and price rules. The forms get restyled, but the rules behave the same.
- **Routes/URLs, auth and roles:** the JWT flow, `AuthGuard`, and the redirect after login (admin → `/admin`, others → `/home`).
- **Realtime notifications:** the socket.io mechanism stays. Only the UI around it changes.
- **The public catalog page** (server-rendered by the backend), unless this file says otherwise later.
- **Docker, nginx and `.env` setup.**

### 7.8 Devices and accessibility
*(These are proposed defaults; change any of them.)*
- **Screens:** desktop (≥ 1280px) is the main target. Tablet (768–1279px) is fully supported, for the reception desk. Phone (< 768px) is usable: the sidebar becomes a drawer and tables scroll or stack, but it isn't specially optimised. ✏️ Confirm or change.
- **Accessibility: WCAG 2.1 AA.**
  - Text contrast at least 4.5:1.
  - A visible focus ring on everything (2px accent + 2px offset).
  - Everything works by keyboard: sidebar, palette, AI panel and dialogs, which trap focus and close on Esc.
  - Real `<button>`/`<a>` elements, `aria-label` on icon-only buttons, `aria-current` on the active nav item.
  - Touch targets ≥ 44px. Respect `prefers-reduced-motion`.
- **Language:** English, left-to-right only, for now. User-entered text such as names and addresses gets `dir="auto"` so Hebrew names display correctly. ✏️ Is a Hebrew right-to-left UI needed later? If so, new components avoid hard-coded left/right where that's cheap.
- **Formats:** dates like `14 Mar 2027` (the Angular `date` pipe, `d MMM y`), times as 24h `17:30`, money as `₪48,250`.

### 7.9 Anything else
- Every redesigned page has a **loading state** (skeletons), an **empty state** (icon, a short line and the main action) and an **error state** with a retry button.
- Build and reuse a small **shared component kit** in `shared/` rather than repeating markup per page (see §6).
- Fix UI copy typos ("peer month" and similar) while touching a page. Buttons use sentence case: "Add member", not "ADD MEMBER".
- Strict TypeScript: no `any`, and typed inputs/outputs on every component.

### 7.10 Implementation plan
Work in phases. **Only do the phase you are asked for**, and leave anything still marked ✏️ outside that phase alone.

**Phase 1: foundation, shell, dashboard, login** (everything here is decided)
1. **Design tokens:** put the §7.2 colours, font, radii and shadows in `tailwind.config.js`. Load Plus Jakarta Sans in `index.html` and remove Inter and Barlow Condensed. Keep Roboto only while Material pages still exist. Keep preflight **off**.
2. **Icons:** an `<app-icon name="…" [size]>` component that renders inline Lucide-style SVGs from a typed icon map.
3. **Component kit** (Tailwind, standalone-looking, strictly typed):
   - `Button` (primary / secondary / dark / ghost; sm and md)
   - `IconButton`
   - `Card`
   - `PageHeader` (title, subtitle, actions slot)
   - `StatusPill` (active / expiring / inactive / neutral)
   - `Avatar` (initials with the pastel palette, or an image)
   - `KpiCard`
   - `SegmentedControl`
   - `EmptyState`
   - `Skeleton`
4. **App shell:** rewrite `app-nav` to follow §7.3.
   - Floating sidebar with groups, collapsible with the state remembered, and a drawer below `lg`.
   - Top row with the ⌘K trigger and the bell. The bell keeps opening the existing notifications dialog for now.
   - Every existing page must still work inside the new shell.
5. **Command palette (⌘K / Ctrl K):**
   - Jump to any page.
   - Actions that open the existing add dialogs (Add member, Add trainer, New class, Add product, Sell product, Schedule maintenance).
   - Live member search using the existing members endpoint (filtering on the client is fine for now).
   - The **Ask AI** group is shown, but disabled with a "Coming soon" label.
6. **AI panel (UI only):**
   - Opens from the sidebar button, ⌘J, or the dashboard's "Explain this" button, and is closed by default.
   - It shows an empty state: "EasyFit AI is coming soon", with example questions as disabled chips.
   - No AI backend in this phase.
7. **Dashboard:** rebuild it following §5.1 and `mockups/Final-Dashboard.dc.html`.
   - Add **one read-only endpoint**, `GET /api/dashboard/summary`, scoped by `gymId` on the server, returning the KPI numbers, monthly income, today's classes, the expiring list, the next maintenance jobs and low-stock products.
   - Chart colours use the brand tokens only.
8. **Login:** restyle it in the Studio look with a light split layout. Keep the form behaviour and error handling exactly as they are.

**Do not in Phase 1:**
- Remove Bootstrap, jQuery or Angular Material.
- Upgrade Angular.
- Restyle the other pages beyond what the shell needs.
- Build any AI backend.

**Phase 1 is done when:**
- `ng build --prod` passes with no new warnings and no `any`.
- Every existing route still works.
- The shell, palette and AI panel are fully usable by keyboard.
- Screenshots at 1440, 1024 and 390px wide broadly match the mockups.

**Phase 2+** (to be written once the ✏️ decisions are made): component patterns for forms and lists (§7.4), then the page-by-page redesign in the §7.5 order, clean-up (Bootstrap/Material/jQuery), a possible Angular upgrade, and the AI backend (§7.6).
