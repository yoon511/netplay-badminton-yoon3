import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 🔥 카톡/페북 미리보기 설정 (OG 메타태그)
export const metadata: Metadata = {
  title: "넷플레이 게임판 - 윤",
  description: "배드민턴 넷플레이 자동 매칭 / 대기열 관리 시스템",

  openGraph: {
    title: "넷플레이 게임판 - 윤",
    description: "배드민턴 넷플레이 게임 매칭 및 대기열 관리 서비스",
    url: "https://netplay-badminton-yoon.vercel.app",
    siteName: "넷플레이 게임판",
    images: [
      {
        url: "/og-image.png", // 반드시 public 폴더에 og-image.png 넣어야 함
        width: 1200,
        height: 630,
      },
    ],
    locale: "ko_KR",
    type: "website",
  },

  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
