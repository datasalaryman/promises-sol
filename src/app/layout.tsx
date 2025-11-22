import { Toaster } from "@/components/ui/toaster";
import "@/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { Navbar } from "@/app/_components/Navbar";
import { WalletContext } from "@/app/_contexts/Wallet";
import { TRPCReactProvider } from "@/trpc/react";

export const metadata: Metadata = {
  title: "promisekeepr.xyz",
  description: "Make your promise on Solana",
  icons: [{ rel: "icon", url: "/promisekeepr.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body>
        <div className="gaps-2 flex flex-col">
          <WalletContext>
            <TRPCReactProvider>
              <Navbar />
              {children}
            </TRPCReactProvider>
          </WalletContext>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
