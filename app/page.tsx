"use client";

import { useCallback, useRef, useState } from "react";
import styles from "./page.module.css";

type Status = "idle" | "uploading" | "converting" | "success" | "error";

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
    if (file.size > 6 * 1024 * 1024) {
      setStatus("error");
      setErrorMessage("File exceeds 6MB limit (Netlify Function payload cap).");
      return;
    }

    setFileName(file.name);
    setErrorMessage(null);
    setStatus("uploading");

    try {
      const form = new FormData();
      form.append("file", file);

      setStatus("converting");
      const res = await fetch("/.netlify/functions/convert", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        let detail = `${res.status} ${res.statusText}`;
        try {
          const body = await res.json();
          if (body.detail) detail = body.detail;
        } catch {
          /* response wasn't json */
        }
        throw new Error(detail);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.docx$/i, "") + ".pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

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
            Drop a Word document. Get a clean, professional PDF.
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
              <p className={styles.hint}>.docx · max 6 MB</p>
            </>
          )}

          {(status === "uploading" || status === "converting") && (
            <>
              <div className={styles.spinner} aria-hidden />
              <p className={styles.dropText}>
                {status === "uploading" ? "Uploading…" : "Converting…"}
              </p>
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
            Files are converted on-demand and never stored. Processing happens in a Netlify
            Function and the PDF streams back to your browser.
          </p>
        </footer>
      </div>
    </main>
  );
}
