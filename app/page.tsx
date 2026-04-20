"use client";

import { useCallback, useRef, useState } from "react";
import styles from "./page.module.css";

type Status = "idle" | "converting" | "success" | "error";

const PDF_STYLES = `
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 11pt; line-height: 1.55; color: #1a1a1a; }
  .document { padding: 22mm 20mm; max-width: 210mm; }
  h1, h2, h3, h4, h5, h6 { font-weight: 600; line-height: 1.25; color: #0a0a0a; margin: 1.6em 0 0.6em; }
  h1 { font-size: 22pt; margin-top: 0; }
  h2 { font-size: 16pt; }
  h3 { font-size: 13pt; }
  h1.doc-title { font-size: 26pt; margin-bottom: 0.2em; }
  p.doc-subtitle { font-size: 13pt; color: #666; margin-top: 0; margin-bottom: 1.8em; }
  p { margin: 0 0 0.8em; }
  strong, b { font-weight: 600; }
  em, i { font-style: italic; }
  a { color: #2563eb; text-decoration: none; }
  ul, ol { margin: 0 0 0.9em; padding-left: 1.4em; }
  li { margin-bottom: 0.3em; }
  blockquote { margin: 1.2em 0; padding: 0.2em 0 0.2em 1em; border-left: 3px solid #d4d4d4; color: #444; font-style: italic; }
  table { width: 100%; border-collapse: collapse; margin: 1.2em 0; font-size: 10pt; }
  th, td { padding: 0.55em 0.7em; text-align: left; border-bottom: 1px solid #e5e5e5; vertical-align: top; }
  th { font-weight: 600; background: #fafafa; border-bottom: 2px solid #d4d4d4; }
  img { max-width: 100%; height: auto; }
  hr { border: 0; border-top: 1px solid #e5e5e5; margin: 2em 0; }
`;

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".docx")) {
      setStatus("error");
      setErrorMessage("Please upload a .docx file.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setStatus("error");
      setErrorMessage("File exceeds 25 MB limit.");
      return;
    }

    setFileName(file.name);
    setErrorMessage(null);
    setStatus("converting");

    try {
      const [{ default: mammoth }, html2pdfModule] = await Promise.all([
        import("mammoth/mammoth.browser"),
        import("html2pdf.js"),
      ]);
      const html2pdf = (html2pdfModule as unknown as { default: () => any }).default;

      const arrayBuffer = await file.arrayBuffer();
      const { value: bodyHtml } = await mammoth.convertToHtml(
        { arrayBuffer },
        {
          styleMap: [
            "p[style-name='Title'] => h1.doc-title:fresh",
            "p[style-name='Subtitle'] => p.doc-subtitle:fresh",
            "p[style-name='Quote'] => blockquote:fresh",
          ],
        }
      );

      const container = document.createElement("div");
      container.innerHTML = `<style>${PDF_STYLES}</style><div class="document">${bodyHtml}</div>`;
      container.style.position = "fixed";
      container.style.left = "-10000px";
      container.style.top = "0";
      container.style.width = "210mm";
      document.body.appendChild(container);

      const baseName = file.name.replace(/\.docx$/i, "") || "document";

      try {
        await html2pdf()
          .set({
            margin: 0,
            filename: `${baseName}.pdf`,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
            pagebreak: { mode: ["css", "legacy"] },
          })
          .from(container)
          .save();
      } finally {
        container.remove();
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Conversion failed.");
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const reset = () => {
    setStatus("idle");
    setFileName(null);
    setErrorMessage(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>docx → pdf</h1>
          <p className={styles.subtitle}>
            Drop a Word document. Get a clean PDF — all in your browser.
          </p>
        </header>

        <div
          className={`${styles.dropzone} ${dragActive ? styles.dropzoneActive : ""} ${
            status === "error" ? styles.dropzoneError : ""
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          onClick={() => status === "idle" && inputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            hidden
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          {status === "idle" && (
            <>
              <div className={styles.icon} aria-hidden>⬆</div>
              <p className={styles.dropText}>
                <strong>Click to upload</strong> or drag and drop
              </p>
              <p className={styles.hint}>.docx · max 25 MB</p>
            </>
          )}

          {status === "converting" && (
            <>
              <div className={styles.spinner} aria-hidden />
              <p className={styles.dropText}>Converting…</p>
              <p className={styles.hint}>{fileName}</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className={styles.iconSuccess} aria-hidden>✓</div>
              <p className={styles.dropText}>PDF downloaded</p>
              <p className={styles.hint}>{fileName}</p>
              <button className={styles.resetBtn} onClick={(e) => { e.stopPropagation(); reset(); }}>
                Convert another
              </button>
            </>
          )}

          {status === "error" && (
            <>
              <div className={styles.iconError} aria-hidden>!</div>
              <p className={styles.dropText}>{errorMessage}</p>
              <button className={styles.resetBtn} onClick={(e) => { e.stopPropagation(); reset(); }}>
                Try again
              </button>
            </>
          )}
        </div>

        <footer className={styles.footer}>
          <p>
            Everything runs in your browser — your files never leave your device.
          </p>
        </footer>
      </div>
    </main>
  );
}
