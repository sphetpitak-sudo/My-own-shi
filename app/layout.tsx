import type { Metadata } from "next";
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
  title: "Piggy",
  description: "Track your income and expenses",
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
