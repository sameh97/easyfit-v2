# Redesign mockups (design references)

These files are exported from the design canvas. They are **visual references, not code to copy**:
each is one HTML screen with inline styles and a small script block that fills in sample data
(the `{{…}}` holes and `<sc-for>` loops belong to the design tool). They will not render when
opened directly in a browser; read the markup for the exact colours, sizes, spacing and content.

| File | What it shows | Status |
|---|---|---|
| `Final-Dashboard.dc.html` | App shell (floating sidebar, ⌘K trigger, bell) + Dashboard | ✅ Approved (Phase 1) |
| `Nav-1-Sidebar-AI-Panel.dc.html` | The AI panel **open** (chat, source chips, action buttons, composer) | ✅ Approved for the AI panel. Shell = Final |
| `Nav-3-Rail-Command.dc.html` | The **⌘K command palette** (Ask AI answer, member result, actions) | ✅ Approved for the palette only. Ignore the dark rail |
| `B-Members.dc.html` | Members as cards (pills, progress bar, avatars) | Style reference only. Members uses a table; the **card style applies to Trainers** |
| `P2-Members-Detail.dc.html` | Members **table + detail side panel** (narrowed table, tabs, quick renew, toast) | ✅ Approved (Phase 2) |
| `P2-Member-Form.dc.html` | **Add member side panel** with a validation error, length chips, sticky footer | ✅ Approved (Phase 2). The pattern for every create/edit form |
| `P2-Members-Hebrew.dc.html` | The Members page in **Hebrew, right-to-left**: sidebar on the right, mirrored layout, LTR phones and emails | ✅ Approved (Phase 2) |
| `P3-Classes.dc.html` | **Classes**: week strip, day list (done / up next), class detail panel with trainer and participants | ✅ Approved (Phase 3) |
| `P3-Class-Form.dc.html` | **New class side panel**: date, 24-hour time, description, trainer, members as chips | ✅ Approved (Phase 3) |
| `P3-Classes-Hebrew.dc.html` | Classes in **Hebrew, right-to-left** | ✅ Approved (Phase 3) |
| `P3-Machines.dc.html` | **Machines** card grid with status badges; detail panel with open alerts and jobs | ✅ Approved (Phase 3) |
| `P3-Maintenance.dc.html` | **Maintenance** jobs grouped Overdue / Today / This week / Later / Inactive, Mark done | ✅ Approved (Phase 3) |
| `P3-Notifications.dc.html` | The **bell panel** under the bell, grouped by machine | ✅ Approved (Phase 3) |
| `P3-Sidebar.dc.html` | The shared sidebar the P3 screens import (component, not a screen) | Reference |
| `P4-Products.dc.html` | **Products**: product cards with stock states (in stock / N left / out of stock), filters, product detail panel with recent sales | ✅ Approved (Phase 4) |
| `P4-Sell.dc.html` | **Sell side panel**: quantity stepper, optional member prefill, customer fields with an ID error, live total | ✅ Approved (Phase 4) |
| `P4-Sales.dc.html` | **Sales tab**: date range, revenue / items / sales totals, sales table, Export | ✅ Approved (Phase 4) |
| `P4-Catalogs.dc.html` | **Catalogs** list (three-line rows: products and status, names, validity and actions) with the **Share on WhatsApp** panel | ✅ Approved (Phase 4) |
| `P4-Profile.dc.html` | **Profile and settings**: profile, gym and preferences (language) cards | ✅ Approved (Phase 4) |
| `P4-Public-Catalog.dc.html` | The **public catalog page** members open, phone size, in Hebrew | ✅ Approved (Phase 4) |
| `P4-Admin-Users.dc.html` | **Admin: Users** in the Studio shell with the admin nav (Gyms uses the same table pattern) | ✅ Approved (Phase 4) |
| `P4-404.dc.html` | **404** page inside the shell | ✅ Approved (Phase 4) |
| `P4-Sidebar.dc.html` | The shared sidebar the P4 screens import (`active`, `admin` props) | Reference |

Notes:
- The mockups use physical CSS (`left`, `padding-left`) in places. The real code must use logical utilities (§7.10, Phase 2 step 1).
- The Hebrew mockup's strings are a first draft; the final wording goes in `he.json` and gets reviewed by the owner.
- All sample names and numbers are made up (the P3 screens use the seed data's class, trainer and machine names, all set on Wednesday 30 September). Tokens are in `redesign.md` §7.2.
