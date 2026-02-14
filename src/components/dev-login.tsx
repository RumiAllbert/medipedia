"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const devAccounts = [
  { email: "admin@medipedia.local", label: "Admin", role: "ADMIN" },
  { email: "reviewer@medipedia.local", label: "Dr. Alex Rivera", role: "REVIEWER" },
  { email: "contributor@medipedia.local", label: "Taylor Chen", role: "CONTRIBUTOR" },
];

export function DevLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (email: string) => {
    setLoading(email);
    setError(null);
    try {
      const res = await fetch("/api/dev-login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Login failed");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Login failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Quick Sign In (Dev Only)</CardTitle>
        <CardDescription>
          Click any account below to sign in instantly. Requires seeded database.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {devAccounts.map((account) => (
          <Button
            key={account.email}
            variant="outline"
            className="w-full justify-between"
            disabled={loading === account.email}
            onClick={() => handleLogin(account.email)}
          >
            <span>
              {account.label}{" "}
              <span className="text-muted-foreground">({account.email})</span>
            </span>
            <Badge variant="secondary">{account.role}</Badge>
          </Button>
        ))}
        {error && (
          <p className="mt-2 text-sm text-destructive">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
