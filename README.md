# docx → pdf

A tiny web app that turns a Word document into a PDF — entirely in the browser.

## How it works

1. Drag-drop a `.docx` onto the page.
2. [`mammoth`](https://github.com/mwilliamson/mammoth.js) converts the `.docx` into HTML in-browser.
3. [`html2pdf.js`](https://github.com/eKoopmans/html2pdf.js) (html2canvas + jsPDF) renders the styled HTML into a PDF and triggers a download.

No server, no serverless function, no upload. Your file never leaves your device.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy to Netlify

```bash
netlify deploy --prod
```

Or push to GitHub and connect the repo in the Netlify dashboard. The `@netlify/plugin-nextjs` plugin handles the rest.

## Tradeoffs

- **Rasterized output.** html2pdf.js renders the HTML to a canvas and embeds it in the PDF, so text in the resulting PDF is not selectable/searchable. If you need selectable text, swap to a server-side LibreOffice pipeline.
- **Memory-bound.** All processing happens in the browser tab. Very large docs (50+ MB with many images) may slow the tab down or run out of memory on low-end devices.
- **Styling is opinionated.** All PDFs use the same stylesheet. Edit `PDF_STYLES` in `app/page.tsx` to change it.

## File layout

```
app/
  layout.tsx          root layout
  page.tsx            drag-drop UI + conversion logic
  page.module.css     UI styles
  globals.css         reset + base styles
  types.d.ts          module declarations
netlify.toml          Next.js build config
next.config.js        Next.js config
tsconfig.json         TypeScript config
```
