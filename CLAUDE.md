# EasyFit V2 Context

## Architecture
* Frontend: Angular
* Backend: Node.js, Express (located in /backend)
* Database: PostgreSQL

## Core Directives
1. **TypeScript Only:** Write strict, typed TypeScript for both layers.
2. **UI Consistency:** New UI components must use Tailwind CSS. Maintain a modern, clean, athletic aesthetic. 
3. **Database Safety:** Never write or execute destructive SQL (DROP, DELETE, UPDATE) without explicit permission.
4. **Security:** Never log, read, or print environment variables or `.env` files.
