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
- Currency is ₪ (ILS). Phone and ID validation is Israeli-specific (`05X-XXXXXXX`, Israeli ID checksum). Names can be in Latin or Hebrew letters. The UI was English and left-to-right only; since Phase 2, redesigned pages are in English and Hebrew (right-to-left), see §7.8.

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
| `/members` | `MembersPageComponent` | gym user | `app-nav` | ✅ Phase 2 |
| `/trainers` | `TrainersPageComponent` | gym user | `app-nav` | ✅ Phase 2 |
| `/group-trainings` | `ClassesPageComponent` | gym user | `app-nav` | ✅ Phase 3 |
| `/machines` | `MachinesPageComponent` | gym user | `app-nav` | ✅ Phase 3 |
| `/scheduler` | `MaintenancePageComponent` (machine maintenance) | gym user | `app-nav` | ✅ Phase 3 |
| `/products` | `ProductsPageComponent` (+ bills tab) | gym user | `app-nav` | ❌ (Phase 4) |
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
>
> ✅ **Decisions after the Phase 1 review:**
> - **Revenue KPI compares month to date with the same days of last month.** For example, 1–2 Oct is compared with 1–2 Sep. Both sides are whole days, from the 1st to the end of today. Last month's window is capped at its last day, so on 31 Oct it is 1–30 Sep and on 30–31 Mar it is all of February. The caption reads "vs ₪X same period last month". When that period had no sales, the caption reads "No sales in the same period last month" and the % chip is hidden. The endpoint returns `revenue.thisMonth` (month to date), `revenue.lastMonthSamePeriod` and `revenue.changePct`.
> - **The sidebar Maintenance badge counts maintenance jobs that are due today or overdue,** not unread notifications, and is hidden at 0. The bell keeps the unread-notification count.
>   - *Due today:* an active job with a scheduled run (`startTime + n × daysFrequency`, before `endTime`) on today's date.
>   - *Overdue:* an active job, not due today, whose alert from an earlier day is still open. "Open" means it was not cleared with **Done** in the machine-notifications dialog, which deletes it. The schema has no per-run completion record, so an open alert is the only "not done yet" signal.
>   - Each job counts once. The endpoint returns `maintenanceDue: { today, overdue, total }`, and the badge refreshes when a new alert arrives over socket.io.

### 5.2 Members `/members`
- **Today:** a `mat-card` with a title, a mini FAB "+" button and a menu. Below it is a `mat-table` (`MembersTableComponent`) with a search box and paginator. Columns: first name, last name, phone, birthday, address, email, status (active/inactive), join date, end of membership, image, edit, delete.
- **Add/Edit member dialogs:** first/last name, phone, email, birthday, address, join date, end of membership, gender radio (male/female), image upload to S3. Every field has a `mat-form-field` with a prefix icon and hints.
- **Data:** `id, firstName, lastName, phone, birthDay, email, address, isActive, joinDate, endOfMembershipDate, gender (1 = male, 2 = female), imageURL, gymId`.

> ✅ **Decision (Phase 2):** a **table with a detail side panel**. Mockups: `P2-Members-Detail.dc.html`, `P2-Member-Form.dc.html`, `P2-Members-Hebrew.dc.html`.
> - **Status** is derived on the frontend from the existing fields:
>   - **Inactive:** `isActive = false`.
>   - **Expired:** active, and `endOfMembershipDate` is before today.
>   - **Expiring:** active, and the membership ends within the next 7 days.
>   - **Active:** everything else.
>   - Pill colours: success / warning / danger-soft (`#FBE4DF` with `#A6321D`) / neutral.
> - **Toolbar:** a segmented filter with counts (All · Active · Expiring · Expired · Inactive), search across name, phone and email, a gender filter, and **Export** (CSV of the current filtered list, built on the client).
> - **Table columns:**
>   - Member: avatar, name, and email underneath.
>   - Phone.
>   - Status pill.
>   - Membership ends: the date, plus a note like "In 3 days" (amber) or "2 months ago" (red).
>   - Joined.
>   - Actions: edit, plus a more-menu with Delete.
>   - Expiring rows get a faint amber background (`#FFF8EB`).
>   - Default sort: membership ending soonest first.
> - **Clicking a row opens the detail panel** (420px) and narrows the table to Member · Status · Membership ends. The panel shows:
>   - Header: avatar, name and status.
>   - Buttons: **Renew membership** (primary), **Edit**, and a more-menu (Deactivate, Delete).
>   - Tabs: **Overview** (a membership card with a progress bar and **quick renew** chips for +1, +3 and +12 months, then contact details and upcoming classes), **Classes**, and **Purchases**.
> - **Renew** updates `endOfMembershipDate` (and sets `isActive = true`) through the **existing** update endpoint. It extends from the later of today and the current end date. Then a toast appears with **Undo**.
> - The panel can be deep-linked as `/members?member=<id>`. The dashboard's Renew buttons and the ⌘K member results open it.

### 5.3 Trainers `/trainers`
- **Today:** the same layout as Members (`TrainersTableComponent`). Columns: name, phone, birthday, address, email, status, join date, certification date, image, edit, delete.
- **Add/Edit trainer dialogs:** the same fields as a member, plus certification date.
- **Data:** `id, firstName, lastName, phone, birthDay, email, address, isActive, joinDate, certificationDate, imageURL, gymId`, and the trainer has many group trainings.

> ✅ **Decision (Phase 2):** a **card grid** (there are few trainers) with the same detail panel and side-panel forms as Members.
> - **Card:** photo or initials avatar (56px), name, phone, status pill (Active / Inactive), "Certified {certificationDate}", and "{N} classes this week · next: {description} {day time}". The card opens the detail panel.
> - **Detail panel:** Overview (contact details, join and certification dates) and Classes (upcoming and past group trainings they lead).
> - **Add/Edit trainer** uses the same side-panel form as a member, plus **certification date** and minus the membership section.

> ✅ **Done in Phase 2 (§5.2, §5.3).** What was decided while building it:
> - **The update endpoints find members and trainers by email**, not by id. The email therefore can't be changed from an edit form; the form says so instead of failing silently. Changing this needs a backend change (out of scope so far).
> - **Trainers have no `gender` column**, but the legacy trainer forms require gender (it picks the placeholder photo). The rule stays; editing prefills it from the placeholder photo when there is one.
> - **Placeholder photos** (`AppConsts.*_DEFULT_IMAGE`) count as "no photo": initials are shown. New records still save the placeholder, as before.
> - **"Ends soonest first"** sorts running memberships by end date, then expired ones, then inactive members.
> - **Renew membership** opens a menu with +1 / +3 / +12 months (the same as the quick-renew chips). An inactive member gets **Activate** instead of Deactivate.
> - **Member activity** comes from `GET /api/members/:id/activity` (read-only, gym from the JWT): upcoming and the last 10 past classes, and up to 50 purchases with the total count and total spent. Bill phones are compared with spaces and dashes removed.
> - **Trainer cards** count "classes this week" from Sunday to Saturday.
> - **CSV export** is UTF-8 with a BOM (Excel shows Hebrew), headers in the UI language, dates as `YYYY-MM-DD`.
> - Deep links: `/members?member=<id>` and `/trainers?trainer=<id>`.

### 5.4 Group trainings `/group-trainings`
- **Today:** a `mat-card` with a search box and a `mat-table`. Columns: training (trainer), start time, description, edit, delete.
- **Add/Edit dialog:** trainer (multiselect dropdown), members (multiselect), start date/time, description.
- **Show single training dialog:** the class details plus a table of participating members.
- **Data:** `id, startTime, description, trainerId, gymId`, with members joined through `MemberParticipate`. There's **no end time, capacity, class type or room field**.

> ✅ **Decision (Phase 3): a week strip with a day list.** Mockups: `P3-Classes.dc.html`, `P3-Class-Form.dc.html`, `P3-Classes-Hebrew.dc.html`. No new fields: classes keep only a start time, a description, a trainer and members.
> - **Header:** "Classes", subtitle "N classes this week", primary action **New class**.
> - **Week strip:** seven day pills (Sunday to Saturday) with the day name, the date and the number of classes; previous/next week buttons (chevrons mirror in RTL) and **Today**. The selected day is in the URL (`?day=YYYY-MM-DD`).
> - **Day list:** one row per class, by start time: time, class name (the description before a colon) with the rest as a caption, trainer (avatar and name) and member count. Past classes are dimmed to 55% and the next class gets an accent-soft background and an "Up next" tag, the same rules as the dashboard's Today card.
> - **Filters:** trainer (menu) and search by class name.
> - **Detail panel (420px):** date and time, description, trainer (opens the trainer panel), participants (avatar, name, opens the member panel), **Edit**, and a more-menu with **Delete** (confirm).
> - **Add/Edit side panel:** date, time (24h), trainer (active trainers), members (searchable multi-select with chips) and description. The validation rules of the legacy add/edit class dialogs stay the same.
> - Deep link `/group-trainings?class=<id>`. The dashboard's Today rows and the ⌘K "New class" action open the new panels.

### 5.5 Machines `/machines`
- **Today:** a `mat-card` with a search box, a "+" FAB and a virtual-scroll `mat-list`. Each item has a **250×250 image** on the left, then name, serial number, description, production year, price (₪), and buttons: *Notifications*, *Edit* and *Delete*.
- **Add/Edit dialogs:** name, serial number, description, production year, price and image, laid out in a `mat-grid-list`.
- **Machine notifications dialog:** a list of maintenance alerts for one machine (job type and time) with *Done* buttons and a "clear all" button.
- **Data:** `id, name, description, serialNumber, productionYear, imgUrl, price, gymId`.

> ✅ **Decision (Phase 3): a card grid, linked to Maintenance.** Mockup: `P3-Machines.dc.html`.
> - **Card:** photo (or an icon tile), name, serial number (always LTR), production year, price (₪) and a **status badge** from the machine's maintenance jobs: *Due today* or *Overdue* (danger), *Next: {date}* (neutral), or *No jobs* (neutral). Machines with open alerts show the alert count.
> - **Toolbar:** search by name or serial number, and a segmented filter **All · Needs attention · OK**.
> - **Detail panel:** photo, serial number, year, price, description; a **Maintenance** section with the machine's jobs (type, every N days, next run) linking to Maintenance; and the machine's **open alerts** with **Done** and **Clear all** (this replaces the machine-notifications dialog, same endpoints).
> - **Add/Edit side panel:** name, serial number (LTR), description, production year, price (LTR) and photo. Validation rules unchanged.
> - Deep link `/machines?machine=<id>`.

### 5.6 Scheduler (machine maintenance) `/scheduler`
- **Today:** a virtual-scroll `mat-list` of scheduled jobs. Each shows the job type (**Clean** or **Service**), active/inactive, start date, end date and "every N days", with buttons for *Machine details*, *Edit* and *Delete*.
- **Add/Edit dialog:** machine (multiselect), job type (select), start and end date/time (Owl + Material pickers), frequency in days, active toggle.
- When a job fires, the backend creates a notification and pushes it over socket.io. That drives the bell badge in the top bar.
- **Data:** `id, startTime, endTime, isActive, daysFrequency, jobID (1 = clean, 2 = service), machineSerialNumber, gymId`.

> ✅ **Decision (Phase 3): its own page, linked to Machines.** Mockup: `P3-Maintenance.dc.html`.
> - **List of jobs grouped by when they are next due:** *Overdue*, *Today*, *This week*, *Later*, then *Inactive*. Each row: job type pill (Clean / Service), machine name and serial number, "every N days", the next run (date and time), and the open-alert state.
> - Rows with an open alert have **Mark done**, which clears that machine's alerts (existing endpoint).
> - **Actions:** Edit, and a more-menu with Deactivate/Activate and Delete (confirm).
> - **Add/Edit side panel:** machine (by name and serial number), job type (segmented Clean / Service), start date and time, end date and time, every N days, and an Active switch. Validation rules unchanged.
> - **One status, everywhere:** the "due today / overdue" rules of §5.1 decide the badge on Machines, the groups here and the sidebar badge. ✅ **Approved:** one new read-only `GET /api/maintenance/status` (gym from the JWT) that reuses the dashboard's logic (`job-occurrence.ts`) and returns, per job, the next run and whether it is due today or overdue, and per machine the open-alert count.

### 5.7 Products `/products`
- **Today:** `mat-tab-group` with two tabs.
  - **Products tab:** a search box, a "+" FAB and a virtual-scroll list. Each item has a 250×250 image, then name, category, description, code, quantity and price, with buttons for *Sell*, *Edit* and *Delete*.
  - **Bills tab:** a list of sales showing product, customer name, customer ID, phone, quantity, total and date.
- **Add/Edit product dialog:** name, description, code, quantity, price, category (select) and image.
- **Sell product dialog:** customer ID, name, phone and quantity. This creates a bill and lowers the stock.
- **Categories** are hard-coded in the frontend: 1 protein, 2 BCAA, 3 Glutamine, 4 Creatine, 5 Clothes.
- **Data:** Product `id, name, description, code, quantity, price, imgUrl, categoryID, gymId`. Bill `id, coustomerID, coustomerName, coustomerPhone, productID, productName, quantity, totalCost, gymId, createdAt`. (`coustomer` is misspelled in the DB.)

> ✅ **Decision (Phase 4).** Mockups: `P4-Products.dc.html`, `P4-Sell.dc.html`, `P4-Sales.dc.html`.
> - **Two tabs on one page:** **Products** (card grid, §7.4 "cards for small visual sets") and **Sales** (the bills, as a `DataTable`). The tab is in the URL (`?tab=sales`).
> - **Product card:** photo (or an icon tile), name, category pill, price (₪), code (LTR), and stock: "N in stock" (neutral), "N left" (warning at ≤ 5, the dashboard's low-stock rule), "Out of stock" (danger at 0). A **Sell** button on the card.
> - **Toolbar:** search by name or code, a category filter (the five hard-coded categories), and a segmented **All · Low stock · Out of stock**.
> - **Product detail panel:** photo, description, price, code, stock, the product's recent sales (from the bills already loaded), **Sell**, **Edit**, and a more-menu with **Delete** (confirm).
> - **Sell = a quick side panel (POS-like):** quantity stepper (max = stock), customer name, phone (LTR) and Israeli ID, and the total (`price × quantity`) shown live. An optional **member search** prefills name and phone from a member; the ID is still typed (members have no ID field). Validation stays exactly as the legacy sell dialog (quantity > 0 and a whole number, name letters only, Israeli mobile, Israeli ID checksum); the backend already refuses more than the stock.
> - **Sales tab:** columns date, product, customer (name and phone), quantity, total; default newest first; a date-range filter (This month / Last month / This year / All) with the **total revenue and item count of the filtered rows** above the table; CSV export like Members. Search by customer name, phone or product.
> - **Add/Edit product side panel:** photo, name, category (select), description, code (LTR), price (LTR), quantity. Rules unchanged.
> - Deep links `/products?product=<id>`, `/products?tab=sales`. The dashboard's Low stock rows and ⌘K "Sell product" / "Add product" open the new panels.
> - ✅ **Deleting a sale restores the stock:** a small backend change (same request and response) adds the sale's quantity back to the product; the confirm says "N will go back into stock". Today the stock is not restored.

### 5.8 Catalogs `/catalog`
- **Today:** a `mat-card` with a `mat-table`. Columns: link, duration (days), creation time, send on WhatsApp, edit, delete.
- **Add/Edit catalog dialog:** products (multiselect) and duration in days. This creates a **temporary public URL**.
- **Send catalog dialog:** pick member phones (chips) and send the link over WhatsApp. This **doesn't work in Docker** because `wbm` needs Chromium and a QR login.
- The **public catalog page** that members open is **server-rendered HTML** in `backend/services/easyfit-catalog-template.ts` and `backend/templates/` (not Angular). Include it in the redesign if you want.

> ✅ **Decision (Phase 4).** Mockups: `P4-Catalogs.dc.html`, `P4-Public-Catalog.dc.html`. Catalog rows have three lines (products and status · product names · validity and actions) so they fit next to the Share panel.
> - **A table** (few columns, few rows): products (avatar stack of product photos + "N products"), link (shortened, LTR) with **Copy link**, valid for N days, created, **status** (Active / Expired: `creationTime + durationDays` before now), actions (Share, Edit, more-menu with Delete).
> - **Create/Edit side panel:** products as chips (the Phase 3 `MultiSelect`), "valid for" days (1–100, as today). After creating, the panel shows the link with **Copy**.
> - ✅ **Share on WhatsApp replaces `wbm` sending** (which doesn't work in Docker: it needs Chromium and a QR login): a searchable list of members with phones, each row a `https://wa.me/972…?text=…` link that opens WhatsApp with the message and link filled in; plus **Copy link** and **Copy message**. No backend change; the old send endpoint stays but is unused.
> - ✅ **The public catalog page is restyled** (server-rendered `easyfit-catalog-template.ts`) in the Studio look: light, Plus Jakarta Sans/Rubik, product cards, Hebrew RTL when the browser is Hebrew. The last step of Phase 4; same URL and data, template only.

### 5.9 Profile `/profile`
- **Today:** a `mat-card` with first and last name, "member since", email and phone, plus an *Edit* button. It opens the **Edit profile dialog** (name, email (read-only), phone, birthday, address, image; there is no password field), and Phase 2 added the language switch.

> ✅ **Decision (Phase 4).** Mockup: `P4-Profile.dc.html`.
> - **A settings-style page** with three cards: **Profile** (avatar, name, role, email, phone LTR, birthday, address, member since; **Edit** opens the side panel), **Gym** (name, phone, address, read-only; the admin edits gyms), **Preferences** (language English / עברית, the existing switch).
> - **Edit profile side panel:** photo, first/last name, phone, birthday, address; email shown read-only with the note that it is the sign-in name. Rules unchanged (`validateName`, `validateIsraeliPhoneNumber`, `validateBirthDay`).
> - ✅ **No password change in Phase 4.** A gym user can't change their password today; it needs a new endpoint that checks the current password. Noted for later.

### 5.10 Notifications (top-bar bell)
- The redesigned bell badge shows the unread count, which updates live over socket.io.
- Clicking it opens the old **`NotificationsDropdownComponent`** as a Material dialog: cards grouped by machine, showing machine name, count and time, each with a *View* button.

> ✅ **Decision (Phase 3): a dropdown panel under the bell.** Mockup: `P3-Notifications.dc.html`.
> - About 380px wide, radius 20, overlay shadow, anchored to the bell at the inline end; a full-width sheet below `md`.
> - Grouped by machine: machine name, number of alerts and the latest time. **View** opens the machine's detail panel; **Done** clears that machine's alerts; **Clear all** (with confirm) clears every alert of the gym. All through the existing endpoints.
> - Empty state: "You're all caught up". The unread count and the socket.io live updates stay as they are.

### 5.11 Admin: Gyms `/admin`, Users `/users`
- **Today:** the old `mat-sidenav` shell. **Gyms** is a `mat-table` (name, phone, address, edit, delete) with add/edit gym dialogs. **Users** is a `mat-table` (first name, last name, email, phone, birthday, address, gym name, edit, delete) with add/edit user dialogs (all user fields plus a gym multiselect).

> ✅ **Decision (Phase 4).** Mockup: `P4-Admin-Users.dc.html` (Gyms uses the same table pattern). In the admin area ⌘K offers only pages and actions (no members to search).
> - **The same Studio shell with an admin nav** (answers the ✏️ in §4): the floating sidebar with *Gyms* and *Users*, no gym card, no ⌘K member search (the palette keeps Pages and Actions), no bell. `app-admin-nav` is deleted.
> - **Gyms:** a `DataTable` (name, phone LTR, address, users count), add/edit side panel (name, phone, address; rules unchanged), delete with confirm.
> - **Users:** a `DataTable` (avatar and name, email LTR, phone LTR, gym, role), add/edit side panel (name, email, password + confirm on add, phone, birthday, address, gym select, photo; rules unchanged, including `validatePassword`), delete with confirm.
> - **Admin role guard** on `/admin` and `/users` (frontend `AdminGuard`, roleId 2); a gym user who opens them is sent to `/home`. The backend already checks `verifyAdmin` on most admin endpoints.
> - Admin pages are translated like the rest (English/Hebrew).

### 5.12 Missing pages
- A **404 page** (a TODO in the routes).
- **Register**: `RegisterPageComponent` exists but isn't routed.

> ✅ **Decision (Phase 4).** Mockup: `P4-404.dc.html`.
> - **404:** a Studio page for unknown URLs (`**` route): "Page not found", a short line and a button back to the dashboard (or to login when signed out). Inside the shell when signed in.
> - **Register:** `RegisterPageComponent` is unrouted and admins create users; *recommendation:* delete it.
> - Landing page, forgot password: out of scope for Phase 4 (✏️ say if you want either).

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
- The UI is English left-to-right only. ✅ Hebrew with RTL was added in Phase 2 (§7.8).
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

### 7.4 Components and patterns ✅
- **Create/edit = side panel.** It slides in from the inline-end side (right in English, left in Hebrew).
  - 480px wide, radius 24, inset 16px, with a backdrop `rgba(27,28,32,.38)`.
  - Header: title, a "Fields marked * are required" note, and a close button.
  - The body scrolls, and is split into sections with uppercase labels.
  - A sticky footer holds **Cancel** (secondary) and the primary action ("Add member" / "Save changes").
  - Focus is trapped inside, Esc closes it, and if there are unsaved changes it asks "Discard changes?".
  - On phones it's full-screen.
  - Mockup: `P2-Member-Form.dc.html`.
- **Detail views = side panel without a backdrop** (420px). The list stays usable next to it, and selecting another row swaps the panel's content.
- **Lists:** a **table** for large lists (members, sales, later machines and jobs) and **cards** for small visual sets (trainers, later products).
  - Tables come from one shared `DataTable` pattern: header row, 62px rows, row hover, the selected row in `accent-soft`, client-side sort and pagination, skeleton rows while loading, an empty state and an error state.
  - **Below `md`, table rows stack into cards.**
- **Forms:**
  - Pill-shaped inputs (46px) with the label above.
  - Help text below in `ink-3`. The error replaces the help text, in `danger` with a red ring, and appears on blur or submit.
  - Required fields are marked with a red `*`.
  - Two-column grid on ≥ md, one column on phones.
  - Phone and email inputs are always `dir="ltr"`.
  - Validation **rules stay exactly as in `FormInputComponent`**; only the look and the (translated) messages change.
- **One date picker:** the **Angular Material datepicker**, restyled to Studio (a pill input with a calendar icon at the end, and a Studio-styled popup), locale-aware (Hebrew month and day names in Hebrew). `ng-pick-datetime` and `@angular-material-components/datetime-picker` are not used in redesigned pages. They're removed in the clean-up phase, once no page uses them.
- **Toasts:**
  - A dark (`ink`) pill, **bottom-centre**, 4 seconds.
  - A green check icon for success and a red icon for errors (errors stay until dismissed).
  - An optional action button such as **Undo**, and `aria-live="polite"`.
  - They replace the Material snackbar on redesigned pages.
- **Confirm dialog:**
  - A small centred Studio modal (400px, radius 24).
  - Title, one sentence, then Cancel and a destructive button in `danger`.
  - Used for delete and deactivate.

### 7.5 Page priorities ✅
1. **Phase 2:** shared patterns (§7.4) + **Hebrew/RTL** + **Members** + **Trainers**
2. **Phase 3:** Classes (group trainings), Machines, Maintenance (scheduler), notifications panel
3. **Phase 4:** Products and Sales, Catalogs, Profile and settings, Admin (Gyms, Users, the same shell with admin nav), 404
4. **Phase 5:** clean-up. Remove Bootstrap, jQuery, Angular Material components and the extra date pickers; turn preflight back on; drop `important`. Then decide on the Angular upgrade.
5. **Phase 6:** the AI backend (§7.6)

### 7.6 New features or fields
**AI assistant ("EasyFit AI").** The UI is in §7.3. The backend has two separate capabilities, and they need different architectures:
1. **Questions about the gym's own data** (members, expirations, classes, sales, maintenance). Use **LLM tool calling** against a set of **read-only, typed API functions** (e.g. `findMembers(filter)`, `getExpiringMemberships(days)`, `getSales(range)`, `getMachineJobs(status)`). Every function is **scoped to the user's `gymId` on the server**. The model never writes raw SQL and never sees another gym's data. This part is *not* RAG.
2. **Questions about documents** (gym rules, price lists, policies, trainer notes). This is **RAG**: upload PDF/DOCX → split into chunks → embed → store in **Postgres with `pgvector`** (it runs on the existing Postgres 16, so no new database) → retrieve the top chunks → answer with **citations** (file name + page) shown as source chips.
- **Actions** proposed by the AI (send a reminder, renew a membership, mark a job done) go through the existing endpoints and **always need an explicit confirm click**.
- Stream answers to the panel (SSE or the existing socket.io).
- The API key and model choice come from `.env`. Log prompts for debugging with no personal data in the logs.
- ✏️ Which LLM provider? Which languages should the AI answer in (Hebrew)? Is the AI in scope for this redesign, or only its UI shell with a "coming soon" state?

**Dashboard aggregates** (for §5.1): an endpoint returning active members, new this month, expiring in 7/3 days, today's classes (from `startTime`), month revenue and % change (from bills), low-stock products (qty ≤ 5), and the next maintenance jobs.

**Member activity** (for §5.2, Phase 2): a read-only `GET /api/members/:id/activity` returning the member's group trainings and their purchases matched by phone. See §7.10.

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
- **Screens ✅:** desktop (≥ 1280px) is the main target. Tablet (768–1279px) is fully supported, for the reception desk. Phone (< 768px) is **usable**: the sidebar becomes a drawer, table rows stack into cards, and side panels are full-screen. It isn't specially polished.
- **Accessibility: WCAG 2.1 AA.**
  - Text contrast at least 4.5:1.
  - A visible focus ring on everything (2px accent + 2px offset).
  - Everything works by keyboard: sidebar, palette, AI panel and dialogs, which trap focus and close on Esc.
  - Real `<button>`/`<a>` elements, `aria-label` on icon-only buttons, `aria-current` on the active nav item.
  - Touch targets ≥ 44px. Respect `prefers-reduced-motion`.
- **Language ✅: English and Hebrew, switchable, with a full right-to-left layout in Hebrew** (built in Phase 2). Mockup: `P2-Members-Hebrew.dc.html`.
  - **Switching:** an "English / עברית" choice in the user menu at the bottom of the sidebar and on the profile page. Remembered in `localStorage`. The default is English. It sets `<html lang dir>` immediately, with no reload.
  - **RTL means mirrored:** the sidebar is on the right, side panels open from the left, text aligns to the start, and the order of table columns is reversed. **Directional icons** (chevrons, arrows, the "next page" control) are flipped. **Non-directional icons** (search, bell, plus, user, check, calendar) are not.
  - **Always left-to-right, even in Hebrew:** phone numbers, emails, URLs, serial numbers, codes, prices typed into inputs, and keyboard hints like `Ctrl K`. Wrap them in `<bdi dir="ltr">`, or use `dir="ltr"` on inputs.
  - **Fonts:** Plus Jakarta Sans has no Hebrew letters, so the font stack is `'Plus Jakarta Sans', 'Rubik', sans-serif` (Rubik from Google Fonts, weights 400–800). In Hebrew, don't use negative letter-spacing on headings.
  - **Translations:** every UI string in redesigned pages comes from translation files (`en.json` / `he.json`), never hard-coded. This includes validation messages, toasts, empty states, aria-labels and the AI "coming soon" text. Data typed by users (names, addresses, product names) is never translated. The owner will review the Hebrew wording.
  - **Dates in Hebrew** use Hebrew month names (`14 במרץ 2027`), still with the Gregorian calendar. Numbers use Western digits. Currency is `₪48,250` in both languages.
  - **Legacy pages** (not yet redesigned) stay English and left-to-right inside a `dir="ltr"` wrapper until their phase migrates them.
- **Formats:** dates like `14 Mar 2027` (`d MMM y`, locale-aware), times as 24h `17:30`, money as `₪48,250`.

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

#### Notes for later phases

**Tailwind runs with `important: true` and only scans Studio files** (decided in Phase 1, see `frontend/tailwind.config.js`).

- **Why:** two legacy stylesheets beat plain Tailwind utilities.
  - **Bootstrap 4** ships `!important` helpers with the same names as Tailwind utilities but different values. `p-5` is 3rem instead of 1.25rem, the 3/4/5 spacing steps differ, and `bg-white`, `bg-transparent`, `text-warning`, `text-danger`, `text-success`, `border`, `border-0` and `rounded-lg` all clash. As a result, cards got 48px padding, status colours turned Bootstrap yellow and green, and `bg-opacity-*` stopped working.
  - **`body.mat-typography`** (Angular Material) styles `h1`, `h2` and `p` at specificity 0,1,1, which beats a single utility class. Headings rendered as 24px Roboto 400.
- **What was done:**
  1. `important: true`, so every utility is `!important` and wins over both.
  2. The JIT `purge` list contains **only Studio folders** (`shared/ui`, `components/nav`, `components/shell`, `components/home`, `components/login`). This way Tailwind never generates `!important` versions of Bootstrap helper names that only legacy templates use, and legacy pages keep Bootstrap's values.
  3. The `.studio` base layer in `src/styles.css` uses `body .studio :where(…)` selectors. They beat Bootstrap's reboot and `.mat-typography`, lose to utilities, and include a scoped border reset so that `border-t` styles one side only.
- **Rules for every later phase:**
  - **Add each newly redesigned page's folder to the `purge` list** in `tailwind.config.js`. Utilities used in a file outside the list are not generated, and that page silently renders unstyled.
  - Put the `studio` class on the redesigned page's root element so it gets the base layer.
  - When a legacy page is migrated, remove the Bootstrap helper classes from its template in the same change, so `!important` Tailwind and Bootstrap helpers never meet on one element.
  - Once Bootstrap and Material are removed (§2 ✏️), turn preflight back on, drop `important: true` and the `.studio` layer, and scan `./src/**/*.{html,ts}` again.

---

**Phase 2: patterns, Hebrew/RTL, Members, Trainers**
Branch `redesign/phase-2` (from master, after Phase 1 is merged). Mockups: `P2-Members-Detail.dc.html`, `P2-Member-Form.dc.html`, `P2-Members-Hebrew.dc.html`. Decisions: §5.2, §5.3, §7.4, §7.8.

1. **Language and RTL foundation** (do this first; everything after it is built bilingual from the start):
   - Add **`@ngx-translate/core` v13 + `@ngx-translate/http-loader` v6** (the versions for Angular 11), with `assets/i18n/en.json` and `he.json`. Keys are grouped by area: `shell.*`, `dashboard.*`, `members.*`, `common.*`, `validation.*`.
   - A typed **`LanguageService`**:
     - holds the current language, and remembers it in `localStorage`
     - sets `document.documentElement.lang` and `dir`
     - exposes the language as an observable
     - registers Angular locale data for `he`
   - Pipes and adapters that follow the current language at runtime (the built-in `date` pipe only uses the fixed `LOCALE_ID`): a `localDate` pipe (wraps `formatDate`), and a Material `DateAdapter` locale for the date picker.
   - **Logical-direction utilities for Tailwind 2** (it has no `ms-`/`ps-`/`start-` utilities):
     - Add a small typed plugin in `tailwind.config.js` that generates `ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`, `text-end`, `border-s`, `border-e`, `rounded-s-*`, `rounded-e-*` from the spacing and radius scales, using CSS logical properties.
     - Studio code must use **only** these for horizontal direction: no `ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`, `text-left`, `text-right`, `border-l`, `border-r` or `rounded-l`/`r` in Studio templates.
     - Add a `flip-rtl` class (`[dir=rtl] .flip-rtl { transform: scaleX(-1) }`) and use it on directional icons.
   - Load **Rubik** (400–800) next to Plus Jakarta Sans, and update the font stack. Remove the negative heading letter-spacing in Hebrew.
   - The **language switch** goes in the sidebar user menu (English / עברית).
   - Wrap legacy pages in `dir="ltr"` so they don't break.
   - **Translate and mirror everything from Phase 1:** shell, sidebar, ⌘K palette, AI panel, dashboard and login. The sidebar sits on the inline-start side, the AI panel on the inline-end side, and the palette's results and hints are translated.
2. **Overlay kit** (`shared/ui`, using `@angular/cdk` overlay and a11y, which already come with Material and are kept after the clean-up):
   - `SidePanelService` / `<app-side-panel>`: a form variant (480px, backdrop, unsaved-changes guard) and a detail variant (420px, no backdrop). It opens from the inline-end side, is full-screen below `md`, traps focus, closes on Esc, and returns focus to the trigger when it closes.
   - `ConfirmDialogService` (Studio confirm, §7.4).
   - `ToastService` + `<app-toast-host>`: bottom-centre, success and error, an optional action such as Undo, `aria-live`. It replaces the snackbar on redesigned pages only.
3. **Form kit** (`shared/ui/form`):
   - `TextField`, `TextArea`, `Select`, `DateField` (the Material datepicker, restyled; no other date picker), `SegmentedField` (for gender), `ImageUpload` (the existing S3 upload flow), `FormSection`, plus a shared field-error component.
   - It works with the **existing validators** from `FormInputComponent` without changing their rules. Messages come from `validation.*` keys in both languages.
   - Errors show on blur or submit. On submit, focus moves to the first invalid field.
4. **DataTable pattern** (`shared/ui/data-table`):
   - Column definitions (typed), client-side sort, pagination (10 / 25 / 50), row click, selected row, skeleton rows, empty and error states, and a stacked-card layout below `md`.
   - The header and the pager are translated, and the chevrons mirror in RTL.
5. **Members page** (§5.2): rebuild `/members` as a Studio page following the mockups.
   - Status derivation, the segmented filter with counts, search, the gender filter, CSV export, and the "ends soonest" default sort.
   - **Detail panel** with Overview / Classes / Purchases tabs, Renew (quick +1 / +3 / +12 months, with a toast and Undo), Edit, Deactivate and Delete (with confirm). Deep link `?member=<id>`.
   - **Add/Edit side panel:** photo, personal details, gender, address, membership dates, and length chips (1 / 3 / 6 / 12 months) that set the end date from the join date.
   - **One new read-only endpoint:** `GET /api/members/:id/activity`, scoped by `gymId` on the server. It returns:
     - the member's group trainings (upcoming and the last 10 past), from `MemberParticipate`
     - their purchases: bills whose `coustomerPhone` matches the member's phone after removing spaces and dashes. Bills don't reference members, so phone matching is the only link. The tab says "Matched by phone number".
   - Wire up the dashboard's "Renew" buttons, the ⌘K member results and the "Add member" action to the new panels.
6. **Trainers page** (§5.3): the card grid, the detail panel (Overview, Classes) and the add/edit side panel with certification date. ⌘K "Add trainer" opens the new panel.
7. **Tidy-up:**
   - Add the new folders to the Tailwind `purge` list (see the notes above) and put `studio` on each page root.
   - Remove Bootstrap and Material classes from the migrated templates.
   - Delete the replaced old components (`members-table`, `add-member`, `update-member`, `trainers-table`, `add-trainer`, `update-trainer` and their dialogs) once nothing references them.
   - Fix copy typos you come across.

**Do not in Phase 2:**
- Remove the Bootstrap, jQuery, Angular Material or date-picker libraries from the project.
- Upgrade Angular.
- Redesign or translate any other page (Classes, Machines, Maintenance, Products, Catalogs, Profile, Admin). The only exception is the language switch on Profile, which may be a small Studio section.
- Change the DB schema or any existing endpoint's request or response.
- Change validation rules.
- Build any AI backend.

**Phase 2 is done when:**
- `ng build --prod` passes with no new warnings and no `any`. The backend type-checks.
- Members and trainers can be created, viewed, edited, renewed (members), deactivated and deleted against the **real backend**, in **both languages**. Validation errors show in the right language.
- In Hebrew, every Studio page (login, shell, dashboard, members, trainers, palette, AI panel, side panels, toasts, confirm dialogs) is fully mirrored and translated. Phone numbers and emails still read left to right. Legacy pages still work, in English.
- These checks pass:
  - a script confirms `en.json` and `he.json` have exactly the same keys
  - a grep finds no physical-direction utilities (`ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`, `text-left`, `text-right`, `border-l`, `border-r`) in Studio folders
- Screenshots at 1440, 1024 and 390px, in English and Hebrew, broadly match the mockups. At 390px, rows stack and panels are full-screen.
- Keyboard: side panels and dialogs trap focus, close on Esc and return focus. Every icon button has a translated `aria-label`.
- **Report:** the Hebrew strings you wrote, in a list, for the owner to review.

#### Notes from Phase 2 for later phases
- **Every UI string goes through the translation files** (`assets/i18n/en.json` and `he.json`, grouped by area). Counted strings have `one` / `two` / `other` forms and use the `plural` pipe or `LanguageService.tCount`. Dates use the `localDate` pipe or `LanguageService.date`, never the built-in `date` pipe.
- **Direction:** only logical utilities (`ms-`, `pe-`, `start-`, `text-start`, `border-s`, `rounded-e`…); `rtl:` for transforms; `flip-rtl` on directional icons; `<bdi dir="ltr">` or `[ltr]="true"` for phones, emails, serial numbers and prices.
- **Studio routes** set `data: { studio: true }` in `app.module.ts`; routes without it are wrapped in `dir="ltr" lang="en"`.
- **Run `npm run check:studio`** before every commit: it fails on missing translation keys and on physical-direction utilities in Studio folders.
- **Building blocks:** `SidePanelService` + `<app-panel-layout>` for forms, `<app-side-panel>` for details, `ConfirmDialogService`, `ToastService`, `MenuService` for small menus, `<app-data-table>`, the form kit in `shared/ui/form`. Menus anchor to `event.currentTarget` (a template ref on an `appButton` is the component, not the element).

---

**Phase 3: Classes, Machines, Maintenance, notifications panel** (✅ approved with the P3 mockups)
Branch `redesign/phase-3` (from master, after Phase 2 is merged). Mockups: the `P3-*.dc.html` files. Decisions: §5.4, §5.5, §5.6, §5.10.

1. **Kit additions** (`shared/ui`): a `TimeField` (24h, typed or picked), a searchable `MultiSelect` with chips (members of a class), a `Switch`, a shared `Tabs` component (extracted from the detail panels), and a `WeekStrip`.
2. **Notifications panel** (§5.10) replacing `NotificationsDropdownComponent`.
3. **Classes** (§5.4): week strip, day list, detail panel, add/edit side panel; deep link `?class=<id>`.
4. **Machines** (§5.5): card grid with status badges, detail panel with jobs and open alerts, add/edit side panel; deep link `?machine=<id>`.
5. **Maintenance** (§5.6): grouped job list, Mark done, add/edit side panel, and the read-only `GET /api/maintenance/status` (approved). Build the endpoint first in this step; Machines (step 4) can start from the existing data and switch to it.
6. **Wiring and tidy-up:** ⌘K "New class" and "Schedule maintenance" and the dashboard's Today and Maintenance cards open the new panels. Add the new folders to the `purge` list and `data: { studio: true }` to the routes. Delete the replaced components (`display-trainings`, `add-group-training`, `edit-group-training`, `show-single-training`, `machines`, `machines-table`, `create-machine`, `edit-machine`, `machine-notifications`, `scheduler-page`, `add-scheduled-job-page`, `update-scheduled-job`, `machine-details`, `notifications-dropdown`) once nothing references them.

**Do not in Phase 3:**
- Change the DB schema (no class duration, capacity or type) or any existing endpoint's request or response. The only new endpoint is the read-only maintenance status one.
- Remove the Bootstrap, jQuery, Angular Material, `ng-multiselect-dropdown` or date-picker libraries (Phase 5); they just stop being used on these pages.
- Redesign Products, Catalogs, Profile or Admin.
- Change validation rules.

**Phase 3 is done when:**
- `ng build --prod` passes with no new warnings and no `any`; the backend type-checks.
- Classes, machines and maintenance jobs can be created, viewed, edited and deleted (jobs also deactivated and marked done) against the real backend, in both languages.
- The bell panel shows live alerts, View, Done and Clear all work, and the sidebar badge agrees with Machines and Maintenance.
- `npm run check:studio` passes; screenshots at 1440, 1024 and 390px in English and Hebrew broadly match the P3 mockups.
- Keyboard: panels and dialogs trap focus, close on Esc and return focus; every icon button has a translated `aria-label`.
- **Report:** the new Hebrew strings, for the owner to review.

#### Done in Phase 3 (decisions made while building it)
- **Backend fix in `PUT /api/group-training`** (approved by the owner; same request and response): the class was looked up by id + trainerId and the "trainer busy" check matched the class itself, so changing the trainer, or editing without moving the time by an hour, always failed.
- **Trainer clash rule** shown on the class form's time field before saving is the backend's: a trainer can't start a class less than an hour after another of theirs started. Class times now take any minute (24h field); the legacy dialog only offered whole hours.
- **`GET /api/maintenance/status?tzOffset=`** returns `due` (= the dashboard's `maintenanceDue`), per job `nextRun`, `dueToday`, `overdue`, `openAlerts`, `oldestOpenAlertAt`, and per machine `openAlerts`. The rule lives in `backend/common/maintenance-due.ts`, shared with the dashboard. The sidebar badge reads this endpoint.
- **Maintenance groups:** This week = from tomorrow to the end of Saturday (Sunday–Saturday weeks, like Classes); Later after that; Inactive = paused, or active with no run left.
- **Bell panel** groups the alerts of `GET /api/notifications` on the client (the grouped endpoint has no times). An alert from today reads "due", an older one "overdue". One store (`MaintenanceAlertsService`) feeds the bell, the panel and the machine panel.
- **Done on a single alert** (machine panel) uses `PUT /api/notification` with `seen = true`, as the legacy dialog did; Done on a machine and Mark done use `DELETE /api/machine-notifications`.
- **Machine serial numbers stay editable** (legacy rule), but jobs and alerts reference the serial, so changing it orphans them; the edit form warns when the machine has jobs or alerts. A real fix needs a backend change (cascade or lock).
- **Machine name rule** (legacy `validateMachineName`) still requires an English first letter; Hebrew machine names are refused.
- Deep links: `/group-trainings?day=YYYY-MM-DD&class=<id>`, `/machines?machine=<id>` (also `?serial=<serial>`), `/scheduler?machine=<serial>` (prefills the search).
- New kit pieces: `TimeField`, `MultiSelect`, `Switch`, `Tabs`, `WeekStrip`; the machine badge and job-type pill live in `components/machines/machine-badges.component.ts`.

**Phase 4: Products and Sales, Catalogs, Profile, Admin, 404** (✅ approved with the P4 mockups)
Branch `redesign/phase-4` (from `redesign/phase-1`, after Phase 3 is merged). Mockups: the `P4-*.dc.html` files. Decisions: §5.7, §5.8, §5.9, §5.11, §5.12. Same rules as Phases 2–3 (translations, logical utilities, purge list, `data: { studio: true }`, one commit per step, prod build and EN/HE browser test per step).

1. **Products and Sales** (§5.7): product card grid with stock states, filters, detail panel, add/edit side panel; the quick **Sell** side panel (member prefill); the Sales tab (`DataTable`, date range, totals, CSV). Deep links `?product=`, `?tab=sales`. Dashboard Low stock rows and ⌘K "Sell product" / "Add product" open the new panels. Deleting a sale restores stock (backend, same request and response).
2. **Catalogs** (§5.8): table with status and Copy link, create/edit side panel (products as chips), **Share on WhatsApp** (wa.me links) instead of `wbm` sending.
3. **Profile** (§5.9): settings page (Profile, Gym, Preferences) and the edit side panel.
4. **Admin** (§5.11): the Studio shell with admin nav; Gyms and Users tables with side-panel forms; `AdminGuard` on `/admin` and `/users`; delete `app-admin-nav`.
5. **404 and clean-up** (§5.12): `**` route with the 404 page; delete `RegisterPageComponent` and the replaced Products, Catalog, Profile and Admin components and dialogs once nothing references them.
6. **Public catalog page** (§5.8): restyle the server-rendered template in the Studio look, same URL and data.

**Do not in Phase 4:**
- Change the DB schema, or any endpoint's request or response (the sale-delete stock fix keeps both).
- Remove Bootstrap, jQuery, Angular Material, `ng-multiselect-dropdown` or the date-picker libraries (Phase 5).
- Change validation rules.
- Build any AI backend.

**Phase 4 is done when:**
- `ng build --prod` passes with no new warnings and no `any`; the backend type-checks.
- Products can be created, viewed, edited, sold and deleted, sales listed, filtered, exported and deleted; catalogs created, edited, shared and deleted; the profile edited; gyms and users created, edited and deleted by the admin; against the real backend, in both languages.
- A gym user can't open admin pages; unknown URLs show the 404 page.
- No legacy (Material/Bootstrap) page is left in the gym or admin area.
- `npm run check:studio` passes; screenshots at 1440, 1024 and 390 in English and Hebrew broadly match the P4 mockups.
- Keyboard: panels and dialogs trap focus, close on Esc and return focus; every icon button has a translated `aria-label`.
- **Report:** the new Hebrew strings, for the owner to review.

**Phase 5+:** clean-up (§7.5), then the AI backend.
