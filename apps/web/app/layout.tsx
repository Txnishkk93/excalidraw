import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NOVA - Think. Draw. Collaborate.",
  description: "A collaborative online whiteboard application.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
