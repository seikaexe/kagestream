import "@/app/globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LibraryProvider } from "@/components/providers/library-provider";
import { SettingsProvider } from "@/components/providers/settings-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SITE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: SITE.name, template: "%s · Kagenime" },
  description: SITE.description,
  keywords: ["anime", "manga", "webtoon", "kagenime", "anime indonesia"],
  authors: [{ name: SITE.developer }],
  openGraph: {
    type: "website",
    siteName: "Kagenime",
    title: { default: SITE.name, template: "%s · Kagenime" },
    description: SITE.description
  },
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var raw=localStorage.getItem("kagenime:settings:v1");var data=raw?JSON.parse(raw):{};var theme=(data&&typeof data.theme==="string")?data.theme:"system";var dark=(theme==="dark")||(theme==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(dark)document.documentElement.classList.add("dark");document.documentElement.dataset.reduceMotion=data&&data.reduceMotion?"true":"false"}catch(e){}})();`
          }}
        />
      </head>
      <body className="antialiased">
        <LibraryProvider>
          <SettingsProvider>
            <QueryProvider>
              <Header />
              <main id="kagenime-content" className="container-page">
                {children}
              </main>
              <Footer />
              <BottomNav />
            </QueryProvider>
          </SettingsProvider>
        </LibraryProvider>
      </body>
    </html>
  );
}
