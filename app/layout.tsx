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
  title: "StudyHub",
  description: "Student planner — manage homework and tasks",
  manifest: "/manifest.json",
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
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <LangProvider>{children}</LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
