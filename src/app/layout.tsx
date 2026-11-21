import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "@fontsource/caveat/500.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Beauty Shelf admin", template: "%s · Beauty Shelf admin" },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={GeistSans.className}>
      <body>{children}</body>
    </html>
  );
}
