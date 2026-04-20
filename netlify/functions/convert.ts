import type { Handler } from "@netlify/functions";
import mammoth from "mammoth";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { pdfStyles } from "./_styles";

/**
 * POST /.netlify/functions/convert
 * Body: multipart/form-data with a single file field named "file"
 * Returns: application/pdf
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    // Netlify gives us base64-encoded body for binary uploads
    const contentType = event.headers["content-type"] || event.headers["Content-Type"] || "";
    if (!contentType.includes("multipart/form-data")) {
      return { statusCode: 400, body: "Expected multipart/form-data" };
    }

    const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/);
    const boundary = boundaryMatch?.[1] || boundaryMatch?.[2];
    if (!boundary) {
      return { statusCode: 400, body: "Missing multipart boundary" };
    }

    const bodyBuffer = Buffer.from(event.body || "", event.isBase64Encoded ? "base64" : "utf8");
    const file = parseFirstFile(bodyBuffer, boundary);
    if (!file) {
      return { statusCode: 400, body: "No file found in request" };
    }

    // docx → HTML
    const { value: bodyHtml, messages } = await mammoth.convertToHtml(
      { buffer: file.content },
      {
        styleMap: [
          "p[style-name='Title'] => h1.doc-title:fresh",
          "p[style-name='Subtitle'] => p.doc-subtitle:fresh",
          "p[style-name='Quote'] => blockquote:fresh",
          "p[style-name='Intense Quote'] => blockquote.intense:fresh",
        ],
      }
    );

    // Log any mammoth warnings (hidden from user, visible in Netlify function logs)
    if (messages.length) console.warn("Mammoth messages:", messages);

    const originalName = file.filename.replace(/\.docx$/i, "") || "document";
    const html = buildHtmlDocument(bodyHtml, originalName);

    // HTML → PDF
    const pdfBuffer = await renderPdf(html);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFilename(originalName)}.pdf"`,
        "Cache-Control": "no-store",
      },
      body: pdfBuffer.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (err) {
    console.error("Conversion failed:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Conversion failed",
        detail: err instanceof Error ? err.message : String(err),
      }),
    };
  }
};

/** Render the assembled HTML to a PDF buffer using headless Chrome. */
async function renderPdf(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "22mm", right: "20mm", bottom: "22mm", left: "20mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

/** Wrap mammoth's body HTML in a full document with professional styling. */
function buildHtmlDocument(bodyHtml: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>${pdfStyles}</style>
</head>
<body>
<main class="document">
${bodyHtml}
</main>
</body>
</html>`;
}

// ----- helpers -----

interface ParsedFile {
  filename: string;
  contentType: string;
  content: Buffer;
}

/**
 * Minimal multipart parser — extracts the first file field.
 * We avoid pulling in a dep like `busboy` to keep the function bundle small.
 */
function parseFirstFile(body: Buffer, boundary: string): ParsedFile | null {
  const delimiter = Buffer.from(`--${boundary}`);
  const parts: Buffer[] = [];
  let start = 0;

  while (true) {
    const idx = body.indexOf(delimiter, start);
    if (idx === -1) break;
    if (start !== 0) parts.push(body.slice(start, idx));
    start = idx + delimiter.length;
    // Skip trailing CRLF after the boundary
    if (body[start] === 0x0d && body[start + 1] === 0x0a) start += 2;
  }

  for (const part of parts) {
    // Split headers/body on double CRLF
    const headerEnd = part.indexOf("\r\n\r\n");
    if (headerEnd === -1) continue;
    const rawHeaders = part.slice(0, headerEnd).toString("utf8");
    // Strip trailing CRLF before the next boundary marker
    let content = part.slice(headerEnd + 4);
    if (content.length >= 2 && content[content.length - 2] === 0x0d && content[content.length - 1] === 0x0a) {
      content = content.slice(0, content.length - 2);
    }

    const dispositionMatch = rawHeaders.match(/Content-Disposition:\s*form-data;([^\r\n]*)/i);
    if (!dispositionMatch) continue;
    const disposition = dispositionMatch[1];
    const filenameMatch = disposition.match(/filename="([^"]*)"/i);
    if (!filenameMatch) continue;

    const typeMatch = rawHeaders.match(/Content-Type:\s*([^\r\n]+)/i);
    return {
      filename: filenameMatch[1],
      contentType: typeMatch?.[1]?.trim() || "application/octet-stream",
      content,
    };
  }
  return null;
}

function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80) || "document";
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
