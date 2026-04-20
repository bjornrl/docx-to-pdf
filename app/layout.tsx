import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "docx → pdf",
  description: "Drop a Word document, get a clean professional PDF.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
