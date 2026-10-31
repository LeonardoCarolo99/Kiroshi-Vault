import type { Metadata, Viewport } from "next";
import { Chakra_Petch, Saira, Share_Tech_Mono } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import { AuthSyncProvider } from "@/components/auth/AuthSyncProvider";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

const chakra = Chakra_Petch({
  variable: "--font-chakra",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const saira = Saira({
  variable: "--font-saira",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const shareTech = Share_Tech_Mono({
  variable: "--font-share-tech",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Kiroshi Vault // Cyberpunk TCG",
    template: "%s // Kiroshi Vault",
  },
  description:
    "A Night City command deck for the Cyberpunk Trading Card Game: collection, decks, match history, and opening-hand simulation.",
  applicationName: "Kiroshi Vault",
  keywords: ["Cyberpunk TCG", "collection tracker", "deck builder", "Night City"],
  appleWebApp: {
    capable: true,
    title: "Kiroshi Vault",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#04060a",
  colorScheme: "dark",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${chakra.variable} ${saira.variable} ${shareTech.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AuthSyncProvider>
          <AppShell>{children}</AppShell>
        </AuthSyncProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
