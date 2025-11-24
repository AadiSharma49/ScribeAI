// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header"; // new client header

export const metadata: Metadata = {
  title: "ScribeAI",
  description: "AI-powered meeting scribing and transcription",
};

export default function RootLayout({ children }: { children: React.ReactNode; }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground">
        <div className="min-h-screen flex flex-col">
          <Header />

          <main className="flex-1">
            {children}
          </main>

          <footer className="border-t border-muted/60 py-4 text-center text-xs text-muted-foreground">
            Built for AttackCapital – ScribeAI · {new Date().getFullYear()}
          </footer>
        </div>
      </body>
    </html>
  );
}
