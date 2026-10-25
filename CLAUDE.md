# EasyFit V2 Context

## Architecture
* Frontend: Angular 22 (NgModule-based, `standalone: false`), Tailwind 3.4, Node 22.22+/24.15+
* Backend: Node.js, Express (located in /backend)
* Database: PostgreSQL

## Core Directives
1. **TypeScript Only:** Write strict, typed TypeScript for both layers.
2. **UI Consistency:** New UI components must use Tailwind CSS. Maintain a modern, clean, athletic aesthetic. 
   * **Tailwind:** preflight is on and `frontend/tailwind.config.js` scans all of `src/` (since Phase 5; Bootstrap and the Material theme are gone). The only Angular Material left is the datepicker inside the Studio `DateField`, themed by `src/datepicker-theme.scss`. Use logical-direction utilities (`ms-`, `pe-`, `start-`…) and run `npm run check:studio` before committing. Details are in `redesign.md` §7.10, "Done in Phase 5".
3. **Database Safety:** Never write or execute destructive SQL (DROP, DELETE, UPDATE) without explicit permission.
4. **Security:** Never log, read, or print environment variables or `.env` files.
