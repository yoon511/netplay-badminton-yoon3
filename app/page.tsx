"use client";

export const dynamic = "force-dynamic"; // <<< 🔥 SSR 완전 비활성화

import { Suspense } from "react";
import HomeContent from "./HomeContent";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
