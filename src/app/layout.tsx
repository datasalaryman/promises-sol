import { Toaster } from "@/components/ui/toaster";
import "@/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { Navbar } from "@/app/_components/Navbar";

export const metadata: Metadata = {
  title: "solpromises.xyz",
  description: "Make your promise on Solana",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body>
        <Navbar />
        <div className="pt-2">
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
};

export function MdxLayout({ children }: { children: React.ReactNode }) {
  // Create any shared layout or styles here
  return (
    <div className="flex flex-col items-center">
      <div className="px-16 sm:px-40">
        <article className="prose prose-slate">
          {children}
        </article>
      </div>
    </div>
  )
}