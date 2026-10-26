import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flexnotes — Your thoughts, with room to move",
  description:
    "A clean, modern, open-source infinite notepad. Sticky notes on an endless canvas, saved privately in your browser.",
  applicationName: "Flexnotes",
};

export const viewport: Viewport = {
  themeColor: "#fafaf9",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full overscroll-none">{children}</body>
    </html>
  );
}
