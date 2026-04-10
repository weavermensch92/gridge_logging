import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gridge AI Monitoring",
  description: "AI Usage Monitoring & Coaching Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
