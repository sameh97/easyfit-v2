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

Notes:
- The mockups use physical CSS (`left`, `padding-left`) in places. The real code must use logical utilities (§7.10, Phase 2 step 1).
- The Hebrew mockup's strings are a first draft; the final wording goes in `he.json` and gets reviewed by the owner.
- All sample names and numbers are made up. Tokens are in `redesign.md` §7.2.
