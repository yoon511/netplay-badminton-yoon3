"use client";

import { useEffect, useState } from "react";
import BadmintonManager from "./BadmintonManager";

export default function Home() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsAdmin(params.get("admin") === "yoon511");
  }, []);

  return <BadmintonManager isAdmin={isAdmin} />;
}

