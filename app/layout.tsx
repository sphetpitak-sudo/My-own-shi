import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";
import { LangProvider } from "@/lib/i18n";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  metadataBase: new URL("https://catarot.love"),
  title: "Sealo — เปิดไพ่ชะตา",
  description: "ค้นพบอนาคตของคุณด้วยไพ่ทาโรต์",
  manifest: "/manifest.json",
  openGraph: {
    title: "Sealo — เปิดไพ่ชะตา",
    description: "ค้นพบอนาคตของคุณด้วยไพ่ทาโรต์",
    url: "https://catarot.love",
    siteName: "Sealo",
    locale: "th_TH",
    type: "website",
    images: [
      {
        url: "/logo-512.png",
        width: 512,
        height: 512,
        alt: "Sealo Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sealo — เปิดไพ่ชะตา",
    description: "ค้นพบอนาคตของคุณด้วยไพ่ทาโรต์",
    images: ["/logo-512.png"],
  },
  icons: {
    icon: "/logo-192.png",
    shortcut: "/logo-192.png",
    apple: "/logo-180.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1025",
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html lang="th" suppressHydrationWarning className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=K2D:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: `
          const theme = localStorage.getItem('theme');
          if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
          }
        ` }} />
      </head>
      <body className="min-h-full flex flex-col">
        <div aria-hidden className="global-bg" />
        <div aria-hidden className="global-bg-overlay" />
        <noscript>
          <div style={{ padding: "2rem", textAlign: "center", fontFamily: "sans-serif" }}>
            <p>Sealo ต้องการ JavaScript</p>
            <p>กรุณาเปิดใช้งาน JavaScript</p>
          </div>
        </noscript>
        <ThemeProvider>
          <LangProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
