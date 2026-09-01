import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AdaRealBook",
  description: "Une bibliothèque de partitions jazz, façon Real Book.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
