import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";

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
        url: "/LOGO.png",
        width: 1254,
        height: 1254,
        alt: "Sealo Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sealo — เปิดไพ่ชะตา",
    description: "ค้นพบอนาคตของคุณด้วยไพ่ทาโรต์",
    images: ["/LOGO.png"],
  },
  icons: {
    icon: "/LOGO.png",
    shortcut: "/LOGO.png",
    apple: "/LOGO.png",
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
            <p>Sealo ต้องการ JavaScript</p>
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
