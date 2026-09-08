# VIBE WEAR — Fix: env vars not loading before route files check them

## Files to Replace / Add

| This file | Action |
|-----------|--------|
| index.js  | Replaces src/index.js |
| env.js    | NEW FILE — put in vibewear-server root, same folder as index.js |
| appointments.js | Goes in src/routes/appointments.js (already sent before, included again for completeness) |

## The bug
In ES modules, every `import` statement's target file gets fully evaluated
BEFORE the importing file's own top-level code runs — even code written
above the imports. So the old `dotenv.config()` call at the top of index.js
was actually running AFTER routes/products.js and routes/appointments.js had
already checked `process.env` at their own top level — meaning those checks
always saw an empty environment locally, even with a correct .env file. This
is why the Cloudinary warning showed up on every local run, and why the new
Gmail warning did too.

## The fix
Moved the dotenv loading into its own file (env.js) and made it the very
first import in index.js. Node evaluates a file's imports in the order
they're declared, so env.js now finishes loading .env before any route file
gets a chance to read process.env.

Verified locally: with test Cloudinary/Gmail values in .env, both warnings
are now completely gone on startup.

## After replacing files
1. Copy env.js into vibewear-server's root folder
2. Replace index.js with the one here
3. Confirm routes/appointments.js matches (resent for completeness)
4. Restart: Ctrl+C then npm run dev
5. Confirm the console no longer shows the Cloudinary/Gmail warnings
6. git add . && git commit -m "fix: load env vars before routes check them" && git push
