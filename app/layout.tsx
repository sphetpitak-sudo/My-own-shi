import type { Metadata, Viewport } from "next";
import { K2D } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";

const k2d = K2D({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin", "thai"],
  variable: "--font-pixel",
});

export const metadata: Metadata = {
  title: "StudyHub — Student Planner",
  description: "จัดการงานบ้าน วิชา และเวลาเรียนของคุณ",
  manifest: "/manifest.json",
  openGraph: {
    title: "StudyHub — Student Planner",
    description: "จัดการงานบ้าน วิชา และเวลาเรียนของคุณ",
    url: "https://my-own-shi.vercel.app",
    siteName: "StudyHub",
    locale: "th_TH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "StudyHub — Student Planner",
    description: "จัดการงานบ้าน วิชา และเวลาเรียนของคุณ",
  },
};

export const viewport: Viewport = {
  themeColor: "#17171f",
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      suppressHydrationWarning
      className={`${k2d.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          const lang = localStorage.getItem('lang') || navigator.language.split('-')[0];
          document.documentElement.lang = lang === 'th' ? 'th' : 'en';
        ` }} />
      </head>
      <body className="min-h-full flex flex-col">
        <noscript>
          <div style={{ padding: "2rem", textAlign: "center", fontFamily: "sans-serif" }}>
            <p>StudyHub requires JavaScript to run. Please enable JavaScript in your browser.</p>
          </div>
        </noscript>
        <ThemeProvider>
          <LangProvider>{children}</LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
