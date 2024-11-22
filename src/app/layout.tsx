import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import { LogoFull } from "@/app/logo2";
import { APP_URL } from "@/app/APP_URL";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "You2Txt | by Fernando Rojoyarn ",
  description: "YouTube Video → txt file",
  openGraph: {
    images: [
      {
        url: `https://${APP_URL}/og.png`,
        width: 1200,
        height: 630,
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{
          fontFamily: "var(--font-geist-sans)",
        }}
      >
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <div className='fixed top-0 left-0 w-full h-16 px-4 flex items-center z-40'>
            <LogoFull width={150} />
          </div>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
