"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
      setLoading(false);
    }
  };

  return (
    <Button variant="ghost" onClick={handleLogout} disabled={loading}>
      {loading ? "Signing out..." : "Sign out"}
    </Button>
  );
}
