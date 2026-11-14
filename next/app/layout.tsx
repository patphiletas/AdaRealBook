import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Real Book — partitions de jazz",
  description: "Une bibliothèque de partitions jazz, façon Real Book.",
};

// Mode scène appliqué avant l'affichage (pas de flash clair) : choix mémorisé,
// sinon réglage sombre/clair de l'appareil. Voir lib/stockage.ts et app/page.tsx.
const scriptTheme = `(function(){try{var t=localStorage.getItem("realbook:theme");if(t!=="dark"&&t!=="light")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme est posé par le script avant l'hydratation : React ne doit pas s'en étonner.
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptTheme }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
