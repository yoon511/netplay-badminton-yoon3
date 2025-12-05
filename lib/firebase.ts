// lib/firebase.ts

import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";

// 환경변수 확인용 - 실제 배포 오류 원인 추적에 도움됨
if (!process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL) {
  console.warn("⚠️ WARNING: Firebase DATABASE_URL is missing!");
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// 이미 초기화된 Firebase 앱이 있으면 재사용 (Vercel 핫리로드 오류 방지)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Realtime Database 인스턴스
export const rtdb = getDatabase(app);
