"use client";

import { useSearchParams } from "next/navigation";
import BadmintonManager from "./BadmintonManager";

export default function HomeContent() {
  const searchParams = useSearchParams();
  const isAdmin = searchParams.get("admin") === "yoon511";

  return <BadmintonManager isAdmin={isAdmin} />;
}
