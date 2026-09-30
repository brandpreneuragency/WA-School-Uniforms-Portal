import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "School Uniform Order | Wagner Atelier",
  description: "Private school uniform order request portal powered by Wagner Atelier."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
