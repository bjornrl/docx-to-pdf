# docx → pdf

A tiny web app that turns a Word document into a clean, professional-looking PDF. Drop a `.docx` file on the page, get a styled PDF back.

## How it works

1. Frontend (Next.js, App Router) renders a drag-drop upload zone.
2. File is POSTed as `multipart/form-data` to `/.netlify/functions/convert`.
3. The function uses [`mammoth`](https://github.com/mwilliamson/mammoth.js) to turn the `.docx` into semantic HTML, injects it into a styled template, then renders it to PDF with [`puppeteer-core`](https://pptr.dev) + [`@sparticuz/chromium`](https://github.com/Sparticuz/chromium).
4. PDF streams back to the browser and auto-downloads.

No files are stored anywhere — everything is in-memory per request.

## Local development

```bash
npm install
npm run dev
```

To test the Netlify Function locally, use the Netlify CLI:

```bash
npm install -g netlify-cli
netlify dev
```

This runs the Next.js app *and* the function together on `http://localhost:8888`. Plain `npm run dev` won't route `/.netlify/functions/convert` correctly.

## Deploy to Netlify

### Option A — via Netlify dashboard

1. Push this repo to GitHub.
2. In the Netlify dashboard: **Add new site → Import from Git**.
3. Build command: `npm run build` (already set in `netlify.toml`).
4. Publish directory: `.next` (already set).
5. Deploy.

### Option B — via CLI

```bash
netlify login
netlify init       # link to a new or existing site
netlify deploy --prod
```

## Tradeoffs & limits

- **6 MB payload cap.** Netlify Functions reject request bodies over 6 MB. For larger docs, upload first to object storage (S3, Supabase Storage) and pass a signed URL to the function instead.
- **10s / 26s timeout.** Free tier caps functions at 10 seconds, Pro at 26. Puppeteer cold start is ~2–4s, so small/medium docs are fine; a 100-page doc with many images may time out. For heavy workloads, swap to a Netlify Background Function or run conversion in a long-running service.
- **Bundle size.** `@sparticuz/chromium` is ~50 MB. `netlify.toml` explicitly bundles it via `included_files`; don't remove that.
- **Styling is opinionated.** All PDFs use the same stylesheet (Inter, A4, generous margins). To preserve the Word doc's own formatting instead, swap `mammoth.convertToHtml` for a `docx → PDF` pipeline like LibreOffice — but that's much heavier on serverless.

## Customising the PDF look

Edit `netlify/functions/_styles.ts`. It's a single CSS string that gets inlined into every rendered document. Common tweaks:

- **Typography.** Change the `font-family` on `body`. If you want a self-hosted font, base64-embed it in the CSS (external font URLs may not load reliably in the headless browser).
- **Margins.** Change `margin` in the `page.pdf({ margin: … })` call in `convert.ts`, not the CSS — Puppeteer's PDF margins take precedence.
- **Headings, code blocks, tables.** All defined in `_styles.ts`. Print-specific rules (`page-break-inside`, `orphans`, `widows`) are there too.

## File layout

```
app/
  layout.tsx          root layout
  page.tsx            drag-drop UI
  page.module.css     UI styles
  globals.css         reset + base styles
netlify/
  functions/
    convert.ts        the conversion endpoint
    _styles.ts        PDF stylesheet (inlined)
netlify.toml          build + function config
next.config.js        Next.js config
tsconfig.json         TypeScript config
```
