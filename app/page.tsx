"use client";

import { useSearchParams } from "next/navigation";
import BadmintonManager from "./BadmintonManager";

export default function Home() {
  const searchParams = useSearchParams();
  const isAdmin = searchParams.get("admin") === "yoon511";

  return <BadmintonManager isAdmin={isAdmin} />;
}
