# EasyFit V2 Context

## Architecture
* Frontend: Angular
* Backend: Node.js, Express (located in /backend)
* Database: PostgreSQL

## Core Directives
1. **TypeScript Only:** Write strict, typed TypeScript for both layers.
2. **UI Consistency:** New UI components must use Tailwind CSS. Maintain a modern, clean, athletic aesthetic. 
   * **Tailwind scan list:** `frontend/tailwind.config.js` uses `important: true` and only scans Studio folders (`purge` list). Every newly redesigned page's folder **must be added to that list**, or its utilities are not generated. Put the `studio` class on the page's root element. Reason: Bootstrap 4's `!important` helpers (`p-5`, `bg-white`, `text-warning`…) and `body.mat-typography` would otherwise override Tailwind, and scanning legacy templates would restyle legacy pages. Details are in `redesign.md` §7.10, "Notes for later phases".
3. **Database Safety:** Never write or execute destructive SQL (DROP, DELETE, UPDATE) without explicit permission.
4. **Security:** Never log, read, or print environment variables or `.env` files.
