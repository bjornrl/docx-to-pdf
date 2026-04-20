/**
 * Inline stylesheet injected into every rendered PDF.
 * Goal: clean, professional, readable — proper vertical rhythm, restrained palette.
 */
export const pdfStyles = `
  @page {
    size: A4;
  }

  * {
    box-sizing: border-box;
  }

  html, body {
    margin: 0;
    padding: 0;
    -webkit-font-smoothing: antialiased;
  }

  body {
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.55;
    color: #1a1a1a;
    background: #ffffff;
  }

  .document {
    max-width: 100%;
  }

  /* Headings */
  h1, h2, h3, h4, h5, h6 {
    font-weight: 600;
    line-height: 1.25;
    color: #0a0a0a;
    margin: 1.6em 0 0.6em;
    page-break-after: avoid;
  }

  h1 { font-size: 22pt; letter-spacing: -0.01em; margin-top: 0; }
  h2 { font-size: 16pt; letter-spacing: -0.005em; }
  h3 { font-size: 13pt; }
  h4 { font-size: 12pt; }
  h5, h6 { font-size: 11pt; text-transform: uppercase; letter-spacing: 0.04em; color: #555; }

  h1.doc-title {
    font-size: 26pt;
    margin-bottom: 0.2em;
  }

  p.doc-subtitle {
    font-size: 13pt;
    color: #666;
    margin-top: 0;
    margin-bottom: 1.8em;
    font-weight: 400;
  }

  /* Paragraphs */
  p {
    margin: 0 0 0.8em;
    orphans: 3;
    widows: 3;
  }

  /* Emphasis */
  strong, b { font-weight: 600; color: #0a0a0a; }
  em, i { font-style: italic; }

  /* Links */
  a {
    color: #2563eb;
    text-decoration: none;
    border-bottom: 1px solid rgba(37, 99, 235, 0.3);
  }

  /* Lists */
  ul, ol {
    margin: 0 0 0.9em;
    padding-left: 1.4em;
  }
  li {
    margin-bottom: 0.3em;
  }
  li > ul, li > ol {
    margin-top: 0.3em;
    margin-bottom: 0.3em;
  }

  /* Blockquotes */
  blockquote {
    margin: 1.2em 0;
    padding: 0.2em 0 0.2em 1em;
    border-left: 3px solid #d4d4d4;
    color: #444;
    font-style: italic;
  }
  blockquote.intense {
    border-left-color: #1a1a1a;
    color: #1a1a1a;
    font-weight: 500;
  }

  /* Code */
  code {
    font-family: "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace;
    font-size: 0.9em;
    background: #f4f4f5;
    padding: 0.1em 0.35em;
    border-radius: 3px;
  }
  pre {
    font-family: "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace;
    font-size: 9.5pt;
    background: #f4f4f5;
    padding: 0.9em 1.1em;
    border-radius: 4px;
    overflow-x: auto;
    line-height: 1.45;
    margin: 1em 0;
  }
  pre code { background: transparent; padding: 0; }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.2em 0;
    font-size: 10pt;
    page-break-inside: avoid;
  }
  th, td {
    padding: 0.55em 0.7em;
    text-align: left;
    border-bottom: 1px solid #e5e5e5;
    vertical-align: top;
  }
  th {
    font-weight: 600;
    background: #fafafa;
    border-bottom: 2px solid #d4d4d4;
  }

  /* Images */
  img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 1em 0;
  }

  /* Horizontal rule */
  hr {
    border: 0;
    border-top: 1px solid #e5e5e5;
    margin: 2em 0;
  }

  /* Print niceties */
  table, pre, blockquote, figure { page-break-inside: avoid; }
  img { page-break-inside: avoid; }
`;
