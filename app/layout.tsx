import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Tarot Destiny — เปิดไพ่ชะตา",
  description: "ค้นพบอนาคตของคุณด้วยไพ่ทาโรต์",
  manifest: "/manifest.json",
  openGraph: {
    title: "Tarot Destiny — เปิดไพ่ชะตา",
    description: "ค้นพบอนาคตของคุณด้วยไพ่ทาโรต์",
    url: "https://my-own-shi.vercel.app",
    siteName: "Tarot Destiny",
    locale: "th_TH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tarot Destiny — เปิดไพ่ชะตา",
    description: "ค้นพบอนาคตของคุณด้วยไพ่ทาโรต์",
  },
};

export const viewport: Viewport = {
  themeColor: "#17171f",
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html lang="th" suppressHydrationWarning className="h-full antialiased">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          const theme = localStorage.getItem('theme');
          if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
          }
        ` }} />
      </head>
      <body className="min-h-full flex flex-col">
        <noscript>
          <div style={{ padding: "2rem", textAlign: "center", fontFamily: "sans-serif" }}>
            <p>Tarot Destiny ต้องการ JavaScript</p>
            <p>กรุณาเปิดใช้งาน JavaScript</p>
          </div>
        </noscript>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
